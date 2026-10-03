/* ============================================================================
   scenes-a.js — Acts I & II (0.0s → 15.4s)
   Every scene is a pure function of local time. Shared meshes are built once.
   ========================================================================== */

const CFG = window.OTA_CONFIG;

const Assets = (() => {
  const unitBox = Geo.box(1, 1, 1);
  return {
    unitBox,
    globe:   Geo.sphereWire(3.25, 9, 18, 56),
    globeIn: Geo.sphereWire(3.08, 5, 10, 40),
    logo:    Geo.extrude(Geo.chevron(3.0, 1.62, 0.5), 0.5),
    logoSm:  Geo.extrude(Geo.chevron(1.86, 1.0, 0.31), 0.34),
    torus:   Geo.torus(4.3, 0.045, 96, 6),
    phone:   Geo.extrude(Geo.roundedRect(2.26, 4.72, 0.33, 8), 0.24),
    hex:     Geo.extrude(Geo.regularPoly(6, 1.62, Math.PI / 2), 0.3),
    card:    Geo.extrude(Geo.roundedRect(3.0, 4.0, 0.16, 5), 0.11),
    plinth:  Geo.extrude(Geo.roundedRect(3.3, 0.34, 0.14, 4), 0.9),
  };
})();

/* Materials ---------------------------------------------------------------- */
const MAT = {
  gold: {
    color: [0.72, 0.56, 0.17], metal: 0.92, rim: 0.8,
    groups: { 0: [0.52, 0.39, 0.11], 1: [0.88, 0.71, 0.26], 2: [0.3, 0.22, 0.07], 3: [0.95, 0.8, 0.36] },
    stroke: null, strokeW: 1,
  },
  steel: {
    color: [0.22, 0.26, 0.33], metal: 0.6, rim: 0.7,
    groups: { 0: [0.13, 0.16, 0.22], 1: [0.26, 0.3, 0.38], 2: [0.07, 0.09, 0.12], 3: [0.32, 0.36, 0.44] },
  },
  glass: {
    color: [0.09, 0.12, 0.19], metal: 0.35, rim: 1.15, alpha: 0.9,
    groups: { 0: [0.06, 0.08, 0.13], 1: [0.1, 0.13, 0.21], 2: [0.04, 0.05, 0.09], 3: [0.12, 0.16, 0.25] },
  },
  up:   { color: [0.03, 0.32, 0.2], metal: 0.42, rim: 0.7, emissive: 0.05,
          groups: { 0: [0.02, 0.2, 0.13], 1: [0.05, 0.46, 0.28], 2: [0.01, 0.1, 0.06], 3: [0.07, 0.6, 0.36] } },
  down: { color: [0.34, 0.08, 0.1], metal: 0.42, rim: 0.7, emissive: 0.04,
          groups: { 0: [0.24, 0.055, 0.07], 1: [0.5, 0.12, 0.14], 2: [0.12, 0.03, 0.04], 3: [0.62, 0.16, 0.17] } },
};

const fade = (mat, a) => ({ ...mat, alpha: (mat.alpha ?? 1) * a });

