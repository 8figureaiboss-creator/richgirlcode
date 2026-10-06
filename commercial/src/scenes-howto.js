/* ============================================================================
   scenes-howto.js — "How to find your setup" (0.0s → 176.0s)

   A walkthrough, not a trailer. The grammar is different from the brand film:
   one idea per scene, a persistent step counter so the viewer always knows
   where they are, and the real product doing the thing the voice-over is
   describing rather than a graphic standing in for it.
   ========================================================================== */

/* ── Regions of the real screenshots ─────────────────────────────────────────
   Normalised to the PACKED textures in shots.js. `profile` and `homescreen`
   are packed full-frame, so these are straight fractions of the image.       */
const R_PROF = {
  header:  { x: 0.025, y: 0.010, w: 0.950, h: 0.082 },   // the Q bar
  ticker:  { x: 0.040, y: 0.408, w: 0.922, h: 0.134 },   // live index strip
  card:    { x: 0.036, y: 0.556, w: 0.936, h: 0.312 },   // the profile card
  name:    { x: 0.085, y: 0.782, w: 0.380, h: 0.078 },   // "Options Sniper"
  profTab: { x: 0.788, y: 0.868, w: 0.160, h: 0.085 },   // PROFILE, bottom nav
};

/* The iOS home-row capture: OTA sits between TradingView and Robinhood. */
const R_HOME = {
  tv:  { x: 0.052, y: 0.160, w: 0.206, h: 0.770 },
  ota: { x: 0.272, y: 0.160, w: 0.218, h: 0.770 },
  rh:  { x: 0.512, y: 0.160, w: 0.200, h: 0.770 },
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/* Phone, tablet and desktop, each carrying the mark — "one click away, on
   whatever you are sitting in front of", said with objects instead of a list. */
function deviceGlyphs(ctx, cx, baseY, scale, t, start, alpha) {
  const specs = [[86, 170, 'PHONE'], [132, 176, 'TABLET'], [224, 146, 'DESKTOP']];
  const gap = 28 * scale;
  const total = specs.reduce((a, sp) => a + sp[0] * scale, 0) + gap * (specs.length - 1);
  let x = cx - total / 2;
  specs.forEach(([w0, h0, lab], i) => {
    const w = w0 * scale, h = h0 * scale;
    const e = E.outExpo(clamp((t - start - i * 240) / 760));
    if (e <= 0.02) { x += w + gap; return; }
    const y = baseY - h + (1 - e) * 18;
    ctx.save();
    ctx.globalAlpha = clamp(e * 1.8) * alpha;

    roundRect(ctx, x, y, w, h, 13 * scale);
    ctx.fillStyle = 'rgba(6,28,16,0.94)';
    ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.52);
    ctx.lineWidth = 1.6;
    ctx.stroke();

    /* The desktop gets a stand, so the three silhouettes read apart. */
    if (lab === 'DESKTOP') {
      ctx.fillStyle = rgba(C.gold, 0.45);
      ctx.fillRect(x + w * 0.42, y + h, w * 0.16, 7 * scale);
      roundRect(ctx, x + w * 0.28, y + h + 6 * scale, w * 0.44, 5 * scale, 2.5 * scale);
      ctx.fill();
    }

    const ms = Math.min(w, h) * 0.44;
    const mx = x + w / 2 - ms / 2, my = y + h / 2 - ms / 2;
    logoStamp(ctx, mx, my, ms, { radius: ms * 0.22 });
    ctx.strokeStyle = rgba(C.gold, 0.5);
    ctx.lineWidth = 1.2;
    roundRect(ctx, mx, my, ms, ms, ms * 0.22);
    ctx.stroke();

    setFont(ctx, 15 * scale, 900);
    ctx.fillStyle = rgba(C.goldLt, 0.92);
    ctx.textBaseline = 'middle';
    tracked(ctx, lab, x + w / 2, baseY + (lab === 'DESKTOP' ? 36 : 26) * scale, 2.4, 'center');
    ctx.restore();
    x += w + gap;
  });
}

/* "STEP 3 / 7" with its own progress dots — the viewer's place in the film. */
function stepChip(ctx, x, y, n, total, label, p, opt = {}) {
  if (p <= 0.004) return;
  const e = E.outExpo(clamp(p));
  const big = opt.size || 17;
  ctx.save();
  ctx.globalAlpha = clamp(p * 2);
  ctx.textBaseline = 'middle';

  setFont(ctx, big, 900);
  const num = `STEP ${n}`;
  const nw = trackedWidth(ctx, num, 3) + 26;
  roundRect(ctx, x, y - 16, nw, 32, 16);
  ctx.fillStyle = rgba(C.gold, 0.16);
  ctx.fill();
  ctx.strokeStyle = rgba(C.gold, 0.7);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = C.goldLt;
  tracked(ctx, num, x + 13, y, 3);

  /* Dots: filled up to the current step. */
  let dx = x + nw + 14;
  for (let i = 1; i <= total; i++) {
    const on = i <= n;
    ctx.beginPath();
    ctx.arc(dx + 5, y, on ? 4 : 3, 0, 7);
    ctx.fillStyle = on ? rgba(C.gold, 0.95) : rgba(C.slate, 0.4);
    ctx.fill();
    dx += 15;
  }

  if (label) {
    setFont(ctx, big, 800);
    ctx.fillStyle = rgba(C.cream, 0.88);
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx + 14, y - big, trackedWidth(ctx, label, 2.6) * e + 4, big * 2);
    ctx.clip();
    tracked(ctx, label, dx + 14, y, 2.6);
    ctx.restore();
  }
  ctx.restore();
}

/* A chart card with its timeframe on it — the five uploads. */
function chartCard(ctx, x, y, w, h, p, label, seed, t) {
  if (p <= 0.004) return;
  const e = E.outExpo(clamp(p));
  const yy = y + (1 - e) * 26;
  ctx.save();
  ctx.globalAlpha = clamp(p * 2);
  roundRect(ctx, x, yy, w, h, 12);
  const g = ctx.createLinearGradient(x, yy, x, yy + h);
  g.addColorStop(0, 'rgba(10,40,22,0.96)');
  g.addColorStop(1, 'rgba(3,14,8,0.96)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(C.gold, 0.4);
  ctx.lineWidth = 1.3;
  ctx.stroke();

  ctx.save();
  roundRect(ctx, x + 1, yy + 1, w - 2, h - 2, 11);
  ctx.clip();
  candles2d(ctx, x + 10, yy + 34, w - 20, h - 46, t + seed * 2200, clamp(p * 1.6));
  ctx.restore();

  setFont(ctx, Math.min(16, w * 0.12), 900);
  ctx.fillStyle = C.goldLt;
  ctx.textBaseline = 'middle';
  tracked(ctx, label, x + 12, yy + 18, 2);
  ctx.restore();
}

/* One of the three readings the analysis can return. */
function verdict(ctx, x, y, w, h, p, label, color, sub, emphasis = 0) {
  if (p <= 0.004) return;
  const e = E.spring(clamp(p), 6, 4.6);
  ctx.save();
  ctx.globalAlpha = clamp(p * 2);
  const s = lerp(0.88, 1, e) * (1 + emphasis * 0.04);
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(s, s);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  roundRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = rgba(color, 0.12 + emphasis * 0.1);
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.5 + emphasis * 0.45);
  ctx.lineWidth = 1.6 + emphasis * 1.4;
  if (emphasis) { ctx.shadowColor = rgba(color, 0.5); ctx.shadowBlur = 30 * emphasis; }
  ctx.stroke();
  ctx.shadowBlur = 0;
  setFont(ctx, Math.min(34, w * 0.13), 900);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  tracked(ctx, label, x + w / 2, y + h / 2 - (sub ? 13 : 0), 2.4, 'center');
  if (sub) {
    setFont(ctx, Math.min(17, w * 0.065), 600);
    ctx.fillStyle = rgba(C.slate, 0.95);
    ctx.fillText(sub, x + w / 2, y + h / 2 + 18);
  }
  ctx.textAlign = 'left';
  ctx.restore();
}

