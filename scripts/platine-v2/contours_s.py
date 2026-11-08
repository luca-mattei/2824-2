import sys, json; sys.path.insert(0, sys.argv[1]+'/py')
import numpy as np, cv2
S = sys.argv[1]; m = np.load(S+'/maps.npz'); D, T, TH, GX, GY = m['D'], m['T'], m['through'], m['GX'], m['GY']
G, E = 0.02, 13.0
inside = ~np.isnan(D)
def loops(mask, eps=2.5, minarea=40):
    cs, hi = cv2.findContours(mask.astype(np.uint8), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in cs:
        if abs(cv2.contourArea(c)) < minarea: continue
        a = cv2.approxPolyDP(c, eps, True)[:, 0, :].astype(float)
        if len(a) < 3: continue
        out.append([[round(-E + u*G, 4), round(E - v*G, 4)] for u, v in a])
    return out
ker = np.ones((5, 5), np.uint8)
# face cadran : niveaux quantifiés au 0,02 supérieur
Dq = np.where(inside, np.ceil(np.round(D, 4) / 0.02 - 1e-6) * 0.02, np.nan)
dial = []
for Lv in sorted(set(np.round(Dq[inside], 2))):
    if Lv <= 0.301: continue
    reg = (np.round(Dq, 2) == Lv) & inside & ~TH
    if reg.sum() < 10: continue
    reg = cv2.dilate(reg.astype(np.uint8), ker)
    lp = loops(reg)
    if lp: dial.append(dict(z=float(Lv), loops=lp))
# face ponts
top = []
for Lv in sorted(set(np.round(T[inside], 2))):
    if Lv >= 2.199: continue
    reg = (np.round(T, 2) == Lv) & inside & ~TH
    if reg.sum() < 10: continue
    lp = loops(cv2.dilate(reg.astype(np.uint8), ker))
    if lp: top.append(dict(z=float(Lv), loops=lp))
thr = loops(cv2.dilate((TH & (np.hypot(GX, GY) < 13.2)).astype(np.uint8), np.ones((3, 3), np.uint8)), eps=2.0, minarea=30)
pieces = json.load(open(S+'/pieces.json'))
out = dict(dial=dial, top=top, through=thr, pieces=pieces)
json.dump(out, open(S+'/platine_s.json', 'w'), separators=(',', ':'))
npts = sum(len(l) for c in dial + top for l in c['loops']) + sum(len(l) for l in thr)
print('niveaux cadran', len(dial), [c['z'] for c in dial]); print('niveaux ponts', len(top), [c['z'] for c in top]); print('perçages', len(thr), 'points', npts)
import os; print('taille', os.path.getsize(S+'/platine_s.json'))
