import sys, json; sys.path.insert(0, sys.argv[1]+'/py'); exec(open(sys.argv[1]+'/common.py').read())
MXY = np.load(S+'/MXY.npy'); MX, MY = MXY; R = np.hypot(MX, MY)
comps = {c['id']: c for c in json.load(open(S+'/comp.json'))}
LV = np.full(lab.shape, np.nan, np.float32)
lvl = {}
man = {594:.30, 725:.30, 513:.30, 1624:.30, 1939:.30, 1445:.38, 772:.38,
       632:.50, 660:.60, 687:.70, 759:.78, 750:.50, 720:.50,
       956:.50, 1113:.60, 1206:.70,
       1609:.44, 1704:.52, 1684:.56, 1662:.60, 1730:.70, 1871:.60, 1541:.44, 1629:.44, 1514:.44,
       414:.55, 1897:.30, 2049:.30, 1655:.38}
for i, c in comps.items():
    if i in man: lvl[i] = man[i]; continue
    rm = (c['r10'] + c['r90']) / 2; ring = c['cov'] >= 0.06 and (c['r90'] - c['r10']) < 1.3 and c['r10'] > 8.2
    if ring:
        lvl[i] = .62 if rm >= 12.3 else .30 if rm >= 11.83 else .44 if rm >= 11.0 else .48 if rm >= 10.0 else .52 if rm >= 9.2 else .56
    elif c['y'] > 5.5 and c['r90'] < 11.3:
        lvl[i] = .72
# pièces de mise à l'heure (sautoir 236 + vis) et repères de lubrification : zone occultée -> creusure de mise à l'heure
OCC = .72
for i in (236, 475, 476, 473): lvl[i] = OCC
# voisinage pour le reste
assigned = np.zeros(lab.max()+1, bool); val = np.zeros(lab.max()+1, np.float32)
for i, v in lvl.items(): assigned[i] = True; val[i] = v
ids = [i for i in comps if i not in lvl]
k3 = np.ones((7,7), np.uint8)
for it in range(4):
    left = []
    for i in ids:
        c = comps[i]
        m = (lab == i).astype(np.uint8)
        ring = cv2.dilate(m, k3) & (1 - m)
        nb = lab[ring.astype(bool)]; nb = nb[assigned[nb]]
        if len(nb):
            vals, cnt = np.unique(val[nb], return_counts=True); v = float(vals[cnt.argmax()])
            if c['a'] < 0.7 and c['r90'] - c['r10'] < 1.2: v = min(v + .06, .80)   # petit lamage autour d'un trou
            lvl[i] = v; assigned[i] = True; val[i] = v
        else: left.append(i)
    ids = left
print('non attribués', len(ids))
LV = val[lab]; LV[~assigned[lab]] = np.nan; LV[lab == 0] = np.nan
# zones particulières
white = z['white'].copy(); red = z['red']
# repères de lubrification : composantes blanches qui touchent un trait rouge vif et situées en zone mise à l'heure
nW, wl, wst, wcen = cv2.connectedComponentsWithStats(white.astype(np.uint8), connectivity=4)
redd = cv2.dilate(red.astype(np.uint8), np.ones((5,5), np.uint8)).astype(bool)
marker = np.zeros(nW, bool)
for i in range(1, nW):
    x, y = px2mm(*wcen[i])
    if y > 2.0 and np.hypot(x, y) < 12.0 and redd[wl == i].mean() > 0.05: marker[i] = True
mk = marker[wl]
occ = z['dark'] | mk | (redd & (MY > 2.0) & (R > 2))
LV[occ] = OCC
through = white & ~mk & (R < 12.85)
# remplissage des traits et pixels non classés par le niveau le plus proche
known = ~np.isnan(LV)
_, idx = __import__('scipy.ndimage', fromlist=['x']).distance_transform_edt(~known, return_indices=True) if False else (None, None)
inv = (~known).astype(np.uint8)
dist, lbl = cv2.distanceTransformWithLabels(inv, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
ky, kx = np.nonzero(known); kv = LV[ky, kx]
# lbl indexe les pixels connus (zéros de inv) dans l'ordre de balayage
order = np.zeros(lbl.max()+1, np.float32); order[1:len(kv)+1] = kv
LV = np.where(known, LV, order[lbl])
np.savez_compressed(S+'/levels.npz', LV=LV.astype(np.float32), through=through, occ=occ)
vis = ((LV - 0.25) / 0.6 * 255).clip(0, 255).astype(np.uint8)
vis = cv2.applyColorMap(vis, cv2.COLORMAP_VIRIDIS); vis[through] = 255
cv2.imwrite(S+'/pdf/levels.png', cv2.resize(vis, (1100, 1100), interpolation=cv2.INTER_AREA))
