#!/usr/bin/env python3
"""Build voiceover.wav + src/timing.json from raw.wav, SHOTS.txt and ASR word times (raw_words.json).
usage: build_voice.py PROJECT [--tempo 1.0] [--gap 0.38]"""
import json, sys, subprocess, unicodedata, re, os
P = sys.argv[1]
tempo = float(sys.argv[sys.argv.index('--tempo')+1]) if '--tempo' in sys.argv else 1.0
gap = float(sys.argv[sys.argv.index('--gap')+1]) if '--gap' in sys.argv else 0.38
norm = lambda s: re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode())
shots = [(k.strip(), t.strip()) for k, t in (l.split('|', 1) for l in open(f'{P}/SHOTS.txt', encoding='utf-8') if '|' in l)]
W = json.load(open(f'{P}/raw_words.json'))
def lev(a, b):
    d = list(range(len(b)+1))
    for i, ca in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, cb in enumerate(b, 1): p, d[j] = d[j], min(d[j]+1, d[j-1]+1, p+(ca != cb))
    return d[-1]
idx = 0; bounds = []
for k, t in shots:
    last = norm(t.split()[-1]); best = None
    for j in range(idx, min(len(W), idx + 60)):
        w = norm(W[j][2])
        if w and (w == last or lev(w, last) <= max(2, len(last)//3)): best = j; break
    if best is None: sys.exit(f'no match for end of {k}: {last}')
    bounds.append((idx, best)); idx = best + 1
# build pieces: each shot = list of speech segments; inner pauses longer than 0.3 s are shortened to 0.22 s
inner = 0.22
import numpy as np
_pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{P}/raw.wav', '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout, np.int16).astype(float) / 32768
def silent(a, b):  # true only if every 50 ms window in [a,b] is below -38 dB, so ASR timing errors never cut speech
    x = _pcm[int(a * 16000):int(b * 16000)]
    if len(x) < 800: return False
    w = x[:len(x) // 800 * 800].reshape(-1, 800)
    return 20 * np.log10(np.sqrt((w ** 2).mean(1)).max() + 1e-9) < -38
shotsegs = []
for (a, b) in bounds:
    segs = []; s0 = max(0, W[a][0] - 0.05)
    for j in range(a, b):
        if W[j+1][0] - W[j][1] > 0.3 and silent(W[j][1] + 0.03, W[j+1][0] - 0.03):
            segs.append((s0, W[j][1] + 0.06)); s0 = W[j+1][0] - 0.05
    segs.append((s0, W[b][1] + 0.12)); shotsegs.append(segs)
filt = []; lab = []; n = 0
for i, segs in enumerate(shotsegs):
    for q, (s, e) in enumerate(segs):
        filt.append(f'[0:a]atrim={s:.3f}:{e:.3f},asetpts=PTS-STARTPTS[s{n}]'); lab.append(f'[s{n}]'); n += 1
        g = gap if q == len(segs) - 1 else inner
        if not (i == len(shotsegs) - 1 and q == len(segs) - 1):
            filt.append(f'anullsrc=r=24000:cl=stereo,atrim=0:{g:.3f}[g{n}]'); lab.append(f'[g{n}]')
pieces = [(0, sum(e - s for s, e in segs) + inner * (len(segs) - 1)) for segs in shotsegs]
lead, tail = 0.15, 0.8
filt.append(''.join(lab) + f'concat=n={len(lab)}:v=0:a=1,aresample=48000,atempo={tempo:.4f},adelay={int(lead*1000)}|{int(lead*1000)},apad=pad_dur={tail},loudnorm=I=-16:TP=-1.5[out]')
r = subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f'{P}/raw.wav', '-filter_complex', ';'.join(filt), '-map', '[out]', '-ar', '48000', '-ac', '2', f'{P}/voiceover.wav'], capture_output=True, text=True)
if r.returncode: sys.exit(r.stderr)
t = 0; out = []
for i, ((k, txt), (s, e)) in enumerate(zip(shots, pieces)):
    d = e - s
    out.append(dict(key=k, start=round(t/tempo + lead, 3), end=round((t + d)/tempo + lead, 3), words=len(txt.split()), text=txt))
    t += d + gap
timing = dict(fps=30, duration=round(out[-1]['end'] + 0.75, 2), shots=out)
os.makedirs(f'{P}/src', exist_ok=True)
json.dump(timing, open(f'{P}/src/timing.json', 'w'), indent=1, ensure_ascii=False)
print(P, 'duration', timing['duration'])
for o in out: print(f"  {o['key']:9} {o['start']:6.2f}-{o['end']:6.2f} {o['text'][:50]}")