/* A line of the confirmation checklist, ticking itself. */
function checkRow(ctx, x, y, w, p, label, opt = {}) {
  if (p <= 0.004) return;
  const e = E.outExpo(clamp(p));
  const size = opt.size || 24;
  ctx.save();
  ctx.globalAlpha = clamp(p * 2);
  ctx.translate((1 - e) * -22, 0);

  const r = size * 0.72;
  ctx.beginPath();
  ctx.arc(x + r, y, r, 0, 7);
  ctx.fillStyle = rgba(C.green, 0.14 * e);
  ctx.fill();
  ctx.strokeStyle = rgba(C.green, 0.4 + 0.5 * e);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  /* The tick draws itself in, rather than popping. */
  const tp = clamp((p - 0.35) / 0.4);
  if (tp > 0) {
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const a = [x + r - r * 0.42, y + r * 0.02];
    const b = [x + r - r * 0.1, y + r * 0.38];
    const c2 = [x + r + r * 0.46, y - r * 0.38];
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    const m1 = Math.min(1, tp * 2);
    ctx.lineTo(lerp(a[0], b[0], m1), lerp(a[1], b[1], m1));
    if (tp > 0.5) {
      const m2 = (tp - 0.5) * 2;
      ctx.lineTo(lerp(b[0], c2[0], m2), lerp(b[1], c2[1], m2));
    }
    ctx.stroke();
  }

  setFont(ctx, size, 800);
  ctx.fillStyle = rgba(C.cream, 0.95);
  ctx.textBaseline = 'middle';
  tracked(ctx, label, x + r * 2 + 16, y, 1.6);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.restore();
}

/* BIAS · LEVELS · CONFIRMATION · … — six terms are too many for arrows. */
function dotLine(ctx, words, cx, y, t, opt = {}) {
  const { size = 23, start = 0, stagger = 190, alpha = 1, color = C.cream } = opt;
  setFont(ctx, size, 900);
  const gap = size * 1.5;
  const ws = words.map(w => trackedWidth(ctx, w, 2.4));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = cx - total / 2;
  words.forEach((w, i) => {
    const e = E.outExpo(clamp((t - start - i * stagger) / 520));
    ctx.save();
    ctx.globalAlpha = clamp(e * 2) * alpha;
    setFont(ctx, size, 900);
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    tracked(ctx, w, x, y, 2.4);
    ctx.restore();
    x += ws[i];
    if (i < words.length - 1) {
      ctx.save();
      ctx.globalAlpha = clamp(E.outExpo(clamp((t - start - i * stagger - 120) / 420)) * 2) * alpha;
      ctx.fillStyle = rgba(C.gold, 0.95);
      ctx.beginPath();
      ctx.arc(x + gap / 2, y, 3.2, 0, 7);
      ctx.fill();
      ctx.restore();
      x += gap;
    }
  });
}

/* A tablet or desktop panel in 3D, carrying a real screen. */
function slab(S, ctx, cam, W, H, img, m, alpha, hw, hh) {
  if (alpha <= 0.02) return () => {};
  S.mesh(Geo.extrude(Geo.roundedRect(hw * 2 + 0.22, hh * 2 + 0.22, 0.16, 6), 0.14),
    M4.chain(m, M4.translate(0, 0, -0.08)),
    { ...fade(MAT.gold, 0.55 * alpha), metal: 0.95, zBias: -1.4 });
  S.mesh(Geo.extrude(Geo.roundedRect(hw * 2 + 0.1, hh * 2 + 0.1, 0.14, 6), 0.16), m,
    fade(MAT.steel, alpha));
  return () => {
    if (img) texQuad3D(ctx, img, cam, W, H, quadCorners(m, hw, hh, 0.09), 7, clamp(alpha * 1.5));
  };
}

/* Every walkthrough scene shares this bed, so the cuts feel like one room. */
function howtoBed(ctx, A, { warm = 0.44, cx = 0.5, cy = 0.5, drift = 1 } = {}) {
  const { t, W, H, S, cam, V } = A;
  inkBackdrop(ctx, W, H, { warm, cx, cy });
  const settle = E.outExpo(clamp(t / 1700));
  cam.fov = (V ? 52 : 44) * Math.PI / 180;
  cam.lookAt([lerp(-2.6 * drift, -0.7 * drift, settle), lerp(2.2, 3.3, settle),
              lerp(13.4, 16, settle)], [0, 1.4, 0]);
  S.reset();
  floorGrid(S, { half: 22, step: 2.4, y: -3.4, alpha: 0.13 * settle });
  railsBehind(S, t, 1.4, settle);
  S.render(ctx, cam, W, H);
  dustField(ctx, t, W, H, 32, { speed: 14 * drift, alpha: 0.19 });
  return settle;
}

/* The headline block every walkthrough scene opens with. */
function howtoHead(ctx, A, step, kicker, lines, out) {
  const { t, W, V, SAFE } = A;
  ctx.save();
  ctx.globalAlpha = out;
  if (V) {
    stepChip(ctx, 70, SAFE.top - 108, step, 7, kicker, seg(t, 150, 800), { size: 18 });
    const hOpt = { size: lines.length > 2 ? 54 : 62, weight: 900, tracking: -1,
                   align: 'center', mode: 'wipe' };
    lines.forEach(([text, gold], i) => {
      kinetic(ctx, text, { ...hOpt, alpha: out, x: W / 2, y: SAFE.top + 4 + i * (hOpt.size + 8),
        p: seg(t, 320 + i * 280, 1050 + i * 280),
        color: gold ? C.gold : C.cream, shadow: gold ? 0.5 : 0 });
    });
  } else {
    stepChip(ctx, 112, 232, step, 7, kicker, seg(t, 150, 800), { size: 18 });
    const hOpt = { size: 78, weight: 900, tracking: -1.4, mode: 'wipe' };
    lines.forEach(([text, gold], i) => {
      kinetic(ctx, text, { ...hOpt, alpha: out, x: 110, y: 372 + i * 90,
        p: seg(t, 320 + i * 280, 1050 + i * 280),
        color: gold ? C.gold : C.cream, shadow: gold ? 0.5 : 0 });
    });
  }
  ctx.restore();
}

