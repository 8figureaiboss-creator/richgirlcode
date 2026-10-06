/* ============================================================================
   fx.js — post-processing stack + reusable motion-graphics widgets.
   The post chain is the thing that makes a canvas look like film rather than
   like a canvas: bloom → aberration → grain → vignette → grade → letterbox.
   ========================================================================== */

const FX = {
  _grain: null,
  _vign: null,

  initGrain(size = 256, tiles = 4) {
    if (FX._grain) return;
    FX._grain = [];
    for (let k = 0; k < tiles; k++) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = size;
      const c = cv.getContext('2d');
      const img = c.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 128 + (Math.random() - 0.5) * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      c.putImageData(img, 0, 0);
      FX._grain.push(cv);
    }
  },

  grain(ctx, W, H, frame, amount = 0.055) {
    if (!FX._grain || amount <= 0) return;
    const tile = FX._grain[frame % FX._grain.length];
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = amount;
    const s = 2.2;
    const ox = (frame * 37) % tile.width;
    const oy = (frame * 61) % tile.height;
    ctx.translate(-ox * s, -oy * s);
    for (let y = 0; y < H + tile.height * s; y += tile.height * s) {
      for (let x = 0; x < W + tile.width * s; x += tile.width * s) {
        ctx.drawImage(tile, x, y, tile.width * s, tile.height * s);
      }
    }
    ctx.restore();
  },

  bloom(ctx, src, work, amount = 0.42, blur = 9) {
    if (amount <= 0.002) return;
    const wctx = work.getContext('2d');
    wctx.setTransform(1, 0, 0, 1, 0, 0);
    wctx.clearRect(0, 0, work.width, work.height);
    /* The high contrast curve is what turns a blur into a bloom: it crushes
       mid-tones so only genuine highlights bleed. */
    wctx.filter = `blur(${blur}px) brightness(1.05) contrast(2.1) saturate(1.2)`;
    wctx.drawImage(src, 0, 0, work.width, work.height);
    wctx.filter = 'none';

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = amount;
    ctx.drawImage(work, 0, 0, src.width, src.height);
    ctx.restore();
  },

  /* RGB split — only worth spending frames on at hard cuts and impacts. */
  aberration(ctx, src, copy, px) {
    if (px < 0.25) return;
    const cctx = copy.getContext('2d');
    cctx.setTransform(1, 0, 0, 1, 0, 0);
    cctx.clearRect(0, 0, copy.width, copy.height);
    cctx.drawImage(src, 0, 0);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(copy, -px, 0);
    ctx.drawImage(copy,  px, 0);
    ctx.restore();
  },

  vignette(ctx, W, H, strength = 0.78) {
    if (!FX._vign || FX._vign.w !== W || FX._vign.h !== H) {
      const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.18, W / 2, H * 0.5, H * 0.95);
      g.addColorStop(0,    'rgba(0,0,0,0)');
      g.addColorStop(0.55, 'rgba(0,0,0,0.10)');
      g.addColorStop(0.82, 'rgba(0,0,0,0.46)');
      g.addColorStop(1,    'rgba(0,0,0,0.92)');
      FX._vign = { w: W, h: H, g };
    }
    ctx.save();
    ctx.globalAlpha = strength;
    ctx.fillStyle = FX._vign.g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  },

  scanlines(ctx, W, H, alpha = 0.055, gap = 3) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    for (let y = 0; y < H; y += gap) ctx.fillRect(0, y, W, 1);
    ctx.restore();
  },

  letterbox(ctx, W, H, bar = 0) {
    if (bar <= 0) return;
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.restore();
  },

  flash(ctx, W, H, a, color = '#FFF6DF') {
    if (a <= 0.002) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = clamp(a);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  },

  /* Anamorphic-ish flare: horizontal streak + a couple of ghosts. */
  lensFlare(ctx, x, y, intensity = 1, W = 1920) {
    if (intensity <= 0.004) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const streak = ctx.createLinearGradient(x - W * 0.5, y, x + W * 0.5, y);
    streak.addColorStop(0,    'rgba(212,175,55,0)');
    streak.addColorStop(0.42, rgba(C.goldLt, 0.1 * intensity));
    streak.addColorStop(0.5,  rgba('#FFFFFF', 0.5 * intensity));
    streak.addColorStop(0.58, rgba(C.goldLt, 0.1 * intensity));
    streak.addColorStop(1,    'rgba(212,175,55,0)');
    ctx.fillStyle = streak;
    ctx.fillRect(x - W * 0.5, y - 2.5 * intensity - 1, W, 5 * intensity + 2);

    const core = ctx.createRadialGradient(x, y, 0, x, y, 190 * intensity);
    core.addColorStop(0,   rgba('#FFFFFF', 0.72 * intensity));
    core.addColorStop(0.2, rgba(C.goldLt, 0.3 * intensity));
    core.addColorStop(1,   'rgba(212,175,55,0)');
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(x, y, 190 * intensity, 0, 7); ctx.fill();

    ctx.globalAlpha = 0.3 * intensity;
    for (const [d, r, col] of [[0.3, 26, C.cyan], [-0.46, 40, C.gold], [0.72, 17, '#FF9E5E']]) {
      const gx = x + (W / 2 - x) * d * -1.3;
      const gy = y + (0 - y) * d * 0.1;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, rgba(col, 0.5)); g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, 7); ctx.fill();
    }
    ctx.restore();
  },

  /* Directional scrim — the single most useful tool for keeping headline type
     legible over a busy 3D plate. */
  scrim(ctx, W, H, side = 'left', strength = 0.8, extent = 0.56) {
    if (strength <= 0.004) return;
    const g = ctx.createLinearGradient(
      side === 'right' ? W : 0, side === 'bottom' ? H : 0,
      side === 'left' ? W * extent : side === 'right' ? W * (1 - extent) : 0,
      side === 'top' ? H * extent : side === 'bottom' ? H * (1 - extent) : 0);
    g.addColorStop(0,    `rgba(2,9,5,${0.94 * strength})`);
    g.addColorStop(0.45, `rgba(2,9,5,${0.66 * strength})`);
    g.addColorStop(1,    'rgba(2,9,5,0)');
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  },

  /* Diagonal specular sweep across a rect — the "polished metal" tell. */
  sweep(ctx, x, y, w, h, p, { width = 0.22, alpha = 0.5, angle = -0.35 } = {}) {
    if (p <= 0 || p >= 1) return;
    ctx.save();
    roundRect(ctx, x, y, w, h, 0);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(angle);
    const span = (w + h) * 1.3;
    const cx = -span / 2 + span * p;
    const g = ctx.createLinearGradient(cx - span * width, 0, cx + span * width, 0);
    g.addColorStop(0,   'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,248,224,${alpha})`);
    g.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-span, -span, span * 2, span * 2);
    ctx.restore();
  },

  /* Animated HUD brackets. */
  brackets(ctx, x, y, w, h, p, { color = C.gold, len = 36, lw = 2.5 } = {}) {
    const e = E.outExpo(clamp(p)), L = len * e;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.globalAlpha = clamp(p * 2);
    ctx.lineCap = 'square';
    const corner = (cx, cy, sx, sy) => {
      ctx.beginPath();
      ctx.moveTo(cx + sx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * L);
      ctx.stroke();
    };
    corner(x, y, 1, 1); corner(x + w, y, -1, 1);
    corner(x, y + h, 1, -1); corner(x + w, y + h, -1, -1);
    ctx.restore();
  },

  /* Scrolling market strip. Deterministic from `t`. */
  ticker(ctx, y, t, W, items, { size = 19, speed = 62, alpha = 1 } = {}) {
    setFont(ctx, size, 700, true);
    const pad = 54;
    const widths = items.map(it => ctx.measureText(`${it.s}  ${it.d}  ${it.p}`).width + pad);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = -((t / 1000 * speed) % total);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textBaseline = 'middle';
    while (x < W + 60) {
      for (let i = 0; i < items.length && x < W + 60; i++) {
        const it = items[i];
        if (x > -widths[i]) {
          ctx.fillStyle = rgba(C.white, 0.9);
          ctx.fillText(it.s, x, y);
          const w1 = ctx.measureText(it.s).width;
          ctx.fillStyle = it.up ? C.green : C.red;
          ctx.fillText(it.d, x + w1 + 14, y);
          const w2 = ctx.measureText(it.d).width;
          ctx.fillStyle = rgba(C.slate, 0.85);
          ctx.fillText(it.p, x + w1 + w2 + 28, y);
        }
        x += widths[i];
      }
    }
    ctx.restore();
  },

  /* Small uppercase eyebrow label with a leading rule. */
  eyebrow(ctx, x, y, text, p, { color = C.gold, size = 17 } = {}) {
    const e = E.outExpo(clamp(p));
    ctx.save();
    ctx.globalAlpha = clamp(p * 2);
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40 * e, y); ctx.stroke();
    setFont(ctx, size, 800);
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.save();
    ctx.beginPath(); ctx.rect(x + 54, y - size, trackedWidth(ctx, text, 3.4) * e + 4, size * 2); ctx.clip();
    tracked(ctx, text, x + 54, y, 3.4);
    ctx.restore();
    ctx.restore();
  },

  /* Glass card with gold hairline — the UI substrate used in scenes 4-7. */
  card(ctx, x, y, w, h, p, { r = 16, glow = 0.5, fill = 0.72 } = {}) {
    const e = E.outExpo(clamp(p));
    const hh = h * e, yy = y + (h - hh) / 2;
    ctx.save();
    ctx.globalAlpha = clamp(p * 2.2);
    roundRect(ctx, x, yy, w, hh, r);
    const g = ctx.createLinearGradient(x, yy, x + w * 0.4, yy + hh);
    g.addColorStop(0, `rgba(10,42,23,${fill})`);
    g.addColorStop(1, `rgba(3,16,9,${fill})`);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(C.gold, 0.32 * glow + 0.1);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
    return { x, y: yy, w, h: hh };
  },
};

/* ── Particle field ──────────────────────────────────────────────────────────
   Stateless: every particle's position is a closed-form function of t and its
   index, so any frame can be rendered in isolation.                          */
function dustField(ctx, t, W, H, n = 90, { speed = 26, alpha = 0.5, size = 2.4 } = {}) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const seed = i * 1.7137;
    const depth = 0.35 + hash(i * 3.1) * 0.65;
    const x = ((hash(seed) * W + t / 1000 * speed * depth) % (W + 120)) - 60;
    const y = (hash(seed + 9.1) * H + Math.sin(t / 1600 + i) * 18) % H;
    const r = size * depth;
    ctx.globalAlpha = alpha * depth * (0.45 + 0.55 * Math.sin(t / 700 + i * 2.1) ** 2);
    ctx.fillStyle = i % 7 === 0 ? C.goldLt : '#9FB4D8';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  ctx.restore();
}
