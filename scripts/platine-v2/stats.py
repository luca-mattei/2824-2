import sys; sys.path.insert(0, sys.argv[1]+'/py'); exec(open(sys.argv[1]+'/common.py').read())
vv, uu = np.mgrid[0:H, 0:W]
MX, MY = px2mm(uu, vv); R = np.hypot(MX, MY); TH = (np.degrees(np.arctan2(MY, MX)) % 360).astype(int)
np.save(S+'/MXY.npy', np.stack([MX, MY]).astype(np.float32))
n = lab.max() + 1
idx = lab.ravel(); cnt = np.bincount(idx, minlength=n)
rows = []
mm2 = (0.2/k)**2
for i in np.nonzero(cnt > 300)[0]:
    if i == 0: continue
    m = lab == i
    r = R[m]; t = TH[m]
    cov = len(np.unique(t)) / 360
    rows.append(dict(id=int(i), a=round(cnt[i]*mm2, 3), x=round(float(MX[m].mean()), 2), y=round(float(MY[m].mean()), 2),
                     r10=round(float(np.percentile(r, 5)), 2), r90=round(float(np.percentile(r, 95)), 2), cov=round(cov, 2)))
import json; json.dump(rows, open(S+'/comp.json', 'w'))
for c in sorted(rows, key=lambda c: -c['a']):
    if c['a'] > 0.02: print(c)
