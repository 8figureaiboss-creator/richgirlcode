/* ============================================================================
   scenes-c.js — the four-act cut (3.4s → 74.0s)

   Shared vocabulary for this cut:
     screenPane — a framed window onto a REAL screenshot, showing a normalised
                  sub-rect of it. It returns a mapper from image coordinates to
                  screen pixels, so a highlight lands on the actual UI instead
                  of on a guess.
     panKeys    — keyframed source rect. Panning the window down a still is how
                  "the user scrolls" reads on film without faking a scroll.
     spot       — the highlight itself: wash, HUD brackets, and a chip label.
     tileGrid   — a deck of labelled tiles that deals itself out. Wherever the
                  script lists things (modules, asset classes) a flat grid reads
                  the list far better than 3D ever does.
   ========================================================================== */

/* ── Real-screenshot regions ─────────────────────────────────────────────────
   Normalised to the PACKED textures in shots.js (620x1302), not to the source
   files, because the packer scales to the phone's screen aspect and centre-
   crops. Source → texture, with k = 1302/srcH and cropX0 = (srcW*k - 620)/2:

     daily-play  1033x2000   texX = srcX*1.0847 - 0.0423   texY = srcY
     trade-plan  1179x1981   texX = srcX*1.2498 - 0.1249   texY = srcY

   Re-derive these if tools/pack-shots.mjs ever changes its output box.        */
const R_PLAY = {
  pick:   { x: 0.034, y: 0.400, w: 0.140, h: 0.098 },   // Pick Ticker
  upload: { x: 0.262, y: 0.402, w: 0.136, h: 0.094 },   // Upload Charts
  get:    { x: 0.494, y: 0.402, w: 0.146, h: 0.094 },   // Get Contract
  ask:    { x: 0.052, y: 0.550, w: 0.925, h: 0.055 },   // "What ticker are we trading today?"
  chips:  { x: 0.052, y: 0.732, w: 0.760, h: 0.055 },   // QQQ / SPY / AAPL / NVDA
};

const R_PLAN = {
  enter:  { x: 0.012, y: 0.198, w: 0.976, h: 0.152 },   // WHEN TO EXIT (confirmation)
  entry:  { x: 0.012, y: 0.368, w: 0.976, h: 0.095 },   // ENTRY PRICE
  tp:     { x: 0.012, y: 0.477, w: 0.976, h: 0.096 },   // EXIT PRICE (TAKE PROFIT)
  stop:   { x: 0.012, y: 0.588, w: 0.976, h: 0.096 },   // STOP / CUT LOSS
  strike: { x: 0.012, y: 0.699, w: 0.976, h: 0.096 },   // PRIMARY STRIKE (ITM/ATM)
  otm:    { x: 0.012, y: 0.808, w: 0.976, h: 0.096 },   // OTM RUNNER (LOTTO)
};

/* Interpolated source rect. `keys` carry {at, x, y, w}; the height follows from
   the pane's aspect so the screenshot is never stretched, and both axes are
   clamped so the window can't run off the edge of the image. */
function panKeys(keys, t, img, box) {
  let a = keys[0], b = keys[0];
  for (let i = 0; i < keys.length; i++) {
    if (t >= keys[i].at) { a = keys[i]; b = keys[i + 1] || keys[i]; }
  }
  const e = b.at > a.at ? E.inOutCubic(clamp((t - a.at) / (b.at - a.at))) : 1;
  const w = lerp(a.w, b.w, e);
  const h = w * img.width / (img.height * (box.w / box.h));
  const cx = lerp(a.cx === undefined ? 0.5 : a.cx, b.cx === undefined ? 0.5 : b.cx, e);
  const cy = lerp(a.cy, b.cy, e);
  return {
    w, h,
    x: clamp(cx - w / 2, 0, Math.max(0, 1 - w)),
    y: clamp(cy - h / 2, 0, Math.max(0, 1 - h)),
  };
}

/* Rounded-rect SUB-path: appends rather than starting a new path, so several
   can share one even-odd fill — which is how the scrim gets its holes. */
function rrPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* Draw `src` (normalised) of a screenshot into `box`. Returns a mapper that
   turns an image-space rect into the screen rect it currently occupies. */
function screenPane(ctx, img, box, src, alpha = 1, opt = {}) {
  const { radius = 20, glow = 0.5 } = opt;
  if (!img || alpha <= 0.004) return () => ({ x: 0, y: 0, w: 0, h: 0 });

  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  roundRect(ctx, box.x - 11, box.y - 11, box.w + 22, box.h + 22, radius + 9);
  ctx.fillStyle = 'rgba(4,20,11,0.94)';
  ctx.shadowColor = rgba(C.gold, 0.5 * glow);
  ctx.shadowBlur = 56 * glow;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(C.gold, 0.55);
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.save();
  roundRect(ctx, box.x, box.y, box.w, box.h, radius);
  ctx.clip();
  /* The shipped UI is mostly white card on black. Straight into the bloom pass
     that reads as a blown-out sheet, so the plate is graded down first. */
  ctx.filter = 'brightness(0.78) contrast(1.04) saturate(1.06)';
  ctx.drawImage(img,
    src.x * img.width, src.y * img.height, src.w * img.width, src.h * img.height,
    box.x, box.y, box.w, box.h);
  ctx.filter = 'none';
  /* Glass: a faint diagonal sheen so the pane reads as a screen, not a print. */
  const sh = ctx.createLinearGradient(box.x, box.y, box.x + box.w * 0.7, box.y + box.h);
  sh.addColorStop(0, 'rgba(255,255,255,0.07)');
  sh.addColorStop(0.45, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();
  ctx.restore();

  return (r) => ({
    x: box.x + (r.x - src.x) / src.w * box.w,
    y: box.y + (r.y - src.y) / src.h * box.h,
    w: r.w / src.w * box.w,
    h: r.h / src.h * box.h,
  });
}

/* Illuminate named regions of a pane. Everything else dims, so the thing the
   voice-over just named is the only lit thing on screen — which is what reads
   as "the section lights up" far better than a wash would on a white UI.
   `items` are {r, p, label}; p runs 0→1 across each spot's whole life. */
function spotlight(ctx, bounds, items, opt = {}) {
  const radius = opt.radius || 20;
  const act = [];
  for (const it of items) {
    if (!it.r || it.r.w <= 0 || it.p <= 0.004 || it.p >= 0.999) continue;
    const on = clamp(it.p * 3.4);
    const a = on * (1 - seg(it.p, 0.86, 1));
    if (a > 0.01) act.push({ ...it, on, a });
  }
  if (!act.length) return;
  const lit = Math.max(...act.map(x => x.a));
  const pad = 6;

  ctx.save();
  roundRect(ctx, bounds.x, bounds.y, bounds.w, bounds.h, radius);
  ctx.clip();

  /* One scrim, punched out at every live region. */
  ctx.globalAlpha = lit * (opt.dim === undefined ? 0.6 : opt.dim);
  ctx.beginPath();
  ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h);
  for (const x of act) rrPath(ctx, x.r.x - pad, x.r.y - pad, x.r.w + pad * 2, x.r.h + pad * 2, 12);
  ctx.fillStyle = '#020C06';
  ctx.fill('evenodd');

  for (const x of act) {
    const r = x.r;
    ctx.globalAlpha = x.a;
    roundRect(ctx, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2, 12);
    ctx.strokeStyle = rgba(C.gold, 0.9);
    ctx.lineWidth = 2.4;
    ctx.stroke();
    FX.brackets(ctx, r.x - pad - 7, r.y - pad - 7, r.w + pad * 2 + 14, r.h + pad * 2 + 14, x.on,
      { color: C.goldLt, len: Math.min(34, r.w * 0.2, r.h * 0.8), lw: 2.8 });

    if (!x.label) continue;
    const size = opt.size || 21;
    setFont(ctx, size, 900);
    const tw = trackedWidth(ctx, x.label, 2.2) + 28;
    const bh = size + 16;
    const above = r.y - pad - bh - 16 > bounds.y;
    let lx = clamp(r.x + r.w / 2 - tw / 2, bounds.x + 12, bounds.x + bounds.w - tw - 12);
    let ly = above ? r.y - pad - bh / 2 - 10 : r.y + r.h + pad + bh / 2 + 10;
    ly = clamp(ly, bounds.y + bh / 2 + 8, bounds.y + bounds.h - bh / 2 - 8);
    roundRect(ctx, lx, ly - bh / 2, tw, bh, bh / 2);
    ctx.fillStyle = 'rgba(3,15,8,0.96)';
    ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.75);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = C.goldLt;
    ctx.textBaseline = 'middle';
    tracked(ctx, x.label, lx + 14, ly, 2.2);
  }
  ctx.restore();
}

