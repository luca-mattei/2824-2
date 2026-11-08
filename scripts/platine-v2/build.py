import sys, json, pickle, math; sys.path.insert(0, sys.argv[1]+'/py'); exec(open(sys.argv[1]+'/common.py').read())
L = np.load(S+'/levels.npz'); LV, THR = L['LV'], L['through']
mah = json.load(open(S+'/mah.json'))
G, E = 0.02, 13.0; N = int(round(2*E/G)) + 1
cols = np.arange(N); gx = -E + cols*G; gy = E - cols*G
GX, GY = np.meshgrid(gx, gy)            # ligne 0 = +Y
GR = np.hypot(GX, GY)
def to_px(x, y):
    # inverse de la déformation radiale puis de l'affine
    r = np.hypot(x, y); t = np.degrees(np.arctan2(y, x)) % 360
    Rt = np.interp(t, th, Rs, period=360)
    rd = np.where(r > R0, R0 + (r - R0) * (Rt - R0) / (12.8 - R0), r)
    f = np.where(r > 1e-9, rd / np.maximum(r, 1e-9), 1.0); xd, yd = x*f, y*f
    A = np.array([[-0.19967091, 0.00179759], [0.00157667, -0.20041717]]); c = np.array([53.4458212, 43.4791052])
    Ai = np.linalg.inv(A)
    ptx = Ai[0,0]*(xd-c[0]) + Ai[0,1]*(yd-c[1]); pty = Ai[1,0]*(xd-c[0]) + Ai[1,1]*(yd-c[1])
    return (ptx - X0)*k, (pty - Y0)*k
PU, PV = to_px(GX, GY)
ui = np.clip(np.round(PU).astype(int), 0, W-1); vi = np.clip(np.round(PV).astype(int), 0, H-1)
inside = GR <= 12.8
D = LV[vi, ui].copy(); TH_ = THR[vi, ui] & inside
# nettoyage : indices de niveaux, filtre médian
qs = np.round(D / 0.02).astype(np.int32); qs = cv2.medianBlur(np.clip(qs, 0, 255).astype(np.uint8), 5).astype(np.float32) * 0.02
D = np.where(inside, qs, np.nan)
TH_ = cv2.medianBlur(TH_.astype(np.uint8)*255, 3) > 127
TH_[np.hypot(GX-7.0, GY-0.0) < 1.15] = False
# ---------- nouvelles pièces ----------
ZS = 1.05
stem = [  # (y0, y1, rayon, type)
  (6.90, 7.70, 0.20, 'rond'), (7.70, 9.45, 0.40, 'carre'), (9.45, 10.45, 0.36, 'rond'), (10.45, 10.80, 0.42, 'rond'),
  (10.80, 11.05, 0.25, 'rond'), (11.05, 17.30, 0.42, 'rond'), (17.30, 19.00, 0.30, 'filet')]
P2 = dict(y0=8.25, y1=9.35, R=0.58); P3 = dict(y0=9.50, y1=10.40, R=0.92)
Zmah = dict(sautoir=(0.36, 0.48), plaque=(0.50, 0.62))
NEW = []   # (nom, empreinte masque, zmin, zmax)
def rect_mask(x0, x1, y0, y1):
    return (GX >= x0) & (GX <= x1) & (GY >= y0) & (GY <= y1)
def poly_mask(p):
    m = np.zeros((N, N), np.uint8)
    pp = np.array([[(x + E)/G, (E - y)/G] for x, y in p], np.int32); cv2.fillPoly(m, [pp], 1); return m.astype(bool)
def disc_mask(x, y, r): return np.hypot(GX - x, GY - y) <= r
for y0, y1, r, t in stem: NEW.append(('tige', rect_mask(-r, r, y0, y1), ZS - r, ZS + r))
for P in (P2, P3): NEW.append(('pignon', rect_mask(-P['R'], P['R'], P['y0'], P['y1']), ZS - P['R'], ZS + P['R']))
# pièces de mise à l'heure (contours ETA p. 8) ; la bascule est reconstruite en barre
A_, B_ = (2.63, 8.49), (-0.85, 9.25)
def bar_poly(a, b, w):
    dx, dy = b[0]-a[0], b[1]-a[1]; l = math.hypot(dx, dy); px, py = -dy/l*w/2, dx/l*w/2
    return [(a[0]-px, a[1]-py), (b[0]-px, b[1]-py), (b[0]+px, b[1]+py), (a[0]+px, a[1]+py)]