/* Shared backdrop: deep ink with a warm pool of light. */
function inkBackdrop(ctx, W, H, { warm = 0.5, cx = 0.5, cy = 0.56 } = {}) {
  ctx.fillStyle = '#04060A';
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * cx, H * cy, 0, W * cx, H * cy, H * 1.05);
  g.addColorStop(0,   `rgba(32,27,14,${0.95 * warm})`);
  g.addColorStop(0.4, `rgba(14,16,26,${0.7 * warm})`);
  g.addColorStop(1,   'rgba(3,4,7,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/* Receding floor grid in 3D. */
function floorGrid(S, { half = 24, step = 2, y = 0, alpha = 0.22, color = C.gold } = {}) {
  for (let i = -half; i <= half; i += step) {
    const a = alpha * (1 - Math.abs(i) / (half * 1.25));
    if (a <= 0.004) continue;
    S.path([[-half, y, i], [half, y, i]], { color: rgba(color, a), width: 1, zBias: -0.01 });
    S.path([[i, y, -half], [i, y, half]], { color: rgba(color, a * 0.6), width: 1, zBias: -0.01 });
  }
}

const TICKER_ITEMS = [
  { s: 'SPY',  d: '▲ 0.82%', p: '547.32', up: 1 },
  { s: 'QQQ',  d: '▲ 1.14%', p: '463.18', up: 1 },
  { s: '/ES',  d: '▲ 0.64%', p: '5482.25', up: 1 },
  { s: '/NQ',  d: '▲ 1.02%', p: '19640.50', up: 1 },
  { s: 'NVDA', d: '▲ 3.20%', p: '892.14', up: 1 },
  { s: 'TSLA', d: '▼ 2.31%', p: '174.88', up: 0 },
  { s: 'AAPL', d: '▲ 0.47%', p: '211.55', up: 1 },
  { s: 'VIX',  d: '▼ 4.55%', p: '14.22',  up: 0 },
  { s: '/CL',  d: '▲ 1.47%', p: '78.94',  up: 1 },
  { s: 'GOLD', d: '▲ 0.38%', p: '2341.60', up: 1 },
];

/* ══ S1 · 0.0 → 3.4s ══  "The market doesn't wait." ═══════════════════════ */
function sceneHook(ctx, A) {
  const { t, p, W, H, S, cam } = A;
  inkBackdrop(ctx, W, H, { warm: 0.42, cy: 0.62 });

  /* Camera: hard push-in through the candle field. */
  const push = E.outCubic(clamp(t / 3300));
  const z = lerp(30, 11.5, push);
  cam.fov = lerp(50, 40, push) * Math.PI / 180;
  cam.lookAt([Math.sin(t / 2600) * 2.4, lerp(9.5, 5.2, E.inOutCubic(push)), z], [0, 0.8, 0]);

  S.reset();
  floorGrid(S, { half: 26, step: 2, alpha: 0.2 * clamp(p * 4) });

  /* Candlestick city — heights evolve so the market reads as live. */
  const cols = 15, rows = 11, sp = 1.95;
  const phase = t / 1000 * 0.42;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = (i - (cols - 1) / 2) * sp;
      const zz = (j - (rows - 1) / 2) * sp;
      const n = fbm(i * 0.47 + j * 1.31 + phase, 3);
      const grow = clamp((t - 120 - (Math.abs(i - 7) + Math.abs(j - 5)) * 34) / 520);
      if (grow <= 0.01) continue;
      const h = (0.55 + Math.abs(n) * 3.3) * E.outExpo(grow);
      const up = n > 0;
      /* Most of the field is neutral; only the strongest moves take colour,
         which is what keeps a wide shot from turning into confetti. */
      const strong = Math.abs(n) > 0.42;
      const m = fade(strong ? (up ? MAT.up : MAT.down) : MAT.steel, clamp(grow * 1.6));
      S.mesh(Assets.unitBox,
        M4.chain(M4.translate(x, h / 2, zz), M4.scale(sp * 0.26, h, sp * 0.26)), m);
      const wick = 0.35 + Math.abs(noise1(i * 5.3 + j * 2.1)) * 0.8;
      S.path([[x, h, zz], [x, h + wick, zz]],
        { color: rgba(up ? C.green : C.red, 0.55 * grow), width: 2 });
      S.path([[x, 0.02, zz], [x, -wick * 0.5, zz]],
        { color: rgba(up ? C.green : C.red, 0.2 * grow), width: 2 });
    }
  }
  S.render(ctx, cam, W, H);

  /* Horizon haze sells depth. */
  const hz = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.62);
  hz.addColorStop(0, 'rgba(4,6,10,0)');
  hz.addColorStop(1, rgba(C.gold, 0.07));
  ctx.fillStyle = hz; ctx.fillRect(0, H * 0.3, W, H * 0.34);

  dustField(ctx, t, W, H, 70, { speed: -40, alpha: 0.36 });
  FX.scrim(ctx, W, H, 'left', 0.92, 0.62);

  /* ── Type ── */
  const tp1 = seg(t, 480, 1180), tp2 = seg(t, 900, 1700);
  const out = 1 - seg(t, 2950, 3400, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  ctx.translate(0, (1 - out) * -36);
  kinetic(ctx, 'THE MARKET', { x: 150, y: 470, size: 132, weight: 900, tracking: -3, p: tp1, mode: 'wipe', color: C.white });
  kinetic(ctx, "DOESN'T WAIT.", { x: 150, y: 612, size: 132, weight: 900, tracking: -3, p: tp2, mode: 'wipe', color: C.gold, shadow: 0.7 });
  const lw = seg(t, 1500, 2100, E.outExpo);
  ctx.fillStyle = rgba(C.gold, 0.85 * lw);
  ctx.fillRect(150, 660, 300 * lw, 3);
  FX.eyebrow(ctx, 152, 318, 'LIVE MARKET · 24 / 7 / 365', seg(t, 1750, 2350));
  ctx.restore();

  /* Session clock HUD. */
  clockHud(ctx, W - 190, 190, 62, t, seg(t, 1200, 2000) * out);

  /* Ticker strip. */
  const tk = seg(t, 260, 900, E.outExpo) * out;
  ctx.save();
  ctx.globalAlpha = tk;
  ctx.fillStyle = 'rgba(5,7,12,0.82)';
  ctx.fillRect(0, H - 76, W, 76);
  ctx.fillStyle = rgba(C.gold, 0.26);
  ctx.fillRect(0, H - 76, W, 1.5);
  FX.ticker(ctx, H - 38, A.abs, W, TICKER_ITEMS, { alpha: 0.95 });
  ctx.restore();

  FX.flash(ctx, W, H, (1 - clamp(t / 230)) * 0.9);
}

