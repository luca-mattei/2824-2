import sys; sys.path.insert(0, sys.argv[1]+'/py')
import fitz
d = fitz.open(sys.argv[2])
print(d.metadata, len(d))
for i,p in enumerate(d):
    t = p.get_text().strip().replace('\n',' | ')
    print(f"--- p{i+1} ({len(p.get_images())} img): {t[:600]}")
    p.get_pixmap(dpi=110).save(f"{sys.argv[1]}/pdf/p{i+1:02d}.png")
