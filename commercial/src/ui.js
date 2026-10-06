/* ============================================================================
   ui.js — the in-film product UI, drawn to off-screen canvases and then mapped
   onto 3D surfaces by texQuad3D. Every number is illustrative and is labelled
   as such on screen; nothing here claims a real return.
   ========================================================================== */

/* Deterministic equity-ish series. */
function series(n, t, { drift = 0.72, vol = 0.5, seed = 0 } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    pts.push(x * drift + fbm(i * 0.21 + seed + t / 2600, 4) * vol * (0.35 + x * 0.8));
  }
  const min = Math.min(...pts), max = Math.max(...pts);
  return pts.map(v => (v - min) / (max - min || 1));
}

function sparkline(c, x, y, w, h, data, p, { color = C.gold, fill = true, width = 2.6 } = {}) {
  const n = Math.max(2, Math.floor(data.length * clamp(p)));
  const px = (i) => x + (i / (data.length - 1)) * w;
  const py = (v) => y + h - v * h;
  c.save();
  if (fill) {
    c.beginPath();
    c.moveTo(px(0), y + h);
    for (let i = 0; i < n; i++) c.lineTo(px(i), py(data[i]));
    c.lineTo(px(n - 1), y + h);
    c.closePath();
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, rgba(color, 0.34));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g; c.fill();
  }
  c.beginPath();
  for (let i = 0; i < n; i++) (i ? c.lineTo : c.moveTo).call(c, px(i), py(data[i]));
  c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round';
  c.shadowColor = rgba(color, 0.7); c.shadowBlur = 14;
  c.stroke();
  c.shadowBlur = 0;
  if (n > 1) {
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(px(n - 1), py(data[n - 1]), width * 1.5, 0, 7); c.fill();
  }
  c.restore();
}