NEW.append(('8', poly_mask(mah['8']['poly']), *Zmah['sautoir']))
NEW.append(('6', poly_mask(mah['6']['poly']), *Zmah['plaque']))
NEW.append(('7', poly_mask(bar_poly(A_, B_, 0.5)) | disc_mask(*A_, 0.42), *Zmah['plaque']))
NEW.append(('5', poly_mask(mah['5']['poly']), *Zmah['plaque']))
px6, py6, r6 = mah['6']['pion']; NEW.append(('6pion', disc_mask(px6, py6, r6), 0.20, 0.62))
px5, py5, r5 = mah['5']['pion']; NEW.append(('5pion', disc_mask(px5, py5, r5), 0.20, 0.62))
NEW.append(('6gorge', disc_mask(0.0, 10.92, 0.14), 0.62, ZS))      # goupille de tirette dans la gorge
NEW.append(('7fourche', rect_mask(-0.75, -0.45, 8.68, 8.92) | rect_mask(0.45, 0.75, 8.68, 8.92), 0.62, ZS))
vx, vy, vr = mah['8']['vis']
VIS_CADRAN = {'900 Vis du sautoir de tirette': (vx, vy, 0.40, 0.24, 0.36, 1.25),
              '907 Vis du pont de minuterie': (-4.5, 4.5, 0.40, 0.03, 0.15, 0.95),
              '900 Vis de la plaque du sautoir': (-3.6, -6.4, 0.40, 0.05, 0.17, 0.95)}
for nm, (x, y, r, zh0, zh1, zend) in VIS_CADRAN.items():
    NEW.append((nm, disc_mask(x, y, r), zh0, zh1)); NEW.append((nm+' tige', disc_mask(x, y, r*0.5), zh1, zend))
# fixateurs de cadran (côté ponts, logés dans le bord) : 62° et 242°, r 12.0
FIX = []
for a in (62.0, 242.0):
    c = (12.0*math.cos(math.radians(a)), 12.0*math.sin(math.radians(a))); FIX.append((round(c[0],4), round(c[1],4), a))
# ---------- occupation des pièces du GLB ----------
parts = pickle.load(open(S+'/tris.pkl', 'rb'))
REMPL = {'2 Pignon coulant', '3 Pignon de remontoir', '4 Tige de remontoir', '5 Levier de correcteur', '6 Tirette',
         '7 Bascule de pignon coulant', '8 Sautoir de tirette', '1-1 Fixateur de cadran (1/2)', '1-1 Fixateur de cadran (2/2)'} | set(VIS_CADRAN)
MID = 1.55
Dc = np.where(inside, D, np.nan).astype(np.float32)
T = np.where(GR <= 11.9, 2.15, 2.2).astype(np.float32)
for c, r in (((-5.88, 2.76), 6.25), ((7.0, 0.0), 5.15), ((-6.03, -4.62), 3.65), ((-2.5, -3.27), 3.9)):
    T[disc_mask(*c, r)] = 2.0
through = TH_.copy()
def raster(Tri, marge):
    zmin = np.full((N, N), np.inf, np.float32); zmax = np.full((N, N), -np.inf, np.float32)
    P = np.stack([(Tri[..., 0] + E)/G, (E - Tri[..., 1])/G], -1)
    for t, p in zip(Tri, P):
        x0, y0 = np.floor(p.min(0)).astype(int) - 2; x1, y1 = np.ceil(p.max(0)).astype(int) + 2
        if x1 < 0 or y1 < 0 or x0 >= N or y0 >= N: continue
        x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, N-1), min(y1, N-1)
        m = np.zeros((y1-y0+1, x1-x0+1), np.uint8)
        cv2.fillConvexPoly(m, np.round(p - [x0, y0]).astype(np.int32), 1)
        if marge: m = cv2.dilate(m, np.ones((2*marge+1, 2*marge+1), np.uint8))
        mb = m.astype(bool); zz = t[:, 2]
        sub = zmax[y0:y1+1, x0:x1+1]; sub[mb] = np.maximum(sub[mb], zz.max())
        sub = zmin[y0:y1+1, x0:x1+1]; sub[mb] = np.minimum(sub[mb], zz.min())
    return zmin, zmax
def appliquer(zmin, zmax, nom):
    global Dc, T, through
    occ = np.isfinite(zmax)
    dial = occ & (zmax <= MID); brid = occ & (zmin >= MID); trav = occ & ~dial & ~brid
    need = dial & (zmax + 0.03 > Dc); Dc = np.where(need, zmax + 0.03, Dc)
    need = brid & (zmin - 0.03 < T); T = np.where(need, zmin - 0.03, T)
    through |= trav & inside