/* ══ H1 · 0.0 → 18.0s ══  Save it to your home screen ═════════════════════ */
function hAccess(ctx, A) {
  const { t, W, H, S, cam, V, SAFE } = A;
  inkBackdrop(ctx, W, H, { warm: 0.58, cx: V ? 0.5 : 0.56, cy: V ? 0.42 : 0.5 });

  const settle = E.outExpo(clamp(t / 1900));
  cam.fov = (V ? 50 : 42) * Math.PI / 180;
  cam.lookAt([lerp(-3.2, -0.6, settle), lerp(1.8, 3.0, settle), lerp(13, 15.6, settle)], [0, 1.3, 0]);
  S.reset();
  floorGrid(S, { half: 22, step: 2.4, y: -3.4, alpha: 0.14 * settle });
  railsBehind(S, t, 1.4, settle);

  /* The app icon itself, in 3D — it turns, then leaves to become the shortcut. */
  const tileIn = E.spring(clamp((t - 250) / 1500), 5.6, 4.4);
  const tileGo = seg(t, 3000, 4300, E.inOutCubic);
  const tileA = clamp(tileIn * 1.4) * (1 - tileGo);
  const TP = V ? [0, 3.65, 0] : [3.6, 2.2, 0];
  let tileM = null;
  if (tileA > 0.02) {
    tileM = M4.chain(M4.translate(TP[0], TP[1], TP[2]),
      M4.rotY(lerp(-0.95, 0.22, tileIn) + Math.sin(t / 2600) * 0.06),
      M4.rotX(Math.sin(t / 3100) * 0.05),
      M4.scale(lerp(0.5, V ? 0.92 : 0.78, tileIn)));
    S.mesh(Assets.tileRim, M4.chain(tileM, M4.translate(0, 0, -0.09)),
      { ...fade(MAT.gold, 0.95 * tileA), metal: 0.95, zBias: -1.4 });
    S.mesh(Assets.tile, tileM, fade(MAT.forest, tileA));
    S.mesh(Assets.torus, M4.chain(M4.translate(TP[0], TP[1], TP[2]),
      M4.rotX(1.1 + Math.sin(t / 2000) * 0.08), M4.rotY(t / 1800),
      M4.scale(0.6)), fade(MAT.gold, 0.32 * tileA));
  }
  S.render(ctx, cam, W, H);
  if (tileM && tileA > 0.04) {
    texQuad3D(ctx, logoTexture(512), cam, W, H, quadCorners(tileM, 1.3, 1.3, 0.168), 6, tileA);
  }
  dustField(ctx, t, W, H, 34, { speed: 14, alpha: 0.2 });

  const out = 1 - seg(t, 17300, 18000, E.inOutQuad);

  /* The real home row, with the OTA icon lit. */
  const hs = seg(t, 2600, 3600);
  const box = V ? { x: 90, y: 862, w: 900, h: 266 }
                : { x: 480, y: 574, w: 584, h: 173 };
  if (hs > 0.004 && IMG.homescreen) {
    const src = { x: 0, y: 0, w: 1, h: 1 };
    src.h = 1 * IMG.homescreen.height / (IMG.homescreen.width * (box.h / box.w));
    src.y = (1 - src.h) / 2;
    const e = E.outExpo(clamp(hs));
    const bx = { ...box, y: box.y + (1 - e) * 24 };
    ctx.save();
    ctx.globalAlpha = out;
    const map = screenPane(ctx, IMG.homescreen, bx, src, clamp(hs * 1.6), { radius: 18 });
    spotlight(ctx, bx, [{ r: map(R_HOME.ota), p: seg(t, 9400, 16800), label: 'ONE TAP' }],
      { size: V ? 19 : 18, radius: 18, dim: 0.66 });
    ctx.restore();
  }

  /* The icon itself, flying from the title into the row. */
  const fly = seg(t, 3000, 4400, E.inOutCubic);
  if (fly > 0.01 && fly < 0.995) {
    const from = V ? [W / 2, 650] : [1284, 459];
    const to = V ? [box.x + box.w * 0.38, box.y + box.h * 0.46]
                 : [box.x + box.w * 0.38, box.y + box.h * 0.46];
    const s = lerp(V ? 190 : 170, V ? 96 : 86, fly);
    const x = lerp(from[0], to[0], fly);
    const y = lerp(from[1], to[1], fly) - Math.sin(fly * Math.PI) * 110;
    ctx.save();
    ctx.globalAlpha = out * clamp((1 - fly) * 6);
    ctx.shadowColor = rgba(C.gold, 0.5);
    ctx.shadowBlur = 44;
    logoStamp(ctx, x - s / 2, y - s / 2, s, { radius: s * 0.22 });
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(C.gold, 0.7);
    ctx.lineWidth = 2;
    roundRect(ctx, x - s / 2, y - s / 2, s, s, s * 0.22);
    ctx.stroke();
    ctx.restore();
  }

  /* Type. */
  ctx.save();
  ctx.globalAlpha = out;
  if (V) {
    FX.eyebrow(ctx, 70, SAFE.top - 100, 'BEFORE YOU START', seg(t, 200, 900));
    const hOpt = { size: 58, weight: 900, tracking: -1, align: 'center', mode: 'wipe' };
    kinetic(ctx, 'SAVE OTA OS',        { ...hOpt, alpha: out, x: W / 2, y: SAFE.top + 4,  p: seg(t, 400, 1200), color: C.cream });
    kinetic(ctx, 'TO YOUR HOME SCREEN.', { ...hOpt, size: 50, alpha: out, x: W / 2, y: SAFE.top + 70, p: seg(t, 700, 1500), color: C.gold, shadow: 0.5 });
    kinetic(ctx, 'Fast access. Phone or desktop.', {
      x: W / 2, y: SAFE.top + 128, size: 27, weight: 600, tracking: 1.2, face: true,
      align: 'center', alpha: out, p: seg(t, 1200, 2000), mode: 'wipe', color: rgba(C.slate, 0.98),
    });
    deviceGlyphs(ctx, W / 2, 790, 1.25, t, 5000, out);
  } else {
    FX.eyebrow(ctx, 112, 250, 'BEFORE YOU START', seg(t, 200, 900));
    const hOpt = { size: 72, weight: 900, tracking: -1.4, mode: 'wipe' };
    kinetic(ctx, 'SAVE OTA OS',          { ...hOpt, alpha: out, x: 110, y: 382, p: seg(t, 400, 1200), color: C.cream });
    kinetic(ctx, 'TO YOUR HOME SCREEN.', { ...hOpt, size: 60, alpha: out, x: 110, y: 462, p: seg(t, 700, 1500), color: C.gold, shadow: 0.5 });
    ctx.globalAlpha = out * seg(t, 1200, 2000);
    setFont(ctx, 26, 600, true);
    ctx.fillStyle = rgba(C.slate, 0.98);
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Fast access. Phone or desktop.', 112, 520);
    deviceGlyphs(ctx, 1430, 556, 1.3, t, 5000, out);
  }
  ctx.restore();
}

/* ══ H2 · 18.0 → 31.0s ══  Profile → Your Daily Play ══════════════════════ */
const PAN_PROF = [
  { at:    0, cy: 0.46, w: 1.00 },
  { at: 1200, cy: 0.50, w: 1.00 },
  { at: 3600, cy: 0.70, w: 0.96 },   // the profile card
  { at: 6400, cy: 0.88, w: 0.92 },   // the bottom nav
  { at: 9200, cy: 0.88, w: 0.92 },
];

function hProfile(ctx, A) {
  const { t, W, H, V, SAFE } = A;
  howtoBed(ctx, A, { warm: 0.44, cx: V ? 0.5 : 0.62, drift: 1 });

  const box = V ? { x: 110, y: SAFE.top + 190, w: 860, h: 800 }
                : { x: 1030, y: 160, w: 760, h: 660 };
  const enter = E.outExpo(clamp(t / 900));
  const out = 1 - seg(t, 12400, 13000, E.inOutQuad);
  const src = panKeys(PAN_PROF, t, IMG.profile, box);
  const map = screenPane(ctx, IMG.profile, box, src, clamp(enter * 1.4) * out);

  if (enter > 0.3) {
    ctx.save();
    ctx.globalAlpha = out;
    spotlight(ctx, box, [
      { r: map(R_PROF.header),  p: seg(t,  500, 1900), label: 'LOG IN' },
      { r: map(R_PROF.card),    p: seg(t, 3400, 6300), label: 'YOUR PROFILE' },
      { r: map(R_PROF.profTab), p: seg(t, 6500, 9400), label: 'PROFILE' },
    ], { size: V ? 20 : 18 });
    ctx.restore();
  }

  howtoHead(ctx, A, 1, 'START IN YOUR PROFILE',
    [['LOG IN.', false], ['OPEN YOUR PLAY.', true]], out);

  ctx.save();
  ctx.globalAlpha = out;
  const fy = V ? box.y + box.h + 68 : 620;
  flowLine(ctx, ['PROFILE', 'YOUR DAILY PLAY'], V ? W / 2 : 110 + 300, fy, t,
    { size: V ? 27 : 30, start: 9000, stagger: 420, alpha: out });
  ctx.restore();
}

/* ══ H3 · 31.0 → 46.5s ══  Ticker, and options or futures ═════════════════ */
const PAN_CHOOSE = [
  { at:    0, cy: 0.40, w: 1.00 },
  { at: 1400, cy: 0.455, w: 1.00 },   // the Options / Futures toggle
  { at: 5200, cy: 0.455, w: 1.00 },
  { at: 7000, cy: 0.600, w: 1.00 },   // the ticker field
  { at: 10400, cy: 0.600, w: 1.00 },
  { at: 12000, cy: 0.740, w: 1.00 },  // the ticker chips
  { at: 14800, cy: 0.748, w: 1.00 },
];
const R_TOGGLE = { x: 0.055, y: 0.282, w: 0.430, h: 0.048 };
const R_FIELD  = { x: 0.057, y: 0.648, w: 0.600, h: 0.060 };
const R_START  = { x: 0.680, y: 0.648, w: 0.300, h: 0.060 };

