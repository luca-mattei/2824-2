import sys; sys.path.insert(0, sys.argv[1]+'/py')
import pymupdf as fitz
d = fitz.open(sys.argv[2])
for spec in sys.argv[3:]:
    pg, dpi, *clip = spec.split(':')
    p = d[int(pg)-1]
    r = p.rect
    if clip:
        x0,y0,x1,y1 = map(float, clip[0].split(','))
        cl = fitz.Rect(r.width*x0, r.height*y0, r.width*x1, r.height*y1)
    else: cl = r
    name = f"{sys.argv[1]}/pdf/hi_{pg}_{dpi}" + (("_"+clip[0].replace(',','-')) if clip else "") + ".png"
    p.get_pixmap(dpi=int(dpi), clip=cl).save(name); print(name)
