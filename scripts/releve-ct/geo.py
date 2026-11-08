import pymupdf, sys, math
def bez(p0,p1,p2,p3,n=8):
    return [((1-t)**3*p0.x+3*(1-t)**2*t*p1.x+3*(1-t)*t*t*p2.x+t**3*p3.x,(1-t)**3*p0.y+3*(1-t)**2*t*p1.y+3*(1-t)*t*t*p2.y+t**3*p3.y) for t in [i/n for i in range(n+1)]]
def pts_of(d):
    P=[]
    for it in d['items']:
        if it[0]=='l': P+= [(it[1].x,it[1].y),(it[2].x,it[2].y)]
        elif it[0]=='c': P+= bez(*it[1:5])
    return P
def hull(P):
    P=sorted(set(P))
    def cr(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lo=[];up=[]
    for p in P:
        while len(lo)>=2 and cr(lo[-2],lo[-1],p)<=0: lo.pop()
        lo.append(p)
    for p in reversed(P):
        while len(up)>=2 and cr(up[-2],up[-1],p)<=0: up.pop()
        up.append(p)
    return lo[:-1]+up[:-1]
def kasa(P):
    # x^2+y^2 + D x + E y + F = 0, moindres carrés (normales 3x3)
    import itertools
    S=[[0]*3 for _ in range(3)]; b=[0]*3
    for x,y in P:
        r=[x,y,1]; z=-(x*x+y*y)
        for i in range(3):
            b[i]+=r[i]*z
            for j in range(3): S[i][j]+=r[i]*r[j]
    # résolution Cramer
    def det(m): return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0])
    d=det(S)
    if abs(d)<1e-12: return 0,0,1
    sol=[]
    for k in range(3):
        m=[row[:] for row in S]
        for i in range(3): m[i][k]=b[i]
        sol.append(det(m)/d)
    D,E,F=sol; cx,cy=-D/2,-E/2; return cx,cy,math.sqrt(cx*cx+cy*cy-F)

def circle_fit(P):
    H=hull(P); cx,cy,r=kasa(H)
    for _ in range(4):
        H2=[q for q in H if abs(math.hypot(q[0]-cx,q[1]-cy)-r)<0.6]
        if len(H2)<6: break
        H=H2; cx,cy,r=kasa(H)
    return cx,cy,r,len(H)

import random
def circle3(a,b,c):
    ax,ay=a; bx,by=b; cx,cy=c
    d=2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by))
    if abs(d)<1e-9: return None
    ux=((ax*ax+ay*ay)*(by-cy)+(bx*bx+by*by)*(cy-ay)+(cx*cx+cy*cy)*(ay-by))/d
    uy=((ax*ax+ay*ay)*(cx-bx)+(bx*bx+by*by)*(ax-cx)+(cx*cx+cy*cy)*(bx-ax))/d
    return ux,uy,math.hypot(ax-ux,ay-uy)
def ransac_circle(P, tol=0.4, it=4000, rmin=40, seed=1):
    rnd=random.Random(seed); best=None
    for _ in range(it):
        c=circle3(*rnd.sample(P,3))
        if not c or c[2]<rmin: continue
        n=sum(1 for q in P if abs(math.hypot(q[0]-c[0],q[1]-c[1])-c[2])<tol)
        if not best or n>best[0]: best=(n,c)
    inl=[q for q in P if abs(math.hypot(q[0]-best[1][0],q[1]-best[1][1])-best[1][2])<tol]
    cx,cy,r=kasa(inl); return cx,cy,r,len(inl),len(P)
def is_circle(d, tol=0.03):
    if d['items'] and all(it[0]=='c' for it in d['items']) and len(d['items']) in (4,8):
        P=pts_of(d); cx,cy,r=kasa(P)
        if r>0 and max(abs(math.hypot(x-cx,y-cy)-r) for x,y in P) < tol*r+0.05: return cx,cy,r
    return None