/* Rotating 24-hour session dial. */
function clockHud(ctx, cx, cy, r, t, a) {
  if (a <= 0.004) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = rgba(C.gold, 0.3); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const ang = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const long = i % 6 === 0;
    ctx.globalAlpha = a * (long ? 0.8 : 0.3);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * (r - (long ? 11 : 5)), cy + Math.sin(ang) * (r - (long ? 11 : 5)));
    ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
    ctx.stroke();
  }
  const sweep = (t / 2400) % 1;
  ctx.globalAlpha = a;
  ctx.strokeStyle = C.gold; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, r - 16, -Math.PI / 2, -Math.PI / 2 + sweep * Math.PI * 2);
  ctx.stroke();
  setFont(ctx, 20, 800, true);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = C.white;
  ctx.fillText('24H', cx, cy - 7);
  setFont(ctx, 12, 700, true);
  ctx.fillStyle = rgba(C.slate, 0.9);
  ctx.fillText('OPEN', cx, cy + 13);
  ctx.textAlign = 'left';
  ctx.restore();
}

/* ══ S2 · 3.4 → 7.2s ══  "Trillions move while you sleep." ════════════════ */
const CITIES = [
  { n: 'NEW YORK', lat: 40.7,  lng: -74.0 },
  { n: 'LONDON',   lat: 51.5,  lng: -0.12 },
  { n: 'TOKYO',    lat: 35.7,  lng: 139.7 },
  { n: 'HONG KONG',lat: 22.3,  lng: 114.2 },
  { n: 'FRANKFURT',lat: 50.1,  lng: 8.68 },
  { n: 'SYDNEY',   lat: -33.9, lng: 151.2 },
  { n: 'DUBAI',    lat: 25.2,  lng: 55.3 },
  { n: 'SÃO PAULO',lat: -23.5, lng: -46.6 },
];
const ROUTES = [[0, 1], [1, 2], [2, 3], [0, 4], [3, 5], [1, 6], [0, 7], [4, 2]];