/* A deck of labelled tiles that deals itself out. */
function tileGrid(ctx, items, box, t, opt = {}) {
  const { cols = 2, gap = 14, stagger = 110, start = 0, dur = 620,
          accent = C.gold, alpha = 1 } = opt;
  const rows = Math.ceil(items.length / cols);
  const w = (box.w - gap * (cols - 1)) / cols;
  const h = (box.h - gap * (rows - 1)) / rows;

  items.forEach((it, i) => {
    const e = E.outExpo(clamp((t - start - i * stagger) / dur));
    if (e <= 0.01) return;
    const col = i % cols, row = (i / cols) | 0;
    const x = box.x + col * (w + gap);
    const y = box.y + row * (h + gap) + (1 - e) * 26;
    const [label, detail] = Array.isArray(it) ? it : [it, null];

    ctx.save();
    ctx.globalAlpha = clamp(e * 1.6) * alpha;
    roundRect(ctx, x, y, w, h, 12);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(11,45,25,0.93)');
    g.addColorStop(1, 'rgba(3,15,8,0.93)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.34);
    ctx.lineWidth = 1.3;
    ctx.stroke();

    /* A short rule marks each tile, so a scanning eye finds the baseline. */
    ctx.fillStyle = rgba(accent, 0.85);
    ctx.fillRect(x + 18, y + h * 0.5 - (detail ? 25 : 9), 3, 18);

    const fs = Math.min(27, w * 0.098);
    setFont(ctx, fs, 900);
    ctx.fillStyle = C.cream;
    ctx.textBaseline = 'middle';
    tracked(ctx, label, x + 32, y + h * 0.5 - (detail ? 15 : 0), 1.1);
    if (detail) {
      setFont(ctx, fs * 0.72, 600);
      ctx.fillStyle = rgba(C.slate, 0.95);
      ctx.fillText(detail, x + 32, y + h * 0.5 + 16);
    }
    ctx.restore();
  });
}

/* Row of outlined word-chips, centred, dealing left to right. */
function chipRow(ctx, words, cx, y, t, opt = {}) {
  const { size = 20, start = 0, stagger = 180, dur = 650, h = 42,
          tracking = 2.4, alpha = 1, color = C.goldLt } = opt;
  setFont(ctx, size, 800);
  const ws = words.map(w => trackedWidth(ctx, w, tracking) + size * 1.8);
  const total = ws.reduce((a, b) => a + b, 0) + (words.length - 1) * 12;
  let x = cx - total / 2;
  words.forEach((w, i) => {
    const e = E.outExpo(clamp((t - start - i * stagger) / dur));
    if (e > 0.01) {
      ctx.save();
      ctx.globalAlpha = clamp(e * 1.6) * alpha;
      roundRect(ctx, x, y, ws[i], h, h / 2);
      ctx.fillStyle = rgba(C.gold, 0.1);
      ctx.fill();
      ctx.strokeStyle = rgba(C.gold, 0.45);
      ctx.lineWidth = 1.1;
      ctx.stroke();
      setFont(ctx, size, 800);
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      tracked(ctx, w, x + size * 0.9, y + h / 2, tracking);
      ctx.restore();
    }
    x += ws[i] + 12;
  });
  return total;
}

/* ANALYZE → CONFIRM → EXECUTE → MANAGE RISK, laid out from measured widths so
   the arrows always land between the words whatever the copy becomes. */
function flowLine(ctx, words, cx, y, t, opt = {}) {
  const { size = 26, start = 0, stagger = 230, alpha = 1 } = opt;
  setFont(ctx, size, 900);
  const ws = words.map(w => trackedWidth(ctx, w, 2.6));
  const arrow = size * 1.7;
  const total = ws.reduce((a, b) => a + b, 0) + arrow * (words.length - 1);
  let x = cx - total / 2;
  words.forEach((w, i) => {
    const e = E.outExpo(clamp((t - start - i * stagger) / 520));
    ctx.save();
    ctx.globalAlpha = clamp(e * 2) * alpha;
    setFont(ctx, size, 900);
    ctx.fillStyle = C.cream;
    ctx.textBaseline = 'middle';
    tracked(ctx, w, x, y, 2.6);
    ctx.restore();
    x += ws[i];
    if (i < words.length - 1) {
      const ae = E.outExpo(clamp((t - start - i * stagger - 150) / 420));
      ctx.save();
      ctx.globalAlpha = clamp(ae * 2) * alpha;
      ctx.strokeStyle = rgba(C.gold, 0.95);
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      const ax = x + arrow * 0.3, aw = arrow * 0.4 * ae;
      ctx.beginPath();
      ctx.moveTo(ax, y);
      ctx.lineTo(ax + aw, y);
      ctx.moveTo(ax + aw - size * 0.2, y - size * 0.17);
      ctx.lineTo(ax + aw, y);
      ctx.lineTo(ax + aw - size * 0.2, y + size * 0.17);
      ctx.stroke();
      ctx.restore();
      x += arrow;
    }
  });
}

/* Titled glass panel with a mini visual on the right. */
function statPanel(ctx, box, p, title, detail, draw, opt = {}) {
  if (p <= 0.004) return;
  const e = E.outExpo(clamp(p));
  const y = box.y + (1 - e) * 24;
  ctx.save();
  ctx.globalAlpha = clamp(p * 2) * (opt.alpha === undefined ? 1 : opt.alpha);
  roundRect(ctx, box.x, y, box.w, box.h, 14);
  const g = ctx.createLinearGradient(box.x, y, box.x + box.w, y + box.h);
  g.addColorStop(0, 'rgba(11,45,25,0.93)');
  g.addColorStop(1, 'rgba(3,15,8,0.93)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(C.gold, 0.36);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.fillStyle = rgba(C.gold, 0.9);
  ctx.fillRect(box.x + 20, y + box.h * 0.5 - 20, 3, 40);

  setFont(ctx, opt.size || 27, 900);
  ctx.fillStyle = C.cream;
  ctx.textBaseline = 'middle';
  tracked(ctx, title, box.x + 36, y + box.h * 0.5 - 14, 1.3);
  setFont(ctx, (opt.size || 27) * 0.68, 600);
  ctx.fillStyle = rgba(C.slate, 0.95);
  ctx.fillText(detail, box.x + 36, y + box.h * 0.5 + 15);
  if (draw) {
    ctx.save();
    ctx.translate(box.x + box.w - (opt.vizW || 180) - 24, y + box.h * 0.5);
    draw(ctx, opt.vizW || 180, box.h - 36, clamp(p * 1.4));
    ctx.restore();
  }
  ctx.restore();
}

/* The device, framed and textured. */
function device(S, ctx, cam, W, H, img, m, alpha) {
  S.mesh(Geo.extrude(Geo.roundedRect(2.42, 4.88, 0.38, 8), 0.2),
    M4.chain(m, M4.translate(0, 0, -0.1)),
    { ...fade(MAT.gold, 0.6 * alpha), metal: 0.95, zBias: -1.4 });
  S.mesh(Assets.phone, m, fade(MAT.steel, alpha));
  return () => {
    if (alpha > 0.05 && img) {
      texQuad3D(ctx, img, cam, W, H, quadCorners(m, 0.945, 1.985, 0.125), 7, clamp(alpha * 1.6));
    }
  };
}

/* Slow orbital rails — the ambient depth under the flat UI acts. */
function railsBehind(S, t, y, a) {
  for (const [R, tilt, spd, al] of [[6.4, 1.2, 1 / 5600, 0.22], [7.9, 1.03, -1 / 7400, 0.14]]) {
    S.mesh(Geo.ringXZ(R, 110),
      M4.chain(M4.translate(0, y, 0), M4.rotX(tilt), M4.rotY(t * spd)),
      { wireOnly: true, wireColor: rgba(C.gold, al * a), wireWidth: 1.2, wireGlow: 0.5 });
  }
}

/* ══ S2 · 3.4 → 9.2s ══  Ten apps collapse into one ═══════════════════════ */
const SCATTER = ['CHARTS', 'BROKER', 'NEWS', 'SCANNER', 'DISCORD',
                 'NOTES', 'ALERTS', 'JOURNAL', 'SHEETS', 'YOUTUBE'];

function sceneCollapse(ctx, A) {
  const { t, W, H, V, SAFE } = A;
  inkBackdrop(ctx, W, H, { warm: 0.3, cy: 0.5 });

  const collapse = E.inOutCubic(clamp((t - 3000) / 2000));
  const cx = W / 2, cy = V ? H * 0.46 : H * 0.5;

  /* Scattered tools drift apart, then are pulled in. */
  SCATTER.forEach((name, i) => {
    const a0 = (i / SCATTER.length) * Math.PI * 2 + 0.4;
    const R = (V ? 330 : 440) * (0.62 + hash(i * 3.1) * 0.5);
    const drift = 1 + Math.sin(t / 900 + i) * 0.05 + clamp(t / 2600) * 0.1;
    const r = R * drift * (1 - collapse);
    const appear = E.outExpo(clamp((t - 120 - i * 80) / 560));
    const al = appear * (1 - clamp((collapse - 0.55) / 0.4));
    if (al <= 0.01) return;
    const x = cx + Math.cos(a0) * r, y = cy + Math.sin(a0) * r * (V ? 1.15 : 0.78);
    const s = (V ? 96 : 110) * (1 - collapse * 0.55);
    ctx.save();
    ctx.globalAlpha = al;
    roundRect(ctx, x - s / 2, y - s / 2, s, s, s * 0.24);
    ctx.fillStyle = 'rgba(16,22,18,0.95)';
    ctx.fill();
    ctx.strokeStyle = rgba(C.slate, 0.3);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    setFont(ctx, s * 0.135, 800);
    ctx.fillStyle = rgba(C.slate, 0.85);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, x, y);
    ctx.textAlign = 'left';
    ctx.restore();
  });

  /* The one that stays. */
  const born = E.outExpo(clamp((collapse - 0.5) / 0.5));
  if (born > 0.01) {
    const s = (V ? 300 : 260) * born;
    ctx.save();
    ctx.globalAlpha = born;
    ctx.shadowColor = rgba(C.gold, 0.5);
    ctx.shadowBlur = 60 * born;
    logoStamp(ctx, cx - s / 2, cy - s / 2, s, { radius: s * 0.2 });
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(C.gold, 0.75);
    ctx.lineWidth = 2.4;
    roundRect(ctx, cx - s / 2, cy - s / 2, s, s, s * 0.2);
    ctx.stroke();
    ctx.restore();
    FX.flash(ctx, W, H, clamp(1 - Math.abs(collapse - 0.55) * 12) * 0.45);
  }

  dustField(ctx, t, W, H, 50, { speed: 20, alpha: 0.26 });

  const out = 1 - seg(t, 5300, 5800, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out * (1 - collapse * 0.8);
  const hy = V ? SAFE.top + 10 : 210;
  const hOpt = { size: V ? 76 : 88, weight: 900, tracking: -1.5,
                 align: V ? 'center' : 'left', mode: 'wipe' };
  kinetic(ctx, 'TEN APPS.',  { ...hOpt, x: V ? W / 2 : 150, y: hy, p: seg(t, 400, 1200), color: C.cream });
  kinetic(ctx, 'NO SYSTEM.', { ...hOpt, x: V ? W / 2 : 150, y: hy + (V ? 84 : 98),
                               p: seg(t, 900, 1800), color: C.red, shadow: 0.4 });
  ctx.restore();
}

/* ══ S3 · 9.2 → 16.4s ══  One system ══════════════════════════════════════ */
function sceneOneSystem(ctx, A) {
  const { t, W, H, S, cam, V, SAFE } = A;
  inkBackdrop(ctx, W, H, { warm: 0.78, cy: V ? 0.36 : 0.44 });

  const settle = E.outExpo(clamp(t / 1800));
  const spin = lerp(-1.1, 0.24, settle) + Math.sin(t / 2400) * 0.07;
  cam.fov = (V ? 46 : 39) * Math.PI / 180;
  const MY = V ? 3.5 : 2.4;
  cam.lookAt([0, lerp(2.0, MY - 0.6, settle), lerp(8.0, V ? 13.6 : 12.4, settle)],
             [0, lerp(0.6, MY - (V ? 1.6 : 0.6), settle), 0]);

  S.reset();
  floorGrid(S, { half: 20, step: 2, y: -2.6, alpha: 0.14 * settle });
  const mk = E.spring(clamp(t / 1400), 6.2, 4.7);
  const tileM = M4.chain(M4.translate(0, MY, 0), M4.rotY(spin),
                         M4.rotX(Math.sin(t / 2600) * 0.06), M4.scale(lerp(0.5, 0.95, mk)));
  S.mesh(Assets.tileRim, M4.chain(tileM, M4.translate(0, 0, -0.09)),
    { ...fade(MAT.gold, 0.95 * clamp(mk * 1.4)), metal: 0.95, zBias: -1.4 });
  S.mesh(Assets.tile, tileM, fade(MAT.forest, clamp(mk * 1.4)));
  S.mesh(Assets.torus, M4.chain(M4.translate(0, MY, 0), M4.rotX(1.1 + Math.sin(t / 1900) * 0.08),
    M4.rotY(t / 1500), M4.scale(0.8 * mk)), fade(MAT.gold, 0.45 * mk));
  S.render(ctx, cam, W, H);
  texQuad3D(ctx, logoTexture(512), cam, W, H, quadCorners(tileM, 1.3, 1.3, 0.168), 6, clamp((mk - 0.04) * 1.7));

  FX.sweep(ctx, W * 0.2, H * 0.05, W * 0.6, H * 0.6, seg(t, 1200, 2100), { alpha: 0.35, width: 0.1 });
  FX.lensFlare(ctx, W / 2, H * (V ? 0.3 : 0.36), env(clamp((t - 900) / 900), 0.25, 0.5) * 0.7, W);

  const out = 1 - seg(t, 6750, 7200, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  const ty = V ? H - SAFE.bottom - 400 : H * 0.68;
  kinetic(ctx, 'ONE SYSTEM.', { x: W / 2, y: ty, size: V ? 84 : 92, weight: 900, tracking: -1,
    align: 'center', p: seg(t, 1500, 2400), mode: 'wipe', color: C.cream, shadow: 0.5 });
  const rl = seg(t, 2300, 2900, E.outExpo);
  ctx.fillStyle = rgba(C.gold, 0.9 * rl);
  ctx.fillRect(W / 2 - 200 * rl, ty + 32, 400 * rl, 3);
  const sOpt = { size: V ? 34 : 38, weight: 800, tracking: 3, align: 'center',
                 mode: 'wipe', color: rgba(C.gold, 0.96) };
  kinetic(ctx, 'YOUR FINANCIAL',    { ...sOpt, x: W / 2, y: ty + 92,  p: seg(t, 2700, 3400) });
  kinetic(ctx, 'OPERATING SYSTEM.', { ...sOpt, x: W / 2, y: ty + 140, p: seg(t, 2900, 3600) });

  chipRow(ctx, ['LEARN', 'ANALYZE', 'TRADE', 'INVEST', 'BUILD WEALTH'], W / 2, ty + 186, t,
    { size: V ? 19 : 21, start: 3600, stagger: 200, alpha: out });
  ctx.restore();
}

/* ══ S4 · 16.4 → 23.6s ══  Build the play, on the real app ════════════════ */
const PAN_PLAY = [
  { at:    0, cy: 0.420, w: 1.00 },
  { at: 1400, cy: 0.452, w: 1.00 },   // the four-step rail
  { at: 2500, cy: 0.578, w: 1.00 },   // "What ticker are we trading today?"
  { at: 4150, cy: 0.578, w: 1.00 },   // held while the question is lit
  { at: 5300, cy: 0.762, w: 0.98 },   // QQQ / SPY / AAPL / NVDA
  { at: 6600, cy: 0.772, w: 0.98 },
];

function sceneBuildPlay(ctx, A) {
  const { t, W, H, S, cam, V, SAFE } = A;
  inkBackdrop(ctx, W, H, { warm: 0.4, cx: V ? 0.5 : 0.62, cy: V ? 0.46 : 0.5 });

  const settle = E.outExpo(clamp(t / 1700));
  cam.fov = (V ? 52 : 44) * Math.PI / 180;
  cam.lookAt([lerp(-3.4, -0.8, settle), lerp(2.2, 3.4, settle), lerp(13, 16, settle)], [0, 1.4, 0]);
  S.reset();
  floorGrid(S, { half: 22, step: 2.4, y: -3.4, alpha: 0.13 * settle });
  railsBehind(S, t, 1.4, settle);
  S.render(ctx, cam, W, H);
  dustField(ctx, t, W, H, 34, { speed: 16, alpha: 0.2 });

  const box = V ? { x: 100, y: SAFE.top + 180, w: 880, h: 790 }
                : { x: 1000, y: 150, w: 790, h: 660 };
  const enter = E.outExpo(clamp(t / 900));
  const out = 1 - seg(t, 6800, 7200, E.inOutQuad);
  const src = panKeys(PAN_PLAY, t, IMG.dailyPlay, box);
  const map = screenPane(ctx, IMG.dailyPlay, box, src, clamp(enter * 1.4) * out);

  if (enter > 0.3) {
    ctx.save();
    ctx.globalAlpha = out;
    spotlight(ctx, box, [
      { r: map(R_PLAY.pick),   p: seg(t,  600, 2000), label: 'PICK TICKER' },
      { r: map(R_PLAY.upload), p: seg(t, 1050, 2350), label: 'UPLOAD CHARTS' },
      { r: map(R_PLAY.get),    p: seg(t, 1500, 2700), label: 'GET CONTRACT' },
      { r: map(R_PLAY.ask),    p: seg(t, 2850, 4350), label: 'WHAT ARE WE TRADING?' },
      { r: map(R_PLAY.chips),  p: seg(t, 5000, 6600), label: 'QQQ \u00b7 SPY \u00b7 AAPL \u00b7 NVDA' },
    ], { size: V ? 21 : 19 });
    ctx.restore();
  }
  FX.sweep(ctx, box.x, box.y, box.w, box.h, seg(t, 1200, 2200), { alpha: 0.18, width: 0.08 });

  ctx.save();
  ctx.globalAlpha = out;
  if (V) {
    FX.eyebrow(ctx, 70, SAFE.top - 92, 'STEP ONE · BUILD THE PLAY', seg(t, 200, 800));
    const hOpt = { size: 62, weight: 900, tracking: -1, align: 'center', mode: 'wipe' };
    kinetic(ctx, 'YOUR TICKER.', { ...hOpt, x: W / 2, y: SAFE.top + 4,   p: seg(t, 350, 1050), color: C.cream });
    kinetic(ctx, 'YOUR CHARTS.', { ...hOpt, x: W / 2, y: SAFE.top + 72,  p: seg(t, 650, 1350), color: C.cream });
    kinetic(ctx, 'YOUR SETUP.',  { ...hOpt, x: W / 2, y: SAFE.top + 140, p: seg(t, 950, 1650), color: C.gold, shadow: 0.5 });
  } else {
    FX.eyebrow(ctx, 112, 250, 'STEP ONE · BUILD THE PLAY', seg(t, 200, 800));
    const hOpt = { size: 84, weight: 900, tracking: -1.5, mode: 'wipe' };
    kinetic(ctx, 'YOUR TICKER.', { ...hOpt, x: 110, y: 390, p: seg(t, 350, 1050), color: C.cream });
    kinetic(ctx, 'YOUR CHARTS.', { ...hOpt, x: 110, y: 486, p: seg(t, 650, 1350), color: C.cream });
    kinetic(ctx, 'YOUR SETUP.',  { ...hOpt, x: 110, y: 582, p: seg(t, 950, 1650), color: C.gold, shadow: 0.5 });
    const lw = seg(t, 1500, 2200, E.outExpo);
    ctx.fillStyle = rgba(C.gold, 0.85 * lw);
    ctx.fillRect(110, 636, 300 * lw, 3);
    setFont(ctx, 23, 600);
    ctx.globalAlpha = out * seg(t, 1900, 2600);
    ctx.fillStyle = rgba(C.slate, 0.95);
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('A guided framework, not a blank chart.', 110, 700);
  }
  ctx.restore();
}

/* ══ S5 · 23.6 → 31.2s ══  The contract, on the real trade plan ═══════════ */
const PAN_PLAN = [
  { at:    0, cy: 0.250, w: 1.00 },
  { at:  900, cy: 0.274, w: 1.00 },   // WHEN TO EXIT — the confirmation
  { at: 2000, cy: 0.416, w: 0.94 },   // ENTRY PRICE
  { at: 3200, cy: 0.525, w: 0.94 },   // EXIT PRICE (TAKE PROFIT)
  { at: 4200, cy: 0.636, w: 0.88 },   // STOP / CUT LOSS
  { at: 5200, cy: 0.747, w: 0.88 },   // PRIMARY STRIKE
  { at: 6300, cy: 0.856, w: 0.88 },   // OTM RUNNER
];

function scenePlan(ctx, A) {
  const { t, W, H, S, cam, V, SAFE } = A;
  inkBackdrop(ctx, W, H, { warm: 0.42, cx: V ? 0.5 : 0.62, cy: V ? 0.42 : 0.5 });

  const settle = E.outExpo(clamp(t / 1700));
  cam.fov = (V ? 52 : 44) * Math.PI / 180;
  cam.lookAt([lerp(3.4, 0.8, settle), lerp(2.2, 3.2, settle), lerp(13, 16, settle)], [0, 1.4, 0]);
  S.reset();
  floorGrid(S, { half: 22, step: 2.4, y: -3.4, alpha: 0.13 * settle });
  railsBehind(S, t, 1.4, settle);
  S.render(ctx, cam, W, H);
  dustField(ctx, t, W, H, 34, { speed: -16, alpha: 0.2 });

  const box = V ? { x: 100, y: SAFE.top + 150, w: 880, h: 660 }
                : { x: 1010, y: 130, w: 780, h: 660 };
  const enter = E.outExpo(clamp(t / 900));
  const out = 1 - seg(t, 7200, 7600, E.inOutQuad);
  const src = panKeys(PAN_PLAN, t, IMG.tradePlan, box);
  const map = screenPane(ctx, IMG.tradePlan, box, src, clamp(enter * 1.4) * out);

  if (enter > 0.3) {
    ctx.save();
    ctx.globalAlpha = out;
    spotlight(ctx, box, [
      { r: map(R_PLAN.enter),  p: seg(t,  700, 2000), label: 'CONFIRMATION' },
      { r: map(R_PLAN.entry),  p: seg(t, 1950, 3150), label: 'ENTRY' },
      { r: map(R_PLAN.tp),     p: seg(t, 3100, 4200), label: 'TAKE PROFIT' },
      { r: map(R_PLAN.stop),   p: seg(t, 4150, 5250), label: 'RISK DEFINED' },
      { r: map(R_PLAN.strike), p: seg(t, 5200, 6300), label: 'PRIMARY STRIKE' },
      { r: map(R_PLAN.otm),    p: seg(t, 6250, 7400), label: 'OTM RUNNER' },
    ], { size: V ? 21 : 19 });
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = out;
  if (V) {
    FX.eyebrow(ctx, 70, SAFE.top - 92, 'STEP TWO · THE CONTRACT', seg(t, 200, 800));
    const hOpt = { size: 66, weight: 900, tracking: -1, align: 'center', mode: 'wipe' };
    kinetic(ctx, 'ENTRY. EXIT.',  { ...hOpt, x: W / 2, y: SAFE.top + 6,  p: seg(t, 350, 1050), color: C.cream });
    kinetic(ctx, 'RISK. STRIKE.', { ...hOpt, x: W / 2, y: SAFE.top + 78, p: seg(t, 700, 1400), color: C.gold, shadow: 0.5 });

    flowLine(ctx, ['ANALYZE', 'CONFIRM', 'EXECUTE', 'MANAGE RISK'], W / 2, box.y + box.h + 62, t,
      { size: 28, start: 5200, stagger: 230 });
    ctx.globalAlpha = out * seg(t, 6300, 6900);
    setFont(ctx, 18, 600);
    ctx.fillStyle = rgba(C.slate, 0.8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Educational tools only. Not financial advice.', W / 2, box.y + box.h + 108);
    ctx.textAlign = 'left';
  } else {
    FX.eyebrow(ctx, 112, 250, 'STEP TWO · THE CONTRACT', seg(t, 200, 800));
    const hOpt = { size: 84, weight: 900, tracking: -1.5, mode: 'wipe' };
    kinetic(ctx, 'ENTRY. EXIT.',  { ...hOpt, x: 110, y: 400, p: seg(t, 350, 1050), color: C.cream });
    kinetic(ctx, 'RISK. STRIKE.', { ...hOpt, x: 110, y: 496, p: seg(t, 700, 1400), color: C.gold, shadow: 0.5 });
    const lw = seg(t, 1500, 2200, E.outExpo);
    ctx.fillStyle = rgba(C.gold, 0.85 * lw);
    ctx.fillRect(110, 548, 300 * lw, 3);

    flowLine(ctx, ['ANALYZE', 'CONFIRM', 'EXECUTE', 'MANAGE RISK'], 110 + 390, 650, t,
      { size: 26, start: 5200, stagger: 230 });
    ctx.globalAlpha = out * seg(t, 6300, 6900);
    setFont(ctx, 19, 600);
    ctx.fillStyle = rgba(C.slate, 0.8);
    ctx.textBaseline = 'middle';
    ctx.fillText('Educational tools only. Not financial advice.', 110, 712);
  }
  ctx.restore();
}

/* ══ S6 · 31.2 → 38.4s ══  The Academy ════════════════════════════════════ */
const MODULE_TILES = [
  ['TRADING ACADEMY',    'the core curriculum'],
  ['RISK MANAGEMENT 101', 'size it before you take it'],
  ['GREEKS MASTERY',     'delta · gamma · theta · vega'],
  ['CANDLE ANATOMY',     'read what price is saying'],
  ['TECHNICAL ANALYSIS', 'levels, structure, confluence'],
  ['OPTIONS STRATEGIES', 'singles, spreads, hedges'],
  ['TRADING PSYCHOLOGY', 'discipline, on demand'],
  ['$100 WEALTH PLAYBOOK', 'start from where you are'],
];

function sceneAcademy(ctx, A) {
  const { t, W, H, S, cam, V, SAFE } = A;
  inkBackdrop(ctx, W, H, { warm: 0.5, cx: V ? 0.5 : 0.4, cy: V ? 0.4 : 0.48 });

  const settle = E.outExpo(clamp(t / 1800));
  cam.fov = (V ? 50 : 42) * Math.PI / 180;
  cam.lookAt([lerp(-2.6, 0, settle), 3.0, lerp(13, 15.4, settle)], [0, 1.6, 0]);
  S.reset();
  floorGrid(S, { half: 22, step: 2.4, y: -3.4, alpha: 0.14 * settle });
  /* A receding shelf of cards — the library, kept well out of the type's way. */
  for (let i = 0; i < 7; i++) {
    const e = E.outExpo(clamp((t - 200 - i * 120) / 900));
    if (e <= 0.01) continue;
    const ang = -0.9 + i * 0.3 + Math.sin(t / 3400 + i) * 0.04;
    S.mesh(Assets.card,
      M4.chain(M4.translate(Math.sin(ang) * 7.4, 1.8 + Math.cos(i * 1.7) * 0.5, -2 - Math.cos(ang) * 4),
               M4.rotY(ang * 0.8), M4.scale(0.5 * e)),
      fade(MAT.glass, 0.5 * e));
  }
  railsBehind(S, t, 1.6, settle);
  S.render(ctx, cam, W, H);
  dustField(ctx, t, W, H, 34, { speed: 14, alpha: 0.2 });

  const out = 1 - seg(t, 6800, 7200, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;

  if (V) {
    FX.eyebrow(ctx, 70, SAFE.top - 92, 'THE TRADING ACADEMY', seg(t, 200, 800));
    const hOpt = { size: 76, weight: 900, tracking: -1.5, align: 'center', mode: 'wipe' };
    kinetic(ctx, 'IT DOESN’T STOP', { ...hOpt, size: 62, x: W / 2, y: SAFE.top + 6,  p: seg(t, 320, 1000), color: C.cream });
    kinetic(ctx, 'AT THE TRADE.',        { ...hOpt, x: W / 2, y: SAFE.top + 84, p: seg(t, 620, 1400), color: C.gold, shadow: 0.5 });

    /* The count, rolled rather than stated. */
    const cp = seg(t, 1400, 2600);
    ctx.globalAlpha = out * clamp(cp * 3);
    setFont(ctx, 110, 900);
    ctx.fillStyle = C.goldLt;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${rollNumber(32, cp)}+`, W / 2, SAFE.top + 236);
    setFont(ctx, 26, 800);
    ctx.fillStyle = rgba(C.cream, 0.9);
    ctx.textBaseline = 'middle';
    tracked(ctx, 'LEARNING MODULES', W / 2, SAFE.top + 282, 4.6, 'center');
    ctx.textAlign = 'left';

    tileGrid(ctx, MODULE_TILES, { x: 90, y: SAFE.top + 330, w: 900, h: 660 }, t,
      { cols: 2, start: 2200, stagger: 130, alpha: out });
  } else {
    FX.eyebrow(ctx, 112, 230, 'THE TRADING ACADEMY', seg(t, 200, 800));
    const hOpt = { size: 80, weight: 900, tracking: -1.5, mode: 'wipe' };
    kinetic(ctx, 'IT DOESN’T STOP', { ...hOpt, x: 110, y: 360, p: seg(t, 320, 1000), color: C.cream });
    kinetic(ctx, 'AT THE TRADE.',        { ...hOpt, x: 110, y: 452, p: seg(t, 620, 1400), color: C.gold, shadow: 0.5 });

    const cp = seg(t, 1400, 2600);
    ctx.globalAlpha = out * clamp(cp * 3);
    setFont(ctx, 150, 900);
    ctx.fillStyle = C.goldLt;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${rollNumber(32, cp)}+`, 110, 640);
    setFont(ctx, 27, 800);
    ctx.fillStyle = rgba(C.cream, 0.9);
    ctx.textBaseline = 'middle';
    tracked(ctx, 'LEARNING MODULES', 112, 692, 5);

    tileGrid(ctx, MODULE_TILES, { x: 980, y: 140, w: 820, h: 660 }, t,
      { cols: 2, start: 2200, stagger: 130, alpha: out });
  }
  ctx.restore();
}

/* ══ S7 · 38.4 → 45.6s ══  Journal · Hit List · Mission Control ═══════════ */
function vizGrades(c, w, h, p) {
  const grades = ['A', 'B+', 'A-', 'A'];
  setFont(c, 21, 900);
  c.textBaseline = 'middle';
  grades.forEach((g, i) => {
    const e = E.outExpo(clamp((p * 1.5) - i * 0.12));
    if (e <= 0.02) return;
    const x = i * (w / 4);
    c.globalAlpha = e;
    roundRect(c, x, -16, w / 4 - 8, 32, 8);
    c.fillStyle = rgba(C.green, 0.16);
    c.fill();
    c.strokeStyle = rgba(C.green, 0.5);
    c.lineWidth = 1;
    c.stroke();
    c.fillStyle = C.green;
    c.textAlign = 'center';
    c.fillText(g, x + (w / 4 - 8) / 2, 1);
  });
  c.textAlign = 'left';
  c.globalAlpha = 1;
}

function vizRows(c, w, h, p) {
  const rows = [['NVDA', 1], ['SPY', 1], ['TSLA', 0], ['QQQ', 1]];
  setFont(c, 16, 800);
  c.textBaseline = 'middle';
  rows.forEach(([s, up], i) => {
    const e = E.outExpo(clamp((p * 1.5) - i * 0.1));
    if (e <= 0.02) return;
    const y = -h / 2 + 14 + i * (h / 4);
    c.globalAlpha = e;
    c.fillStyle = rgba(C.cream, 0.9);
    tracked(c, s, 0, y, 1.4);
    c.fillStyle = up ? C.green : C.red;
    c.fillText(up ? '▲' : '▼', w - 22, y);
    c.fillStyle = rgba(C.gold, 0.18);
    c.fillRect(0, y + h / 8 - 2, w * e, 1);
  });
  c.globalAlpha = 1;
}

function vizRing(c, w, h, p) {
  const r = Math.min(w, h) * 0.38;
  const e = E.outExpo(clamp(p));
  c.save();
  c.translate(w / 2, 0);
  c.strokeStyle = rgba(C.gold, 0.2);
  c.lineWidth = 7;
  c.beginPath();
  c.arc(0, 0, r, 0, 7);
  c.stroke();
  c.strokeStyle = C.gold;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + e * Math.PI * 1.62);
  c.stroke();
  setFont(c, r * 0.62, 900);
  c.fillStyle = C.goldLt;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(`${Math.round(e * 81)}%`, 0, 1);
  c.textAlign = 'left';
  c.restore();
}

function sceneTrack(ctx, A) {
  const { t, W, H, S, cam, V, SAFE } = A;
  inkBackdrop(ctx, W, H, { warm: 0.46, cx: V ? 0.5 : 0.58, cy: V ? 0.44 : 0.5 });

  const settle = E.outExpo(clamp(t / 1800));
  cam.fov = (V ? 50 : 42) * Math.PI / 180;
  cam.lookAt([lerp(2.6, 0.4, settle), 3.0, lerp(13, 15.4, settle)], [0, 1.6, 0]);
  S.reset();
  floorGrid(S, { half: 22, step: 2.4, y: -3.4, alpha: 0.14 * settle });
  railsBehind(S, t, 1.6, settle);
  S.render(ctx, cam, W, H);
  dustField(ctx, t, W, H, 34, { speed: -14, alpha: 0.2 });

  const out = 1 - seg(t, 6800, 7200, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;

  const panels = [
    ['DAILY JOURNAL',  'every decision, graded', vizGrades],
    ['HIT LIST',       'the names you are watching', vizRows],
    ['MISSION CONTROL', 'progress you can actually see', vizRing],
  ];

  if (V) {
    FX.eyebrow(ctx, 70, SAFE.top - 92, 'REVIEW · REPEAT · IMPROVE', seg(t, 200, 800));
    const hOpt = { size: 64, weight: 900, tracking: -1, align: 'center', mode: 'wipe' };
    kinetic(ctx, 'EVERY TRADE,',   { ...hOpt, x: W / 2, y: SAFE.top + 6,  p: seg(t, 320, 1000), color: C.cream });
    kinetic(ctx, 'ON THE RECORD.', { ...hOpt, x: W / 2, y: SAFE.top + 76, p: seg(t, 620, 1400), color: C.gold, shadow: 0.5 });

    panels.forEach(([title, detail, viz], i) => {
      statPanel(ctx, { x: 90, y: SAFE.top + 150 + i * 142, w: 900, h: 124 },
        seg(t, 1200 + i * 320, 2100 + i * 320), title, detail, viz,
        { size: 28, vizW: 240 });
    });

    if (CFG.showResult && IMG.result) {
      const rp = seg(t, 2900, 3900);
      if (rp > 0.004) {
        const e = E.outExpo(clamp(rp));
        const rw = 540, rh = rw * (IMG.result.height / IMG.result.width);
        const rx = W / 2 - rw / 2, ry = SAFE.top + 586 + (1 - e) * 26;
        ctx.save();
        ctx.globalAlpha = out * clamp(rp * 2);
        roundRect(ctx, rx - 10, ry - 10, rw + 20, rh + 20, 20);
        ctx.fillStyle = 'rgba(6,32,16,0.92)';
        ctx.fill();
        ctx.strokeStyle = rgba(C.gold, 0.5);
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.save();
        roundRect(ctx, rx, ry, rw, rh, 14);
        ctx.clip();
        ctx.drawImage(IMG.result, rx, ry, rw, rh);
        ctx.restore();
        /* The required qualifier sits ON the screenshot — it can never be
           cropped away from the claim it qualifies. */
        setFont(ctx, 16, 800);
        const lab = 'INDIVIDUAL RESULT · NOT TYPICAL';
        const lw2 = trackedWidth(ctx, lab, 2) + 26;
        roundRect(ctx, rx + 12, ry + rh - 46, lw2, 34, 17);
        ctx.fillStyle = 'rgba(3,15,8,0.92)';
        ctx.fill();
        ctx.strokeStyle = rgba(C.gold, 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = rgba(C.goldLt, 0.95);
        ctx.textBaseline = 'middle';
        tracked(ctx, lab, rx + 25, ry + rh - 29, 2);
        ctx.restore();
      }
    }
  } else {
    FX.eyebrow(ctx, 112, 230, 'REVIEW · REPEAT · IMPROVE', seg(t, 200, 800));
    const hOpt = { size: 80, weight: 900, tracking: -1.5, mode: 'wipe' };
    kinetic(ctx, 'EVERY TRADE,',   { ...hOpt, x: 110, y: 360, p: seg(t, 320, 1000), color: C.cream });
    kinetic(ctx, 'ON THE RECORD.', { ...hOpt, x: 110, y: 452, p: seg(t, 620, 1400), color: C.gold, shadow: 0.5 });

    panels.forEach(([title, detail, viz], i) => {
      statPanel(ctx, { x: 110, y: 530 + i * 128, w: 760, h: 112 },
        seg(t, 1200 + i * 320, 2100 + i * 320), title, detail, viz,
        { size: 27, vizW: 210 });
    });

    if (CFG.showResult && IMG.result) {
      const rp = seg(t, 2900, 3900);
      if (rp > 0.004) {
        ctx.globalAlpha = out;
        shotCard(ctx, 1000, 230, 680, IMG.result, rp,
          { radius: 14, label: 'INDIVIDUAL RESULT · NOT TYPICAL' });
      }
    }
  }
  ctx.restore();
}

/* ══ S8 · 45.6 → 53.2s ══  My Wealth Portfolio ════════════════════════════ */
const ASSET_TILES = [
  ['STOCKS',             'core positions'],
  ['ETFs',               'broad exposure'],
  ['DIVIDEND & INCOME',  'cash that compounds'],
  ['REITs',              'property, without the deed'],
  ['BONDS',              'the ballast'],
  ['PRECIOUS METALS',    'the hedge'],
  ['REAL ESTATE & LAND', 'the long hold'],
  ['LUXURY GOODS',       'assets you can wear'],
];

function sceneWealth(ctx, A) {
  const { t, W, H, S, cam, V, SAFE } = A;
  inkBackdrop(ctx, W, H, { warm: 0.56, cx: 0.5, cy: V ? 0.4 : 0.5 });

  const settle = E.outExpo(clamp(t / 1900));
  cam.fov = (V ? 52 : 44) * Math.PI / 180;
  cam.lookAt([lerp(-5, -1.6, settle), lerp(2.0, 4.4, settle), lerp(12, 15.8, settle)], [0, 1.2, 0]);

  S.reset();
  floorGrid(S, { half: 24, step: 2.4, y: -0.02, alpha: 0.16 * settle });
  /* An allocation that builds itself — eight columns, one per asset class. */
  for (let i = 0; i < 8; i++) {
    const e = E.outExpo(clamp((t - 300 - i * 150) / 1100));
    if (e <= 0.01) continue;
    const h = (1.1 + Math.abs(fbm(i * 1.7 + 3, 3)) * 4.6) * e;
    const x = (i - 3.5) * 1.9;
    S.mesh(Assets.unitBox,
      M4.chain(M4.translate(x, h / 2, -1.5), M4.scale(1.1, h, 1.1)),
      fade(i % 3 === 0 ? MAT.gold : MAT.forest, 0.92 * e));
    S.mesh(Assets.unitBox,
      M4.chain(M4.translate(x, h + 0.06, -1.5), M4.scale(1.16, 0.08, 1.16)),
      fade(MAT.gold, 0.9 * e));
  }
  railsBehind(S, t, 2.4, settle);
  S.render(ctx, cam, W, H);
  FX.scrim(ctx, W, H, V ? 'bottom' : 'left', 0.84, V ? 0.6 : 0.52);
  dustField(ctx, t, W, H, 36, { speed: 15, alpha: 0.22 });

  const out = 1 - seg(t, 7200, 7600, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  if (V) {
    FX.eyebrow(ctx, 70, SAFE.top - 92, 'MY WEALTH PORTFOLIO', seg(t, 200, 800));
    const hOpt = { size: 72, weight: 900, tracking: -1.5, align: 'center', mode: 'wipe' };
    kinetic(ctx, 'BIGGER THAN', { ...hOpt, x: W / 2, y: SAFE.top + 6,  p: seg(t, 320, 1000), color: C.cream });
    kinetic(ctx, 'ONE TRADE.',  { ...hOpt, x: W / 2, y: SAFE.top + 84, p: seg(t, 620, 1400), color: C.gold, shadow: 0.5 });
    tileGrid(ctx, ASSET_TILES, { x: 90, y: SAFE.top + 180, w: 900, h: 800 }, t,
      { cols: 2, start: 1500, stagger: 150, alpha: out });
  } else {
    FX.eyebrow(ctx, 112, 230, 'MY WEALTH PORTFOLIO', seg(t, 200, 800));
    const hOpt = { size: 84, weight: 900, tracking: -1.5, mode: 'wipe' };
    kinetic(ctx, 'BIGGER THAN', { ...hOpt, x: 110, y: 380, p: seg(t, 320, 1000), color: C.cream });
    kinetic(ctx, 'ONE TRADE.',  { ...hOpt, x: 110, y: 476, p: seg(t, 620, 1400), color: C.gold, shadow: 0.5 });
    const lw = seg(t, 1400, 2100, E.outExpo);
    ctx.fillStyle = rgba(C.gold, 0.85 * lw);
    ctx.fillRect(110, 528, 300 * lw, 3);
    setFont(ctx, 23, 600);
    ctx.globalAlpha = out * seg(t, 1800, 2500);
    ctx.fillStyle = rgba(C.slate, 0.95);
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Organise every asset class in one place.', 110, 594);
    tileGrid(ctx, ASSET_TILES, { x: 980, y: 140, w: 820, h: 660 }, t,
      { cols: 2, start: 1500, stagger: 150, alpha: out });
  }
  ctx.restore();
}

/* ══ S9 · 53.2 → 62.4s ══  Beyond trading — the lifestyle ecosystem ═══════ */
/* The membership card is drawn once to an off-screen target and reused. */
function memberTexture(w = 704, h = 444) {
  const cv = Targets.get('member', w, h);
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);

  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#0C2E19');
  g.addColorStop(0.55, '#062010');
  g.addColorStop(1, '#0A2414');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  const sheen = c.createLinearGradient(0, 0, w * 0.8, h);
  sheen.addColorStop(0, 'rgba(240,220,156,0.16)');
  sheen.addColorStop(0.45, 'rgba(240,220,156,0)');
  c.fillStyle = sheen;
  c.fillRect(0, 0, w, h);

  c.strokeStyle = rgba(C.gold, 0.7);
  c.lineWidth = 3;
  roundRect(c, 14, 14, w - 28, h - 28, 20);
  c.stroke();

  drawLogoMark(c, 42, 38, 76);

  /* The gold contact pad every membership card has. */
  const px = 42, py = 160;
  roundRect(c, px, py, 92, 68, 9);
  const cg = c.createLinearGradient(px, py, px + 92, py + 68);
  cg.addColorStop(0, C.goldLt);
  cg.addColorStop(0.6, C.gold);
  cg.addColorStop(1, C.goldDk);
  c.fillStyle = cg;
  c.fill();
  c.strokeStyle = rgba('#000000', 0.25);
  c.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    c.beginPath();
    c.moveTo(px, py + (68 / 4) * i);
    c.lineTo(px + 92, py + (68 / 4) * i);
    c.stroke();
  }

  setFont(c, 21, 800);
  c.fillStyle = rgba(C.gold, 0.95);
  c.textBaseline = 'middle';
  tracked(c, 'MEMBER', w - 42, 64, 5.4, 'right');
  setFont(c, 16, 800);
  c.fillStyle = rgba(C.slate, 0.95);
  tracked(c, 'OTA OS · LIFESTYLE ECOSYSTEM', w - 42, 104, 3, 'right');

  setFont(c, 44, 500, true);
  c.fillStyle = C.cream;
  c.fillText('Supercar Social Society', px, 300);

  setFont(c, 18, 800);
  c.fillStyle = rgba(C.goldLt, 0.9);
  tracked(c, 'ACCESS · NETWORK · EVENTS', px, 352, 3.6);
  return cv;
}

const LIFE_CHIPS = ['LUXURY GOODS', 'REAL ESTATE & LAND', 'SUPERCAR SOCIAL SOCIETY', 'THE NETWORK'];

function sceneLifestyle(ctx, A) {
  const { t, W, H, S, cam, V, SAFE } = A;
  /* The last third pulls the warmth down, so the cut to the launch is a fall
     into black rather than a hard chop. */
  const dim = 1 - seg(t, 7200, 9200, E.inOutQuad);
  inkBackdrop(ctx, W, H, { warm: 0.66 * dim, cy: V ? 0.4 : 0.48 });

  const settle = E.outExpo(clamp(t / 1900));
  const converge = E.inOutCubic(clamp((t - 6600) / 2200));
  cam.fov = (V ? 48 : 41) * Math.PI / 180;
  const CY = V ? 2.9 : 2.0;
  cam.lookAt([lerp(-3.4, 0, settle), lerp(1.6, CY - 0.4, settle), lerp(11, V ? 13.2 : 12.2, settle)],
             [0, CY - 0.3, 0]);

  S.reset();
  floorGrid(S, { half: 20, step: 2, y: -2.8, alpha: 0.14 * settle * dim });

  /* The card rotates in, then folds away into the mark. */
  const cardE = E.spring(clamp(t / 1600), 5.4, 4.4);
  const cardOut = 1 - converge;
  const cardM = M4.chain(
    M4.translate(0, CY, 0),
    M4.rotY(lerp(-1.25, 0.34, settle) + Math.sin(t / 2800) * 0.08),
    M4.rotX(-0.1 + Math.sin(t / 3300) * 0.05),
    M4.scale(lerp(0.55, 1, cardE) * lerp(1, 0.25, converge)));
  if (cardOut > 0.02) {
    S.mesh(Geo.extrude(Geo.roundedRect(4.56, 2.94, 0.24, 6), 0.09),
      M4.chain(cardM, M4.translate(0, 0, -0.06)),
      { ...fade(MAT.gold, 0.85 * cardOut * clamp(cardE * 1.5)), metal: 0.95, zBias: -1.4 });
    S.mesh(Geo.extrude(Geo.roundedRect(4.4, 2.78, 0.2, 6), 0.1), cardM,
      fade(MAT.forest, cardOut * clamp(cardE * 1.5)));
  }

  /* The mark takes the card's place. */
  const mk = E.outExpo(clamp((t - 7000) / 1500));
  const tileM = M4.chain(M4.translate(0, CY, 0), M4.rotY(0.2 + Math.sin(t / 2600) * 0.05),
                         M4.scale(0.78 * mk));
  if (mk > 0.02) {
    S.mesh(Assets.tileRim, M4.chain(tileM, M4.translate(0, 0, -0.09)),
      { ...fade(MAT.gold, 0.95 * mk), metal: 0.95, zBias: -1.4 });
    S.mesh(Assets.tile, tileM, fade(MAT.forest, mk));
  }
  S.render(ctx, cam, W, H);

  if (cardOut > 0.05 && cardE > 0.05) {
    texQuad3D(ctx, memberTexture(), cam, W, H,
      quadCorners(cardM, 2.12, 1.34, 0.055), 7, clamp(cardE * 1.6) * cardOut);
  }
  if (mk > 0.04) {
    texQuad3D(ctx, logoTexture(512), cam, W, H, quadCorners(tileM, 1.3, 1.3, 0.168), 6, mk);
  }
  FX.lensFlare(ctx, W / 2, H * (V ? 0.33 : 0.4), env(clamp((t - 7000) / 1200), 0.3, 0.6) * 0.6, W);
  dustField(ctx, t, W, H, 44, { speed: 14, alpha: 0.26 * dim });

  const head = 1 - seg(t, 5600, 6300, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = head;
  if (V) {
    FX.eyebrow(ctx, 70, SAFE.top - 92, 'THE OTA LIFESTYLE ECOSYSTEM', seg(t, 200, 800));
    const hOpt = { size: 76, weight: 900, tracking: -1.5, align: 'center', mode: 'wipe' };
    kinetic(ctx, 'BEYOND',     { ...hOpt, alpha: head, x: W / 2, y: SAFE.top + 6,  p: seg(t, 320, 1000), color: C.cream });
    kinetic(ctx, 'THE TRADE.', { ...hOpt, alpha: head, x: W / 2, y: SAFE.top + 88, p: seg(t, 620, 1400), color: C.gold, shadow: 0.5 });
  } else {
    FX.eyebrow(ctx, 112, 230, 'THE OTA LIFESTYLE ECOSYSTEM', seg(t, 200, 800));
    const hOpt = { size: 84, weight: 900, tracking: -1.5, mode: 'wipe' };
    kinetic(ctx, 'BEYOND',     { ...hOpt, alpha: head, x: 110, y: 370, p: seg(t, 320, 1000), color: C.cream });
    kinetic(ctx, 'THE TRADE.', { ...hOpt, alpha: head, x: 110, y: 466, p: seg(t, 620, 1400), color: C.gold, shadow: 0.5 });
  }
  ctx.restore();

  /* Chips, then the wordmark that replaces them. */
  const chipA = 1 - seg(t, 5500, 6100, E.inOutQuad);
  const cy2 = V ? H - SAFE.bottom - 350 : H - 268;
  if (chipA > 0.004) {
    if (V) {
      chipRow(ctx, LIFE_CHIPS.slice(0, 2), W / 2, cy2, t, { size: 21, start: 2300, stagger: 220, alpha: chipA });
      chipRow(ctx, LIFE_CHIPS.slice(2),    W / 2, cy2 + 58, t, { size: 21, start: 2700, stagger: 220, alpha: chipA });
    } else {
      chipRow(ctx, LIFE_CHIPS, W / 2, cy2, t, { size: 21, start: 2300, stagger: 220, alpha: chipA });
    }
  }

  const wa = seg(t, 6300, 6900) * dim;
  const wy = V ? H - SAFE.bottom - 330 : H - 274;
  const wOpt = { size: V ? 46 : 50, weight: 900, tracking: V ? 4 : 6.5, alpha: wa,
                 align: 'center', mode: 'glyph', stagger: 0.022, color: C.cream, shadow: 0.4 };
  if (wa > 0.004) {
    if (V) {
      kinetic(ctx, 'OPTIONS TRADERS', { ...wOpt, x: W / 2, y: wy, p: seg(t, 6300, 7200) });
      kinetic(ctx, 'ACADEMY OS',      { ...wOpt, x: W / 2, y: wy + 58, p: seg(t, 6500, 7400) });
    } else {
      kinetic(ctx, 'OPTIONS TRADERS ACADEMY OS', { ...wOpt, x: W / 2, y: wy, p: seg(t, 6300, 7300) });
    }
  }

  /* Fall to black under the cut. */
  const fo = seg(t, 8400, 9200, E.inQuad);
  if (fo > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fo * 0.9})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ══ S10 · 62.4 → 74.0s ══  The product-launch close ══════════════════════ */
function sceneLaunch(ctx, A) {
  const { t, W, H, V, SAFE } = A;

  /* Near-black, with the deep green only breathing in behind the mark. */
  ctx.fillStyle = '#010703';
  ctx.fillRect(0, 0, W, H);
  const markY = lerp(V ? 640 : H * 0.42, V ? 544 : H * 0.30, E.inOutCubic(clamp((t - 7700) / 900)));
  const glow = E.outExpo(clamp((t - 300) / 2600));
  const g = ctx.createRadialGradient(W / 2, markY, 0, W / 2, markY, H * 0.62);
  g.addColorStop(0, `rgba(10,46,24,${0.85 * glow})`);
  g.addColorStop(0.45, `rgba(5,24,13,${0.6 * glow})`);
  g.addColorStop(1, 'rgba(1,7,3,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  dustField(ctx, t, W, H, 40, { speed: 10, alpha: 0.2 * glow });

  /* The mark arrives slowly — this is the only beat in the film that waits. */
  const mp = E.outExpo(clamp((t - 400) / 2200));
  const size = lerp(V ? 300 : 230, V ? 184 : 150, E.inOutCubic(clamp((t - 7700) / 900)));
  if (mp > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(mp * 1.3);
    const s = size * lerp(0.86, 1, mp);
    ctx.shadowColor = rgba(C.gold, 0.45);
    ctx.shadowBlur = 70 * mp;
    logoStamp(ctx, W / 2 - s / 2, markY - s / 2, s, { radius: s * 0.2 });
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(C.gold, 0.7 * mp);
    ctx.lineWidth = 2.2;
    roundRect(ctx, W / 2 - s / 2, markY - s / 2, s, s, s * 0.2);
    ctx.stroke();
    /* One expanding ring, like a key light finding the object. */
    const rp = env(clamp((t - 900) / 2000), 0.3, 0.7);
    if (rp > 0.01) {
      ctx.globalAlpha = rp * 0.35;
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(W / 2, markY, s * lerp(0.62, 1.5, clamp((t - 900) / 2000)), 0, 7);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* The two lines, one at a time, where the end card will later sit. */
  const ly = V ? 980 : H * 0.72;
  const lOpt = { size: V ? 62 : 68, weight: 900, tracking: -1, align: 'center', mode: 'wipe' };
  const a1 = seg(t, 3200, 4100) * (1 - seg(t, 5900, 6300, E.inOutQuad));
  if (a1 > 0.004) {
    ctx.save();
    ctx.globalAlpha = a1;
    if (V) {
      kinetic(ctx, 'YOU DON’T NEED',      { ...lOpt, x: W / 2, y: ly,       p: seg(t, 3200, 4100), color: C.cream });
      kinetic(ctx, 'ANOTHER TRADING APP.', { ...lOpt, x: W / 2, y: ly + 74, p: seg(t, 3500, 4500), color: C.cream });
    } else {
      kinetic(ctx, 'YOU DON’T NEED ANOTHER TRADING APP.',
        { ...lOpt, size: 60, x: W / 2, y: ly, p: seg(t, 3200, 4400), color: C.cream });
    }
    ctx.restore();
  }
  const a2 = seg(t, 6200, 7000) * (1 - seg(t, 7500, 7900, E.inOutQuad));
  if (a2 > 0.004) {
    ctx.save();
    ctx.globalAlpha = a2;
    if (V) {
      kinetic(ctx, 'YOU NEED AN',       { ...lOpt, x: W / 2, y: ly,       p: seg(t, 6200, 7000), color: C.gold, shadow: 0.6 });
      kinetic(ctx, 'OPERATING SYSTEM.', { ...lOpt, x: W / 2, y: ly + 74, p: seg(t, 6400, 7300), color: C.gold, shadow: 0.6 });
    } else {
      kinetic(ctx, 'YOU NEED AN OPERATING SYSTEM.',
        { ...lOpt, size: 60, x: W / 2, y: ly, p: seg(t, 6200, 7200), color: C.gold, shadow: 0.6 });
    }
    ctx.restore();
  }

  /* ── End card ── */
  const ep = seg(t, 7800, 8400);
  if (ep <= 0.004) return;
  const top = V ? 880 : H * 0.47;

  ctx.save();
  const wOpt = { size: V ? 54 : 58, weight: 900, tracking: V ? 4.2 : 7,
                 align: 'center', mode: 'glyph', stagger: 0.02, color: C.cream, shadow: 0.5 };
  if (V) {
    kinetic(ctx, 'OPTIONS TRADERS', { ...wOpt, x: W / 2, y: top, p: seg(t, 7800, 8700) });
    kinetic(ctx, 'ACADEMY OS',      { ...wOpt, x: W / 2, y: top + 64, p: seg(t, 7950, 8850) });
  } else {
    kinetic(ctx, 'OPTIONS TRADERS ACADEMY OS', { ...wOpt, x: W / 2, y: top, p: seg(t, 7800, 8800) });
  }

  const y2 = top + (V ? 126 : 54);
  kinetic(ctx, CFG.endline, {
    x: W / 2, y: y2, size: V ? 29 : 30, weight: 600, tracking: 1.4, face: true,
    align: 'center', p: seg(t, 8200, 9000), mode: 'wipe', color: rgba(C.gold, 0.96),
  });

  const rl = seg(t, 8500, 9100, E.outExpo);
  ctx.fillStyle = rgba(C.gold, 0.8 * rl);
  ctx.fillRect(W / 2 - 180 * rl, y2 + (V ? 26 : 22), 360 * rl, 2);

  /* Your market. Your education. Your wealth. One system. */
  const cp = seg(t, 8700, 9400);
  if (cp > 0.004) {
    ctx.save();
    ctx.globalAlpha = clamp(cp * 2);
    setFont(ctx, V ? 22 : 23, 800);
    const line = CFG.closing.map(s => s.replace(/\.$/, '').toUpperCase()).join('   ·   ');
    ctx.fillStyle = rgba(C.cream, 0.92);
    ctx.textBaseline = 'middle';
    tracked(ctx, line, W / 2, y2 + (V ? 66 : 58), 2.4, 'center');
    ctx.restore();
  }

  /* CTA. */
  const bp = E.outBack(clamp((t - 9300) / 760));
  const by = y2 + (V ? 104 : 92);
  if (bp > 0.01) {
    const bw = V ? W - 180 : 600, bh = V ? 96 : 92;
    const bx = W / 2 - bw / 2;
    const pulse = 0.5 + 0.5 * Math.sin((t - 9300) / 420);
    ctx.save();
    ctx.globalAlpha = clamp((t - 9300) / 380);
    ctx.translate(W / 2, by + bh / 2);
    ctx.scale(lerp(0.9, 1, clamp(bp)), lerp(0.9, 1, clamp(bp)));
    ctx.translate(-W / 2, -(by + bh / 2));
    roundRect(ctx, bx - 8 - pulse * 10, by - 8 - pulse * 10, bw + 16 + pulse * 20, bh + 16 + pulse * 20, 15);
    ctx.strokeStyle = rgba(C.gold, 0.4 * (1 - pulse));
    ctx.lineWidth = 2;
    ctx.stroke();
    roundRect(ctx, bx, by, bw, bh, 11);
    const bg = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    bg.addColorStop(0, C.goldLt);
    bg.addColorStop(0.55, C.gold);
    bg.addColorStop(1, C.goldDk);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.shadowColor = rgba(C.gold, 0.55);
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.shadowBlur = 0;
    setFont(ctx, V ? 33 : 33, 900);
    ctx.fillStyle = '#06200F';
    ctx.textBaseline = 'middle';
    tracked(ctx, CFG.cta, W / 2, by + bh / 2 + 1, 3.2, 'center');
    ctx.restore();
    FX.sweep(ctx, bx, by, bw, bh, seg(t, 9700, 10500), { alpha: 0.75, width: 0.12 });
  }

  /* The offer, stated exactly: a 7-day money-back guarantee. */
  const gp = seg(t, 10000, 10600);
  const gy = by + (V ? 134 : 124);
  if (gp > 0.004) {
    ctx.save();
    ctx.globalAlpha = gp;
    chipRow(ctx, CFG.badges, W / 2, gy, t, { size: V ? 20 : 19, start: 10000, stagger: 180, h: 46, alpha: gp });
    ctx.restore();
  }

  const dp = seg(t, 10500, 11100);
  if (dp > 0.004) {
    ctx.save();
    ctx.globalAlpha = dp;
    setFont(ctx, V ? 23 : 20, 800);
    ctx.fillStyle = rgba(C.goldLt, 0.95);
    ctx.textBaseline = 'middle';
    tracked(ctx, CFG.trademark, W / 2, gy + (V ? 80 : 70), 3.2, 'center');
    setFont(ctx, V ? 18 : 15, 500);
    ctx.fillStyle = rgba(C.slate, 0.92);
    ctx.textAlign = 'center';
    CFG.disclaimer.forEach((ln, i) => ctx.fillText(ln, W / 2, gy + (V ? 120 : 104) + i * (V ? 24 : 20)));
    ctx.textAlign = 'left';
    ctx.restore();
  }
  ctx.restore();

  const fo = seg(t, 11200, 11600, E.inQuad);
  if (fo > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fo})`;
    ctx.fillRect(0, 0, W, H);
  }
}
