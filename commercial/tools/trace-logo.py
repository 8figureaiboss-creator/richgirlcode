#!/usr/bin/env python3
"""
trace-logo.py — turn the supplied logo PNG into resolution-independent paths.

The mark is two flat colours with anti-aliased edges, so the grey values along
every edge encode the true sub-pixel position of the outline. Marching squares
at the 0.5 iso-level, with linear interpolation on each cell edge, recovers that
outline far more faithfully than upscaling the 159px bitmap would — and the
result draws crisply at any size.

Output: src/logo-art.js
"""
import zlib, struct, sys, json, math
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/logo.png')
OUT = Path(__file__).resolve().parent.parent / 'src' / 'logo-art.js'

# ── decode PNG ──────────────────────────────────────────────────────────────
def read_png(p):
    d = p.read_bytes()
    assert d[:8] == b'\x89PNG\r\n\x1a\n', 'not a PNG'
    i, idat, pal = 8, b'', None
    w = h = bd = ct = None
    while i < len(d):
        ln = struct.unpack('>I', d[i:i+4])[0]
        typ, data = d[i+4:i+8], d[i+8:i+8+ln]
        i += 12 + ln
        if typ == b'IHDR': w, h, bd, ct = struct.unpack('>IIBB', data[:10])
        elif typ == b'IDAT': idat += data
        elif typ == b'PLTE': pal = data
        elif typ == b'IEND': break
    raw = zlib.decompress(idat)
    ch = {0:1, 2:3, 3:1, 4:2, 6:4}[ct]
    bpp = max(1, ch * (bd // 8))
    stride = (w * ch * bd + 7) // 8
    out, prev, pos = bytearray(), bytearray(stride), 0
    for _ in range(h):
        f = raw[pos]; pos += 1
        line = bytearray(raw[pos:pos+stride]); pos += stride
        for x in range(stride):
            a = line[x-bpp] if x >= bpp else 0
            b = prev[x]
            c = prev[x-bpp] if x >= bpp else 0
            if f == 1: line[x] = (line[x] + a) & 255
            elif f == 2: line[x] = (line[x] + b) & 255
            elif f == 3: line[x] = (line[x] + (a + b) // 2) & 255
            elif f == 4:
                pp = a + b - c
                pa, pb, pc = abs(pp-a), abs(pp-b), abs(pp-c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out += line; prev = line
    return w, h, ch, ct, bytes(out), pal

W, H, CH, CT, PX, PAL = read_png(SRC)

def rgb(x, y):
    o = (y * W + x) * CH
    if CT == 3:
        i = PX[o]; return PAL[i*3], PAL[i*3+1], PAL[i*3+2]
    return PX[o], PX[o+1], PX[o+2]

# ── coverage field: 0 = plate green, 1 = cream mark ─────────────────────────
PLATE = (6, 32, 16)
MARK  = (254, 245, 218)
dv = [MARK[i] - PLATE[i] for i in range(3)]
den = sum(c*c for c in dv)

cov = [[0.0] * W for _ in range(H)]
for y in range(H):
    for x in range(W):
        r, g, b = rgb(x, y)
        t = ((r-PLATE[0])*dv[0] + (g-PLATE[1])*dv[1] + (b-PLATE[2])*dv[2]) / den
        cov[y][x] = min(1.0, max(0.0, t))

# ── marching squares on pixel centres, iso = 0.5 ───────────────────────────
ISO = 0.5
def interp(p, q, vp, vq):
    t = (ISO - vp) / (vq - vp) if vq != vp else 0.5
    return (p[0] + (q[0]-p[0])*t, p[1] + (q[1]-p[1])*t)

segs = []
for y in range(H-1):
    for x in range(W-1):
        v = [cov[y][x], cov[y][x+1], cov[y+1][x+1], cov[y+1][x]]
        p = [(x, y), (x+1, y), (x+1, y+1), (x, y+1)]
        idx = sum((1 << i) for i in range(4) if v[i] >= ISO)
        if idx in (0, 15): continue
        e = {}
        for i in range(4):
            j = (i+1) % 4
            if (v[i] >= ISO) != (v[j] >= ISO):
                e[i] = interp(p[i], p[j], v[i], v[j])
        ks = sorted(e)
        if len(ks) == 2:
            segs.append((e[ks[0]], e[ks[1]]))
        elif len(ks) == 4:          # saddle — split by the cell average
            avg = sum(v) / 4
            if avg >= ISO: segs.append((e[0], e[1])); segs.append((e[2], e[3]))
            else:          segs.append((e[1], e[2])); segs.append((e[3], e[0]))

# ── link segments into closed loops ────────────────────────────────────────
# Endpoints are snapped to a grid so shared vertices match exactly, then
# segments are consumed from an adjacency map. At a junction (saddle cells, or
# where the Q's tail meets its bowl) several segments share a point, so the
# walk always takes an unconsumed one rather than assuming a degree-2 graph.
Q = 1e-7
def key(pt): return (round(pt[0] / Q), round(pt[1] / Q))

adj = {}
for i, (a, b) in enumerate(segs):
    adj.setdefault(key(a), []).append(i)
    adj.setdefault(key(b), []).append(i)

alive = [True] * len(segs)
loops = []
for start in range(len(segs)):
    if not alive[start]: continue
    a0, b0 = segs[start]
    alive[start] = False
    loop = [a0, b0]
    cur = b0
    while True:
        nxt = None
        for j in adj.get(key(cur), ()):
            if not alive[j]: continue
            a, b = segs[j]
            nxt = b if key(a) == key(cur) else a
            alive[j] = False
            break
        if nxt is None: break
        loop.append(nxt)
        cur = nxt
        if key(cur) == key(loop[0]): break
    if len(loop) > 8:
        loops.append(loop)

# ── Ramer–Douglas–Peucker, tight epsilon to stay faithful ──────────────────
def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]
    nl = math.hypot(dx, dy)
    worst, wi = 0.0, 0
    for i in range(1, len(pts)-1):
        px, py = pts[i]
        d = abs(dy*px - dx*py + b[0]*a[1] - b[1]*a[0]) / nl if nl > 1e-9 else math.hypot(px-a[0], py-a[1])
        if d > worst: worst, wi = d, i
    if worst <= eps: return [a, b]
    return rdp(pts[:wi+1], eps)[:-1] + rdp(pts[wi:], eps)

EPS = 0.055   # sub-pixel: well under a tenth of a source pixel
out = []
for lp in loops:
    s = rdp(lp, EPS)
    if len(s) >= 4:
        out.append([[round(x / (W-1), 5), round(y / (H-1), 5)] for x, y in s])

out.sort(key=lambda l: -len(l))
total = sum(len(l) for l in out)

js = f"""/* ============================================================================
   logo-art.js — GENERATED by tools/trace-logo.py from the supplied logo file.
   Do not hand-edit; re-run the tracer if the artwork changes.

   The mark is stored as outlines traced from the original at sub-pixel accuracy
   (marching squares on the anti-aliased coverage field), not as an upscaled
   bitmap — so it stays sharp at any size while remaining the supplied shape.
   Coordinates are normalised 0..1 over the source's {W}x{H} frame.
   Filled with the even-odd rule so the Q's counter reads as a hole.
   ========================================================================== */
const LOGO_ART = {{
  w: {W}, h: {H},
  plate: '#062010',
  mark: '#FEF5DA',
  loops: {json.dumps(out, separators=(',', ':'))},
}};
"""
OUT.write_text(js)
print(f"traced {len(out)} loops · {total} points · {len(js)/1024:.1f} KB → {OUT}")
