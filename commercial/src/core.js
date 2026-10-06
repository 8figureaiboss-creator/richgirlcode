/* ============================================================================
   core.js — timeline, easing, deterministic noise, typography engine, post FX.
   Everything is a pure function of `t` (ms). No frame-to-frame state, so the
   spot can be scrubbed, replayed, or stepped frame-exact by the MP4 renderer
   and look identical every time.
   ========================================================================== */

/* ── Easing ──────────────────────────────────────────────────────────────── */
const E = {
  linear: t => t,
  inQuad:  t => t * t,
  outQuad: t => 1 - (1 - t) ** 2,
  inOutQuad: t => t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2,
  inCubic:  t => t ** 3,
  outCubic: t => 1 - (1 - t) ** 3,
  inOutCubic: t => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2,
  outQuart: t => 1 - (1 - t) ** 4,
  outQuint: t => 1 - (1 - t) ** 5,
  inExpo:  t => t <= 0 ? 0 : 2 ** (10 * t - 10),
  outExpo: t => t >= 1 ? 1 : 1 - 2 ** (-11 * t),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1
    : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
  outBack: (t, s = 1.7) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2,
  outElastic: t => t <= 0 ? 0 : t >= 1 ? 1
    : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
  /* Critically-ish damped spring — the organic one. */
  spring: (t, freq = 7.5, damp = 5.2) =>
    t >= 1 ? 1 : 1 - Math.exp(-damp * t) * Math.cos(freq * t * Math.PI * 0.5),
};

const clamp  = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp   = (a, b, t) => a + (b - a) * t;
const mix    = lerp;

/* Normalised, clamped sub-range of a progress value, optionally eased. */
const seg = (t, a, b, ease = E.linear) => ease(clamp((t - a) / (b - a)));

/* Trapezoid envelope: 0 → 1 over `up`, hold, 1 → 0 over `down`. */
function env(t, up = 0.1, down = 0.1, ease = E.inOutCubic) {
  return ease(clamp(t / up)) * ease(clamp((1 - t) / down));
}

/* ── Deterministic noise ─────────────────────────────────────────────────── */
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}
function noise1(x) {
  const i = Math.floor(x), f = x - i;
  const u = f * f * (3 - 2 * f);
  return mix(hash(i), hash(i + 1), u) * 2 - 1;
}
function fbm(x, oct = 4) {
  let a = 0.5, s = 0;
  for (let i = 0; i < oct; i++) { s += noise1(x) * a; x *= 2.03; a *= 0.5; }
  return s;
}

/* ── Colour helpers ──────────────────────────────────────────────────────── */
/* Brand palette, sampled straight from the OTA OS logo:
   deep green #062010 is the base ink, cream #FEF5DA carries the type, gold
   is the accent. `white` and `slate` are kept as names so every call site
   stays readable — they now resolve to cream and a muted cream. */
const C = {
  gold:    '#D4AF37',
  goldLt:  '#F0DC9C',
  goldDk:  '#7E6118',
  ink:     '#031108',   // deepest green-black, for backgrounds
  ink2:    '#062010',   // the logo green
  ink3:    '#0A2E18',   // raised surfaces
  forest:  '#062010',
  white:   '#FEF5DA',   // cream — primary type
  cream:   '#FEF5DA',
  slate:   '#9DAE98',   // muted sage-cream — secondary type
  green:   '#3FD98A',   // market up
  red:     '#E8643F',   // market down (terracotta, not fire-engine red)
  cyan:    '#6FD9C4',
};
const rgba = (hex, a) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/* ── Canvas helpers ──────────────────────────────────────────────────────── */
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
}

const FONT  = '"Inter var","Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
const MONO  = '"JetBrains Mono","SF Mono",Menlo,Consolas,monospace';
const SERIF = '"Playfair Display",Georgia,"Times New Roman",serif';

