"""Mix for the pixel reel: original chiptune (pulse lead, triangle bass, noise drums, echo) + 8-bit foley + cloned voice → out/mix.wav
LIB=... $LIB/.venv/bin/python mix.py   (run events.mjs first)"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import resample_poly
from scipy.ndimage import maximum_filter1d, uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core/audio'))
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add
rng = np.random.default_rng(15)
ev = json.load(open(os.path.join(HERE, 'out', 'events.json'))); DUR = ev['dur']; N = int((DUR + .3) * SR)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------- chip voices ----------
def pulse(m, d, duty=.25, v=1.0):
    tt = t_(d); ph = (hz(m) * tt) % 1; x = np.where(ph < duty, 1.0, -1.0)
    return x * np.minimum(1, tt / .003) * np.minimum(1, (d - tt) / .01) * v
def tri(m, d, v=1.0):   # 4-bit triangle
    tt = t_(d); ph = (hz(m) * tt) % 1; x = np.round((1 - 4 * np.abs(ph - .5)) * 7) / 7
    return x * np.minimum(1, (d - tt) / .01) * v
def lfsr(d, short=False):  # noise channel: sample-and-hold random at a coarse rate
    n = int(d * SR); step = 6 if short else 2; x = np.repeat(rng.choice([-1.0, 1.0], n // step + 1), step)[:n]; return x
def crush(x, bits=5): q = 2 ** (bits - 1); return np.round(x * q) / q

# ---------- 8-bit foley ----------
def blip(): m = int(rng.integers(76, 80)); return pulse(m, .025, .5, .5)
def boom(): d = .7; tt = t_(d); f = 30 + 90 * np.exp(-tt / .06); return norm(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * env_exp(d, .2) * .7 + lfsr(d) * env_exp(d, .06))
def dribble(): d = .12; tt = t_(d); f = 60 + 80 * np.exp(-tt / .012); return norm(crush(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .03), 4))
def shoot(): d = .18; tt = t_(d); f = 300 + 1500 * tt / d; return norm(np.where((np.cumsum(f) / SR) % 1 < .25, 1.0, -1.0) * env_exp(d, .08))
def swish(): d = .22; return norm(hp(lfsr(d, True), 3000) * np.sin(np.pi * t_(d) / d))
def levelup(): return np.concatenate([pulse(m, .07, .5) for m in (72, 76, 79, 84, 88)] + [pulse(91, .2, .5)])
def swirl(): d = .9; tt = t_(d); f = 1600 * np.exp(-tt * 2.5) + 150; return norm(np.where((np.cumsum(f) / SR) % 1 < .5, 1.0, -1.0) * (tt / d) ** .5 * .8 + lfsr(d) * (tt / d) * .3)
def fanfare(): return np.concatenate([pulse(m, .12, .5) for m in (72, 72, 72)] + [pulse(76, .3, .5), pulse(74, .15, .5), pulse(79, .6, .5)])
def static(d): return lp(lfsr(d, True), 6000) * .4
def crowd(): d = 3.0; tt = t_(d); return norm(bp(rng.standard_normal(len(tt)), 300, 2500) * np.minimum(1, tt / .2) * np.exp(-tt / 1.6))
def select(): return np.concatenate([pulse(84, .05, .5), pulse(91, .08, .5)])
def hit():  # punch: low thud + crunchy noise crack, bit-crushed
    d = .25; tt = t_(d); f = 55 + 120 * np.exp(-tt / .02); return norm(crush(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .07) + lfsr(d) * env_exp(d, .02) * .8, 5))
FOL = {'hit': (hit, .32), 'coin': (lambda: np.concatenate([pulse(83, .03, .5), pulse(90, .05, .5)]) * .5, .1), 'boom': (boom, .38), 'blip': (blip, .09), 'dribble': (dribble, .28), 'shoot': (shoot, .12), 'swish': (swish, .2), 'levelup': (levelup, .16),
       'swirl': (swirl, .22), 'fanfare': (fanfare, .2), 'crowd': (crowd, .22), 'select': (select, .16)}
fol = np.zeros((N, 2))
for e in ev['ev']:
    if e['type'] == 'static': add(fol, static(e['d']), e['t'], .05); continue
    if e['type'] in FOL: fn, g = FOL[e['type']]; add(fol, fn().astype(float), e['t'], g, pan=float(rng.uniform(-.2, .2)))

# ---------- score: 140 bpm, A minor; gold = key change to C major with the full band ----------
secs = sorted((e['t'], e['name']) for e in ev['ev'] if e['type'] == 'section')
sec_at = lambda t: ([s for a, s in secs if a <= t + 1e-6] or ['A'])[-1]
B = 60 / 140; S16 = B / 4
PROG = {'min': [45, 41, 48, 43], 'maj': [48, 53, 55, 48]}
LEAD = [0, 3, 7, 10, 7, 3, 12, 10, 7, 5, 3, 5, 7, -1, 3, -1]       # original 16-step phrase over the chord root (−1 = rest)
mus = np.zeros((N, 2))
for i in range(int(DUR / S16)):
    t = i * S16; s = sec_at(t)
    if s in ('D', 'end'): continue
    bar = int(t / (B * 4)); st = i % 16; key = 'maj' if s == 'G' else 'min'; root = PROG[key][bar % 4]
    if st % 2 == 0: add(mus, tri(root + (12 if st % 4 == 2 else 0), S16 * 1.8), t, .30)
    if st in (0, 8) or (s in ('B', 'G') and st == 10): add(mus, norm(lfsr(.08) * env_exp(.08, .02)) + tri(33, .08) * .6, t, .22)
    if st in (4, 12) and s != 'A': add(mus, norm(lfsr(.12) * env_exp(.12, .04)), t, .16)
    if s != 'M' and st % 2 == 1: add(mus, hp(lfsr(.03, True), 6000) * env_exp(.03, .008), t, .07, pan=.3)
    if s in ('B', 'G', 'M') and LEAD[st] >= 0:
        m = root + 24 + (LEAD[st] if key == 'min' else [0, 4, 7, 12, 7, 4, 12, 11, 7, 5, 4, 5, 7, -1, 4, -1][st])
        if m >= root + 24: add(mus, pulse(m, S16 * .9, .25), t, .07 if s == 'M' else .1, pan=-.25)
# SNES-style echo: a few taps with feedback, low-passed
echo = np.zeros_like(mus)
for dly, g in ((.19, .35), (.29, .22), (.37, .14)):
    k = int(dly * SR); echo[k:] += mus[:-k] * g
mus = mus + lp(echo.T, 3500).T * .8

# ---------- voice: compressed, music ducked ~8 dB under it ----------
vo = np.zeros((N, 2)); vad = np.zeros(N)
for e in ev['ev']:
    if e['type'] != 'voice': continue
    y, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = hp(resample_poly(y, SR, sr), 110); y = y + .5 * bp(y, 2500, 5000)
    y = norm(sfx.compress(y / (np.abs(y).max() + 1e-9), thr=.2, ratio=5, att=.002, rel=.08), .9)
    add(vo, y, e['t'], .85); s0 = int(e['t'] * SR); vad[s0:s0 + len(y)] = 1
vad = uniform_filter1d(maximum_filter1d(vad, size=int(.16 * SR)), size=int(.3 * SR))
mus *= (1 - .6 * vad)[:, None] * .45   # announcer on top: music ducked under the voice
mix = mus + vo + fol
for c in range(2): mix[:, c] = sfx.limit(mix[:, c], .95)
assert np.isfinite(mix).all()
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); m = vad > .5
print(f'voice {db(vo[m]):.1f} dB  music under voice {db(mus[m]):.1f} dB  foley {db(fol):.1f} dB  peak {20*np.log10(np.abs(mix).max()):.2f}')