function sceneGlobe(ctx, A) {
  const { t, p, W, H, S, cam } = A;
  inkBackdrop(ctx, W, H, { warm: 0.34, cx: 0.68, cy: 0.5 });

  const spin = t / 1000 * 0.3 + 2.1;
  const inP = E.outExpo(clamp(t / 1100));
  cam.fov = 40 * Math.PI / 180;
  cam.lookAt([lerp(2, 0.6, inP), lerp(3.4, 1.5, inP), lerp(15, 11.4, inP)], [2.9, 0.1, 0]);

  S.reset();
  const R = 3.25;
  const gm = M4.chain(M4.translate(2.9, 0.1, 0), M4.rotY(spin), M4.rotZ(0.38));

  /* Globe shell: two wire layers for parallax depth. */
  S.mesh(Assets.globe, gm,
    { wireOnly: true, wireColor: rgba(C.gold, 0.46 * inP), wireWidth: 1.2, wireGlow: 0.7 });
  S.mesh(Assets.globeIn, M4.chain(M4.translate(2.9, 0.1, 0), M4.rotY(-spin * 0.6), M4.rotZ(0.38)),
    { wireOnly: true, wireColor: rgba(C.cyan, 0.16 * inP), wireWidth: 1 });

  /* Dark sphere core so back-facing wires read as "behind". */
  S.sprite([2.9, 0.1, 0], (c, sc) => {
    const r = sc * R * 0.99;
    const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, 'rgba(14,20,34,0.97)');
    g.addColorStop(1, 'rgba(4,6,11,0.99)');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  }, { scale: 1, zBias: -0.02 });

  /* Capital-flow arcs, fired in sequence. */
  ROUTES.forEach(([a, b], i) => {
    const local = ((t / 1000 * 0.55 + i * 0.37) % 1.6) / 1.6;
    const pts = Geo.arcLatLng(
      [CITIES[a].lat, CITIES[a].lng], [CITIES[b].lat, CITIES[b].lng], R, 0.3, 44)
      .map(q => M4.xform(gm, q).slice(0, 3));
    const grow = clamp(local * 2.4);
    const n = Math.max(2, Math.floor(pts.length * grow));
    S.path(pts.slice(0, n),
      { color: rgba(C.gold, 0.5 * inP * (1 - clamp((local - 0.6) / 0.4))), width: 2.2, glow: 1 });
    if (grow >= 1) {
      const head = pts[Math.min(pts.length - 1, Math.floor(clamp((local - 0.42) / 0.5) * (pts.length - 1)))];
      S.sprite(head, (c, sc) => {
        const r = Math.max(1.6, sc * 0.05);
        c.fillStyle = rgba(C.goldLt, 0.95); c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      }, {});
    }
  });

  /* City nodes + labels. */
  CITIES.forEach((city, i) => {
    const wp = M4.xform(gm, Geo.latLng(city.lat, city.lng, R)).slice(0, 3);
    const toCam = V3.dot(V3.norm(V3.sub(wp, [2.9, 0.1, 0])), V3.norm(V3.sub(cam.eye, wp)));
    if (toCam < 0.05) return;
    const pulse = 0.5 + 0.5 * Math.sin(t / 420 + i * 1.7);
    const vis = clamp((t - 500 - i * 90) / 420) * toCam;
    if (vis <= 0.01) return;
    S.sprite(wp, (c, sc) => {
      const r = Math.max(2, sc * 0.022);
      c.globalAlpha = vis;
      c.fillStyle = C.goldLt;
      c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      c.strokeStyle = rgba(C.gold, 0.5 * (1 - pulse));
      c.lineWidth = 1.4;
      c.beginPath(); c.arc(0, 0, r + pulse * 15, 0, 7); c.stroke();
      if (toCam > 0.45) {
        setFont(c, 14, 800);
        c.fillStyle = rgba(C.white, 0.75 * vis);
        c.textBaseline = 'middle';
        tracked(c, city.n, r + 10, 0.5, 1.6);
      }
      c.globalAlpha = 1;
    }, {});
  });
  S.render(ctx, cam, W, H);

  dustField(ctx, t, W, H, 60, { speed: 16, alpha: 0.3 });
  FX.scrim(ctx, W, H, 'left', 0.8, 0.52);

  /* ── Type (left third) ── */
  const out = 1 - seg(t, 3350, 3800, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  FX.eyebrow(ctx, 152, 350, 'GLOBAL SESSIONS · ALWAYS OPEN', seg(t, 300, 900));
  kinetic(ctx, 'WHILE YOU SLEEP,', { x: 150, y: 470, size: 92, weight: 900, tracking: -1.5, p: seg(t, 520, 1200), mode: 'wipe', color: C.white });
  kinetic(ctx, 'CAPITAL MOVES.',   { x: 150, y: 572, size: 92, weight: 900, tracking: -1.5, p: seg(t, 760, 1500), mode: 'wipe', color: C.gold, shadow: 0.6 });
  const sub = seg(t, 1500, 2300);
  if (sub > 0) {
    setFont(ctx, 26, 600);
    ctx.globalAlpha = out * sub;
    ctx.fillStyle = rgba(C.slate, 0.95);
    ctx.fillText('Most people watch from the sidelines.', 152, 650);
  }
  ctx.restore();

  /* Session bars — Tokyo / London / New York overlap. */
  sessionBars(ctx, 152, 760, 560, t, seg(t, 1900, 2700) * out);
}