function hChoose(ctx, A) {
  const { t, W, H, V, SAFE } = A;
  howtoBed(ctx, A, { warm: 0.42, cx: V ? 0.5 : 0.64, drift: -1 });

  const box = V ? { x: 110, y: SAFE.top + 190, w: 860, h: 800 }
                : { x: 1030, y: 160, w: 760, h: 660 };
  const enter = E.outExpo(clamp(t / 900));
  const out = 1 - seg(t, 14900, 15500, E.inOutQuad);
  const src = panKeys(PAN_CHOOSE, t, IMG.dailyPlay, box);
  const map = screenPane(ctx, IMG.dailyPlay, box, src, clamp(enter * 1.4) * out);

  if (enter > 0.3) {
    ctx.save();
    ctx.globalAlpha = out;
    spotlight(ctx, box, [
      { r: map(R_TOGGLE),       p: seg(t, 1400, 5000), label: 'OPTIONS OR FUTURES' },
      { r: map(R_FIELD),        p: seg(t, 6900, 10200), label: 'ENTER THE TICKER' },
      { r: map(R_PLAY.chips),   p: seg(t, 11900, 14600), label: 'OR PICK ONE' },
    ], { size: V ? 20 : 18 });
    ctx.restore();
  }

  /* The ticker types itself, so the step reads even with the sound off. */
  const typ = seg(t, 7400, 9000);
  if (typ > 0.004 && typ < 0.999) {
    const r = map(R_FIELD);
    const n = Math.min(3, Math.floor(typ * 4.2));
    const txt = 'QQQ'.slice(0, n);
    ctx.save();
    ctx.globalAlpha = out * clamp(typ * 6) * (1 - seg(typ, 0.9, 1));
    setFont(ctx, Math.min(40, r.h * 0.72), 900);
    ctx.fillStyle = C.goldLt;
    ctx.textBaseline = 'middle';
    const tx = r.x + 14;
    tracked(ctx, txt, tx, r.y + r.h / 2, 2);
    /* caret */
    if ((t / 420 | 0) % 2 === 0) {
      ctx.fillRect(tx + trackedWidth(ctx, txt, 2) + 5, r.y + r.h * 0.22, 3, r.h * 0.56);
    }
    ctx.restore();
  }

  howtoHead(ctx, A, 2, 'PICK YOUR MARKET',
    [['ENTER', false], ['YOUR TICKER.', true]], out);

  ctx.save();
  ctx.globalAlpha = out;
  const fy = V ? box.y + box.h + 68 : 640;
  const nOpt = { size: V ? 25 : 27, weight: 900, tracking: 2.2, mode: 'wipe', color: C.cream };
  if (V) {
    kinetic(ctx, '1.  ENTER TICKER', { ...nOpt, alpha: out, x: W / 2, y: fy, align: 'center', p: seg(t, 12400, 13200) });
    kinetic(ctx, '2.  SELECT OPTIONS OR FUTURES', { ...nOpt, size: 23, alpha: out, x: W / 2, y: fy + 44, align: 'center', p: seg(t, 12800, 13600) });
  } else {
    kinetic(ctx, '1.  ENTER TICKER', { ...nOpt, alpha: out, x: 112, y: fy, p: seg(t, 12400, 13200) });
    kinetic(ctx, '2.  SELECT OPTIONS OR FUTURES', { ...nOpt, alpha: out, x: 112, y: fy + 50, p: seg(t, 12800, 13600) });
  }
  ctx.restore();
}

/* ══ H4 · 46.5 → 62.5s ══  Upload your charts ═════════════════════════════ */
const TIMEFRAMES = ['FULL INTRADAY', '4H', '1H', '15M', '5M'];

function hUpload(ctx, A) {
  const { t, W, H, V, SAFE } = A;
  howtoBed(ctx, A, { warm: 0.44, cx: 0.5, drift: 1 });
  const out = 1 - seg(t, 15400, 16000, E.inOutQuad);

  /* Five charts deal in, then slide toward the device. */
  const cw = V ? 400 : 340, ch = V ? 230 : 196;
  const cols = V ? 2 : 3;
  const gx = V ? (W - cols * cw - 36) / 2 : W - 60 - cols * cw - (cols - 1) * 18;
  const gy = V ? SAFE.top + 230 : 300;
  TIMEFRAMES.forEach((label, i) => {
    const p = seg(t, 2300 + i * 700, 3600 + i * 700);
    const col = i % cols, row = (i / cols) | 0;
    const gone = seg(t, 12400 + i * 90, 13600 + i * 90, E.inOutCubic);
    ctx.save();
    ctx.globalAlpha = out * (1 - gone);
    ctx.translate(gone * (V ? 0 : 260), gone * (V ? -220 : -90));
    chartCard(ctx, gx + col * (cw + 18), gy + row * (ch + 18), cw, ch, p, label, i + 1, t);
    ctx.restore();
  });

  howtoHead(ctx, A, 3, 'PULL THEM FROM TRADINGVIEW',
    [['UPLOAD', false], ['YOUR CHARTS.', true]], out);

  ctx.save();
  ctx.globalAlpha = out;
  const ly = V ? H - SAFE.bottom - 210 : H - 230;
  ctx.globalAlpha = out * seg(t, 11000, 11800);
  setFont(ctx, V ? 22 : 23, 600);
  ctx.fillStyle = rgba(C.slate, 0.96);
  ctx.textAlign = V ? 'center' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Five timeframes give the system the market structure it needs.',
    V ? W / 2 : 112, ly);
  ctx.textAlign = 'left';
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = out;
  dotLine(ctx, TIMEFRAMES, V ? W / 2 : W / 2, V ? H - SAFE.bottom - 150 : H - 170, t,
    { size: V ? 21 : 23, start: 12600, stagger: 150, alpha: out, color: C.goldLt });
  ctx.restore();
}

