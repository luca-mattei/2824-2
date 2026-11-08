"""Denture d'une roue sur une vue segmentée (vue.py) : nombre de dents et rayons de tête et de pied.
Usage : python -I dents.py <W> <vue> <X> <Y> <r_min> <r_max> <a0> <a1>   (mm ; arc visible a0..a1 en degrés)
Méthode : sur chaque cercle de rayon r, franchissements de traits le long de l'arc visible ; dans la bande
de denture ils sont réguliers. Le pas est ajusté par moindres carrés sur toutes les dents de l'arc
(angle = a + pas * indice), d'où le nombre de dents = 360 / pas. Tête et pied = bornes de la bande régulière."""
import sys, numpy as np
W, vue = sys.argv[1:3]; X, Y, r0, r1, a0, a1 = map(float, sys.argv[3:9])
z = np.load(f'{W}/{vue}.npz'); img = z['img']; x0, y0, cx, cy, s, k, mir = z['meta']
dark = img.astype(int).sum(2) / 3 < 90
def px(Xm, Ym):
    Xm = -Xm if mir else Xm
    return (Xm / s + cx - x0) * k, (-Ym / s + cy - y0) * k
th = np.radians(np.arange(a0, a1, 0.005))
rows = []
for r in np.arange(r0, r1, 0.01):
    u, v = px(X + r * np.cos(th), Y + r * np.sin(th))
    ok = (u >= 0) & (v >= 0) & (u < img.shape[1] - 1) & (v < img.shape[0] - 1)
    sig = np.zeros(len(th), bool); sig[ok] = dark[v[ok].astype(int), u[ok].astype(int)]
    e = np.flatnonzero(sig[1:] & ~sig[:-1]); f = np.flatnonzero(~sig[1:] & sig[:-1])
    if len(e) < 6 or len(f) < 6: continue
    n = min(len(e), len(f)); c = np.degrees(th[(e[:n] + f[:n]) // 2])     # centres des traits
    d = np.diff(c); p0 = np.median(d)
    if p0 <= 0: continue
    reg = np.mean(np.abs(d - p0) < 0.2 * p0)
    if reg < 0.85: continue
    idx = np.round((c - c[0]) / p0); A = np.vstack([idx, np.ones_like(idx)]).T
    (p, b), *_ = np.linalg.lstsq(A, c, rcond=None); resid = np.std(c - A @ [p, b])
    rows.append((r, len(c), p, reg, resid))
for r, n, p, reg, res in rows:
    print(f'r={r:5.2f}  traits={n:4d}  pas={p:7.4f}°  régularité={reg:.2f}  résidu={res:.3f}°  -> 360/pas={360/p:7.2f}  360/(2·pas)={180/p:7.2f}')
