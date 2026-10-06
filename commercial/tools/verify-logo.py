#!/usr/bin/env python3
"""Rasterise the traced loops and diff against the source coverage field."""
import json, re, sys, zlib, struct
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import importlib.util
spec = importlib.util.spec_from_file_location('tl', Path(__file__).parent / 'trace-logo.py')

# reuse the decoder by exec'ing only its top half
src = (Path(__file__).parent / 'trace-logo.py').read_text()
head = src[:src.index('# ── marching squares')]
head = head.replace("SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/logo.png')",
                    "SRC = Path(sys.argv[1])")
ns = {'__file__': str(Path(__file__).parent / 'trace-logo.py')}
exec(compile(head, 'trace-head', 'exec'), ns)
W, H, cov = ns['W'], ns['H'], ns['cov']

art = json.loads(re.search(r'loops: (\[\[.*?\]\]),\n', (Path(__file__).parent.parent/'src'/'logo-art.js').read_text(), re.S).group(1))
loops = [[(p[0]*(W-1), p[1]*(H-1)) for p in lp] for lp in art]

SS = 4  # supersample, to compare anti-aliased coverage fairly
hit = [[0]*W for _ in range(H)]
for sy in range(H*SS):
    y = (sy + 0.5) / SS - 0.5
    xs = []
    for lp in loops:
        n = len(lp)
        for i in range(n):
            x1, y1 = lp[i]; x2, y2 = lp[(i+1) % n]
            if (y1 <= y < y2) or (y2 <= y < y1):
                xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
    xs.sort()
    for k in range(0, len(xs) - 1, 2):          # even-odd
        a, b = xs[k], xs[k+1]
        for sx in range(int((a+0.5)*SS), int((b+0.5)*SS) + 1):
            x = (sx + 0.5) / SS - 0.5
            if a <= x <= b:
                px, py = int(round(x)), int(round(y))
                if 0 <= px < W and 0 <= py < H: hit[py][px] += 1

err = n_px = 0
worst = []
for y in range(H):
    for x in range(W):
        got = min(1.0, hit[y][x] / (SS*SS))
        d = abs(got - cov[y][x])
        err += d; n_px += 1
        if d > 0.5: worst.append((x, y, round(cov[y][x],2), round(got,2)))
print(f"mean absolute coverage error : {err/n_px*100:.3f}%")
print(f"pixels off by more than 0.5  : {len(worst)}  ({len(worst)/n_px*100:.3f}%)")
if worst[:6]: print("  e.g.", worst[:6])