/* ══ H5 · 62.5 → 77.0s ══  Let the OS analyze ═════════════════════════════ */
function hAnalyze(ctx, A) {
  const { t, W, H, V, SAFE } = A;
  howtoBed(ctx, A, { warm: 0.46, cx: 0.5, drift: -1 });
  const out = 1 - seg(t, 13900, 14500, E.inOutQuad);

  /* One big chart, read in passes. */
  const bx = V ? 90 : 630, bw = V ? W - 180 : 1170;
  const by = V ? SAFE.top + 190 : 186, bh = V ? 600 : 420;
  const cp = seg(t, 200, 1400);
  ctx.save();
  ctx.globalAlpha = out * clamp(cp * 2);
  roundRect(ctx, bx, by, bw, bh, 16);
  const g = ctx.createLinearGradient(bx, by, bx, by + bh);
  g.addColorStop(0, 'rgba(10,40,22,0.95)');
  g.addColorStop(1, 'rgba(3,14,8,0.95)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(C.gold, 0.4);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.save();
  roundRect(ctx, bx + 1, by + 1, bw - 2, bh - 2, 15);
  ctx.clip();
  candles2d(ctx, bx + 18, by + 24, bw - 36, bh - 48, t, clamp(cp * 1.5));

  /* Pass 1: trend. Pass 2: the levels. Pass 3: structure labels. */
  const p1 = seg(t, 1700, 3100, E.outExpo);
  if (p1 > 0.01) {
    ctx.strokeStyle = rgba(C.cyan, 0.85);
    ctx.lineWidth = 2.4;
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.moveTo(bx + 24, by + bh * 0.78);
    ctx.lineTo(bx + 24 + (bw - 48) * p1, by + bh * 0.78 - (bh * 0.42) * p1);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  const p2 = seg(t, 3300, 4700, E.outExpo);
  if (p2 > 0.01) {
    for (const [fy, col, lab] of [[0.30, C.red, 'RESISTANCE'], [0.68, C.green, 'SUPPORT']]) {
      ctx.fillStyle = rgba(col, 0.1 * p2);
      ctx.fillRect(bx + 10, by + bh * fy - 13, (bw - 20) * p2, 26);
      ctx.strokeStyle = rgba(col, 0.8 * p2);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx + 10, by + bh * fy);
      ctx.lineTo(bx + 10 + (bw - 20) * p2, by + bh * fy);
      ctx.stroke();
      setFont(ctx, 15, 900);
      ctx.fillStyle = rgba(col, 0.95 * p2);
      ctx.textBaseline = 'middle';
      tracked(ctx, lab, bx + 20, by + bh * fy - 24, 2.2);
    }
  }
  const p3 = seg(t, 4900, 6300, E.outExpo);
  if (p3 > 0.01) {
    ['HIGHER LOW', 'BREAK', 'RETEST'].forEach((lab, i) => {
      const e = clamp((p3 - i * 0.22) * 3);
      if (e <= 0.02) return;
      const px = bx + bw * (0.3 + i * 0.22), py = by + bh * (0.62 - i * 0.14);
      ctx.globalAlpha = out * e;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 7);
      ctx.fillStyle = C.goldLt;
      ctx.fill();
      setFont(ctx, 14, 900);
      ctx.fillStyle = rgba(C.goldLt, 0.95);
      tracked(ctx, lab, px + 12, py - 1, 2);
    });
    ctx.globalAlpha = out * clamp(cp * 2);
  }

  /* The scanning sweep that ties the passes together. */
  const sw = ((t - 1500) % 3400) / 3400;
  if (t > 1500 && t < 7200) {
    const sx = bx + 10 + (bw - 20) * sw;
    const sg = ctx.createLinearGradient(sx - 60, 0, sx + 14, 0);
    sg.addColorStop(0, 'rgba(111,217,196,0)');
    sg.addColorStop(1, rgba(C.cyan, 0.34));
    ctx.fillStyle = sg;
    ctx.fillRect(sx - 60, by + 2, 74, bh - 4);
    ctx.fillStyle = rgba(C.cyan, 0.85);
    ctx.fillRect(sx, by + 2, 2, bh - 4);
  }
  ctx.restore();
  ctx.restore();

  /* Three readings — and the honest one is the one that gets the emphasis. */
  const vy = V ? by + bh + 66 : by + bh + 56;
  const vw = V ? (W - 220) / 3 : 300, vh = V ? 120 : 104;
  const vx = V ? 110 : bx + (bw - (vw * 3 + 36)) / 2;
  verdict(ctx, vx,                 vy, vw, vh, seg(t,  7400,  8300) * out, 'BULLISH', C.green, 'if structure holds');
  verdict(ctx, vx + vw + 18,       vy, vw, vh, seg(t,  8000,  8900) * out, 'BEARISH', C.red,   'if it breaks down');
  verdict(ctx, vx + (vw + 18) * 2, vy, vw, vh, seg(t,  8600,  9500) * out, 'OR WAIT', C.gold,  'no trade worth taking',
    seg(t, 10400, 11400) * (1 - seg(t, 13200, 14000)));

  howtoHead(ctx, A, 4, 'THE SYSTEM READS THE STRUCTURE',
    [['LET THE OS', false], ['ANALYZE.', true]], out);
}

/* ══ H6 · 77.0 → 94.5s ══  Read the strategy ══════════════════════════════ */
const PAN_STRAT = [
  { at:    0, cy: 0.22, w: 1.00 },
  { at: 1400, cy: 0.274, w: 1.00 },   // WHEN TO ENTER / EXIT
  { at: 5000, cy: 0.416, w: 0.96 },   // ENTRY
  { at: 8200, cy: 0.525, w: 0.96 },   // TAKE PROFIT
  { at: 11400, cy: 0.636, w: 0.92 },  // STOP
  { at: 14600, cy: 0.660, w: 0.92 },
];

function hStrategy(ctx, A) {
  const { t, W, H, V, SAFE } = A;
  howtoBed(ctx, A, { warm: 0.42, cx: V ? 0.5 : 0.62, drift: 1 });

  const box = V ? { x: 110, y: SAFE.top + 190, w: 860, h: 760 }
                : { x: 1030, y: 150, w: 760, h: 640 };
  const enter = E.outExpo(clamp(t / 900));
  const out = 1 - seg(t, 16900, 17500, E.inOutQuad);
  const src = panKeys(PAN_STRAT, t, IMG.tradePlan, box);
  const map = screenPane(ctx, IMG.tradePlan, box, src, clamp(enter * 1.4) * out);

  if (enter > 0.3) {
    ctx.save();
    ctx.globalAlpha = out;
    spotlight(ctx, box, [
      { r: map(R_PLAN.enter), p: seg(t,  1200, 4700), label: 'CONFIRMATION' },
      { r: map(R_PLAN.entry), p: seg(t,  4900, 7900), label: 'ENTRY' },
      { r: map(R_PLAN.tp),    p: seg(t,  8100, 11100), label: 'EXIT' },
      { r: map(R_PLAN.stop),  p: seg(t, 11300, 14400), label: 'RISK' },
    ], { size: V ? 20 : 18 });
    ctx.restore();
  }

  howtoHead(ctx, A, 5, 'READ THE WHOLE PLAN',
    [['GET THE', false], ['STRATEGY.', true]], out);

  ctx.save();
  ctx.globalAlpha = out;
  if (V) {
    const fy = box.y + box.h + 62;
    dotLine(ctx, ['BIAS', 'LEVELS', 'CONFIRMATION'], W / 2, fy, t,
      { size: 23, start: 14000, stagger: 180, alpha: out });
    dotLine(ctx, ['ENTRY', 'EXIT', 'RISK'], W / 2, fy + 44, t,
      { size: 23, start: 14500, stagger: 180, alpha: out });
  } else {
    dotLine(ctx, ['BIAS', 'LEVELS', 'CONFIRMATION'], 110 + 330, 600, t,
      { size: 24, start: 14000, stagger: 180, alpha: out });
    dotLine(ctx, ['ENTRY', 'EXIT', 'RISK'], 110 + 330, 650, t,
      { size: 24, start: 14500, stagger: 180, alpha: out });
  }
  /* The one line in this act that is not a feature. */
  ctx.globalAlpha = out * seg(t, 15200, 16000);
  setFont(ctx, V ? 23 : 24, 600, true);
  ctx.fillStyle = rgba(C.goldLt, 0.95);
  ctx.textAlign = V ? 'center' : 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('…and when to sit on your hands.', V ? W / 2 : 112, V ? box.y + box.h + 150 : 716);
  ctx.textAlign = 'left';
  ctx.restore();
}

/* ══ H7 · 94.5 → 110.5s ══  Review the contract, then the brokerage ═══════ */
const PAN_CON = [
  { at:    0, cy: 0.70, w: 0.94 },
  { at: 1200, cy: 0.747, w: 0.90 },   // PRIMARY STRIKE
  { at: 4600, cy: 0.747, w: 0.90 },
  { at: 6000, cy: 0.856, w: 0.90 },   // OTM RUNNER
  { at: 8600, cy: 0.860, w: 0.90 },
];

