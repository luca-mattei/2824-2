import sys; sys.path.insert(0, sys.argv[1]+'/py')
import numpy as np, cv2, json
S = sys.argv[1]; z = np.load(S+'/seg.npz'); lab = np.load(S+'/lab.npy')
k = 1200/72; X0, Y0 = 190, 135
H, W = lab.shape
vv, uu = np.mgrid[0:H, 0:W]
ptx, pty = X0 + uu/k, Y0 + vv/k
MX = -0.19967091*ptx + 0.00179759*pty + 53.4458212
MY = 0.00157667*ptx - 0.20041717*pty + 43.4791052
R = np.hypot(MX, MY); TH = np.degrees(np.arctan2(MY, MX)) % 360
inside = ~z['white'] | (R < 9)   # non blanc (gris, traits, rouge, pièces)
# rayon dessiné par angle (bord extérieur) : max R des pixels non blancs par bin d'angle
nonw = ~z['white']
bins = np.arange(0, 361, 1)
Rd = np.zeros(360)
for b in range(360):
    m = nonw & (TH >= b) & (TH < b+1) & (R < 16)
    Rd[b] = np.percentile(R[m], 99.9) if m.any() else np.nan
print('R dessiné min/med/max', np.nanmin(Rd), np.nanmedian(Rd), np.nanmax(Rd))
print('par 30°:', [round(Rd[a],2) for a in range(0,360,30)])
np.save(S+'/Rd.npy', Rd)
