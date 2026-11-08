import sys; sys.path.insert(0, sys.argv[1]+'/py')
import pymupdf as fitz, numpy as np, cv2, json
S = sys.argv[1]
d = fitz.open(sys.argv[2]); p = d[7]
clip = fitz.Rect(190, 135, 350, 295); DPI = 1200; k = DPI/72
pix = p.get_pixmap(dpi=DPI, clip=clip, alpha=False)
img = np.frombuffer(pix.samples, np.uint8).reshape(pix.h, pix.w, 3).copy()
cv2.imwrite(S+'/pdf/v1_raw.png', img[:,:,::-1])
r,g,b = [img[:,:,i].astype(int) for i in range(3)]
grey = (abs(r-168)<14)&(abs(g-170)<14)&(abs(b-170)<14)
dark = (abs(r-93)<14)&(abs(g-97)<14)&(abs(b-97)<14)
white = (r>235)&(g>235)&(b>235)
red = (r>150)&(g<90)
print(pix.w, pix.h, grey.mean(), dark.mean(), white.mean(), red.mean())
np.savez_compressed(S+'/seg.npz', grey=grey, dark=dark, white=white, red=red)
n, lab, st, cen = cv2.connectedComponentsWithStats(grey.astype(np.uint8), connectivity=4)
big = [i for i in range(1,n) if st[i,4] > 400]
print('composantes grises', n-1, 'significatives', len(big))
