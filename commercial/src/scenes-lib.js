/* ============================================================================
   scenes-lib.js — the vocabulary both films are written in.

   screenPane — a framed window onto a REAL screenshot, showing a normalised
                sub-rect of it. It returns a mapper from image coordinates to
                screen pixels, so a highlight lands on the actual UI instead
                of on a guess.
   panKeys    — keyframed source rect. Panning the window down a still is how
                "the user scrolls" reads on film without faking a scroll.
   spotlight  — the highlight itself: everything but the named region dims.
   tileGrid   — a deck of labelled tiles that deals itself out.
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