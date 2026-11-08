import sys, json, zlib, base64; sys.path.insert(0, sys.argv[1]+'/py')
import numpy as np
S = sys.argv[1]; d = json.load(open(S+'/platine_s.json'))
def enc(groups):
    # groups: list of (z, loops) -> header + int16 coords
    hdr = []; buf = []
    for z, loops in groups:
        hdr.append([round(z, 3), [len(l) for l in loops]])
        for l in loops: buf.append(np.round(np.array(l) * 1000).astype('<i2').ravel())
    return hdr, np.concatenate(buf).tobytes()
h1, b1 = enc([(c['z'], c['loops']) for c in d['dial']])
h2, b2 = enc([(c['z'], c['loops']) for c in d['top']])
h3, b3 = enc([(0, d['through'])])
blob = zlib.compress(json.dumps(dict(h1=h1, h2=h2, h3=h3, n1=len(b1), n2=len(b2))).encode() + b'\0' + b1 + b2 + b3, 9)
s = base64.b64encode(blob).decode()
open(S+'/blob_s.b64', 'w').write(s); print(len(s))