/* `face`: false/'sans' | true/'mono' | 'serif' (the logo's typeface). */
function setFont(ctx, size, weight = 800, face = false, italic = false) {
  const f = face === 'serif' ? SERIF : (face === true || face === 'mono') ? MONO : FONT;
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${f}`;
}

/* Letter-spaced text with a real measured width (ctx.letterSpacing is not
   reliable across engines, so each glyph is placed by hand). */
function tracked(ctx, text, x, y, tracking = 0, align = 'left') {
  const chars = [...text];
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width + tracking;
  total -= tracking;
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (const ch of chars) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  return total;
}
function trackedWidth(ctx, text, tracking = 0) {
  let total = 0;
  for (const ch of [...text]) total += ctx.measureText(ch).width + tracking;
  return total - tracking;
}

/* ── Kinetic typography ──────────────────────────────────────────────────────
   p = 0..1 reveal progress. Modes:
     wipe  — hard-edged mask sweep, the broadcast standard
     glyph — per-character spring rise with stagger
     blur  — focus-pull in
     scale — weighted punch-in                                                */
function kinetic(ctx, text, opt = {}) {
  const {
    x = 0, y = 0, size = 80, weight = 900, tracking = 0, align = 'left',
    color = C.white, p = 1, mode = 'wipe', stagger = 0.045, face = false,
    alpha = 1, shadow = 0, italic = false,
  } = opt;
  if (p <= 0.0005 || alpha <= 0.002) return 0;

  setFont(ctx, size, weight, face, italic);
  const w = trackedWidth(ctx, text, tracking);
  const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;

  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  if (shadow) { ctx.shadowColor = rgba(C.gold, 0.5 * shadow); ctx.shadowBlur = 26 * shadow; }

  if (mode === 'wipe') {
    const pad = size * 0.42;
    ctx.beginPath();
    ctx.rect(x0 - pad, y - size * 1.15, (w + pad * 2) * E.outQuart(p), size * 1.7);
    ctx.clip();
    tracked(ctx, text, x0, y, tracking, 'left');

  } else if (mode === 'glyph') {
    const chars = [...text];
    let cx = x0;
    const n = chars.length;
    const span = Math.max(0.0001, 1 - stagger * (n - 1));
    for (let i = 0; i < n; i++) {
      const lp = clamp((p - stagger * i) / span);
      const e = E.spring(lp);
      const cw = ctx.measureText(chars[i]).width;
      if (lp > 0) {
        ctx.save();
        ctx.globalAlpha = alpha * clamp(lp * 2.6);
        ctx.translate(cx, y + (1 - e) * size * 0.62);
        ctx.scale(1, lerp(1.45, 1, clamp(lp * 1.5)));
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
      }
      cx += cw + tracking;
    }

  } else if (mode === 'blur') {
    const b = (1 - E.outExpo(p)) * size * 0.34;
    if (ctx.filter !== undefined && b > 0.4) ctx.filter = `blur(${b.toFixed(2)}px)`;
    ctx.globalAlpha = alpha * E.outQuad(p);
    tracked(ctx, text, x0, y, tracking, 'left');
    ctx.filter = 'none';

  } else { // scale
    const e = E.outExpo(p);
    ctx.globalAlpha = alpha * clamp(p * 3);
    ctx.translate(x0 + w / 2, y);
    ctx.scale(lerp(1.22, 1, e), lerp(1.22, 1, e));
    tracked(ctx, text, -w / 2, 0, tracking, 'left');
  }
  ctx.restore();
  return w;
}

/* Width a kinetic() call will occupy — lets a two-colour headline lay itself
   out instead of relying on hand-tuned x offsets that break when copy changes. */
function kineticWidth(ctx, text, { size = 80, weight = 900, tracking = 0, face = false } = {}) {
  setFont(ctx, size, weight, face);
  return trackedWidth(ctx, text, tracking);
}

/* Number that rolls up, with thousands separators. */
function rollNumber(value, p, { decimals = 0, ease = E.outExpo } = {}) {
  const v = value * ease(clamp(p));
  return v.toLocaleString('en-US', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  });
}

/* ── Timeline ────────────────────────────────────────────────────────────── */
class Timeline {
  constructor(duration) { this.duration = duration; this.scenes = []; }

  /* draw(ctx, ctxObj) where ctxObj = { t, p, W, H, abs } */
  add(name, start, end, draw, opt = {}) {
    this.scenes.push({ name, start, end, draw, xfade: opt.xfade ?? 240 });
    return this;
  }

  activeAt(ms) {
    return this.scenes.filter(s => ms >= s.start - s.xfade && ms < s.end);
  }
}
