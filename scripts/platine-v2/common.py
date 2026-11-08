import sys, numpy as np, cv2
S = sys.argv[1]
z = np.load(S+'/seg.npz'); lab = np.load(S+'/lab.npy'); Rd = np.load(S+'/Rd.npy')
k = 1200/72; X0, Y0 = 190, 135
H, W = lab.shape
def aff(u, v):
    ptx, pty = X0 + u/k, Y0 + v/k
    return (-0.19967091*ptx + 0.00179759*pty + 53.4458212, 0.00157667*ptx - 0.20041717*pty + 43.4791052)
# rayon dessiné lissé (robuste), tige exclue
th = np.arange(360); rr = Rd.copy(); rr[70:111] = np.nan
good = ~np.isnan(rr); rr = np.interp(th, th[good], rr[good], period=360)
Rs = np.array([np.percentile(np.take(rr, range(a-20, a+21), mode='wrap'), 75) for a in th])
R0 = 8.5
def warp(x, y):
    r = np.hypot(x, y); t = (np.degrees(np.arctan2(y, x)) % 360)
    Rt = np.interp(t, th, Rs, period=360)
    rn = np.where(r > R0, R0 + (r - R0) * (12.8 - R0) / (Rt - R0), r)
    f = np.where(r > 1e-9, rn / np.maximum(r, 1e-9), 1.0)
    return x * f, y * f
def px2mm(u, v):
    x, y = aff(np.asarray(u, float), np.asarray(v, float)); return warp(x, y)
