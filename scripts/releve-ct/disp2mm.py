# conversion des coordonnées lues sur <vue>_labels.png (affichée à l'échelle d) en mm
import sys, numpy as np
W, vue, d = sys.argv[1], sys.argv[2], float(sys.argv[3])
z = np.load(f'{W}/{vue}.npz'); x0, y0, cx, cy, s, k, mir = z['meta']; H, Wd = z['lab'].shape
f = 2400 / max(H, Wd)
for a in sys.argv[4:]:
    u, v = (float(t) * d / f for t in a.split(','))
    X = (x0 + u / k - cx) * s; Y = -(y0 + v / k - cy) * s
    print(f'[{-X if mir else X:.3f}, {Y:.3f}]', end=', ')
print()
