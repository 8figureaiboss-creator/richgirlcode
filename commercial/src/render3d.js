/* ============================================================================
   render3d.js — painter's-algorithm software renderer on 2D canvas.
   Collects triangles, glow-lines and billboarded sprites into one depth-sorted
   list so 3D geometry and 2D motion-graphics overlays interleave correctly.
   ========================================================================== */

class Camera {
  constructor() {
    this.eye = [0, 0, 10];
    this.target = [0, 0, 0];
    this.up = [0, 1, 0];
    this.fov = 42 * Math.PI / 180;
    this.near = 0.1;
    this.far = 400;
  }
  lookAt(eye, target, up = [0, 1, 0]) { this.eye = eye; this.target = target; this.up = up; return this; }
  matrices(aspect) {
    const view = M4.lookAt(this.eye, this.target, this.up);
    const proj = M4.perspective(this.fov, aspect, this.near, this.far);
    return { view, proj, viewProj: M4.mul(proj, view) };
  }
}

class Scene3D {
  constructor() {
    this.items = [];
    this.light     = V3.norm([-0.45, 0.8, 0.55]);   // key, warm
    this.fillLight = V3.norm([0.7, -0.25, 0.4]);    // fill, cool
    this.ambient = 0.22;
    this.keyColor  = [1.0, 0.94, 0.78];
    this.fillColor = [0.35, 0.52, 0.95];
    this.rimColor  = [0.86, 0.72, 0.36];
  }

  reset() { this.items.length = 0; return this; }

  mesh(mesh, matrix, mat = {}) {
    this.items.push({ k: 'mesh', mesh, m: matrix || M4.identity(), mat });
    return this;
  }

  /* Polyline through world-space points, drawn as a glowing stroke. */
  path(points, opt = {}) {
    this.items.push({ k: 'path', points, opt });
    return this;
  }

  line(a, b, opt = {}) { return this.path([a, b], opt); }

  /* Billboard: `draw(ctx, scale, depth)` is called in screen space, already
     translated to the projected point. Perfect for 3D-anchored HUD labels. */
  sprite(pos, draw, opt = {}) {
    this.items.push({ k: 'sprite', pos, draw, opt });
    return this;
  }

  render(ctx, cam, W, H) {
    const { view, viewProj } = cam.matrices(W / H);
    const hw = W / 2, hh = H / 2;
    const queue = [];

    const project = (p) => {
      const c = M4.xform(viewProj, p);
      if (c[3] <= 0.0001) return null;
      const iw = 1 / c[3];
      return [hw + c[0] * iw * hw, hh - c[1] * iw * hh, c[3]];
    };

    for (const it of this.items) {
      if (it.k === 'mesh') this._queueMesh(it, view, viewProj, hw, hh, queue, cam);
      else if (it.k === 'path') this._queuePath(it, project, queue);
      else if (it.k === 'sprite') {
        const s = project(it.pos);
        if (!s) continue;
        const sc = (it.opt.scale ?? 1) * (hh / Math.tan(cam.fov / 2)) / s[2];
        queue.push({ z: s[2] - (it.opt.zBias ?? 0), kind: 's', it, x: s[0], y: s[1], sc });
      }
    }

    /* Far to near. */
    queue.sort((a, b) => b.z - a.z);

    for (const q of queue) {
      if (q.kind === 't') this._paintTri(ctx, q);
      else if (q.kind === 'l') this._paintLine(ctx, q);
      else {
        ctx.save();
        ctx.translate(q.x, q.y);
        q.it.draw(ctx, q.sc, q.z);
        ctx.restore();
      }
    }
    return queue.length;
  }