function uiChrome(c, w, h, bg = '#031108') {
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(10,46,24,0.92)');
  g.addColorStop(0.5, 'rgba(4,22,11,0.96)');
  g.addColorStop(1, 'rgba(20,16,6,0.9)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}

function tag(c, x, y, text, { size = 15, color = C.gold, bg = 0.12, pad = 10 } = {}) {
  setFont(c, size, 800);
  const tw = trackedWidth(c, text, 1.6);
  roundRect(c, x, y - size * 0.9, tw + pad * 2, size * 1.8, size * 0.9);
  c.fillStyle = rgba(color, bg); c.fill();
  c.strokeStyle = rgba(color, 0.45); c.lineWidth = 1; c.stroke();
  c.fillStyle = color;
  c.textBaseline = 'middle';
  tracked(c, text, x + pad, y, 1.6);
  return tw + pad * 2;
}

/* ── Phone screen ────────────────────────────────────────────────────────── */
function appScreen(t, w = 580, h = 1218) {
  const cv = Targets.get('phone', w, h);
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);
  uiChrome(c, w, h);
  c.textAlign = 'left';

  const S = w / 580;                                  // single scale factor
  const px = 34 * S;

  /* status bar */
  setFont(c, 20 * S, 700, true);
  c.fillStyle = rgba(C.white, 0.75);
  c.textBaseline = 'middle';
  c.fillText('9:41', px, 36 * S);
  c.textAlign = 'right';
  c.fillText('LTE  ▮▮▮', w - px, 36 * S);
  c.textAlign = 'left';

  /* header — the mark itself, then the OS name and build */
  logoStamp(c, px, 70 * S, 46 * S, { radius: 5 * S });
  setFont(c, 25 * S, 900);
  c.fillStyle = C.cream;
  tracked(c, 'OTA OS', px + 60 * S, 95 * S, 2.4 * S);
  setFont(c, 14 * S, 700, true);
  c.fillStyle = rgba(C.slate, 0.8);
  c.fillText('v4.2', px + 174 * S, 95 * S);
  const dotP = 0.5 + 0.5 * Math.sin(t / 300);
  c.fillStyle = rgba(C.green, 0.4 + dotP * 0.6);
  c.beginPath(); c.arc(w - px - 8 * S, 92 * S, 7 * S, 0, 7); c.fill();
  setFont(c, 14 * S, 800);
  c.fillStyle = rgba(C.green, 0.95);
  tracked(c, 'SYSTEM ONLINE', w - px - 24 * S, 93 * S, 1.2 * S, 'right');

  /* portfolio card */
  const cardY = 142 * S, cardH = 352 * S;
  roundRect(c, px, cardY, w - px * 2, cardH, 22 * S);
  c.fillStyle = 'rgba(255,255,255,0.045)'; c.fill();
  c.strokeStyle = rgba(C.gold, 0.22); c.lineWidth = 1.2 * S; c.stroke();

  setFont(c, 17 * S, 800);
  c.fillStyle = rgba(C.slate, 0.95);
  tracked(c, 'PORTFOLIO', px + 26 * S, cardY + 40 * S, 2.2 * S);
  setFont(c, 12 * S, 700);
  c.fillStyle = rgba(C.slate, 0.55);
  tracked(c, 'ILLUSTRATIVE', w - px - 26 * S, cardY + 40 * S, 1.2 * S, 'right');

  setFont(c, 54 * S, 900, true);
  c.fillStyle = C.white;
  c.fillText(`$${rollNumber(48250, clamp(t / 2200), {})}`, px + 24 * S, cardY + 104 * S);
  setFont(c, 19 * S, 800);
  c.fillStyle = C.green;
  c.fillText('▲ TRACKED DAILY', px + 24 * S, cardY + 138 * S);

  sparkline(c, px + 24 * S, cardY + 172 * S, w - px * 2 - 48 * S, 140 * S,
    series(46, t, { seed: 2.3 }), clamp((t - 200) / 1500));

  /* live setup alert */
  const aY = cardY + cardH + 30 * S;
  const pop = E.outBack(clamp((t - 900) / 650));
  c.save();
  c.translate(w / 2, aY + 94 * S);
  c.scale(lerp(0.9, 1, clamp(pop)), lerp(0.9, 1, clamp(pop)));
  c.globalAlpha = clamp((t - 900) / 350);
  c.translate(-w / 2, -(aY + 94 * S));
  roundRect(c, px, aY, w - px * 2, 188 * S, 22 * S);
  const ag = c.createLinearGradient(px, aY, w - px, aY + 188 * S);
  ag.addColorStop(0, 'rgba(36,29,8,0.95)');
  ag.addColorStop(1, 'rgba(8,20,11,0.96)');
  c.fillStyle = ag; c.fill();
  c.strokeStyle = rgba(C.gold, 0.6); c.lineWidth = 1.6 * S; c.stroke();
  tag(c, px + 24 * S, aY + 38 * S, 'LIVE SETUP', { size: 16 * S });
  setFont(c, 15 * S, 700, true);
  c.fillStyle = rgba(C.slate, 0.8);
  c.textAlign = 'right';
  c.fillText('2 MIN AGO', w - px - 24 * S, aY + 38 * S);
  c.textAlign = 'left';
  setFont(c, 32 * S, 900, true);
  c.fillStyle = C.white;
  c.fillText('SPY  548C  ·  0DTE', px + 24 * S, aY + 92 * S);
  const legs = [['ENTRY', '2.40', C.white], ['TARGET', '3.60', C.green], ['STOP', '1.80', C.red]];
  legs.forEach(([k, v, col], i) => {
    const lx = px + 24 * S + i * ((w - px * 2 - 48 * S) / 3);
    setFont(c, 14 * S, 800);
    c.fillStyle = rgba(C.slate, 0.8);
    tracked(c, k, lx, aY + 128 * S, 1.6 * S);
    setFont(c, 25 * S, 900, true);
    c.fillStyle = col;
    c.fillText(v, lx, aY + 162 * S);
  });
  c.restore();

  /* lesson progress */
  const lY = aY + 220 * S;
  setFont(c, 16 * S, 800);
  c.fillStyle = rgba(C.slate, 0.9);
  tracked(c, 'LEARNING ENGINE', px, lY, 2.2 * S);
  setFont(c, 25 * S, 800);
  c.fillStyle = C.white;
  c.fillText('Module 03 · Income Strategies', px, lY + 40 * S);
  const barW = w - px * 2;
  roundRect(c, px, lY + 60 * S, barW, 12 * S, 6 * S);
  c.fillStyle = 'rgba(255,255,255,0.1)'; c.fill();
  const prog = 0.34 + 0.3 * clamp((t - 600) / 2400);
  roundRect(c, px, lY + 60 * S, barW * prog, 12 * S, 6 * S);
  const pg = c.createLinearGradient(px, 0, px + barW, 0);
  pg.addColorStop(0, C.goldDk); pg.addColorStop(1, C.goldLt);
  c.fillStyle = pg; c.fill();

  /* key levels — fills the dead space above the tab bar */
  const kY = lY + 110 * S;
  setFont(c, 16 * S, 800);
  c.fillStyle = rgba(C.slate, 0.9);
  tracked(c, "TODAY'S LEVELS", px, kY, 2.2 * S);
  const levels = [
    ['SPY', '547.32', '548.10 R', C.green],
    ['/ES', '5482.25', '5476.00 S', C.cyan],
    ['QQQ', '463.18', '465.40 R', C.green],
  ];
  levels.forEach(([sym, last, lvl, col], i) => {
    const yy = kY + 34 * S + i * 62 * S;
    const e = clamp((t - 1400 - i * 180) / 420);
    if (e <= 0.01) return;
    c.save();
    c.globalAlpha = e;
    roundRect(c, px, yy, w - px * 2, 50 * S, 12 * S);
    c.fillStyle = 'rgba(255,255,255,0.035)'; c.fill();
    setFont(c, 21 * S, 900, true);
    c.fillStyle = rgba(C.white, 0.92);
    c.textBaseline = 'middle';
    c.fillText(sym, px + 18 * S, yy + 25 * S);
    setFont(c, 19 * S, 700, true);
    c.fillStyle = rgba(C.slate, 0.9);
    c.fillText(last, px + 94 * S, yy + 25 * S);
    setFont(c, 16 * S, 800, true);
    c.fillStyle = col;
    c.textAlign = 'right';
    c.fillText(lvl, w - px - 18 * S, yy + 25 * S);
    c.textAlign = 'left';
    c.restore();
  });

  /* tab bar */
  const tabs = ['LEARN', 'TRADE', 'RISK', 'ALERTS'];
  const tabY = h - 62 * S;
  c.fillStyle = 'rgba(2,11,6,0.94)';
  c.fillRect(0, h - 110 * S, w, 110 * S);
  c.fillStyle = 'rgba(255,255,255,0.07)';
  c.fillRect(0, h - 110 * S, w, 1);
  tabs.forEach((tb, i) => {
    const tx = (i + 0.5) * (w / tabs.length);
    const active = i === (Math.floor(t / 1500) % 2 === 0 ? 0 : 3);
    setFont(c, 15 * S, 800);
    c.textAlign = 'center';
    c.fillStyle = active ? C.gold : rgba(C.slate, 0.55);
    c.fillText(tb, tx, tabY);
    c.beginPath();
    c.arc(tx, tabY - 30 * S, 9 * S, 0, 7);
    c.strokeStyle = active ? C.gold : rgba(C.slate, 0.45);
    c.lineWidth = 2 * S; c.stroke();
    c.textAlign = 'left';
  });
  return cv;
}

/* ── Wide dashboard panel ────────────────────────────────────────────────── */
const MODULES = [
  'Markets & Options Basics', 'The Greeks Deep Dive', 'Income Strategies',
  'Advanced Spreads', 'Futures & Index Products', 'Risk Management',
  'Portfolio Construction', 'Trading Psychology',
];

function panelScreen(t, w = 1700, h = 900) {
  const cv = Targets.get('panel', w, h);
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);
  uiChrome(c, w, h);
  c.textAlign = 'left';
  const S = w / 1700;

  /* top bar */
  c.fillStyle = 'rgba(2,11,6,0.75)';
  c.fillRect(0, 0, w, 76 * S);
  c.fillStyle = rgba(C.gold, 0.2);
  c.fillRect(0, 76 * S, w, 1.4 * S);
  logoStamp(c, 30 * S, 17 * S, 42 * S, { radius: 5 * S });
  setFont(c, 23 * S, 900);
  c.fillStyle = C.cream;
  c.textBaseline = 'middle';
  tracked(c, 'OTA OS', 86 * S, 38 * S, 3 * S);
  ['LEARNING', 'TRADE DESK', 'RISK ENGINE', 'PORTFOLIO'].forEach((m, i) => {
    setFont(c, 16 * S, 700);
    c.fillStyle = i === 0 ? C.gold : rgba(C.slate, 0.7);
    tracked(c, m, (260 + i * 196) * S, 38 * S, 2 * S);
  });
  tag(c, w - 230 * S, 38 * S, '● ALL SYSTEMS LIVE', { size: 14 * S, color: C.green });

  /* left — curriculum checklist */
  const lx = 44 * S, ly = 128 * S;
  setFont(c, 18 * S, 800);
  c.fillStyle = rgba(C.gold, 0.95);
  tracked(c, 'SYSTEM MODULES · 8 OF 8 INSTALLED', lx, ly, 2.6 * S);
  MODULES.forEach((m, i) => {
    const yy = ly + 56 * S + i * 76 * S;
    const done = clamp((t - 400 - i * 165) / 420);
    roundRect(c, lx, yy - 26 * S, 530 * S, 60 * S, 12 * S);
    c.fillStyle = done > 0.5 ? 'rgba(212,175,55,0.07)' : 'rgba(255,255,255,0.028)';
    c.fill();
    c.strokeStyle = done > 0.5 ? rgba(C.gold, 0.3) : 'rgba(255,255,255,0.05)';
    c.lineWidth = 1 * S; c.stroke();

    /* tick */
    const cx2 = lx + 34 * S, cy2 = yy + 4 * S, r = 16 * S;
    c.beginPath(); c.arc(cx2, cy2, r, 0, 7);
    c.strokeStyle = done > 0.1 ? C.gold : rgba(C.slate, 0.4);
    c.lineWidth = 2.2 * S; c.stroke();
    if (done > 0.1) {
      c.save();
      c.beginPath();
      c.moveTo(cx2 - r * 0.45, cy2 + r * 0.03);
      c.lineTo(cx2 - r * 0.08, cy2 + r * 0.42);
      c.lineTo(cx2 + r * 0.5, cy2 - r * 0.38);
      c.strokeStyle = C.goldLt; c.lineWidth = 3.4 * S;
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.setLineDash([r * 2.4, r * 2.4]);
      c.lineDashOffset = r * 2.4 * (1 - E.outCubic(done));
      c.stroke();
      c.restore();
    }
    setFont(c, 15 * S, 800, true);
    c.fillStyle = rgba(C.gold, 0.8);
    c.fillText(String(i + 1).padStart(2, '0'), lx + 66 * S, cy2);
    setFont(c, 21 * S, 700);
    c.fillStyle = done > 0.1 ? C.cream : rgba(C.slate, 0.8);
    c.fillText(m, lx + 104 * S, cy2);
  });

  /* right — live alert feed */
  const rx = 640 * S, rw = w - rx - 44 * S;
  setFont(c, 18 * S, 800);
  c.fillStyle = rgba(C.gold, 0.95);
  tracked(c, 'LIVE TRADE DESK', rx, ly, 2.6 * S);
  setFont(c, 14 * S, 700, true);
  c.fillStyle = rgba(C.slate, 0.7);
  c.textAlign = 'right';
  c.fillText('uptime 99.98%  ·  latency 42ms', w - 44 * S, ly);
  c.textAlign = 'left';

  /* chart */
  const chY = ly + 42 * S, chH = 300 * S;
  roundRect(c, rx, chY, rw, chH, 16 * S);
  c.fillStyle = 'rgba(255,255,255,0.03)'; c.fill();
  c.strokeStyle = rgba(C.gold, 0.18); c.lineWidth = 1 * S; c.stroke();
  for (let i = 1; i < 4; i++) {
    c.fillStyle = 'rgba(255,255,255,0.045)';
    c.fillRect(rx + 16 * S, chY + (chH / 4) * i, rw - 32 * S, 1);
  }
  candles2d(c, rx + 24 * S, chY + 24 * S, rw - 48 * S, chH - 48 * S, t, clamp((t - 300) / 1600));
  setFont(c, 17 * S, 800, true);
  c.fillStyle = rgba(C.white, 0.9);
  c.fillText('SPY  ·  5m  ·  547.32', rx + 26 * S, chY + 28 * S);

  /* alert rows */
  const alerts = [
    { s: 'SPY 548C',   k: 'CREDIT SPREAD', r: 'RISK 1.5%',  col: C.gold },
    { s: '/ES 5480',   k: 'LONG · LEVEL',  r: 'RISK 1.0%',  col: C.cyan },
    { s: 'AAPL 210P',  k: 'CASH-SEC. PUT', r: 'RISK 2.0%',  col: C.green },
  ];
  alerts.forEach((a, i) => {
    const yy = chY + chH + 34 * S + i * 104 * S;
    const e = E.outBack(clamp((t - 1000 - i * 230) / 620));
    if (e <= 0.01) return;
    c.save();
    c.globalAlpha = clamp((t - 1000 - i * 230) / 320);
    c.translate(rx + (1 - e) * 120 * S, yy);
    roundRect(c, 0, 0, rw, 84 * S, 14 * S);
    c.fillStyle = 'rgba(255,255,255,0.045)'; c.fill();
    c.strokeStyle = rgba(a.col, 0.4); c.lineWidth = 1.3 * S; c.stroke();
    c.fillStyle = a.col;
    roundRect(c, 0, 0, 5 * S, 84 * S, 3 * S); c.fill();
    setFont(c, 25 * S, 900, true);
    c.fillStyle = C.white;
    c.fillText(a.s, 26 * S, 32 * S);
    setFont(c, 15 * S, 700);
    c.fillStyle = rgba(C.slate, 0.85);
    tracked(c, a.k, 26 * S, 60 * S, 1.8 * S);
    setFont(c, 17 * S, 800, true);
    c.fillStyle = rgba(a.col, 0.95);
    c.textAlign = 'right';
    c.fillText(a.r, rw - 24 * S, 34 * S);
    c.textAlign = 'left';
    c.restore();
  });
  return cv;
}

