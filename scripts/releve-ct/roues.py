"""Balayage automatique de la denture autour d'un axe, secteur par secteur (30°), rayons r_min..r_max.
Usage : python -I roues.py <W> <vue> <nom> <X> <Y> <r_min> <r_max>
Affiche, par secteur, les rayons où la denture est régulière, le nombre de dents estimé, puis une synthèse."""
import sys, numpy as np
W, vue, nom = sys.argv[1:4]; X, Y, r0, r1 = map(float, sys.argv[4:8])
z = np.load(f'{W}/{vue}.npz'); img = z['img']; x0, y0, cx, cy, s, k, mir = z['meta']
dark = img.astype(int).sum(2) / 3 < 90
def px(Xm, Ym):
    Xm = -Xm if mir else Xm
    return (Xm / s + cx - x0) * k, (-Ym / s + cy - y0) * k
def scan(a0, a1, r):
    th = np.radians(np.arange(a0, a1, 0.005))
    u, v = px(X + r * np.cos(th), Y + r * np.sin(th))
    ok = (u >= 0) & (v >= 0) & (u < img.shape[1] - 1) & (v < img.shape[0] - 1)
    sig = np.zeros(len(th), bool); sig[ok] = dark[v[ok].astype(int), u[ok].astype(int)]
    e = np.flatnonzero(sig[1:] & ~sig[:-1]); f = np.flatnonzero(~sig[1:] & sig[:-1])
    if len(e) < 8 or len(f) < 8: return None
    if f[0] < e[0]: f = f[1:]
    n = min(len(e), len(f)); c = np.degrees(th[(e[:n] + f[:n]) // 2])
    d = np.diff(c); p0 = np.median(d)
    if p0 <= 0.05: return None
    reg = np.mean(np.abs(d - p0) < 0.2 * p0)
    if reg < 0.9: return None
    idx = np.round((c - c[0]) / p0); A = np.vstack([idx, np.ones_like(idx)]).T
    (p, b), *_ = np.linalg.lstsq(A, c, rcond=None)
    return len(c), p, reg
allp = []
for a0 in range(0, 360, 30):
    hits = []
    for r in np.arange(r0, r1, 0.01):
        h = scan(a0, a0 + 30, r)
        if h: hits.append((round(r, 2), *h))
    if hits:
        rs = [h[0] for h in hits]
        Ts = [360 / h[2] for h in hits]
        print(f'{nom} secteur {a0:3d}-{a0+30:3d}°: r {min(rs):.2f}-{max(rs):.2f} ({len(hits)} cercles), 360/pas médian {np.median(Ts):7.2f}, traits {int(np.median([h[1] for h in hits]))}')
        allp += hits
if allp:
    print('synthèse 360/pas (tous cercles réguliers) :', np.round(np.percentile([360 / h[2] for h in allp], [10, 50, 90]), 2))
