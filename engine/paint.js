/* ===========================================================================
   RICH GIRL CODE — Content Engine
   paint.js  ·  Canvas renderer
   ---------------------------------------------------------------------------
   ONE painter drives both the storyboard thumbnails and the 1000x1500 export,
   so the storyboard you approve is pixel-for-pixel the thing that gets built.
   All geometry is authored against a 1000x1500 reference and scaled.
   =========================================================================== */
window.RGC = window.RGC || {};
RGC.paint = (function () {

  const REF_W = 1000, REF_H = 1500;
  const FONT = '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", sans-serif';

  /* ---------- small helpers ---------- */
  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrap(ctx, text, maxW) {
    const words = String(text == null ? '' : text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function drawLines(ctx, lines, x, y, lh, max) {
    const use = max ? lines.slice(0, max) : lines;
    use.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
    return y + use.length * lh;
  }
  function arrow(ctx, x1, y1, x2, y2, head) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(a - 0.4), y2 - head * Math.sin(a - 0.4));
    ctx.lineTo(x2 - head * Math.cos(a + 0.4), y2 - head * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
  }

  /* =======================================================================
     MOTIFS — each paints into box {x,y,w,h}. No text: these read at any size.
     ======================================================================= */
  const motifs = {

    /* Covered-call style payoff: rises, then caps at the strike */
    payoff(ctx, b, t, s) {
      const base = b.y + b.h * 0.78, left = b.x + b.w * 0.08, right = b.x + b.w * 0.95;
      const knee = b.x + b.w * 0.58, top = b.y + b.h * 0.22;
      ctx.strokeStyle = hexA(t.sub, 0.45); ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(left, base); ctx.lineTo(right, base); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left, b.y + b.h * 0.08); ctx.lineTo(left, base + 14 * s); ctx.stroke();
      // shaded profit region
      ctx.beginPath();
      ctx.moveTo(left, base); ctx.lineTo(knee, top); ctx.lineTo(right, top);
      ctx.lineTo(right, base); ctx.closePath();
      ctx.fillStyle = hexA(t.accent, 0.13); ctx.fill();
      // the payoff line
      ctx.strokeStyle = t.accent; ctx.lineWidth = 7 * s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(left, base); ctx.lineTo(knee, top); ctx.lineTo(right, top); ctx.stroke();
      // strike marker
      ctx.setLineDash([6 * s, 8 * s]); ctx.strokeStyle = hexA(t.accent2, 0.6); ctx.lineWidth = 2.5 * s;
      ctx.beginPath(); ctx.moveTo(knee, top); ctx.lineTo(knee, base); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = t.accent2;
      ctx.beginPath(); ctx.arc(knee, top, 11 * s, 0, 7); ctx.fill();
      ctx.fillStyle = t.bg[0];
      ctx.beginPath(); ctx.arc(knee, top, 4.5 * s, 0, 7); ctx.fill();
    },

    /* Time decay: curve falling to zero over shrinking bars */
    decay(ctx, b, t, s) {
      const base = b.y + b.h * 0.76, left = b.x + b.w * 0.08, right = b.x + b.w * 0.95;
      ctx.strokeStyle = hexA(t.sub, 0.45); ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(left, base); ctx.lineTo(right, base); ctx.stroke();
      const n = 9, bw = (right - left) / n * 0.56;
      for (let i = 0; i < n; i++) {
        const f = 1 - i / (n - 1);
        const h = Math.pow(f, 2.1) * b.h * 0.52 + 3 * s;
        const x = left + (right - left) * (i / n) + bw * 0.3;
        ctx.fillStyle = hexA(t.accent, 0.18 + 0.5 * f);
        roundRect(ctx, x, base - h, bw, h, 3 * s); ctx.fill();
      }
      ctx.strokeStyle = t.accent; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const p = i / 60, x = left + (right - left) * p;
        const y = base - Math.pow(1 - p, 2.1) * b.h * 0.58;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    },

    /* Ascending steps */
    ladder(ctx, b, t, s) {
      const n = 4, pad = b.w * 0.06, w = (b.w - pad * 2) / n, base = b.y + b.h * 0.9;
      for (let i = 0; i < n; i++) {
        const h = b.h * (0.2 + 0.19 * i);
        const x = b.x + pad + i * w;
        ctx.fillStyle = hexA(t.accent, 0.16 + 0.2 * i);
        roundRect(ctx, x + w * 0.1, base - h, w * 0.8, h, 8 * s); ctx.fill();
        ctx.strokeStyle = hexA(t.accent, 0.5 + 0.12 * i); ctx.lineWidth = 2.5 * s;
        roundRect(ctx, x + w * 0.1, base - h, w * 0.8, h, 8 * s); ctx.stroke();
      }
      ctx.strokeStyle = t.accent2; ctx.fillStyle = t.accent2; ctx.lineWidth = 5 * s;
      arrow(ctx, b.x + pad + w * 0.3, base - b.h * 0.26,
            b.x + pad + 3.6 * w, base - b.h * 0.86, 18 * s);
    },

    /* Semicircular gauge */
    dial(ctx, b, t, s) {
      const cx = b.x + b.w / 2, cy = b.y + b.h * 0.76, r = Math.min(b.w * 0.36, b.h * 0.62);
      ctx.lineCap = 'butt';
      ctx.strokeStyle = hexA(t.sub, 0.25); ctx.lineWidth = 26 * s;
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = t.accent; ctx.lineWidth = 26 * s;
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * 0.4); ctx.stroke();
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI + Math.PI * (i / 10);
        const r1 = r + 20 * s, r2 = r + (i % 5 === 0 ? 34 : 28) * s;
        ctx.strokeStyle = hexA(t.sub, i % 5 === 0 ? 0.8 : 0.4); ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
      }
      const na = Math.PI + Math.PI * 0.4;
      ctx.strokeStyle = t.ink; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(na) * r * 0.88, cy + Math.sin(na) * r * 0.88); ctx.stroke();
      ctx.fillStyle = t.accent2;
      ctx.beginPath(); ctx.arc(cx, cy, 15 * s, 0, 7); ctx.fill();
    },

    /* Iron condor P/L: flat top in the middle, wings down and flat */
    condor(ctx, b, t, s) {
      const left = b.x + b.w * 0.05, right = b.x + b.w * 0.95;
      const zero = b.y + b.h * 0.62, top = b.y + b.h * 0.3, bot = b.y + b.h * 0.86;
      const x1 = left + (right - left) * 0.16, x2 = left + (right - left) * 0.34;
      const x3 = left + (right - left) * 0.66, x4 = left + (right - left) * 0.84;
      ctx.setLineDash([5 * s, 7 * s]); ctx.strokeStyle = hexA(t.sub, 0.5); ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(left, zero); ctx.lineTo(right, zero); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(x2, top); ctx.lineTo(x3, top); ctx.lineTo(x3, zero); ctx.lineTo(x2, zero);
      ctx.closePath(); ctx.fillStyle = hexA(t.pos, 0.16); ctx.fill();
      [[left, x1], [x4, right]].forEach(([a, c]) => {
        ctx.beginPath(); ctx.moveTo(a, zero); ctx.lineTo(c, zero); ctx.lineTo(c, bot); ctx.lineTo(a, bot);
        ctx.closePath(); ctx.fillStyle = hexA(t.neg, 0.14); ctx.fill();
      });
      ctx.strokeStyle = t.accent; ctx.lineWidth = 7 * s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(left, bot); ctx.lineTo(x1, bot); ctx.lineTo(x2, top);
      ctx.lineTo(x3, top); ctx.lineTo(x4, bot); ctx.lineTo(right, bot);
      ctx.stroke();
      [[x1, bot], [x2, top], [x3, top], [x4, bot]].forEach(([x, y]) => {
        ctx.fillStyle = t.accent2; ctx.beginPath(); ctx.arc(x, y, 8 * s, 0, 7); ctx.fill();
      });
    },

    /* IV crush: tall bar collapsing to short bar */
    crush(ctx, b, t, s) {
      const base = b.y + b.h * 0.88, bw = b.w * 0.2;
      const x1 = b.x + b.w * 0.14, x2 = b.x + b.w * 0.66;
      const h1 = b.h * 0.74, h2 = b.h * 0.22;
      ctx.fillStyle = hexA(t.accent, 0.3); roundRect(ctx, x1, base - h1, bw, h1, 8 * s); ctx.fill();
      ctx.strokeStyle = t.accent; ctx.lineWidth = 3 * s;
      roundRect(ctx, x1, base - h1, bw, h1, 8 * s); ctx.stroke();
      ctx.fillStyle = hexA(t.neg, 0.3); roundRect(ctx, x2, base - h2, bw, h2, 8 * s); ctx.fill();
      ctx.strokeStyle = t.neg; ctx.lineWidth = 3 * s;
      roundRect(ctx, x2, base - h2, bw, h2, 8 * s); ctx.stroke();
      ctx.strokeStyle = hexA(t.ink, 0.75); ctx.fillStyle = hexA(t.ink, 0.75); ctx.lineWidth = 5 * s;
      arrow(ctx, x1 + bw + b.w * 0.06, base - h1 * 0.75,
            x2 - b.w * 0.05, base - h2 - b.h * 0.1, 18 * s);
      ctx.strokeStyle = hexA(t.sub, 0.45); ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(b.x + b.w * 0.06, base); ctx.lineTo(b.x + b.w * 0.94, base); ctx.stroke();
    },

    /* 4x4 grid, one cell live */
    grid(ctx, b, t, s) {
      const n = 4, side = Math.min(b.w, b.h) * 0.86;
      const ox = b.x + (b.w - side) / 2, oy = b.y + (b.h - side) / 2, c = side / n;
      for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) {
        const live = (r === 1 && k === 2);
        ctx.fillStyle = live ? hexA(t.accent, 0.85) : hexA(t.sub, 0.09);
        roundRect(ctx, ox + k * c + c * 0.07, oy + r * c + c * 0.07, c * 0.86, c * 0.86, 6 * s); ctx.fill();
        ctx.strokeStyle = live ? t.accent2 : hexA(t.sub, 0.22); ctx.lineWidth = live ? 3.5 * s : 1.5 * s;
        roundRect(ctx, ox + k * c + c * 0.07, oy + r * c + c * 0.07, c * 0.86, c * 0.86, 6 * s); ctx.stroke();
      }
    },

    /* Left-to-right flow of nodes */
    chain(ctx, b, t, s) {
      const n = 4, cy = b.y + b.h / 2, r = Math.min(b.w / (n * 3.1), b.h * 0.2);
      const gap = (b.w - r * 2 * n) / (n - 1 + 0.6);
      let x = b.x + r + gap * 0.3;
      const pts = [];
      for (let i = 0; i < n; i++) { pts.push(x); x += r * 2 + gap; }
      for (let i = 0; i < n - 1; i++) {
        ctx.strokeStyle = hexA(t.accent, 0.5); ctx.fillStyle = hexA(t.accent, 0.5); ctx.lineWidth = 4 * s;
        arrow(ctx, pts[i] + r + 8 * s, cy, pts[i + 1] - r - 10 * s, cy, 14 * s);
      }
      pts.forEach((px, i) => {
        ctx.fillStyle = hexA(t.accent, 0.14 + i * 0.14);
        ctx.beginPath(); ctx.arc(px, cy, r, 0, 7); ctx.fill();
        ctx.strokeStyle = t.accent; ctx.lineWidth = 3.5 * s;
        ctx.beginPath(); ctx.arc(px, cy, r, 0, 7); ctx.stroke();
        ctx.fillStyle = t.accent2;
        ctx.beginPath(); ctx.arc(px, cy, r * 0.3, 0, 7); ctx.fill();
      });
    },

    /* Closed loop of 3 nodes — the wheel */
    cycle(ctx, b, t, s) {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const R = Math.min(b.w, b.h) * 0.34, r = R * 0.3;
      ctx.strokeStyle = hexA(t.accent, 0.3); ctx.lineWidth = 5 * s;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / 3 + 0.42;
        const a1 = a0 + (2 * Math.PI) / 3 - 0.84;
        ctx.strokeStyle = t.accent; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
        const ex = cx + Math.cos(a1) * R, ey = cy + Math.sin(a1) * R;
        const tx = ex - Math.sin(a1) * 1, ty = ey + Math.cos(a1) * 1;
        ctx.fillStyle = t.accent;
        const ang = Math.atan2(ty - ey, tx - ex) + Math.PI / 2;
        ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-9 * s, -16 * s); ctx.lineTo(9 * s, -16 * s);
        ctx.closePath(); ctx.fill(); ctx.restore();
      }
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
        const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
        ctx.fillStyle = t.bg[1];
        ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
        ctx.fillStyle = hexA(t.accent, 0.2);
        ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
        ctx.strokeStyle = t.accent2; ctx.lineWidth = 4 * s;
        ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.stroke();
        ctx.fillStyle = t.accent2; ctx.font = `800 ${Math.round(r * 0.9)}px ${FONT}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), px, py + r * 0.04);
      }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },

    /* Exponential growth with shaded area */
    curve(ctx, b, t, s) {
      const base = b.y + b.h * 0.84, left = b.x + b.w * 0.08, right = b.x + b.w * 0.95;
      ctx.strokeStyle = hexA(t.sub, 0.45); ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(left, base); ctx.lineTo(right, base); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left, b.y + b.h * 0.05); ctx.lineTo(left, base + 14 * s); ctx.stroke();
      const pt = p => [left + (right - left) * p, base - Math.pow(p, 2.6) * b.h * 0.76];
      ctx.beginPath(); ctx.moveTo(left, base);
      for (let i = 0; i <= 60; i++) { const [x, y] = pt(i / 60); ctx.lineTo(x, y); }
      ctx.lineTo(right, base); ctx.closePath();
      ctx.fillStyle = hexA(t.accent, 0.14); ctx.fill();
      ctx.strokeStyle = t.accent; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const [x, y] = pt(i / 60); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      const [kx, ky] = pt(0.62);
      ctx.setLineDash([5 * s, 7 * s]); ctx.strokeStyle = hexA(t.accent2, 0.55); ctx.lineWidth = 2.5 * s;
      ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx, base); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = t.accent2; ctx.beginPath(); ctx.arc(kx, ky, 10 * s, 0, 7); ctx.fill();
    },

    /* Two opposed panels */
    split(ctx, b, t, s) {
      const gap = b.w * 0.05, w = (b.w - gap) / 2, h = b.h * 0.8, y = b.y + b.h * 0.1;
      ctx.fillStyle = hexA(t.neg, 0.12); roundRect(ctx, b.x, y, w, h, 14 * s); ctx.fill();
      ctx.strokeStyle = hexA(t.neg, 0.55); ctx.lineWidth = 3 * s;
      roundRect(ctx, b.x, y, w, h, 14 * s); ctx.stroke();
      ctx.fillStyle = hexA(t.pos, 0.12); roundRect(ctx, b.x + w + gap, y, w, h, 14 * s); ctx.fill();
      ctx.strokeStyle = hexA(t.pos, 0.6); ctx.lineWidth = 3 * s;
      roundRect(ctx, b.x + w + gap, y, w, h, 14 * s); ctx.stroke();
      const cy = y + h / 2;
      ctx.strokeStyle = hexA(t.neg, 0.8); ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
      const cxl = b.x + w / 2, m = Math.min(w, h) * 0.17;
      ctx.beginPath();
      ctx.moveTo(cxl - m, cy - m); ctx.lineTo(cxl + m, cy + m);
      ctx.moveTo(cxl + m, cy - m); ctx.lineTo(cxl - m, cy + m); ctx.stroke();
      const cxr = b.x + w + gap + w / 2;
      ctx.strokeStyle = hexA(t.pos, 0.9); ctx.lineWidth = 7 * s;
      ctx.beginPath();
      ctx.moveTo(cxr - m, cy); ctx.lineTo(cxr - m * 0.2, cy + m * 0.8); ctx.lineTo(cxr + m, cy - m * 0.7);
      ctx.stroke();
    },

    /* Stacked bars, widest at the bottom */
    stack(ctx, b, t, s) {
      const n = 4, bh = b.h * 0.15, gap = b.h * 0.05;
      const totalH = n * bh + (n - 1) * gap, oy = b.y + (b.h - totalH) / 2;
      for (let i = 0; i < n; i++) {
        const f = (n - i) / n, w = b.w * (0.34 + 0.62 * f);
        const x = b.x + (b.w - w) / 2, y = oy + i * (bh + gap);
        ctx.fillStyle = hexA(t.accent, 0.5 - i * 0.09);
        roundRect(ctx, x, y, w, bh, 7 * s); ctx.fill();
        ctx.strokeStyle = hexA(t.accent, 0.85 - i * 0.14); ctx.lineWidth = 2.5 * s;
        roundRect(ctx, x, y, w, bh, 7 * s); ctx.stroke();
      }
    },

    /* Oversized quote mark between rules */
    quote(ctx, b, t, s) {
      const cx = b.x + b.w / 2, cy = b.y + b.h * 0.52;
      ctx.fillStyle = hexA(t.accent, 0.9);
      ctx.font = `800 ${Math.round(b.h * 0.72)}px Georgia, "Times New Roman", serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('“', cx, cy);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.strokeStyle = hexA(t.accent, 0.4); ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.2, b.y + b.h * 0.95); ctx.lineTo(b.x + b.w * 0.8, b.y + b.h * 0.95);
      ctx.stroke();
    },

    /* Brand seal — used on CTA slides */
    mark(ctx, b, t, s) {
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const R = Math.min(b.w, b.h) * 0.36;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const r1 = R * 1.16, r2 = R * (i % 4 === 0 ? 1.3 : 1.23);
        ctx.strokeStyle = hexA(t.accent, i % 4 === 0 ? 0.75 : 0.3);
        ctx.lineWidth = 2.5 * s;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
      }
      ctx.strokeStyle = hexA(t.accent, 0.9); ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ctx.strokeStyle = hexA(t.accent, 0.35); ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, 7); ctx.stroke();
      ctx.fillStyle = hexA(t.accent, 0.08);
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, 7); ctx.fill();
      ctx.fillStyle = t.accent2;
      ctx.font = `800 ${Math.round(R * 0.62)}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('RGC', cx, cy + R * 0.02);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },

    /* Four ticked rows */
    checklist(ctx, b, t, s) {
      const n = 4, rh = b.h / n;
      for (let i = 0; i < n; i++) {
        const y = b.y + i * rh + rh / 2, r = rh * 0.26, x = b.x + b.w * 0.08;
        ctx.fillStyle = hexA(t.accent, 0.16);
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        ctx.strokeStyle = t.accent; ctx.lineWidth = 3 * s;
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
        ctx.strokeStyle = t.accent2; ctx.lineWidth = 4.5 * s; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - r * 0.45, y); ctx.lineTo(x - r * 0.08, y + r * 0.4); ctx.lineTo(x + r * 0.5, y - r * 0.38);
        ctx.stroke();
        const lw = b.w * (0.62 - i * 0.07);
        ctx.fillStyle = hexA(t.sub, 0.3);
        roundRect(ctx, x + r * 1.9, y - rh * 0.1, lw, rh * 0.2, rh * 0.1); ctx.fill();
      }
    }
  };

  /* =======================================================================
     SLIDE — background, chrome, headline, motif, body, footer
     ======================================================================= */
  function slide(ctx, sl, theme, W, H) {
    const t = theme, s = W / REF_W, sy = H / REF_H;
    const px = v => v * s;          // x / size scale
    const py = v => v * sy;         // y scale

    /* background */
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
    g.addColorStop(0, t.bg[0]); g.addColorStop(1, t.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* faint rule grid */
    ctx.strokeStyle = t.grid; ctx.lineWidth = Math.max(1, px(1.5));
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo((W / 6) * i, 0); ctx.lineTo((W / 6) * i, H); ctx.stroke();
    }
    for (let i = 1; i < 9; i++) {
      ctx.beginPath(); ctx.moveTo(0, (H / 9) * i); ctx.lineTo(W, (H / 9) * i); ctx.stroke();
    }

    /* accent glow */
    const rg = ctx.createRadialGradient(W * 0.82, H * 0.14, 0, W * 0.82, H * 0.14, W * 0.75);
    rg.addColorStop(0, hexA(t.accent, 0.17)); rg.addColorStop(1, hexA(t.accent, 0));
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

    /* top accent bar */
    ctx.fillStyle = t.accent; ctx.fillRect(0, 0, W, Math.max(2, py(8)));

    const M = px(78);              // side margin
    const maxW = W - M * 2;

    /* kicker + counter */
    ctx.font = `800 ${Math.round(px(25))}px ${FONT}`;
    ctx.fillStyle = t.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const kick = String(sl.kicker || '').toUpperCase();
    ctx.fillText(spaced(kick), M, py(112));
    ctx.textAlign = 'right';
    ctx.fillStyle = hexA(t.sub, 0.85);
    ctx.font = `700 ${Math.round(px(25))}px ${FONT}`;
    ctx.fillText(`${pad2(sl.idx + 1)} / ${pad2(sl.total)}`, W - M, py(112));
    ctx.textAlign = 'left';

    /* headline */
    const isHook = sl.role === 'hook';
    const hSize = isHook ? px(84) : px(62);
    const hLh = isHook ? py(98) : py(76);
    const hMax = isHook ? 5 : 3;
    ctx.font = `800 ${Math.round(hSize)}px ${FONT}`;
    ctx.fillStyle = t.ink;
    const hLines = wrap(ctx, sl.headline, maxW);
    let y = py(isHook ? 250 : 215);
    const hEnd = drawLines(ctx, hLines, M, y, hLh, hMax);

    /* rule under headline */
    ctx.strokeStyle = hexA(t.accent, 0.55); ctx.lineWidth = px(5); ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(M, hEnd + py(26)); ctx.lineTo(M + px(132), hEnd + py(26)); ctx.stroke();

    /* body text, measured first so the motif gets the remainder */
    ctx.font = `400 ${Math.round(px(33))}px ${FONT}`;
    const bLines = sl.body ? wrap(ctx, sl.body, maxW) : [];
    const bMax = 5, bLh = py(48);
    const bodyH = Math.min(bLines.length, bMax) * bLh;
    const footTop = H - py(132);
    const bodyTop = footTop - py(34) - bodyH;

    /* motif between rule and body */
    const motifTop = hEnd + py(66);
    const motifH = bodyTop - py(44) - motifTop;
    if (motifH > py(120)) {
      const fn = motifs[sl.motif] || motifs.quote;
      ctx.save();
      fn(ctx, { x: M, y: motifTop, w: maxW, h: motifH }, t, s);
      ctx.restore();
    }

    /* body */
    if (bLines.length) {
      ctx.font = `400 ${Math.round(px(33))}px ${FONT}`;
      ctx.fillStyle = hexA(t.ink, 0.82);
      drawLines(ctx, bLines, M, bodyTop + py(33), bLh, bMax);
    }

    /* footer */
    ctx.strokeStyle = hexA(t.sub, 0.22); ctx.lineWidth = px(2);
    ctx.beginPath(); ctx.moveTo(M, footTop); ctx.lineTo(W - M, footTop); ctx.stroke();
    ctx.font = `800 ${Math.round(px(24))}px ${FONT}`;
    ctx.fillStyle = hexA(t.ink, 0.9);
    ctx.fillText(spaced('RICH GIRL CODE'), M, footTop + py(46));
    ctx.font = `400 ${Math.round(px(22))}px ${FONT}`;
    ctx.fillStyle = hexA(t.sub, 0.9);
    ctx.fillText('@richgirlcode', M, footTop + py(82));
    if (sl.footer) {
      ctx.textAlign = 'right';
      ctx.font = `400 ${Math.round(px(19))}px ${FONT}`;
      ctx.fillStyle = hexA(t.sub, 0.75);
      wrap(ctx, sl.footer, maxW * 0.5).slice(0, 2)
        .forEach((l, i) => ctx.fillText(l, W - M, footTop + py(46 + i * 28)));
      ctx.textAlign = 'left';
    }
  }

  function spaced(s) { return String(s).split('').join(' '); }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  return { slide, motifs, REF_W, REF_H, FONT, hexA, roundRect, wrap, motifNames: Object.keys(motifs) };
})();
