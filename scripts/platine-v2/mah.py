# Contours des pièces de mise à l'heure relevés sur la vue ETA p. 8 (repère modèle, mm)
import sys, json; sys.path.insert(0, sys.argv[1]+'/py'); exec(open(sys.argv[1]+'/common.py').read())
dark = z['dark'].astype(np.uint8)
n, dl, st, cen = cv2.connectedComponentsWithStats(dark, connectivity=8)
def mask_of(ids_dark=(), ids_grey=()):
    m = np.zeros(lab.shape, np.uint8)
    for i in ids_dark: m |= (dl == i).astype(np.uint8)
    for i in ids_grey: m |= (lab == i).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    # remplir les trous intérieurs
    cs, h = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    out = np.zeros_like(m); cv2.drawContours(out, cs, -1, 1, -1)
    return out
def poly(m):
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    c = cv2.approxPolyDP(c, 1.5, True)[:, 0, :].astype(float)
    x, y = px2mm(c[:, 0], c[:, 1])
    return [[round(float(a), 4), round(float(b), 4)] for a, b in zip(x, y)]
def circ(ids_dark=(), ids_grey=()):
    m = mask_of(ids_dark, ids_grey); ys, xs = np.nonzero(m)
    x, y = px2mm(xs.mean(), ys.mean()); r = np.sqrt(m.sum() / np.pi) / k * 0.2
    return [round(float(x), 4), round(float(y), 4), round(float(r), 4)]
res = {
  "8": {"poly": poly(mask_of((), (236, 473, 475, 476))), "vis": circ((), (473, 475, 476))},
  "6": {"poly": poly(mask_of((532, 1716, 1942))), "pion": circ((1716,))},
  "7": {"poly": poly(mask_of((2199, 2145, 3065)))},
  "5": {"poly": poly(mask_of((1792,))), "pion": circ((1986,))},
}
# position de la gorge de tige : où la tirette (6) touche l'axe de la tige
m6 = mask_of((532, 1716, 1942)); ys, xs = np.nonzero(m6)
X, Y = px2mm(xs, ys); sel = np.abs(X) < 0.6
res["gorge_y"] = round(float(np.median(Y[sel])), 3) if sel.any() else None
res["tirette_y_proche"] = [round(float(Y[sel].min()), 3), round(float(Y[sel].max()), 3)] if sel.any() else None
m7 = mask_of((2199, 2145, 3065)); ys, xs = np.nonzero(m7); X, Y = px2mm(xs, ys); sel = np.abs(X) < 0.7
res["bascule_y_proche"] = [round(float(Y[sel].min()), 3), round(float(Y[sel].max()), 3)] if sel.any() else None
for kk in ("8","6","7","5"):
    p = np.array(res[kk]["poly"]); print(kk, len(p), 'X', p[:,0].min().round(2), p[:,0].max().round(2), 'Y', p[:,1].min().round(2), p[:,1].max().round(2), {a:b for a,b in res[kk].items() if a!='poly'})
print({a:b for a,b in res.items() if a not in ("8","6","7","5")})
json.dump(res, open(S+'/mah.json', 'w'))