function sessionBars(ctx, x, y, w, t, a) {
  if (a <= 0.004) return;
  const rows = [
    { n: 'TOKYO',    s: 0.00, e: 0.38 },
    { n: 'LONDON',   s: 0.32, e: 0.72 },
    { n: 'NEW YORK', s: 0.56, e: 1.00 },
  ];
  ctx.save();
  ctx.globalAlpha = a;
  rows.forEach((r, i) => {
    const yy = y + i * 40;
    setFont(ctx, 14, 800, true);
    ctx.fillStyle = rgba(C.slate, 0.8);
    ctx.textBaseline = 'middle';
    ctx.fillText(r.n, x, yy);
    const bx = x + 118, bw = w - 118;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, bx, yy - 6, bw, 12, 6); ctx.fill();
    const g = ctx.createLinearGradient(bx + bw * r.s, 0, bx + bw * r.e, 0);
    g.addColorStop(0, rgba(C.gold, 0.35)); g.addColorStop(1, rgba(C.goldLt, 0.95));
    ctx.fillStyle = g;
    const grow = E.outExpo(clamp((a * 1.6) - i * 0.18));
    roundRect(ctx, bx + bw * r.s, yy - 6, bw * (r.e - r.s) * grow, 12, 6); ctx.fill();
  });
  const px = x + 118 + (w - 118) * ((t / 3600) % 1);
  ctx.strokeStyle = rgba(C.white, 0.6); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(px, y - 22); ctx.lineTo(px, y + 102); ctx.stroke();
  ctx.restore();
}