/* 2D candles for in-UI charts. */
function candles2d(c, x, y, w, h, t, p) {
  const n = 34, cw = w / n;
  const shown = Math.floor(n * clamp(p));
  let prev = 0.5;
  for (let i = 0; i < shown; i++) {
    const o = prev;
    const cl = clamp(o + fbm(i * 0.63 + 11.2, 3) * 0.3, 0.08, 0.92);
    prev = cl;
    const hi = Math.max(o, cl) + Math.abs(noise1(i * 3.1)) * 0.07;
    const lo = Math.min(o, cl) - Math.abs(noise1(i * 7.7)) * 0.07;
    const up = cl >= o;
    const Y = (v) => y + h - v * h;
    const cx = x + i * cw + cw / 2;
    c.strokeStyle = rgba(up ? C.green : C.red, 0.7);
    c.lineWidth = Math.max(1, cw * 0.1);
    c.beginPath(); c.moveTo(cx, Y(hi)); c.lineTo(cx, Y(lo)); c.stroke();
    c.fillStyle = up ? C.green : C.red;
    const by = Y(Math.max(o, cl)), bh = Math.max(1.5, Math.abs(Y(cl) - Y(o)));
    c.fillRect(cx - cw * 0.3, by, cw * 0.6, bh);
  }
}

