"""Aperçu d'une vue avec une grille en mm (repère mouvement) pour placer les graines.
Usage : python -I grille.py <dossier_travail> <vue> [Xmin Xmax Ymin Ymax] [largeur_px]"""
import sys, numpy as np, cv2
W, vue = sys.argv[1:3]
z = np.load(f'{W}/{vue}.npz'); img = z['img'].copy(); x0, y0, cx, cy, s, k, mir = z['meta']
Xa, Xb, Ya, Yb = map(float, sys.argv[3:7]) if len(sys.argv) > 6 else (-13, 13, -13, 13)
Wout = int(sys.argv[7]) if len(sys.argv) > 7 else 1400
def mm2px(X, Y):
    X = -X if mir else X
    return int(round((X / s + cx - x0) * k)), int(round((-Y / s + cy - y0) * k))
u0, v0 = mm2px(Xa, Yb); u1, v1 = mm2px(Xb, Ya)
u0, u1 = sorted((max(0, u0), min(img.shape[1], u1))); v0, v1 = sorted((max(0, v0), min(img.shape[0], v1)))
crop = img[v0:v1, u0:u1].copy()
f = Wout / crop.shape[1]; crop = cv2.resize(crop, None, fx=f, fy=f, interpolation=cv2.INTER_AREA)
step = 0.5 if (Xb - Xa) <= 8 else 1.0
for X in np.arange(np.ceil(Xa), Xb + 1e-9, step):
    u, _ = mm2px(X, 0); u = int((u - u0) * f)
    cv2.line(crop, (u, 0), (u, crop.shape[0]), (0, 120, 255) if X % 2 == 0 else (120, 200, 255), 1)
    if X % 1 == 0: cv2.putText(crop, f'{X:g}', (u + 2, 14), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 200), 1)
for Y in np.arange(np.ceil(Ya), Yb + 1e-9, step):
    _, v = mm2px(0, Y); v = int((v - v0) * f)
    cv2.line(crop, (0, v), (crop.shape[1], v), (0, 120, 255) if Y % 2 == 0 else (120, 200, 255), 1)
    if Y % 1 == 0: cv2.putText(crop, f'{Y:g}', (2, v - 3), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 200), 1)
cv2.imwrite(f'{W}/{vue}_grille.png', crop[:, :, ::-1])
