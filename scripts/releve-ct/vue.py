"""Rendu d'une vue de dessus de la CT ETA et segmentation en zones délimitées par les traits.
Usage : python -I vue.py <CT.pdf> <dossier_travail> <nom> <page> <x0> <y0> <x1> <y1> <cx> <cy> <r_pt> <p|m>
(x0..y1 : rectangle de la vue en points PDF ; cx, cy, r_pt : cercle du mouvement ajusté ; m = vue côté cadran, en miroir)
Sorties : <nom>.npz (image, étiquettes) et <nom>_labels.png (zones numérotées)."""
import sys, json, numpy as np, cv2, pymupdf
pdf, W, nom, pg = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
x0, y0, x1, y1, cx, cy, r = map(float, sys.argv[5:12]); miroir = sys.argv[12] == 'm'
DPI = 1200; k = DPI / 72
pix = pymupdf.open(pdf)[pg - 1].get_pixmap(dpi=DPI, clip=pymupdf.Rect(x0, y0, x1, y1), alpha=False)
img = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w, 3).copy()
g = img.astype(int).sum(2) / 3
trait = g < 60                       # traits noirs
clair = ~trait
n, lab, st, cen = cv2.connectedComponentsWithStats(clair.astype(np.uint8), connectivity=4)
s = 12.8 / r
def px2mm(u, v):
    X = (x0 + np.asarray(u, float) / k - cx) * s; Y = -(y0 + np.asarray(v, float) / k - cy) * s
    return (-X if miroir else X), Y
np.savez_compressed(f'{W}/{nom}.npz', img=img, lab=lab.astype(np.int32), meta=np.array([x0, y0, cx, cy, s, k, 1.0 if miroir else 0.0]))
rng = np.random.default_rng(7); col = rng.integers(90, 255, (n, 3)).astype(np.uint8); col[0] = 0
vis = col[lab]; vis[trait] = 0
f = 2400 / max(vis.shape); small = cv2.resize(vis, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
mm2 = (s / k) ** 2
rows = []
for i in range(1, n):
    a = st[i, 4] * mm2
    if a < 0.02: continue
    X, Y = px2mm(*cen[i]); rows.append((i, a, float(X), float(Y)))
    if a > 0.08:
        cv2.putText(small, str(i), (int(cen[i][0] * f) - 10, int(cen[i][1] * f) + 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)
cv2.imwrite(f'{W}/{nom}_labels.png', small)
json.dump(rows, open(f'{W}/{nom}_zones.json', 'w'))
print(pix.w, pix.h, 'zones', len(rows))
