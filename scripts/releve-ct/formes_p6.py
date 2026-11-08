"""Formes des pièces dessinées seules sur la CT p. 6 (vue de dessus), à l'échelle de la platine de la page.
Pour chaque pièce : chemin rempli le plus grand près du repère, découpé en sous-chemins (contour + ajours),
en mm relatifs au centre donné. Usage : python -I formes_p6.py <CT.pdf> <sortie.json>"""
import sys, json, math, pymupdf
sys.path.insert(0, __import__('os').path.dirname(__file__))
from geo import pts_of, circle_fit
S = 12.8 / 47.314                                   # mm par point (platine de la page)
doc = pymupdf.open(sys.argv[1]); D = doc[5].get_drawings()
CENTRES = {"9": (255.6, 294.0), "10": (312.3, 294.6), "11": (366.7, 294.4), "12": (418.1, 294.3), "14": (91.7, 426.0),
           "19": (401.2, 426.1), "20": (462.5, 424.1), "26": (80.4, 691.5), "27": (118.5, 693.7), "28": (158.6, 693.4),
           "29": (198.0, 693.4), "31-2": (512.7, 689.6), "23": (134.6, 559.6)}
def bez(p0, p1, p2, p3, n=10):
    return [((1-t)**3*p0.x+3*(1-t)**2*t*p1.x+3*(1-t)*t*t*p2.x+t**3*p3.x, (1-t)**3*p0.y+3*(1-t)**2*t*p1.y+3*(1-t)*t*t*p2.y+t**3*p3.y) for t in [i/n for i in range(1, n+1)]]
def subpaths(d):
    out, cur, last = [], [], None
    for it in d['items']:
        a = it[1]
        if last is None or math.hypot(a.x-last[0], a.y-last[1]) > 1e-3:
            if len(cur) > 2: out.append(cur)
            cur = [(a.x, a.y)]
        if it[0] == 'l': cur.append((it[2].x, it[2].y)); last = cur[-1]
        elif it[0] == 'c': cur += bez(*it[1:5]); last = cur[-1]
        elif it[0] == 're':
            r = it[1]; cur = [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1)]; last = None
    if len(cur) > 2: out.append(cur)
    return out
def area(p): return 0.5 * sum(p[i][0]*p[i-1][1] - p[i-1][0]*p[i][1] for i in range(len(p)))
res = {"_source": "CT ETA 2824-2 FDE 481688 25, p. 6 ; échelle 12,8 / 47,314 mm/pt ; repère : centre de la pièce, +Y vers le haut de la page", "pieces": {}}
for n, (cx, cy) in CENTRES.items():
    cands = [d for d in D if d.get('fill') and abs(d['fill'][0]-0.58) < 0.03 and math.hypot((d['rect'].x0+d['rect'].x1)/2-cx, (d['rect'].y0+d['rect'].y1)/2-cy) < 3]
    if not cands: print(n, 'introuvable'); continue
    d = max(cands, key=lambda d: d['rect'].width * d['rect'].height)
    sp = sorted(subpaths(d), key=lambda p: -abs(area(p)))
    mm = [[[round((x-cx)*S, 4), round(-(y-cy)*S, 4)] for x, y in p] for p in sp]
    res["pieces"][n] = {"contour": mm[0], "ajours": mm[1:], "even_odd": d.get('even_odd')}
    print(n, 'sous-chemins', len(sp), 'aires mm2', [round(abs(area(p))*S*S, 3) for p in sp[:12]])
json.dump(res, open(sys.argv[2], 'w'))