/* ── Brand mark ──────────────────────────────────────────────────────────────
   The supplied logo, drawn from the outlines traced out of the original file by
   tools/trace-logo.py (verified: no pixel differs from the source by more than
   half a coverage step). Vector paths rather than the 159px bitmap, so the mark
   is pin-sharp at any size — on a full-screen hero or a 40px app header.      */
function drawLogoMark(c, x, y, s, color = LOGO_ART.mark) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.beginPath();
  for (const lp of LOGO_ART.loops) {
    c.moveTo(lp[0][0], lp[0][1]);
    for (let i = 1; i < lp.length; i++) c.lineTo(lp[i][0], lp[i][1]);
    c.closePath();
  }
  c.fillStyle = color;
  c.fill('evenodd');          // the Q's counter is a hole, not a second shape
  c.restore();
}

/* Full logo tile — plate + mark — rendered for texture mapping onto 3D. */
function logoTexture(size = 512, { bg = true, mark = LOGO_ART.mark, plate = LOGO_ART.plate } = {}) {
  const cv = Targets.get(`logo${bg ? '' : '-alpha'}${size}`, size, size);
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, size, size);

  if (bg) {
    c.fillStyle = plate;
    c.fillRect(0, 0, size, size);
    /* Faint top-left sheen so the flat plate still reads as a surface. */
    const g = c.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
  }
  drawLogoMark(c, 0, 0, size, mark);
  return cv;
}

