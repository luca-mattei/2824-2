"""Contour d'une pièce sur une vue segmentée par vue.py, à partir de graines (points en mm, repère mouvement).
Usage : python -I piece.py <dossier_travail> <vue> <spec.json> <nom_piece>
spec[nom_piece] = {"graines": [[X,Y],...], "trous": [[X,Y],...], "fermer_px": 9}
- union des zones touchées par les graines, traits intérieurs absorbés (fermeture morphologique) ;
- tous les trous intérieurs sont bouchés SAUF ceux qui contiennent un point de "trous" (ajours) ;
Sortie : <dossier_travail>/<vue>_<nom_piece>.json (contour extérieur et trous, en mm) + aperçu PNG."""
import sys, json, numpy as np, cv2
W, vue, spec_f, nom = sys.argv[1:5]
z = np.load(f'{W}/{vue}.npz'); img, lab = z['img'], z['lab']; x0, y0, cx, cy, s, k, mir = z['meta']
spec = json.load(open(spec_f))[nom]
def mm2px(X, Y):
    X = -X if mir else X
    return int(round((X / s + cx - x0) * k)), int(round((-Y / s + cy - y0) * k))
def px2mm(u, v):
    X = (x0 + u / k - cx) * s; Y = -(y0 + v / k - cy) * s
    return (-X if mir else X), Y
ids = set()
for X, Y in spec['graines']:
    u, v = mm2px(X, Y); i = int(lab[v, u])
    if i == 0: print('graine sur un trait', X, Y)
    else: ids.add(i)
m = np.isin(lab, list(ids)).astype(np.uint8)
kf = spec.get('fermer_px', 9)
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((kf, kf), np.uint8))
cs, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
ext = max(range(len(cs)), key=lambda i: cv2.contourArea(cs[i]) if hier[0][i][3] < 0 else -1)
full = np.zeros_like(m); cv2.drawContours(full, cs, ext, 1, -1)
trous_px = [mm2px(*t) for t in spec.get('trous', [])]
holes = []
for i, c in enumerate(cs):
    if hier[0][i][3] != ext: continue
    if any(cv2.pointPolygonTest(c, (float(u), float(v)), False) >= 0 for u, v in trous_px):
        holes.append(c)
def to_mm(c, eps=2.0):
    c = cv2.approxPolyDP(c, eps, True)[:, 0, :].astype(float)
    X, Y = px2mm(c[:, 0], c[:, 1]); return [[round(float(a), 4), round(float(b), 4)] for a, b in zip(X, Y)]
out = {'vue': vue, 'zones': sorted(ids), 'contour': to_mm(cs[ext]), 'trous': [to_mm(h) for h in holes]}
json.dump(out, open(f'{W}/{vue}_{nom}.json', 'w'))
# aperçu : contour vert, trous rouges, graines bleues
vis = img.copy()
cv2.drawContours(vis, [cs[ext]], -1, (0, 180, 0), 9); cv2.drawContours(vis, holes, -1, (220, 0, 0), 9)
for X, Y in spec['graines']: cv2.circle(vis, mm2px(X, Y), 14, (0, 0, 255), -1)
for u, v in trous_px: cv2.circle(vis, (u, v), 14, (255, 0, 255), -1)
f = 1400 / max(vis.shape[:2]); cv2.imwrite(f'{W}/{vue}_{nom}.png', cv2.resize(vis, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)[:, :, ::-1])
A = cv2.contourArea(cs[ext]) * (s / k) ** 2
print(nom, 'zones', len(ids), 'aire', round(A, 2), 'mm2, sommets', len(out['contour']), 'trous', len(holes))
