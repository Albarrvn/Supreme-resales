# Split one ElevenLabs take into the 8 lines by Whisper word times: python split_voice.py <dir with el/voz.wav + el/words.json> <nbareelshd dir>
import json, sys, unicodedata, soundfile as sf, numpy as np
S, D = sys.argv[1], sys.argv[2]
W = json.load(open(f'{S}/el/words.json')); y, sr = sf.read(f'{S}/el/voz.wav')
n = lambda s: unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode().strip(' ,.¡!¿?')
# first word of each line, found in order (the "a" after "16," and the "y" after "más" split the two merged sentences)
starts = ['dallas', 'debuto', 'a', 'en', 'luego', 'solo', 'y', 'el']; idx = []; j = 0
for k, s in enumerate(starts):
    prev = {'a': '16', 'y': 'mas', 'solo': 'partido'}.get(s)
    while not (n(W[j][0]) == s and (prev is None or n(W[j - 1][0]) == prev)): j += 1
    idx.append(j); j += 1
idx.append(len(W)); dur = {}
for k in range(8):
    a, b = idx[k], idx[k + 1] - 1
    t0 = max(0, W[a][1] - .04)
    t1 = min(W[b][2] + .12, W[idx[k + 1]][1] - .02) if k < 7 else min(len(y) / sr, W[b][2] + .3)
    seg = y[int(t0 * sr):int(t1 * sr)].copy(); f = int(.01 * sr); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    sf.write(f'{D}/voices/microluka_el/m{k}.wav', seg, sr); dur[f'm{k}'] = round(len(seg) / sr, 3)
    print(f'm{k} {t0:6.2f}-{t1:6.2f}', ' '.join(w[0].strip() for w in W[a:b + 1]))
json.dump(dur, open(f'{D}/voices/microluka_el/dur.json', 'w'), indent=0)
