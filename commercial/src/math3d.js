/* ============================================================================
   math3d.js — hand-rolled 3D math + software renderer (zero dependencies)
   Vectors are plain [x,y,z] arrays. Matrices are column-major Float32Array(16),
   matching the WebGL/GLSL convention so the code reads like a real pipeline.
   ========================================================================== */

const V3 = {
  add:  (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub:  (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul:  (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot:  (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross:(a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ],
  len:  (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
};

const M4 = {
  identity() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  },

  /* out = a * b  (apply b first, then a) */
  mul(a, b, out = new Float32Array(16)) {
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      out[c * 4]     = a[0] * b0 + a[4] * b1 + a[8]  * b2 + a[12] * b3;
      out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9]  * b2 + a[13] * b3;
      out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
  },

  chain(...mats) {
    return mats.reduce((acc, m) => M4.mul(acc, m));
  },

  translate(x, y, z) {
    const m = M4.identity(); m[12] = x; m[13] = y; m[14] = z; return m;
  },

  scale(x, y = x, z = x) {
    const m = M4.identity(); m[0] = x; m[5] = y; m[10] = z; return m;
  },

  rotX(a) {
    const m = M4.identity(), c = Math.cos(a), s = Math.sin(a);
    m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m;
  },

  rotY(a) {
    const m = M4.identity(), c = Math.cos(a), s = Math.sin(a);
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m;
  },

  rotZ(a) {
    const m = M4.identity(), c = Math.cos(a), s = Math.sin(a);
    m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m;
  },

  /* Right-handed perspective, looking down -Z. */
  perspective(fovY, aspect, near, far) {
    const f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
    const m = new Float32Array(16);
    m[0] = f / aspect; m[5] = f;
    m[10] = (far + near) * nf; m[11] = -1;
    m[14] = 2 * far * near * nf;
    return m;
  },

  lookAt(eye, target, up = [0, 1, 0]) {
    const z = V3.norm(V3.sub(eye, target));
    const x = V3.norm(V3.cross(up, z));
    const y = V3.cross(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -V3.dot(x, eye), -V3.dot(y, eye), -V3.dot(z, eye), 1,
    ]);
  },

  /* Transform a point; returns [x,y,z,w]. */
  xform(m, p) {
    const [x, y, z] = p;
    return [
      m[0] * x + m[4] * y + m[8]  * z + m[12],
      m[1] * x + m[5] * y + m[9]  * z + m[13],
      m[2] * x + m[6] * y + m[10] * z + m[14],
      m[3] * x + m[7] * y + m[11] * z + m[15],
    ];
  },

  /* Transform a direction (ignores translation). */
  xformDir(m, p) {
    const [x, y, z] = p;
    return [
      m[0] * x + m[4] * y + m[8]  * z,
      m[1] * x + m[5] * y + m[9]  * z,
      m[2] * x + m[6] * y + m[10] * z,
    ];
  },
};

/* ── Ear-clipping triangulator ───────────────────────────────────────────────
   Needed to cap extruded logo/phone/shield outlines, which are concave.      */
function triangulate(poly) {
  const n = poly.length;
  if (n < 3) return [];
  const idx = [...Array(n).keys()];
  if (signedArea(poly) < 0) idx.reverse();           // force CCW

  const tris = [];
  let guard = 0;
  while (idx.length > 3 && guard++ < n * n) {
    let clipped = false;
    for (let i = 0; i < idx.length; i++) {
      const i0 = idx[(i - 1 + idx.length) % idx.length];
      const i1 = idx[i];
      const i2 = idx[(i + 1) % idx.length];
      const a = poly[i0], b = poly[i1], c = poly[i2];
      if (cross2(a, b, c) <= 0) continue;             // reflex vertex
      let contains = false;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        if (pointInTri(poly[j], a, b, c)) { contains = true; break; }
      }
      if (contains) continue;
      tris.push([i0, i1, i2]);
      idx.splice(i, 1);
      clipped = true;
      break;
    }
    if (!clipped) break;                              // degenerate — bail out
  }
  if (idx.length === 3) tris.push([idx[0], idx[1], idx[2]]);
  return tris;
}

const cross2 = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

function signedArea(poly) {
  let s = 0;
  for (let i = 0, n = poly.length; i < n; i++) {
    const a = poly[i], b = poly[(i + 1) % n];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

function pointInTri(p, a, b, c) {
  const d1 = cross2(a, b, p), d2 = cross2(b, c, p), d3 = cross2(c, a, p);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}
