/* ============================================================================
   scenes-b.js — Acts III & IV (15.4s → 30.0s)
   ========================================================================== */

/* Transform a quad's local corners into world space for texQuad3D. */
function quadCorners(m, hw, hh, z) {
  return [[-hw, hh, z], [hw, hh, z], [hw, -hh, z], [-hw, -hh, z]]
    .map(p => M4.xform(m, p).slice(0, 3));
}

/* ══ S5 · 15.4 → 19.2s ══  Education + execution ══════════════════════════ */
function sceneCurriculum(ctx, A) {
  const { t, p, W, H, S, cam } = A;
  inkBackdrop(ctx, W, H, { warm: 0.4, cy: 0.52 });

  const settle = E.outExpo(clamp(t / 1600));
  cam.fov = 40 * Math.PI / 180;
  cam.lookAt([lerp(6.0, 1.5, settle), lerp(-1.4, 1.5, settle), lerp(12.0, 11.3, settle)], [0.5, -0.5, 0]);

  const enter = E.spring(clamp(t / 1500), 5.4, 4.3);
  const rotY = lerp(-0.85, -0.2, enter) + Math.sin(t / 2800) * 0.022;
  const m = M4.chain(M4.translate(0.5, -0.5, 0), M4.rotY(rotY), M4.rotX(0.055), M4.scale(lerp(0.86, 1, enter)));

  S.reset();
  floorGrid(S, { half: 20, step: 2.5, y: -3.4, alpha: 0.15 });
  const slab = Geo.extrude(Geo.roundedRect(9.9, 5.4, 0.3, 6), 0.2);
  S.mesh(slab, m, fade(MAT.glass, clamp(enter * 1.6)));
  /* Thin gold bezel */
  S.mesh(Geo.extrude(Geo.roundedRect(10.05, 5.55, 0.33, 6), 0.16),
    M4.chain(m, M4.translate(0, 0, -0.09)),
    { ...fade(MAT.gold, 0.5 * clamp(enter * 1.6)), zBias: -1.4 });
  S.render(ctx, cam, W, H);

  if (enter > 0.05) {
    const tex = panelScreen(t, 1700, 900);
    texQuad3D(ctx, tex, cam, W, H, quadCorners(m, 4.72, 2.5, 0.105), 8, clamp((enter - 0.05) * 1.8));
  }

  /* Screen glare so the slab reads as glass. */
  FX.sweep(ctx, W * 0.1, H * 0.1, W * 0.8, H * 0.8, seg(t, 1200, 2300), { alpha: 0.13, width: 0.09, angle: -0.55 });
  dustField(ctx, t, W, H, 46, { speed: 22, alpha: 0.26 });

  FX.scrim(ctx, W, H, 'top', 0.72, 0.3);

  const out = 1 - seg(t, 3350, 3800, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  FX.eyebrow(ctx, 112, 96, 'THE LEARNING ENGINE', seg(t, 200, 800));
  /* The second half is positioned from the measured width of the first, so the
     copy can change without re-tuning pixel offsets. */
  const headOpt = { size: 76, weight: 900, tracking: -1 };
  const w1 = kineticWidth(ctx, 'LEARN IT.', headOpt);
  kinetic(ctx, 'LEARN IT.', { ...headOpt, x: 110, y: 196, p: seg(t, 420, 1100), mode: 'wipe', color: C.white });
  kinetic(ctx, 'THEN TRADE IT.', { ...headOpt, x: 110 + w1 + 26, y: 196, p: seg(t, 700, 1400), mode: 'wipe', color: C.gold, shadow: 0.5 });
  ctx.restore();

  /* Value chips, bottom-right. */
  const rows = [
    ['8', 'STRUCTURED MODULES'],
    ['200+', 'ON-DEMAND LESSONS'],
    ['DAILY', 'LIVE SETUPS'],
  ];
  ctx.save();
  ctx.globalAlpha = out;
  FX.scrim(ctx, W, H, 'left', 0.7, 0.3);
  rows.forEach(([k, v], i) => {
    const e = E.outExpo(clamp((t - 1750 - i * 180) / 700));
    if (e <= 0.01) return;
    const y = 548 + i * 124;
    ctx.globalAlpha = out * e;
    ctx.translate((1 - e) * -40, 0);
    setFont(ctx, 62, 900, true);
    ctx.fillStyle = C.gold;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(k, 112, y);
    setFont(ctx, 19, 800);
    ctx.fillStyle = rgba(C.white, 0.9);
    tracked(ctx, v, 114, y + 32, 2.4);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
  ctx.restore();
}

/* ══ S6 · 19.2 → 23.0s ══  Risk + compounding ═════════════════════════════ */
function sceneGrowth(ctx, A) {
  const { t, p, W, H, S, cam } = A;
  inkBackdrop(ctx, W, H, { warm: 0.46, cx: 0.56, cy: 0.58 });

  const settle = E.outExpo(clamp(t / 1800));
  cam.fov = 42 * Math.PI / 180;
  cam.lookAt([lerp(-9, -4.6, settle), lerp(1.2, 4.0, settle), lerp(9, 12.2, settle)], [-0.4, 1.9, 0]);

  S.reset();
  floorGrid(S, { half: 20, step: 2, y: 0, alpha: 0.2 });

  /* Compounding towers. */
  const n = 14, sp = 1.05;
  const data = series(n, 0, { drift: 1.0, vol: 0.26, seed: 4.1 });
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * sp + 1.2;
    const grow = E.outExpo(clamp((t - 240 - i * 78) / 820));
    if (grow <= 0.01) continue;
    const h = (0.4 + data[i] * 4.6 + (i / n) * 1.4) * grow;
    S.mesh(Assets.unitBox,
      M4.chain(M4.translate(x, h / 2, 0), M4.scale(sp * 0.56, h, 0.72)),
      fade(i >= n - 4 ? MAT.gold : MAT.steel, clamp(grow * 1.6)));
    S.path([[x, h + 0.08, 0], [x, h + 0.08, 0.001]], { color: rgba(C.goldLt, 0.9 * grow), width: 4 });
  }

  /* 3D equity ribbon floating above the towers. */
  const rp = clamp((t - 700) / 1900);
  if (rp > 0.02) {
    const rn = 40;
    const rd = series(rn, 0, { drift: 1.0, vol: 0.2, seed: 9.4 });
    const verts = [], tris = [], edges = [];
    const shown = Math.max(2, Math.floor(rn * E.outCubic(rp)));
    for (let i = 0; i < shown; i++) {
      const x = (i / (rn - 1) - 0.5) * (n * sp) + 1.2;
      const y = 1.1 + rd[i] * 4.4 + (i / rn) * 1.6;
      verts.push([x, y, -1.5], [x, y, -1.9]);
      if (i > 0) {
        const a = (i - 1) * 2;
        tris.push([a, a + 1, a + 3, 0], [a, a + 3, a + 2, 0]);
        edges.push([a, a + 2]);
      }
    }
    S.mesh({ verts, tris, edges },
      M4.identity(),
      { ...MAT.gold, emissive: 0.5, alpha: 0.95, cull: false, wire: true,
        wireColor: rgba(C.goldLt, 0.9), wireWidth: 3, wireGlow: 1.2 });
  }

  /* Risk shield. */
  const sh = E.spring(clamp((t - 1100) / 1400), 6, 4.6);
  if (sh > 0.01) {
    const sm = M4.chain(M4.translate(-5.6, 4.6, 0.6), M4.rotY(-0.42 + Math.sin(t / 2400) * 0.12), M4.scale(0.52 * sh));
    S.mesh(Assets.hex, sm, fade(MAT.gold, clamp(sh * 1.5)));
    S.sprite([-5.6, 4.6, 0.8], (c, sc) => {
      c.globalAlpha = clamp(sh * 1.6);
      const r = sc * 0.22;
      c.strokeStyle = C.ink; c.lineWidth = Math.max(2, r * 0.26);
      c.lineCap = 'round';
      roundRect(c, -r * 0.62, -r * 0.1, r * 1.24, r * 0.95, r * 0.16);
      c.fillStyle = C.ink; c.fill();
      c.beginPath();
      c.arc(0, -r * 0.1, r * 0.42, Math.PI, 0);
      c.stroke();
      c.globalAlpha = 1;
    }, { zBias: 0.2 });
  }
  S.render(ctx, cam, W, H);

  dustField(ctx, t, W, H, 50, { speed: -18, alpha: 0.3 });
  FX.scrim(ctx, W, H, 'right', 0.93, 0.6);

  const out = 1 - seg(t, 3350, 3800, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  FX.eyebrow(ctx, W - 660, 140, 'THE RISK ENGINE · ALWAYS ON', seg(t, 250, 850));
  kinetic(ctx, 'DEFINED RISK.', { x: W - 112, y: 252, size: 84, weight: 900, tracking: -1, align: 'right', p: seg(t, 500, 1250), mode: 'wipe', color: C.white });
  kinetic(ctx, 'COMPOUND GROWTH.', { x: W - 112, y: 352, size: 84, weight: 900, tracking: -1, align: 'right', p: seg(t, 820, 1650), mode: 'wipe', color: C.gold, shadow: 0.55 });

  const meters = [
    ['POSITION SIZE', '2.0%'],
    ['MAX LOSS', 'CAPPED'],
    ['TARGET R : R', '1 : 2.4'],
  ];
  meters.forEach(([k, v], i) => {
    const e = E.outExpo(clamp((t - 1800 - i * 200) / 720));
    if (e <= 0.01) return;
    const y = 470 + i * 78;
    ctx.globalAlpha = out * e;
    const bx = W - 112 - 430;
    FX.card(ctx, bx, y, 430, 60, e, { r: 10, glow: 0.7, fill: 0.5 });
    setFont(ctx, 17, 800);
    ctx.fillStyle = rgba(C.slate, 0.95);
    ctx.textBaseline = 'middle';
    tracked(ctx, k, bx + 22, y + 30, 2.2);
    setFont(ctx, 26, 900, true);
    ctx.fillStyle = C.goldLt;
    ctx.textAlign = 'right';
    ctx.fillText(v, bx + 408, y + 31);
    ctx.textAlign = 'left';
  });
  ctx.restore();
}

/* ══ S7 · 23.0 → 26.8s ══  Always on, in your pocket ══════════════════════ */
const ZONES = ['SYDNEY', 'TOKYO', 'HONG KONG', 'FRANKFURT', 'LONDON', 'NEW YORK'];

function scenePocket(ctx, A) {
  const { t, p, W, H, S, cam } = A;
  inkBackdrop(ctx, W, H, { warm: 0.6, cy: 0.5 });

  /* Oversized ghost numerals behind everything. */
  ctx.save();
  const gp = E.outExpo(clamp(t / 1400));
  ctx.globalAlpha = 0.075 * gp;
  setFont(ctx, 330, 900);
  ctx.fillStyle = C.gold;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('24/7', W * 0.68, H * 0.22);
  ctx.fillText('365',  W * 0.78, H * 0.78);
  ctx.textAlign = 'left';
  ctx.restore();

  const settle = E.outExpo(clamp(t / 1700));
  cam.fov = 38 * Math.PI / 180;
  cam.lookAt([lerp(-1.4, 1.1, settle), lerp(3.4, 1.0, settle), lerp(12.5, 9.8, settle)], [1.9, 0.2, 0]);

  const enter = E.spring(clamp(t / 1600), 5.2, 4.2);
  const rotY = lerp(0.9, 0.17, enter) + Math.sin(t / 2600) * 0.05;
  const pm = M4.chain(M4.translate(2.5, 0.1, 0), M4.rotY(rotY), M4.rotX(0.02), M4.scale(lerp(0.7, 1.02, enter)));

  S.reset();

  /* Orbital rails = always-on cycle. */
  for (const [R, tilt, spd, a] of [[4.3, 1.18, 1 / 2600, 0.5], [5.4, 0.98, -1 / 3400, 0.3], [6.4, 1.3, 1 / 4600, 0.2]]) {
    S.mesh(Geo.ringXZ(R, 110),
      M4.chain(M4.translate(2.5, 0.1, 0), M4.rotZ(Math.sin(t / 3000) * 0.08), M4.rotX(tilt), M4.rotY(t * spd)),
      { wireOnly: true, wireColor: rgba(C.gold, a * settle), wireWidth: 1.3, wireGlow: 0.6 });
  }
  S.mesh(Assets.torus, M4.chain(M4.translate(2.5, 0.1, 0), M4.rotX(1.1), M4.rotY(t / 3000), M4.scale(1.08)),
    fade(MAT.gold, 0.45 * settle));

  /* Travelling light pips on the outer rail — one per session. */
  ZONES.forEach((z, i) => {
    const ang = (i / ZONES.length) * Math.PI * 2 + t / 3400;
    const wp = M4.xform(M4.chain(M4.translate(2.5, 0.1, 0), M4.rotZ(Math.sin(t / 3000) * 0.08), M4.rotX(1.18)),
      [Math.cos(ang) * 4.3, 0, Math.sin(ang) * 4.3]).slice(0, 3);
    const hot = 0.5 + 0.5 * Math.sin(t / 500 + i * 1.1);
    S.sprite(wp, (c, sc) => {
      c.globalAlpha = settle;
      c.fillStyle = rgba(C.goldLt, 0.55 + hot * 0.45);
      c.beginPath(); c.arc(0, 0, Math.max(2, sc * 0.03), 0, 7); c.fill();
      setFont(c, 13, 800);
      c.fillStyle = rgba(C.white, 0.5 + hot * 0.4);
      c.textBaseline = 'middle';
      tracked(c, z, 12, 0, 1.4);
      c.globalAlpha = 1;
    }, { zBias: 0.1 });
  });

  /* The device. */
  /* The gold rim sits BEHIND the body in local Z. Coplanar faces have no
     stable order under a painter's algorithm, so they must not be coplanar. */
  S.mesh(Geo.extrude(Geo.roundedRect(2.42, 4.88, 0.38, 8), 0.2),
    M4.chain(pm, M4.translate(0, 0, -0.1)),
    { ...fade(MAT.gold, 0.6 * clamp(enter * 1.6)), metal: 0.95, zBias: -1.4 });
  S.mesh(Assets.phone, pm, fade(MAT.steel, clamp(enter * 1.6)));
  S.render(ctx, cam, W, H);

  if (enter > 0.05) {
    const tex = appScreen(t, 580, 1218);
    texQuad3D(ctx, tex, cam, W, H, quadCorners(pm, 1.0, 2.1, 0.125), 7, clamp((enter - 0.05) * 1.8));
  }
  FX.sweep(ctx, W * 0.5, H * 0.04, W * 0.34, H * 0.92, seg(t, 1500, 2500), { alpha: 0.1, width: 0.05, angle: -0.42 });
  FX.scrim(ctx, W, H, 'left', 0.84, 0.5);

  const out = 1 - seg(t, 3350, 3800, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  FX.eyebrow(ctx, 112, 300, 'ONE LOGIN · EVERY SESSION', seg(t, 250, 850));
  const hOpt = { size: 86, weight: 900, tracking: -1.5 };
  const wA = kineticWidth(ctx, 'ALWAYS', hOpt);
  kinetic(ctx, 'ALWAYS ON.', { ...hOpt, x: 110, y: 410, p: seg(t, 480, 1200), mode: 'wipe', color: C.white });
  kinetic(ctx, 'ALWAYS',     { ...hOpt, x: 110, y: 510, p: seg(t, 760, 1500), mode: 'wipe', color: C.white });
  kinetic(ctx, 'WITH YOU.',  { ...hOpt, x: 110 + wA + 24, y: 510, p: seg(t, 980, 1750), mode: 'wipe', color: C.gold, shadow: 0.6 });

  const bullets = ['The whole system in your pocket', 'Live alerts the moment they fire', 'A desk that never closes'];
  bullets.forEach((b, i) => {
    const e = E.outExpo(clamp((t - 1750 - i * 210) / 700));
    if (e <= 0.01) return;
    const y = 620 + i * 56;
    ctx.globalAlpha = out * e;
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.arc(118, y - 8, 4.5, 0, 7); ctx.fill();
    setFont(ctx, 27, 600);
    ctx.fillStyle = rgba(C.white, 0.92);
    ctx.fillText(b, 142 + (1 - e) * 18, y);
  });
  ctx.restore();
}

/* ══ S8 · 26.8 → 30.0s ══  Close ══════════════════════════════════════════ */
function sceneClose(ctx, A) {
  const { t, p, W, H, S, cam } = A;
  inkBackdrop(ctx, W, H, { warm: 0.85, cy: 0.4 });

  const settle = E.outExpo(clamp(t / 1500));
  cam.fov = 40 * Math.PI / 180;
  cam.lookAt([0, lerp(6.1, 5.4, settle), lerp(9.0, 14.0, settle)], [0, 5.8, 0]);

  S.reset();
  floorGrid(S, { half: 22, step: 2, y: -2.6, alpha: 0.16 * settle });

  /* Outbound light motes — the energy releases rather than converges. */
  for (let i = 0; i < 120; i++) {
    const a0 = hash(i * 1.91) * Math.PI * 2;
    const b0 = Math.acos(hash(i * 3.33) * 2 - 1);
    const rr = lerp(0.6, 11, E.outExpo(clamp(t / 2200 - hash(i * 7.3) * 0.3)));
    const pt = [Math.sin(b0) * Math.cos(a0) * rr, Math.cos(b0) * rr * 0.7 + 7.0, Math.sin(b0) * Math.sin(a0) * rr];
    const dir = V3.mul(V3.norm(V3.sub(pt, [0, 7.0, 0])), 0.55);
    S.path([pt, V3.add(pt, dir)], { color: rgba(C.gold, 0.4 * (1 - clamp(t / 2400))), width: 1.4, glow: 0.6 });
  }

  const mk = E.spring(clamp(t / 1300), 6.2, 4.8);
  const my = 7.0;
  const tileM = M4.chain(
    M4.translate(0, my, 0),
    M4.rotY(0.14 + Math.sin(t / 2600) * 0.06),
    M4.scale(0.66 * lerp(0.3, 1, mk)));
  S.mesh(Assets.tileRim, M4.chain(tileM, M4.translate(0, 0, -0.09)),
    { ...fade(MAT.gold, 0.95 * clamp(mk * 1.5)), metal: 0.95, zBias: -1.4 });
  S.mesh(Assets.tile, tileM, fade(MAT.forest, clamp(mk * 1.5)));
  S.mesh(Assets.torus,
    M4.chain(M4.translate(0, my, 0), M4.rotX(1.08), M4.rotY(t / 2200), M4.scale(0.36 * mk)),
    fade(MAT.gold, 0.4 * mk));
  S.render(ctx, cam, W, H);

  if (mk > 0.04) {
    texQuad3D(ctx, logoTexture(512), cam, W, H,
      quadCorners(tileM, 1.3, 1.3, 0.168), 6, clamp((mk - 0.04) * 1.7));
  }

  FX.lensFlare(ctx, W / 2, H * 0.26, env(clamp(t / 1100), 0.3, 0.6) * 0.7, W);
  FX.flash(ctx, W, H, (1 - clamp(t / 280)) * 1.0);

  /* ── Lock-up ── */
  const ty = H * 0.555;
  kinetic(ctx, CFG.brand, {
    x: W / 2, y: ty, size: 56, weight: 900, tracking: 7.5, align: 'center',
    p: seg(t, 520, 1500), mode: 'glyph', stagger: 0.02, color: C.cream, shadow: 0.5,
  });
  kinetic(ctx, CFG.tagline, {
    x: W / 2, y: ty + 52, size: 24, weight: 600, tracking: 6, align: 'center',
    p: seg(t, 1000, 1700), mode: 'wipe', color: rgba(C.gold, 0.95),
  });

  /* CTA button with a live pulse. */
  const bp = E.outBack(clamp((t - 1250) / 760));
  if (bp > 0.01) {
    const bw = 520, bh = 86;
    const bx = W / 2 - bw / 2, by = ty + 108;
    const pulse = 0.5 + 0.5 * Math.sin((t - 1250) / 420);
    ctx.save();
    ctx.globalAlpha = clamp((t - 1250) / 380);
    ctx.translate(W / 2, by + bh / 2);
    ctx.scale(lerp(0.88, 1, clamp(bp)), lerp(0.88, 1, clamp(bp)));
    ctx.translate(-W / 2, -(by + bh / 2));
    roundRect(ctx, bx - 8 - pulse * 10, by - 8 - pulse * 10, bw + 16 + pulse * 20, bh + 16 + pulse * 20, 14);
    ctx.strokeStyle = rgba(C.gold, 0.4 * (1 - pulse)); ctx.lineWidth = 2; ctx.stroke();
    roundRect(ctx, bx, by, bw, bh, 10);
    const bg = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    bg.addColorStop(0, C.goldLt); bg.addColorStop(0.55, C.gold); bg.addColorStop(1, C.goldDk);
    ctx.fillStyle = bg; ctx.fill();
    ctx.shadowColor = rgba(C.gold, 0.55); ctx.shadowBlur = 40; ctx.fill(); ctx.shadowBlur = 0;
    setFont(ctx, 31, 900);
    ctx.fillStyle = '#0A0C10';
    ctx.textBaseline = 'middle';
    tracked(ctx, CFG.cta, W / 2, by + bh / 2 + 1, 3.4, 'center');
    ctx.restore();
    FX.sweep(ctx, bx, by, bw, bh, seg(t, 1700, 2500), { alpha: 0.75, width: 0.12 });
  }

  /* URL + trust badges. */
  const up = seg(t, 1900, 2500);
  if (up > 0) {
    ctx.save();
    ctx.globalAlpha = up;
    setFont(ctx, 27, 800, true);
    ctx.fillStyle = rgba(C.white, 0.95);
    ctx.textBaseline = 'middle';
    tracked(ctx, CFG.url, W / 2, ty + 248, 2.4, 'center');
    /* The guarantee is the risk-reversal — it earns a bordered chip, not a
       line of grey small print. */
    setFont(ctx, 17, 800);
    const chipW = CFG.badges.map(b => trackedWidth(ctx, b, 2) + 38);
    const totalW = chipW.reduce((a, b) => a + b, 0) + (CFG.badges.length - 1) * 14;
    let bx = W / 2 - totalW / 2;
    CFG.badges.forEach((b, i) => {
      roundRect(ctx, bx, ty + 274, chipW[i], 40, 20);
      ctx.fillStyle = rgba(C.gold, i === 0 ? 0.14 : 0.07);
      ctx.fill();
      ctx.strokeStyle = rgba(C.gold, i === 0 ? 0.65 : 0.3);
      ctx.lineWidth = 1.3;
      ctx.stroke();
      setFont(ctx, 17, 800);
      ctx.fillStyle = i === 0 ? C.goldLt : rgba(C.cream, 0.75);
      ctx.textBaseline = 'middle';
      tracked(ctx, b, bx + 19, ty + 295, 2);
      bx += chipW[i] + 14;
    });
    ctx.restore();
  }

  /* Risk disclosure — required for financial advertising, and it builds trust. */
  const dp = seg(t, 2300, 2900);
  if (dp > 0) {
    ctx.save();
    ctx.globalAlpha = dp * 0.8;
    setFont(ctx, 14, 500);
    ctx.fillStyle = rgba(C.slate, 0.75);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    CFG.disclaimer.forEach((ln, i) => ctx.fillText(ln, W / 2, H - 46 + i * 20));
    ctx.textAlign = 'left';
    ctx.restore();
  }

  /* Gentle fade to black on the last 4 frames. */
  const fo = seg(t, 3080, 3200, E.inQuad);
  if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, W, H); }
}