logs = []
for nom, p in parts.items():
    if p['top'] in ('1 Platine',) or nom == '1 Platine' or nom in REMPL or (p['top'] in REMPL): continue
    Tri = p['T']
    if Tri[..., 2].max() < -0.5 and Tri[..., 2].min() < -0.5 and Tri[..., 2].max() < 0: continue
    zmin, zmax = raster(Tri, 3)
    occ = np.isfinite(zmax)
    if occ.any() and zmax[occ].max() <= MID:
        ell = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
        zz = cv2.morphologyEx(np.where(occ, zmax, -10).astype(np.float32), cv2.MORPH_CLOSE, ell)
        zz = np.where(occ, np.maximum(zz, zmax), zz)
        zmax = np.where(zz > -5, zz, -np.inf).astype(np.float32)
        zmin = np.where(np.isfinite(zmax), np.where(np.isfinite(zmin), zmin, zz), np.inf).astype(np.float32)
    if np.isfinite(zmax).any() and np.nanmax(np.where(np.isfinite(zmax), zmax, np.nan)) <= MID:
        zz = np.where(np.isfinite(zmax), zmax, -10).astype(np.float32)
        zz = cv2.dilate(zz, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
        zmax = np.where(zz > -5, zz, -np.inf).astype(np.float32); zmin = np.where(np.isfinite(zmax), np.minimum(np.where(np.isfinite(zmin), zmin, 9), zz), np.inf).astype(np.float32)
    tr = np.isfinite(zmax) & (zmax > MID) & (zmin < MID)
    if tr.any(): logs.append(f'traverse : {nom} ({tr.sum()} px)')
    appliquer(zmin, zmax, nom)
for nom, m, z0, z1 in NEW:
    mm = cv2.dilate(m.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    zmin = np.where(mm, z0, np.inf).astype(np.float32); zmax = np.where(mm, z1, -np.inf).astype(np.float32)
    appliquer(zmin, zmax, nom)
# fixateurs : logement côté ponts
for x, y, a in FIX: T[disc_mask(x, y, 0.95) & inside] = np.minimum(T[disc_mask(x, y, 0.95) & inside], 2.06)
# tunnel de tige dans le bord : pas de rainure ouverte au-delà de r 12.0 (la tige passe sous un pont de matière)
tun = rect_mask(-0.5, 0.5, 11.9, 13.0) & inside
Dc[tun] = np.minimum(Dc[tun], 0.30)
# piliers sous les vis de ponts (côté ponts), seulement là où aucune pièce ne passe entre 2.15 et 3.55
occB = np.full((N, N), np.inf, np.float32)
for nom, p in parts.items():
    if nom.startswith('1 ') or p['top'] == '1 Platine': continue
    Tri = p['T']; zlo = Tri[..., 2].min()
    if zlo < 2.0 or zlo > 3.55: continue
    if nom.startswith('901') or nom.startswith('13 ') or nom.startswith('16 ') or nom.startswith('22 ') or nom.startswith('24-1'): continue
    zmin, _ = raster(Tri, 0); occB = np.minimum(occB, zmin)
PIL = []
for x, y in ((-9.3, -7.0), (1.0, -7.6), (-10.4, 4.6), (-3.4, 9.2), (-1.2, 1.3), (5.9, -4.3), (4.15, -2.8), (10.3, -5.6)):
    for r in (0.75, 0.6, 0.48):
        m = disc_mask(x, y, r + 0.05)
        if np.all(occB[m] > 3.55): PIL.append((x, y, r)); T[disc_mask(x, y, r)] = 3.55; break
    else: logs.append(f'pilier impossible en {x},{y}')
# perçages : là où la matière restante est trop mince
thin = inside & (T - Dc < 0.12)
through |= thin
Dt = np.where(inside, Dc, 0.30).astype(np.float32)
Dt = cv2.morphologyEx(Dt, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
D = np.maximum(Dt, np.where(inside, Dc, 0) * 0)  # ouverture seule
D = np.where(inside, Dt, np.nan)
np.savez_compressed(S+'/maps.npz', D=D, T=T, through=through, GX=GX, GY=GY)
print('piliers', PIL); print('\n'.join(logs))
print('D min/max', np.nanmin(D), np.nanmax(D), 'T min/max', T[inside].min(), T[inside].max(), 'perçé %', through[inside].mean())
json.dump(dict(ZS=ZS, stem=stem, P2=P2, P3=P3, Zmah=Zmah, mah=mah, bascule=[A_, B_], vis_cadran=VIS_CADRAN, fixateurs=FIX, piliers=PIL), open(S+'/pieces.json', 'w'))
