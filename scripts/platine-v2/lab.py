import sys; sys.path.insert(0, sys.argv[1]+'/py')
import numpy as np, cv2
S = sys.argv[1]; z = np.load(S+'/seg.npz'); grey = z['grey']
k = 1200/72; X0, Y0 = 190, 135
def px2mm(u, v):
    pt_x, pt_y = X0 + u/k, Y0 + v/k
    return (-0.19967091*pt_x + 0.00179759*pt_y + 53.4458212, 0.00157667*pt_x - 0.20041717*pt_y + 43.4791052)
n, lab, st, cen = cv2.connectedComponentsWithStats(grey.astype(np.uint8), connectivity=4)
rng = np.random.default_rng(3); col = rng.integers(60, 255, (n, 3)).astype(np.uint8); col[0] = 0
vis = col[lab]; vis[z['white']] = 255; vis[z['red']] = (0,0,200); vis[z['dark']] = (40,40,40)
mm2 = (1/k*0.2)**2
rows = []
for i in range(1, n):
    if st[i,4] < 400: continue
    x, y = px2mm(*cen[i]); rows.append((i, st[i,4]*mm2, x, y))
small = cv2.resize(vis, (1600,1600), interpolation=cv2.INTER_AREA)
f = 1600/vis.shape[0]
for i, a, x, y in rows:
    if a > 0.03:
        cv2.putText(small, str(i), (int(cen[i][0]*f)-8, int(cen[i][1]*f)+5), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0,0,0), 1, cv2.LINE_AA)
cv2.imwrite(S+'/pdf/labels.png', small)
np.save(S+'/lab.npy', lab.astype(np.int32))
for i, a, x, y in sorted(rows, key=lambda r: -r[1])[:70]: print(f"{i:5d} aire={a:7.3f}mm2  centre=({x:6.2f},{y:6.2f})  bbox_px={st[i,:4]}")