/* ══ S3 · 7.2 → 11.6s ══  Brand reveal ════════════════════════════════════ */
function sceneBrand(ctx, A) {
  const { t, p, W, H, S, cam } = A;
  inkBackdrop(ctx, W, H, { warm: 0.72, cy: 0.46 });

  const settle = E.outExpo(clamp(t / 1700));
  const spin = lerp(-2.6, 0.26, settle) + Math.sin(t / 2100) * 0.1;
  cam.fov = lerp(52, 38, settle) * Math.PI / 180;
  cam.lookAt([0, lerp(2.4, 1.6, settle), lerp(6.4, 12.2, settle)], [0, lerp(0.2, 1.9, settle), 0]);

  S.reset();
  floorGrid(S, { half: 20, step: 2, y: -2.5, alpha: 0.14 * settle });

  /* Particle convergence: the globe's data collapses into the mark. */
  const conv = clamp(t / 1400);
  if (conv < 1) {
    for (let i = 0; i < 160; i++) {
      const a0 = hash(i * 1.37) * Math.PI * 2;
      const b0 = Math.acos(hash(i * 2.71) * 2 - 1);
      const rr = lerp(7.5, 1.3, E.inCubic(clamp(conv * 1.15 - hash(i * 5.1) * 0.22)));
      const pt = [
        Math.sin(b0) * Math.cos(a0) * rr,
        Math.cos(b0) * rr * 0.8 + 0.4,
        Math.sin(b0) * Math.sin(a0) * rr,
      ];
      const tail = V3.mul(V3.norm(pt), 0.5 + conv * 1.6);
      S.path([pt, V3.add(pt, tail)],
        { color: rgba(i % 5 === 0 ? C.goldLt : C.gold, 0.5 * (1 - conv ** 2)), width: 1.6, glow: 0.7 });
    }
  }

  /* The mark: extruded chevron, milled gold. */
  const mk = E.spring(clamp((t - 420) / 1500), 6.4, 4.6);
  if (mk > 0.004) {
    const MY = 2.5;
    const m = M4.chain(
      M4.translate(0, MY, 0),
      M4.rotY(spin), M4.rotX(Math.sin(t / 2600) * 0.08),
      M4.scale(lerp(0.2, 0.82, mk)));
    S.mesh(Assets.logo, m, fade(MAT.gold, clamp(mk * 1.4)));
    S.mesh(Assets.logoSm,
      M4.chain(M4.translate(0, MY - 0.44, 0), M4.rotY(spin), M4.rotX(Math.sin(t / 2600) * 0.08),
               M4.scale(lerp(0.2, 0.82, mk))),
      { ...fade(MAT.gold, clamp(mk * 1.4) * 0.72), emissive: 0.12 });
    S.mesh(Assets.logo, M4.chain(M4.translate(0, MY - 2.0, 0), M4.scale(1, -1, 1), M4.rotY(spin), M4.scale(lerp(0.2, 0.82, mk))),
      { ...fade(MAT.gold, 0.055 * mk), rim: 0.2, cull: false });
    S.mesh(Assets.torus, M4.chain(M4.translate(0, MY, 0), M4.rotX(1.1 + Math.sin(t / 1800) * 0.1), M4.rotY(t / 1400), M4.scale(0.6 * mk)),
      fade(MAT.gold, 0.5 * mk));
  }
  S.render(ctx, cam, W, H);

  /* Specular sweep + flare timed to the downbeat. */
  FX.sweep(ctx, W * 0.26, H * 0.08, W * 0.48, H * 0.62, seg(t, 1250, 2100), { alpha: 0.4, width: 0.1 });
  FX.lensFlare(ctx, W / 2 + 120, H * 0.33, env(clamp((t - 1150) / 900), 0.25, 0.5) * 0.85, W);
  FX.flash(ctx, W, H, (1 - clamp(t / 300)) * 0.95);

  /* Lock-up type. */
  const out = 1 - seg(t, 3950, 4400, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  const ty = H * 0.745;
  kinetic(ctx, 'OPTIONS TRADERS ACADEMY', {
    x: W / 2, y: ty, size: 72, weight: 900, tracking: 7, align: 'center',
    p: seg(t, 1650, 2600), mode: 'glyph', stagger: 0.022, color: C.white, shadow: 0.5,
  });
  const rl = seg(t, 2500, 3100, E.outExpo);
  ctx.fillStyle = rgba(C.gold, 0.9 * rl);
  ctx.fillRect(W / 2 - 220 * rl, ty + 34, 440 * rl, 2.5);
  kinetic(ctx, CFG.tagline, {
    x: W / 2, y: ty + 84, size: 30, weight: 600, tracking: 6.5, align: 'center',
    p: seg(t, 2850, 3500), mode: 'wipe', color: rgba(C.gold, 0.95),
  });
  ctx.restore();
}

/* ══ S4 · 11.6 → 15.4s ══  Three pillars ══════════════════════════════════ */
const PILLARS = [
  { k: 'OPTIONS',   d: 'Calls, puts, spreads,\nincome strategies', ico: 'chain' },
  { k: 'FUTURES',   d: '/ES · /NQ · /CL\nladder & levels',        ico: 'ladder' },
  { k: 'INVESTING', d: 'Long-term holdings\n& allocation',        ico: 'donut' },
];

function scenePillars(ctx, A) {
  const { t, p, W, H, S, cam } = A;
  inkBackdrop(ctx, W, H, { warm: 0.4, cy: 0.5 });

  const settle = E.outExpo(clamp(t / 1500));
  cam.fov = 40 * Math.PI / 180;
  cam.lookAt([lerp(-5.5, 0, settle), lerp(2.2, 1.0, settle), lerp(13.5, 11.6, settle)], [0, -0.35, 0]);

  S.reset();
  floorGrid(S, { half: 18, step: 2, y: -3.1, alpha: 0.18 });

  PILLARS.forEach((pl, i) => {
    const x = (i - 1) * 4.0;
    const enter = E.spring(clamp((t - 180 - i * 190) / 1500), 5.6, 4.4);
    if (enter <= 0.004) return;
    const yOff = (1 - enter) * -7;
    const rot = (1 - enter) * 0.9 + Math.sin(t / 2300 + i) * 0.05;
    const m = M4.chain(M4.translate(x, 0.35 + yOff, 0), M4.rotY(rot), M4.rotX(-0.04));
    S.mesh(Assets.card, m, fade(MAT.glass, clamp(enter * 1.5)));
    S.mesh(Assets.plinth, M4.chain(M4.translate(x, -2.14 + yOff, 0), M4.rotY(rot), M4.scale(0.94, 0.5, 0.5)),
      { ...fade(MAT.gold, clamp(enter * 1.5) * 0.5), metal: 0.8, rim: 0.35 });

    /* Card face is drawn in screen space, anchored to the 3D card. */
    S.sprite([x, 0.35 + yOff, 0.07], (c, sc) => {
      const w = sc * 2.82, h = sc * 3.82;
      c.save();
      c.globalAlpha = clamp(enter * 1.5);
      cardFace(c, -w / 2, -h / 2, w, h, pl, t - i * 190, i);
      c.restore();
    }, { zBias: 0.06 });
  });
  S.render(ctx, cam, W, H);

  /* Headline band. */
  const out = 1 - seg(t, 3350, 3800, E.inOutQuad);
  ctx.save();
  ctx.globalAlpha = out;
  FX.eyebrow(ctx, W / 2 - 215, 86, 'ONE APP · THREE DISCIPLINES', seg(t, 250, 850));
  kinetic(ctx, 'NOT JUST TRADING.', {
    x: W / 2, y: 182, size: 78, weight: 900, tracking: -1, align: 'center',
    p: seg(t, 500, 1300), mode: 'wipe', color: C.white,
  });
  ctx.restore();

  /* Bottom rail of capability chips. */
  const chips = ['OPTIONS', 'FUTURES', 'EQUITIES', 'ETFs', 'RISK', 'PORTFOLIO'];
  ctx.save();
  ctx.globalAlpha = out;
  /* Measure the whole rail first so it stays centred whatever the copy is. */
  setFont(ctx, 17, 800);
  const railW = chips.reduce((a, ch) => a + trackedWidth(ctx, ch, 2.6) + 40 + 14, 0) - 14;
  let cx = W / 2 - railW / 2;
  chips.forEach((ch, i) => {
    const e = E.outExpo(clamp((t - 1700 - i * 110) / 700));
    if (e <= 0.01) return;
    setFont(ctx, 17, 800);
    const tw = trackedWidth(ctx, ch, 2.6) + 40;
    ctx.globalAlpha = out * e;
    roundRect(ctx, cx, H - 236, tw, 42, 21);
    ctx.fillStyle = rgba(C.gold, 0.09); ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.4); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = rgba(C.goldLt, 0.95);
    ctx.textBaseline = 'middle';
    tracked(ctx, ch, cx + 20, H - 214, 2.6);
    cx += tw + 14;
  });
  ctx.restore();
}

