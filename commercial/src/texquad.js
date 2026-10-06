/* ============================================================================
   texquad.js — perspective-correct texture mapping on a 2D canvas.
   Canvas2D only gives affine transforms, so a textured quad is subdivided in
   WORLD space and each sub-triangle is drawn with its own affine map. Because
   the subdivision happens before projection, the result is exactly correct
   rather than approximated — this is what puts a live app UI on the 3D phone.
   ========================================================================== */

/* corners: [p00, p10, p11, p01] in world space (UV order: 0,0 → 1,0 → 1,1 → 0,1) */
function texQuad3D(ctx, tex, cam, W, H, corners, n = 7, alpha = 1) {
  const { viewProj } = cam.matrices(W / H);
  const hw = W / 2, hh = H / 2;
  const grid = [];

  for (let j = 0; j <= n; j++) {
    const v = j / n;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      /* Bilinear in world space — planar quad, so this is the true surface. */
      const top = V3.lerp(corners[0], corners[1], u);
      const bot = V3.lerp(corners[3], corners[2], u);
      const wp  = V3.lerp(top, bot, v);
      const c = M4.xform(viewProj, wp);
      if (c[3] <= 0.0001) { grid.push(null); continue; }
      const iw = 1 / c[3];
      grid.push([hw + c[0] * iw * hw, hh - c[1] * iw * hh]);
    }
  }

  const tw = tex.width, th = tex.height;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const a = grid[j * (n + 1) + i];
      const b = grid[j * (n + 1) + i + 1];
      const c = grid[(j + 1) * (n + 1) + i + 1];
      const d = grid[(j + 1) * (n + 1) + i];
      if (!a || !b || !c || !d) continue;
      const u0 = i / n * tw, u1 = (i + 1) / n * tw;
      const v0 = j / n * th, v1 = (j + 1) / n * th;
      affineTri(ctx, tex, a, b, c, [u0, v0], [u1, v0], [u1, v1]);
      affineTri(ctx, tex, a, c, d, [u0, v0], [u1, v1], [u0, v1]);
    }
  }
  ctx.restore();
}

/* Screen-space triangle filled with a texture triangle. The clip path is
   inflated ~0.6px from the centroid so neighbouring cells do not seam. */
function affineTri(ctx, img, p0, p1, p2, t0, t1, t2) {
  const cx = (p0[0] + p1[0] + p2[0]) / 3, cy = (p0[1] + p1[1] + p2[1]) / 3;
  const push = (p) => {
    const dx = p[0] - cx, dy = p[1] - cy;
    const l = Math.hypot(dx, dy) || 1;
    return [p[0] + dx / l * 0.7, p[1] + dy / l * 0.7];
  };
  const q0 = push(p0), q1 = push(p1), q2 = push(p2);

  const du1 = t1[0] - t0[0], dv1 = t1[1] - t0[1];
  const du2 = t2[0] - t0[0], dv2 = t2[1] - t0[1];
  const det = du1 * dv2 - du2 * dv1;
  if (Math.abs(det) < 1e-9) return;

  const A = ((p1[0] - p0[0]) * dv2 - (p2[0] - p0[0]) * dv1) / det;
  const B = ((p1[1] - p0[1]) * dv2 - (p2[1] - p0[1]) * dv1) / det;
  const Cc = ((p2[0] - p0[0]) * du1 - (p1[0] - p0[0]) * du2) / det;
  const D = ((p2[1] - p0[1]) * du1 - (p1[1] - p0[1]) * du2) / det;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]);
  ctx.closePath();
  ctx.clip();
  ctx.transform(A, B, Cc, D,
    p0[0] - A * t0[0] - Cc * t0[1],
    p0[1] - B * t0[0] - D * t0[1]);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/* Off-screen render targets, created on demand and reused every frame. */
const Targets = {
  _c: {},
  get(key, w, h) {
    let t = Targets._c[key];
    if (!t || t.width !== w || t.height !== h) {
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      t = Targets._c[key] = cv;
    }
    return t;
  },
};