/* Flat 2D stamp of the mark, for screen-space chrome (vertical bars, HUD). */
function logoStamp(c, x, y, s, { plate = LOGO_ART.plate, mark = LOGO_ART.mark, radius = 0 } = {}) {
  c.save();
  if (radius > 0) { roundRect(c, x, y, s, s, radius); c.clip(); }
  c.fillStyle = plate;
  c.fillRect(x, y, s, s);
  drawLogoMark(c, x, y, s, mark);
  c.restore();
}

/* ── Real product screenshots ────────────────────────────────────────────────
   Decoded once, before the film reports itself ready, so the frame-exact
   renderer can never capture a frame with an image still decoding. */
const IMG = {};
function loadShots() {
  return Promise.all(Object.keys(SHOTS).map(k => new Promise(done => {
    const im = new Image();
    im.onload = () => { IMG[k] = im; done(); };
    im.onerror = () => done();          // a missing shot degrades, never hangs
    im.src = SHOTS[k].src;
  })));
}

/* A screenshot in a device-style frame, for the wide shots that do not go on
   the 3D phone. `p` drives a rise-and-settle entrance. */
function shotCard(ctx, x, y, w, img, p, { label = null, radius = 18, glow = 0.5 } = {}) {
  if (!img || p <= 0.004) return 0;
  const e = E.outExpo(clamp(p));
  const h = w * (img.height / img.width);
  const yy = y + (1 - e) * 26;
  ctx.save();
  ctx.globalAlpha = clamp(p * 2);

  roundRect(ctx, x - 10, yy - 10, w + 20, h + 20, radius + 8);
  ctx.fillStyle = 'rgba(6,32,16,0.9)';
  ctx.fill();
  ctx.strokeStyle = rgba(C.gold, 0.45 * glow + 0.15);
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.save();
  roundRect(ctx, x, yy, w, h, radius);
  ctx.clip();
  ctx.drawImage(img, x, yy, w, h);
  ctx.restore();

  if (label) {
    setFont(ctx, 15, 800);
    const tw = trackedWidth(ctx, label, 2) + 26;
    roundRect(ctx, x, yy + h + 14, tw, 32, 16);
    ctx.fillStyle = 'rgba(6,32,16,0.92)';
    ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.4);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = rgba(C.goldLt, 0.95);
    ctx.textBaseline = 'middle';
    tracked(ctx, label, x + 13, yy + h + 30, 2);
  }
  ctx.restore();
  return h;
}