/* Mini-UI rendered on each pillar card. */
function cardFace(c, x, y, w, h, pl, t, idx) {
  roundRect(c, x, y, w, h, w * 0.055);
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, 'rgba(24,31,46,0.95)');
  g.addColorStop(1, 'rgba(8,11,18,0.95)');
  c.fillStyle = g; c.fill();
  c.strokeStyle = rgba(C.gold, 0.35); c.lineWidth = Math.max(1, w * 0.004); c.stroke();

  c.save();
  roundRect(c, x, y, w, h, w * 0.055); c.clip();

  const pad = w * 0.085;
  setFont(c, w * 0.082, 900);
  c.fillStyle = C.white;
  c.textBaseline = 'alphabetic';
  tracked(c, pl.k, x + pad, y + h * 0.13, w * 0.008);
  c.fillStyle = rgba(C.gold, 0.9);
  c.fillRect(x + pad, y + h * 0.155, w * 0.18, Math.max(1.5, h * 0.006));

  const vx = x + pad, vy = y + h * 0.22, vw = w - pad * 2, vh = h * 0.46;
  if (pl.ico === 'chain')  drawChain(c, vx, vy, vw, vh, t);
  if (pl.ico === 'ladder') drawLadder(c, vx, vy, vw, vh, t);
  if (pl.ico === 'donut')  drawDonut(c, vx + vw / 2, vy + vh / 2, Math.min(vw, vh) * 0.42, t);

  setFont(c, w * 0.052, 600);
  c.fillStyle = rgba(C.slate, 0.95);
  pl.d.split('\n').forEach((ln, i) => c.fillText(ln, x + pad, y + h * 0.805 + i * w * 0.07));
  c.restore();
}