function hContract(ctx, A) {
  const { t, W, H, V, SAFE } = A;
  howtoBed(ctx, A, { warm: 0.44, cx: V ? 0.5 : 0.4, drift: -1 });
  const out = 1 - seg(t, 15400, 16000, E.inOutQuad);

  /* First half: the strike the system identifies, on the real plan. */
  const leave = seg(t, 9200, 10400, E.inOutCubic);
  const box = V ? { x: 110, y: SAFE.top + 190, w: 860, h: 640 }
                : { x: 1030, y: 150, w: 760, h: 560 };
  if (leave < 0.995) {
    const enter = E.outExpo(clamp(t / 900));
    const src = panKeys(PAN_CON, t, IMG.tradePlan, box);
    ctx.save();
    ctx.globalAlpha = out * (1 - leave);
    ctx.translate(0, leave * -70);
    const map = screenPane(ctx, IMG.tradePlan, box, src, clamp(enter * 1.4));
    if (enter > 0.3) {
      spotlight(ctx, box, [
        { r: map(R_PLAN.strike), p: seg(t, 1100, 4800), label: 'PRIMARY STRIKE' },
        { r: map(R_PLAN.otm),    p: seg(t, 5900, 8800), label: 'OTM RUNNER' },
      ], { size: V ? 20 : 18 });
    }
    ctx.restore();
  }

  /* Second half: the hand-off. OTA identifies it; you go and find it. */
  const hp = seg(t, 9600, 10600);
  if (hp > 0.004) {
    const hy = V ? SAFE.top + 320 : 330;
    const cw = V ? W - 220 : 700, cx = V ? 110 : 1000;
    ctx.save();
    ctx.globalAlpha = out * clamp(hp * 2);

    /* The contract chip, travelling from the OS to the watchlist. */
    const travel = seg(t, 11000, 13000, E.inOutCubic);
    const rowY = hy + 120;
    ['OTA OS', 'YOUR BROKERAGE', 'WATCHLIST'].forEach((lab, i) => {
      const e = E.outExpo(clamp((t - 9700 - i * 300) / 700));
      if (e <= 0.02) return;
      const bw2 = (cw - 44) / 3;
      const bx2 = cx + i * (bw2 + 22);
      const lit = travel > i * 0.33;
      ctx.globalAlpha = out * clamp(e * 2);
      roundRect(ctx, bx2, hy, bw2, 92, 12);
      ctx.fillStyle = lit ? rgba(C.gold, 0.14) : 'rgba(8,30,17,0.92)';
      ctx.fill();
      ctx.strokeStyle = rgba(C.gold, lit ? 0.85 : 0.3);
      ctx.lineWidth = lit ? 2 : 1.2;
      ctx.stroke();
      setFont(ctx, Math.min(21, bw2 * 0.12), 900);
      ctx.fillStyle = lit ? C.goldLt : rgba(C.cream, 0.8);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      tracked(ctx, lab, bx2 + bw2 / 2, hy + 46, 2.2, 'center');
      ctx.textAlign = 'left';
      if (i < 2) {
        ctx.strokeStyle = rgba(C.gold, 0.7);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const ax = bx2 + bw2 + 5, ay = hy + 46;
        ctx.beginPath();
        ctx.moveTo(ax, ay); ctx.lineTo(ax + 12, ay);
        ctx.moveTo(ax + 7, ay - 5); ctx.lineTo(ax + 12, ay); ctx.lineTo(ax + 7, ay + 5);
        ctx.stroke();
      }
    });

    /* The contract itself, carried across. */
    if (travel > 0.01) {
      const bw2 = (cw - 44) / 3;
      const px = cx + bw2 / 2 + travel * (bw2 + 22) * 2;
      ctx.globalAlpha = out;
      setFont(ctx, V ? 21 : 20, 900);
      const lab = 'SPXW 7725 C';
      const tw = trackedWidth(ctx, lab, 2) + 30;
      roundRect(ctx, px - tw / 2, rowY - 20, tw, 40, 20);
      const bg = ctx.createLinearGradient(px - tw / 2, rowY, px + tw / 2, rowY);
      bg.addColorStop(0, C.goldLt);
      bg.addColorStop(1, C.gold);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.fillStyle = '#06200F';
      ctx.textBaseline = 'middle';
      tracked(ctx, lab, px - tw / 2 + 15, rowY, 2);
    }

    /* The real home row again — this time the brokerage is the lit icon. */
    const hb = V ? { x: 110, y: rowY + 70, w: cw, h: cw * 0.243 }
                 : { x: cx, y: rowY + 60, w: 700, h: 207 };
    const hs = seg(t, 12600, 13600);
    if (hs > 0.004 && IMG.homescreen) {
      const srcH = { x: 0, y: 0, w: 1, h: 1 };
      srcH.h = IMG.homescreen.height / (IMG.homescreen.width * (hb.h / hb.w));
      srcH.y = (1 - srcH.h) / 2;
      ctx.globalAlpha = out;
      const m2 = screenPane(ctx, IMG.homescreen, hb, srcH, clamp(hs * 1.6), { radius: 16 });
      spotlight(ctx, hb, [{ r: m2(R_HOME.rh), p: seg(t, 13200, 15300), label: 'YOUR BROKER' }],
        { size: V ? 19 : 18, radius: 16, dim: 0.68 });
    }
    ctx.restore();
  }

  howtoHead(ctx, A, 6, 'THEN GO AND FIND IT',
    [['REVIEW', false], ['THE CONTRACT.', true]], out);
}

/* ══ H8 · 110.5 → 128.5s ══  Confirmation before capital ══════════════════ */
const CONFIRMS = [
  ['STRUCTURE STILL HOLDS', 3400],
  ['LEVEL ACTUALLY RECLAIMED', 5000],
  ['YOUR RISK IS DEFINED', 6600],
  ['IT FITS YOUR PLAN', 8200],
];

function hConfirm(ctx, A) {
  const { t, W, H, V, SAFE } = A;
  howtoBed(ctx, A, { warm: 0.4, cx: 0.5, drift: 1 });
  const out = 1 - seg(t, 17400, 18000, E.inOutQuad);

  /* The contract sits on the watchlist. Nothing is bought. */
  const wx = V ? 110 : 1010, ww = V ? W - 220 : 760;
  const wy = V ? SAFE.top + 200 : 180;
  const wp = seg(t, 400, 1500);
  if (wp > 0.004) {
    const e = E.outExpo(clamp(wp));
    ctx.save();
    ctx.globalAlpha = out * clamp(wp * 2);
    roundRect(ctx, wx, wy + (1 - e) * 20, ww, 250, 16);
    ctx.fillStyle = 'rgba(8,30,17,0.95)';
    ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.42);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    setFont(ctx, 17, 900);
    ctx.fillStyle = rgba(C.gold, 0.9);
    ctx.textBaseline = 'middle';
    tracked(ctx, 'WATCHLIST', wx + 24, wy + 34, 3.2);
    setFont(ctx, 15, 800);
    ctx.fillStyle = rgba(C.slate, 0.9);
    tracked(ctx, 'NOT A POSITION', wx + ww - 24, wy + 34, 2, 'right');
    ctx.fillStyle = rgba(C.gold, 0.22);
    ctx.fillRect(wx + 20, wy + 56, ww - 40, 1);

    setFont(ctx, Math.min(34, ww * 0.052), 900);
    ctx.fillStyle = C.cream;
    tracked(ctx, 'SPXW 7725 C', wx + 24, wy + 100, 1.6);
    setFont(ctx, 19, 600);
    ctx.fillStyle = rgba(C.slate, 0.95);
    ctx.fillText('Identified by the analysis · awaiting your confirmation', wx + 24, wy + 140);

    /* A quiet "not bought" state, rather than a buy button. */
    setFont(ctx, 17, 900);
    const lab = 'WATCHING — NOT BOUGHT';
    const lw = trackedWidth(ctx, lab, 2.2) + 30;
    roundRect(ctx, wx + 24, wy + 174, lw, 44, 22);
    ctx.fillStyle = rgba(C.gold, 0.1);
    ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.5);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = C.goldLt;
    tracked(ctx, lab, wx + 39, wy + 196, 2.2);
    ctx.restore();
  }

  /* The checklist. */
  const ly = wy + 310;
  ctx.save();
  ctx.globalAlpha = out;
  CONFIRMS.forEach(([label, at], i) => {
    checkRow(ctx, wx + 6, ly + i * 62, ww, seg(t, at, at + 1300), label,
      { size: V ? 25 : 24 });
  });
  ctx.restore();

  howtoHead(ctx, A, 7, 'A CONTRACT IS NOT A SIGNAL',
    [["DON'T CHASE.", false], ['WAIT FOR', true], ['CONFIRMATION.', true]], out);

  /* The hard line, last and largest. */
  const dp = seg(t, 10400, 11400);
  if (dp > 0.004) {
    ctx.save();
    ctx.globalAlpha = out * clamp(dp * 2) * (1 - seg(t, 16800, 17400));
    const y2 = V ? H - SAFE.bottom - 120 : H - 150;
    kinetic(ctx, 'YOU DECIDE. NOT THE SCREEN.', {
      x: V ? W / 2 : W / 2, y: y2, size: V ? 38 : 46, weight: 900, tracking: 1.4,
      align: 'center', alpha: out, p: seg(t, 10400, 11600), mode: 'wipe', color: C.goldLt, shadow: 0.4,
    });
    ctx.restore();
  }
}

