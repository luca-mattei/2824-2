import sys, json, struct, pickle
sys.path.insert(0, sys.argv[1]+'/py')
import numpy as np
f = open(sys.argv[2],'rb').read()
jl = struct.unpack('<I', f[12:16])[0]; J = json.loads(f[20:20+jl]); B = f[20+jl+8:]
CT = {5126:np.float32,5123:np.uint16,5125:np.uint32,5121:np.uint8}; NC = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def acc(i):
    a = J['accessors'][i]; bv = J['bufferViews'][a['bufferView']]
    return np.frombuffer(B, CT[a['componentType']], a['count']*NC[a['type']], bv.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'], NC[a['type']])
def qmat(q):
    x,y,z,w=q
    return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def local(n):
    M=np.eye(4); M[:3,:3]=qmat(n.get('rotation',[0,0,0,1]))@np.diag(n.get('scale',[1,1,1])); M[:3,3]=n.get('translation',[0,0,0]); return M
out = {}
def walk(i, P, top):
    n = J['nodes'][i]; W = P @ local(n); name = n.get('name', str(i))
    if 'mesh' in n:
        T = []
        for p in J['meshes'][n['mesh']]['primitives']:
            V = acc(p['attributes']['POSITION']).astype(float); I = acc(p['indices']).reshape(-1,3).astype(int)
            V = (W[:3,:3]@V.T).T + W[:3,3]
            V = np.stack([V[:,0], -V[:,2], V[:,1]], 1)   # repère Blender
            T.append(V[I])
        out[name] = dict(T=np.vstack(T), top=top, extras=n.get('extras', {}))
    for c in n.get('children', []): walk(c, W, top if top else name)
root = J['nodes'][J['scenes'][0]['nodes'][0]]
for c in root['children']: walk(c, np.eye(4), None)
pickle.dump(out, open(sys.argv[1]+'/tris.pkl', 'wb'))
print(len(out))