function drawChain(c, x, y, w, h, t) {
  const rows = 5, rh = h / rows;
  for (let i = 0; i < rows; i++) {
    const yy = y + i * rh;
    const live = Math.sin(t / 400 + i * 1.3) > 0.55;
    c.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.015)';
    c.fillRect(x, yy, w, rh - 2);
    setFont(c, rh * 0.46, 700, true);
    c.textBaseline = 'middle';
    c.fillStyle = rgba(C.white, 0.8);
    c.fillText(`${540 + i * 5}C`, x + 4, yy + rh / 2);
    c.fillStyle = live ? C.green : rgba(C.slate, 0.8);
    c.textAlign = 'right';
    c.fillText(`${(2.4 + i * 0.6 + Math.sin(t / 300 + i) * 0.3).toFixed(2)}`, x + w - 4, yy + rh / 2);
    c.textAlign = 'left';
    if (live) { c.fillStyle = rgba(C.green, 0.1); c.fillRect(x, yy, w, rh - 2); }
  }
}

function drawLadder(c, x, y, w, h, t) {
  const n = 7, rh = h / n;
  for (let i = 0; i < n; i++) {
    const yy = y + i * rh;
    const bid = (Math.sin(t / 380 + i * 0.9) * 0.5 + 0.5);
    c.fillStyle = rgba(i < 3 ? C.red : C.green, 0.14 + bid * 0.2);
    c.fillRect(x, yy, w * (0.25 + bid * 0.7), rh - 2);
    setFont(c, rh * 0.44, 700, true);
    c.textBaseline = 'middle';
    c.fillStyle = rgba(C.white, 0.78);
    c.fillText(`${5490 - i * 2}.25`, x + 4, yy + rh / 2);
  }
  c.strokeStyle = C.gold; c.lineWidth = Math.max(1, h * 0.012);
  const my = y + rh * 3;
  c.beginPath(); c.moveTo(x, my); c.lineTo(x + w, my); c.stroke();
}

function drawDonut(c, cx, cy, r, t) {
  const slices = [[0.42, C.gold], [0.24, C.cyan], [0.18, C.green], [0.16, '#7A6CFF']];
  let a0 = -Math.PI / 2;
  const grow = E.outCubic(clamp(t / 1200));
  slices.forEach(([frac, col]) => {
    const a1 = a0 + frac * Math.PI * 2 * grow;
    c.beginPath();
    c.arc(cx, cy, r, a0, a1);
    c.strokeStyle = col; c.lineWidth = r * 0.34; c.lineCap = 'butt';
    c.stroke();
    a0 += frac * Math.PI * 2 * grow;
  });
  setFont(c, r * 0.44, 900);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = C.white;
  c.fillText(`${Math.round(grow * 100)}%`, cx, cy);
  setFont(c, r * 0.23, 700);
  c.fillStyle = rgba(C.slate, 0.9);
  c.fillText('ALLOCATED', cx, cy + r * 0.38);
  c.textAlign = 'left';
}
