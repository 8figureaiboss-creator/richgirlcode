/* ============================================================================
   geometry.js — procedural mesh factory
   Mesh = { verts: [[x,y,z]...], tris: [[a,b,c,group]...], edges: [[a,b]...] }
   `group` lets a material tint caps differently from side walls, which is what
   sells the "milled metal" look on the logo and the extruded candles.
   ========================================================================== */

const Geo = {
  /* Extrude a 2D outline along +/-Z. group 0 = side walls, 1 = front cap,
     2 = back cap. */
  extrude(poly, depth, { caps = true } = {}) {
    const n = poly.length, hz = depth / 2;
    const verts = [], tris = [], edges = [];

    for (const [x, y] of poly) verts.push([x, y, hz]);   // 0 .. n-1  front
    for (const [x, y] of poly) verts.push([x, y, -hz]);  // n .. 2n-1 back

    const ccw = signedArea(poly) > 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = i, b = j, c = j + n, d = i + n;
      if (ccw) { tris.push([a, b, c, 0], [a, c, d, 0]); }
      else     { tris.push([a, c, b, 0], [a, d, c, 0]); }
      edges.push([a, b], [d, c], [a, d]);
    }

    if (caps) {
      for (const [a, b, c] of triangulate(poly)) {
        tris.push([a, b, c, 1]);
        tris.push([b + n, a + n, c + n, 2]);
      }
    }
    return { verts, tris, edges };
  },

  box(w, h, d) {
    const x = w / 2, y = h / 2, z = d / 2;
    const verts = [
      [-x,-y, z], [ x,-y, z], [ x, y, z], [-x, y, z],
      [-x,-y,-z], [ x,-y,-z], [ x, y,-z], [-x, y,-z],
    ];
    const tris = [
      [0,1,2,1],[0,2,3,1],   // +Z
      [5,4,7,2],[5,7,6,2],   // -Z
      [4,0,3,0],[4,3,7,0],   // -X
      [1,5,6,0],[1,6,2,0],   // +X
      [3,2,6,3],[3,6,7,3],   // +Y  (top — highlight group)
      [4,5,1,0],[4,1,0,0],   // -Y
    ];
    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];
    return { verts, tris, edges };
  },

  /* Wireframe-only sphere: latitude rings + longitude meridians. */
  sphereWire(r, lats = 9, longs = 18, seg = 48) {
    const verts = [], edges = [];
    for (let i = 1; i < lats; i++) {
      const phi = (i / lats) * Math.PI;
      const y = Math.cos(phi) * r, rr = Math.sin(phi) * r;
      const start = verts.length;
      for (let s = 0; s < seg; s++) {
        const t = (s / seg) * Math.PI * 2;
        verts.push([Math.cos(t) * rr, y, Math.sin(t) * rr]);
        edges.push([start + s, start + ((s + 1) % seg)]);
      }
    }
    for (let i = 0; i < longs; i++) {
      const th = (i / longs) * Math.PI * 2;
      const start = verts.length;
      for (let s = 0; s <= seg / 2; s++) {
        const phi = (s / (seg / 2)) * Math.PI;
        const y = Math.cos(phi) * r, rr = Math.sin(phi) * r;
        verts.push([Math.cos(th) * rr, y, Math.sin(th) * rr]);
        if (s > 0) edges.push([start + s - 1, start + s]);
      }
    }
    return { verts, tris: [], edges };
  },

  torus(R, r, major = 64, minor = 10) {
    const verts = [], tris = [], edges = [];
    for (let i = 0; i < major; i++) {
      const u = (i / major) * Math.PI * 2;
      for (let j = 0; j < minor; j++) {
        const v = (j / minor) * Math.PI * 2;
        verts.push([
          (R + r * Math.cos(v)) * Math.cos(u),
          r * Math.sin(v),
          (R + r * Math.cos(v)) * Math.sin(u),
        ]);
      }
    }
    const at = (i, j) => ((i % major) + major) % major * minor + ((j % minor) + minor) % minor;
    for (let i = 0; i < major; i++) {
      for (let j = 0; j < minor; j++) {
        tris.push([at(i, j), at(i + 1, j), at(i + 1, j + 1), 0]);
        tris.push([at(i, j), at(i + 1, j + 1), at(i, j + 1), 0]);
      }
      edges.push([at(i, 0), at(i + 1, 0)]);
    }
    return { verts, tris, edges };
  },

  /* Flat ring in the XZ plane — used for the orbital "24/7/365" rails. */
  ringXZ(R, seg = 96) {
    const verts = [], edges = [];
    for (let i = 0; i < seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      verts.push([Math.cos(t) * R, 0, Math.sin(t) * R]);
      edges.push([i, (i + 1) % seg]);
    }
    return { verts, tris: [], edges };
  },

  /* Rounded-rectangle outline, CCW, ready for extrude(). */
  roundedRect(w, h, r, corner = 6) {
    const x = w / 2, y = h / 2;
    r = Math.min(r, x, y);
    const pts = [];
    const arc = (cx, cy, a0, a1) => {
      for (let i = 0; i <= corner; i++) {
        const a = a0 + (a1 - a0) * (i / corner);
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    arc( x - r,  y - r, 0,               Math.PI / 2);
    arc(-x + r,  y - r, Math.PI / 2,     Math.PI);
    arc(-x + r, -y + r, Math.PI,         Math.PI * 1.5);
    arc( x - r, -y + r, Math.PI * 1.5,   Math.PI * 2);
    return pts;
  },

  regularPoly(sides, r, rot = 0) {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = rot + (i / sides) * Math.PI * 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
  },

  /* Chevron / upward-arrow outline — the OTA mark. Concave, so it exercises
     the ear-clipping triangulator. */
  chevron(w, h, thick) {
    const hw = w / 2, hh = h / 2;
    return [
      [-hw, -hh + thick * 0.9],
      [0,    hh],
      [hw,  -hh + thick * 0.9],
      [hw - thick * 0.72, -hh + thick * 0.9],
      [0,    hh - thick * 1.28],
      [-hw + thick * 0.72, -hh + thick * 0.9],
    ];
  },

  /* Great-circle arc between two lat/lng pairs, bulged out by `lift`. */
  arcLatLng(a, b, r, lift = 0.26, seg = 40) {
    const p0 = Geo.latLng(a[0], a[1], r);
    const p1 = Geo.latLng(b[0], b[1], r);
    const pts = [];
    for (let i = 0; i <= seg; i++) {
      const t = i / seg;
      const p = V3.norm(V3.lerp(p0, p1, t));
      const bulge = Math.sin(t * Math.PI) * lift;
      pts.push(V3.mul(p, r * (1 + bulge)));
    }
    return pts;
  },

  latLng(lat, lng, r) {
    const phi = (90 - lat) * Math.PI / 180;
    const th  = (lng + 180) * Math.PI / 180;
    return [
      -r * Math.sin(phi) * Math.cos(th),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(th),
    ];
  },
};