  _queueMesh(it, view, viewProj, hw, hh, queue, cam) {
    const { mesh, m, mat } = it;
    const n = mesh.verts.length;
    const world = new Array(n), scr = new Array(n);

    for (let i = 0; i < n; i++) {
      const w = M4.xform(m, mesh.verts[i]);
      world[i] = w;
      const c = M4.xform(viewProj, w);
      if (c[3] > 0.0001) {
        const iw = 1 / c[3];
        scr[i] = [hw + c[0] * iw * hw, hh - c[1] * iw * hh, c[3]];
      } else scr[i] = null;
    }

    const alpha = mat.alpha ?? 1;
    if (mesh.tris.length && alpha > 0.002 && !mat.wireOnly) {
      for (const [a, b, c, g] of mesh.tris) {
        const sa = scr[a], sb = scr[b], sc2 = scr[c];
        if (!sa || !sb || !sc2) continue;

        /* Screen-space winding = backface cull (meshes are built CCW-out). */
        const area = (sb[0] - sa[0]) * (sc2[1] - sa[1]) - (sb[1] - sa[1]) * (sc2[0] - sa[0]);
        if (mat.cull !== false && area >= 0) continue;

        const e1 = V3.sub(world[b], world[a]);
        const e2 = V3.sub(world[c], world[a]);
        let nrm = V3.norm(V3.cross(e1, e2));

        const centroid = [
          (world[a][0] + world[b][0] + world[c][0]) / 3,
          (world[a][1] + world[b][1] + world[c][1]) / 3,
          (world[a][2] + world[b][2] + world[c][2]) / 3,
        ];
        const viewDir = V3.norm(V3.sub(cam.eye, centroid));
        if (V3.dot(nrm, viewDir) < 0) nrm = V3.mul(nrm, -1);

        const col = this._shade(nrm, viewDir, mat, g);
        queue.push({
          z: (sa[2] + sb[2] + sc2[2]) / 3 - (mat.zBias ?? 0),
          kind: 't', a: sa, b: sb, c: sc2, col, alpha,
          stroke: mat.stroke, strokeW: mat.strokeW,
        });
      }
    }

    if (mesh.edges.length && (mat.wire || mat.wireOnly)) {
      const wc = mat.wireColor ?? 'rgba(212,175,55,0.55)';
      const ww = mat.wireWidth ?? 1.2;
      for (const [a, b] of mesh.edges) {
        const sa = scr[a], sb = scr[b];
        if (!sa || !sb) continue;
        queue.push({
          z: (sa[2] + sb[2]) / 2 - (mat.zBias ?? 0) - 0.002,
          kind: 'l', pts: [sa, sb], col: wc, w: ww,
          glow: mat.wireGlow ?? 0, alpha: mat.wireAlpha ?? alpha,
        });
      }
    }
  }

  _queuePath(it, project, queue) {
    const pts = [];
    for (const p of it.points) {
      const s = project(p);
      if (s) pts.push(s);
      else if (pts.length > 1) { this._pushPath(pts.slice(), it, queue); pts.length = 0; }
      else pts.length = 0;
    }
    if (pts.length > 1) this._pushPath(pts, it, queue);
  }

  _pushPath(pts, it, queue) {
    let z = 0;
    for (const p of pts) z += p[2];
    queue.push({
      z: z / pts.length - (it.opt.zBias ?? 0),
      kind: 'l', pts,
      col: it.opt.color ?? 'rgba(212,175,55,0.9)',
      w: it.opt.width ?? 2,
      glow: it.opt.glow ?? 0,
      alpha: it.opt.alpha ?? 1,
      cap: it.opt.cap,
      dash: it.opt.dash,
    });
  }

  _shade(n, v, mat, group) {
    const base = (mat.groups && mat.groups[group]) || mat.color || [0.8, 0.8, 0.85];
    const em = mat.emissive ?? 0;
    const metal = mat.metal ?? 0;

    const lam  = Math.max(0, V3.dot(n, this.light));
    const lam2 = Math.max(0, V3.dot(n, this.fillLight)) * 0.45;
    const rim  = Math.pow(1 - Math.min(1, Math.abs(V3.dot(n, v))), 2.4) * (mat.rim ?? 0.55);

    const h = V3.norm(V3.add(this.light, v));
    const spec = Math.pow(Math.max(0, V3.dot(n, h)), 28 + metal * 90) * (0.35 + metal * 1.25);

    const out = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      out[i] = base[i] * (this.ambient + lam * this.keyColor[i] * (1 - metal * 0.35)
             + lam2 * this.fillColor[i])
             + spec * this.keyColor[i]
             + rim * this.rimColor[i]
             + base[i] * em * 1.9;
    }
    return `rgb(${clamp255(out[0])},${clamp255(out[1])},${clamp255(out[2])})`;
  }

  _paintTri(ctx, q) {
    ctx.globalAlpha = q.alpha;
    ctx.beginPath();
    ctx.moveTo(q.a[0], q.a[1]);
    ctx.lineTo(q.b[0], q.b[1]);
    ctx.lineTo(q.c[0], q.c[1]);
    ctx.closePath();
    ctx.fillStyle = q.col;
    ctx.fill();
    /* Hairline stroke on the same path kills seams between adjacent tris. */
    ctx.strokeStyle = q.stroke || q.col;
    ctx.lineWidth = q.strokeW || 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  _paintLine(ctx, q) {
    ctx.beginPath();
    ctx.moveTo(q.pts[0][0], q.pts[0][1]);
    for (let i = 1; i < q.pts.length; i++) ctx.lineTo(q.pts[i][0], q.pts[i][1]);
    ctx.lineCap = q.cap || 'round';
    ctx.lineJoin = 'round';
    if (q.dash) ctx.setLineDash(q.dash); else ctx.setLineDash([]);
    if (q.glow > 0) {
      ctx.globalAlpha = q.alpha * 0.22 * q.glow;
      ctx.lineWidth = q.w * (2.6 + q.glow * 2.2);
      ctx.strokeStyle = q.col;
      ctx.stroke();
    }
    ctx.globalAlpha = q.alpha;
    ctx.lineWidth = q.w;
    ctx.strokeStyle = q.col;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }
}

const clamp255 = (x) => Math.max(0, Math.min(255, Math.round(x * 255)));