/* ══ H9 · 128.5 → 152.5s ══  Ticker → analysis → plan ═════════════════════ */
function hClose(ctx, A) {
  const { t, W, H, S, cam, V, SAFE } = A;
  inkBackdrop(ctx, W, H, { warm: 0.6, cx: 0.5, cy: V ? 0.4 : 0.48 });

  const settle = E.outExpo(clamp(t / 2200));
  cam.fov = (V ? 50 : 42) * Math.PI / 180;
  const CY = V ? 2.6 : 1.8;
  /* The camera stays on axis; the rig itself slides right in 16:9 so the
     headline on the left keeps its own lane. */
  const GX = V ? 0 : 2.3;
  cam.lookAt([lerp(-4.6, GX - 0.4, settle), lerp(1.6, CY + 0.3, settle),
              lerp(12, V ? 15.6 : 14.6, settle)],
             [0, CY - (V ? 1.9 : 1.1), 0]);

  S.reset();
  floorGrid(S, { half: 24, step: 2.4, y: -2.9, alpha: 0.15 * settle });
  railsBehind(S, t, CY, settle);

  /* Phone, tablet, desktop — each carrying a real screen. */
  const e1 = E.spring(clamp(t / 1700), 5.4, 4.4);
  const e2 = E.spring(clamp((t - 500) / 1800), 5.4, 4.4);
  const e3 = E.spring(clamp((t - 1000) / 1900), 5.4, 4.4);
  const sway = Math.sin(t / 3400) * 0.05;

  const mPhone = M4.chain(M4.translate(GX + (V ? -2.4 : -2.7), CY - 0.2, 0.6),
    M4.rotY(0.34 + sway), M4.scale(lerp(0.52, V ? 0.68 : 0.80, e1)));
  const mTab = M4.chain(M4.translate(GX, CY, -0.4), M4.rotY(0.04 + sway * 0.6),
    M4.scale(lerp(0.52, V ? 0.78 : 0.94, e2)));
  const mDesk = M4.chain(M4.translate(GX + (V ? 2.4 : 2.7), CY + 0.1, 0.5),
    M4.rotY(-0.34 + sway), M4.scale(lerp(0.52, V ? 0.68 : 0.80, e3)));

  const d1 = device(S, ctx, cam, W, H, IMG.appHome, mPhone, clamp(e1 * 1.4));
  const d2 = slab(S, ctx, cam, W, H, IMG.dailyPlay, mTab, clamp(e2 * 1.4), 1.28, 2.69);
  const d3 = slab(S, ctx, cam, W, H, IMG.mission, mDesk, clamp(e3 * 1.4), 1.0, 1.67);
  S.render(ctx, cam, W, H);
  d1(); d2(); d3();

  FX.lensFlare(ctx, W * (V ? 0.5 : 0.6), H * (V ? 0.36 : 0.42), env(clamp((t - 1200) / 1400), 0.3, 0.6) * 0.5, W);
  dustField(ctx, t, W, H, 40, { speed: 12, alpha: 0.24 });
  FX.scrim(ctx, W, H, V ? 'bottom' : 'bottom', 0.78, V ? 0.42 : 0.46);

  const out = 1 - seg(t, 23400, 24000, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  if (V) {
    FX.eyebrow(ctx, 70, SAFE.top - 100, 'ONE SYSTEM · EVERY DEVICE', seg(t, 400, 1100));
    const hOpt = { size: 58, weight: 900, tracking: -1, align: 'center', mode: 'wipe' };
    kinetic(ctx, 'A TICKER.',  { ...hOpt, alpha: out, x: W / 2, y: SAFE.top + 4,   p: seg(t, 600, 1400), color: C.cream });
    kinetic(ctx, 'AN ANALYSIS.', { ...hOpt, alpha: out, x: W / 2, y: SAFE.top + 70, p: seg(t, 900, 1700), color: C.cream });
    kinetic(ctx, 'A PLAN.',    { ...hOpt, alpha: out, x: W / 2, y: SAFE.top + 136, p: seg(t, 1200, 2000), color: C.gold, shadow: 0.5 });
  } else {
    FX.eyebrow(ctx, 112, 230, 'ONE SYSTEM · EVERY DEVICE', seg(t, 400, 1100));
    const hOpt = { size: 70, weight: 900, tracking: -1.4, mode: 'wipe' };
    kinetic(ctx, 'A TICKER.',    { ...hOpt, alpha: out, x: 110, y: 350, p: seg(t, 600, 1400), color: C.cream });
    kinetic(ctx, 'AN ANALYSIS.', { ...hOpt, alpha: out, x: 110, y: 432, p: seg(t, 900, 1700), color: C.cream });
    kinetic(ctx, 'A PLAN.',      { ...hOpt, alpha: out, x: 110, y: 514, p: seg(t, 1200, 2000), color: C.gold, shadow: 0.5 });
  }

  /* The honest line — it is the whole reason this film is credible. */
  const np = seg(t, 9800, 11000);
  if (np > 0.004) {
    const ny = V ? H - SAFE.bottom - 420 : H - 300;
    ctx.globalAlpha = out * clamp(np * 2) * (1 - seg(t, 22400, 23200));
    kinetic(ctx, 'NO TECHNOLOGY CAN PREDICT', {
      x: W / 2, y: ny, size: V ? 32 : 40, weight: 900, tracking: 1.6, align: 'center',
      alpha: out, p: seg(t, 9800, 10900), mode: 'wipe', color: C.cream,
    });
    kinetic(ctx, 'WHAT THE MARKET DOES NEXT.', {
      x: W / 2, y: ny + (V ? 42 : 52), size: V ? 32 : 40, weight: 900, tracking: 1.6, align: 'center',
      alpha: out, p: seg(t, 10200, 11400), mode: 'wipe', color: C.red,
    });
    /* In 16:9 this line would land in the caption band, so it rides with the
       headline on the left instead of under the devices. */
    ctx.globalAlpha = out * seg(t, 13000, 14000) * (1 - seg(t, 22400, 23200));
    setFont(ctx, V ? 24 : 25, 600, true);
    ctx.fillStyle = rgba(C.goldLt, 0.96);
    ctx.textAlign = V ? 'center' : 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('The edge is the system you use to decide.',
      V ? W / 2 : 112, V ? ny + 106 : 600);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

/* ══ H10 · 152.5 → 176.0s ══  The closing line, and the card ══════════════ */
function hCard(ctx, A) {
  const { t, W, H, V, SAFE } = A;

  /* Deep green, going quiet. */
  ctx.fillStyle = '#021008';
  ctx.fillRect(0, 0, W, H);
  const glow = E.outExpo(clamp(t / 2200));
  const gy = V ? H * 0.42 : H * 0.46;
  const g = ctx.createRadialGradient(W / 2, gy, 0, W / 2, gy, H * 0.9);
  g.addColorStop(0, `rgba(10,46,24,${0.9 * glow})`);
  g.addColorStop(0.5, `rgba(5,24,13,${0.6 * glow})`);
  g.addColorStop(1, 'rgba(1,8,4,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  dustField(ctx, t, W, H, 36, { speed: 10, alpha: 0.2 * glow });

  /* No presenter: the line itself is the shot. The mark holds behind it,
     barely lit, so the frame is still the product. */
  const ghost = E.outExpo(clamp((t - 200) / 2000)) * (1 - seg(t, 12600, 13600, E.inOutQuad));
  if (ghost > 0.01) {
    const gs = V ? 620 : 560;
    ctx.save();
    ctx.globalAlpha = ghost * 0.1;
    drawLogoMark(ctx, W / 2 - gs / 2, (V ? H * 0.44 : H * 0.48) - gs / 2, gs, C.gold);
    ctx.restore();
  }

  const cOpt = { weight: 900, tracking: -0.6, mode: 'wipe', align: 'center' };
  const quote = 1 - seg(t, 12600, 13600, E.inOutQuad);
  if (quote > 0.004) {
    ctx.save();
    ctx.globalAlpha = quote;
    if (V) {
      const qy = SAFE.top + 180;
      const q = { ...cOpt, size: 52, x: W / 2, alpha: quote };
      kinetic(ctx, 'TRADING ISN\u2019T ABOUT', { ...q, y: qy,      p: seg(t, 1800, 2900), color: C.cream });
      kinetic(ctx, 'CATCHING EVERY MOVE.',  { ...q, y: qy + 64, p: seg(t, 2200, 3300), color: C.cream });
      const rl = seg(t, 3400, 4200, E.outExpo);
      ctx.fillStyle = rgba(C.gold, 0.85 * rl);
      ctx.fillRect(W / 2 - 150 * rl, qy + 104, 300 * rl, 3);
      const q2 = { ...q, size: 46, color: C.gold, shadow: 0.5 };
      kinetic(ctx, 'IT\u2019S A STRATEGY.', { ...q2, y: qy + 184, p: seg(t, 5400, 6400) });
      kinetic(ctx, 'CONFIRMATION.',      { ...q2, y: qy + 248, p: seg(t, 5900, 6900) });
      kinetic(ctx, 'MANAGED RISK.',      { ...q2, y: qy + 312, p: seg(t, 6400, 7400) });
      kinetic(ctx, 'A STRONGER EDGE.',   { ...q2, y: qy + 376, p: seg(t, 6900, 7900) });
    } else {
      const qy = 320;
      const q = { ...cOpt, size: 66, x: W / 2, alpha: quote };
      kinetic(ctx, 'TRADING ISN\u2019T ABOUT', { ...q, y: qy,      p: seg(t, 1800, 2900), color: C.cream });
      kinetic(ctx, 'CATCHING EVERY MOVE.',  { ...q, y: qy + 80, p: seg(t, 2200, 3300), color: C.cream });
      const rl = seg(t, 3400, 4200, E.outExpo);
      ctx.fillStyle = rgba(C.gold, 0.85 * rl);
      ctx.fillRect(W / 2 - 170 * rl, qy + 128, 340 * rl, 3);
      const q2 = { ...q, size: 54, color: C.gold, shadow: 0.5 };
      kinetic(ctx, 'IT\u2019S A STRATEGY.', { ...q2, y: qy + 218, p: seg(t, 5400, 6400) });
      kinetic(ctx, 'CONFIRMATION.',      { ...q2, y: qy + 288, p: seg(t, 5900, 6900) });
      kinetic(ctx, 'MANAGED RISK.',      { ...q2, y: qy + 358, p: seg(t, 6400, 7400) });
      kinetic(ctx, 'A STRONGER EDGE.',   { ...q2, y: qy + 428, p: seg(t, 6900, 7900) });
    }
    ctx.restore();
  }

  /* ── End card ── */
  const ep = seg(t, 13800, 14600);
  if (ep <= 0.004) return;

  const mp = E.outExpo(clamp((t - 13900) / 1600));
  const markY = V ? H * 0.32 : H * 0.30;
  const s = (V ? 220 : 180) * lerp(0.9, 1, mp);
  ctx.save();
  ctx.globalAlpha = clamp(mp * 1.4);
  ctx.shadowColor = rgba(C.gold, 0.45);
  ctx.shadowBlur = 64 * mp;
  logoStamp(ctx, W / 2 - s / 2, markY - s / 2, s, { radius: s * 0.2 });
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba(C.gold, 0.7 * mp);
  ctx.lineWidth = 2.2;
  roundRect(ctx, W / 2 - s / 2, markY - s / 2, s, s, s * 0.2);
  ctx.stroke();
  ctx.restore();

  const top = markY + s / 2 + (V ? 96 : 84);
  const wOpt = { size: V ? 50 : 56, weight: 900, tracking: V ? 4 : 7,
                 align: 'center', mode: 'glyph', stagger: 0.02, color: C.cream, shadow: 0.5 };
  ctx.save();
  if (V) {
    kinetic(ctx, 'OPTIONS TRADERS', { ...wOpt, x: W / 2, y: top, p: seg(t, 14600, 15500) });
    kinetic(ctx, 'ACADEMY OS',      { ...wOpt, x: W / 2, y: top + 60, p: seg(t, 14750, 15650) });
  } else {
    kinetic(ctx, 'OPTIONS TRADERS ACADEMY OS', { ...wOpt, x: W / 2, y: top, p: seg(t, 14600, 15600) });
  }

  const y2 = top + (V ? 120 : 56);
  kinetic(ctx, CFG.endline, {
    x: W / 2, y: y2, size: V ? 32 : 32, weight: 600, tracking: 2.4, face: true,
    align: 'center', p: seg(t, 15100, 16000), mode: 'wipe', color: rgba(C.gold, 0.97),
  });
  const rl = seg(t, 15500, 16200, E.outExpo);
  ctx.fillStyle = rgba(C.gold, 0.8 * rl);
  ctx.fillRect(W / 2 - 170 * rl, y2 + 26, 340 * rl, 2);

  /* A restrained ask — this film is a lesson first. */
  const cp = seg(t, 16200, 17000);
  if (cp > 0.004) {
    ctx.globalAlpha = cp;
    chipRow(ctx, [CFG.cta, CFG.badges[0]], W / 2, y2 + (V ? 62 : 56), t,
      { size: V ? 20 : 19, start: 16200, stagger: 220, h: 48, alpha: cp });
  }

  const dp = seg(t, 17000, 17800);
  if (dp > 0.004) {
    ctx.globalAlpha = dp * 0.9;
    setFont(ctx, V ? 18 : 16, 500);
    ctx.fillStyle = rgba(C.slate, 0.85);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    CFG.disclaimer.forEach((ln, i) =>
      ctx.fillText(ln, W / 2, y2 + (V ? 148 : 126) + i * (V ? 26 : 22)));
    ctx.textAlign = 'left';
  }
  ctx.restore();

  const fo = seg(t, 22800, 23500, E.inQuad);
  if (fo > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fo})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ── The cut ─────────────────────────────────────────────────────────────── */
window.OTA_CUT = {
  duration: 176000,
  poster: 16000,
  score: 'howto',
  cuts: [0, 18000, 46500, 77000, 110500, 128500, 152500],
  scenes: [
    { name: 'access',   start: 0,      end: 18000,  draw: hAccess },
    { name: 'profile',  start: 18000,  end: 31000,  draw: hProfile,  xfade: 300 },
    { name: 'choose',   start: 31000,  end: 46500,  draw: hChoose,   xfade: 300 },
    { name: 'upload',   start: 46500,  end: 62500,  draw: hUpload },
    { name: 'analyze',  start: 62500,  end: 77000,  draw: hAnalyze,  xfade: 300 },
    { name: 'strategy', start: 77000,  end: 94500,  draw: hStrategy },
    { name: 'contract', start: 94500,  end: 110500, draw: hContract, xfade: 300 },
    { name: 'confirm',  start: 110500, end: 128500, draw: hConfirm },
    { name: 'close',    start: 128500, end: 152500, draw: hClose },
    { name: 'card',     start: 152500, end: 176000, draw: hCard },
  ],
};
