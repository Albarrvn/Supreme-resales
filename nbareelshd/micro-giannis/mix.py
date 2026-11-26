"""Mix for Micro Luka: groove (kit + bass, 118 → 136 bpm) + one colour instrument per medium + party/medium foley + cloned voice → out/mix.wav
LIB=... $LIB/.venv/bin/python mix.py   (run events.mjs first)"""
import os, sys, json, numpy as np, soundfile as sf
from scipy.signal import resample_poly
from scipy.ndimage import maximum_filter1d, uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core/audio'))
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add
rng = np.random.default_rng(77)
ev = json.load(open(os.path.join(HERE, 'out', 'events.json'))); DUR = ev['dur']; N = int((DUR + .3) * SR)
E = ev['ev']; hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def sq(m, d, duty=.5): tt = t_(d); return np.where((hz(m) * tt) % 1 < duty, 1., -1.) * np.minimum(1, (d - tt) / .01)
def sine(m, d, tau): tt = t_(d); return np.sin(2 * np.pi * hz(m) * tt) * env_exp(d, tau)

# ---------- tempo map and sections ----------
speed = [e['t'] for e in E if e['type'] == 'speedup']; SPEED = speed[0] if speed else 1e9
dark = [e['t'] for e in E if e['type'] == 'section' and e['name'] == 'dark'][0]
media = sorted((e['t'], e['m'], e['end']) for e in E if e['type'] == 'medium')
def medium_at(t): return ([m for a, m, end in media if a <= t < end + .4] or [None])[-1]

# ---------- groove ----------
def kick(): d = .3; tt = t_(d); f = 48 + 90 * np.exp(-tt / .03); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .12)
def snare(): d = .2; tt = t_(d); return bp(noise(d), 1500, 7000) * env_exp(d, .05) + np.sin(2 * np.pi * 200 * tt) * env_exp(d, .03) * .5
def hat(): d = .04; return hp(noise(d), 7500) * env_exp(d, .01)
def bass(m, d): tt = t_(d); x = sum(a * np.sin(2 * np.pi * hz(m) * k * tt) for k, a in ((1, 1), (2, .6), (3, .35))); return np.tanh(x * 1.5) * np.minimum(1, tt / .004) * env_exp(d, .09)
ROOT = [40, 40, 43, 45]      # E minor-ish party riff
COLOR = {   # one colour instrument per medium, plays the 8th-note riff
    'term': lambda m: sq(m + 24, .07, .25) * .5, 'term2': lambda m: sq(m + 24, .07, .25) * .5,
    'crayon': lambda m: sine(m + 36, .25, .08) + sine(m + 48, .25, .03) * .3,          # toy piano
    'riso': lambda m: sine(m + 24, .5, .25) * (1 + .3 * np.sin(2 * np.pi * 6 * t_(.5))),  # vibes
    'pixel': lambda m: sq(m + 24, .06, .125) * .5, 'blue': lambda m: hp(noise(.03), 2000) * env_exp(.03, .006) * 2,   # typewriter
    'swiss': lambda m: bp(noise(.04), 2000, 3500) * env_exp(.04, .01) * 3,               # claves
}
mus = np.zeros((N, 2)); t = 0.0; i = 0
while t < DUR:
    bpm = 136 if t >= SPEED else 118; s16 = 60 / bpm / 4
    if not (dark - .02 <= t < dark + .7) and t < DUR - .3:   # the long silence before the final stab
        st = i % 16; bar = i // 16; root = ROOT[bar % 4]; quiet = t >= dark
        if st in (0, 6, 10) and not quiet: add(mus, kick(), t, .5)
        if st in (4, 12) and not quiet: add(mus, snare(), t, .32)
        if st % 2 == 0 and not quiet: add(mus, hat(), t, .12, pan=.3)
        if st in (0, 3, 6, 8, 11, 14): add(mus, bass(root + (12 if st == 11 else 0), s16 * 1.6), t, .38)
        m = medium_at(t)
        if m and st % 2 == 0: add(mus, COLOR[m](root + [0, 7, 12, 7, 3, 7, 12, 15][(st // 2) % 8]).astype(float), t, .14, pan=-.25)
    t += s16; i += 1

# ---------- foley ----------
def stab(): return norm(sum(sq(m, .22, .5) for m in (64, 67, 71, 76)) * env_exp(.22, .08))
def whistle(): d = .25; tt = t_(d); f = 2600 + 300 * np.sin(2 * np.pi * 30 * tt); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) * .6
def spring(): d = .25; tt = t_(d); f = 300 + 900 * tt / d; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .1)
def ok(): return np.concatenate([sq(m, .08, .5) * .6 for m in (76, 81, 88)])
def fail(): return np.concatenate([sq(m, .14, .5) * .6 for m in (58, 54, 49)])
def crack(): d = .5; return norm(hp(noise(d), 3000) * env_exp(d, .06) + bp(noise(d), 5000, 9000) * env_exp(d, .015))
def flip(): d = .08; return bp(noise(d), 1500, 6000) * env_exp(d, .015)
def speedup(): return np.concatenate([sq(m, .06, .5) * .5 for m in range(60, 84, 2)])
def beep(): return sq(int(rng.integers(84, 89)), .03, .5) * .4
def slide(): d = .35; tt = t_(d); f = 200 + 1200 * tt / d; return np.where((np.cumsum(f) / SR) % 1 < .5, 1., -1.) * env_exp(d, .2) * .4
def squeak(): d = .14; tt = t_(d); f = 1800 + 700 * np.sin(np.pi * tt / d); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) * .5
def land(): d = .15; tt = t_(d); return np.sin(2 * np.pi * 90 * tt) * env_exp(d, .04)
def thunk(): d = .2; tt = t_(d); return np.sin(2 * np.pi * 70 * tt) * env_exp(d, .05) + bp(noise(d), 400, 2000) * env_exp(d, .01)
def stampf(): d = .12; return bp(noise(d), 300, 3000) * env_exp(d, .02)
def coin(k): return np.concatenate([sq(83 + k % 5, .04, .5), sq(90 + k % 5, .06, .5)]) * .35
def typew(): d = .04; return hp(noise(d), 2500) * env_exp(d, .005) + np.sin(2 * np.pi * 1400 * t_(d)) * env_exp(d, .008) * .4
def swish(): d = .25; return hp(noise(d), 4000) * np.sin(np.pi * t_(d) / d) * .5
def clave(): d = .06; return np.sin(2 * np.pi * 2500 * t_(d)) * env_exp(d, .012)
def bonk(): d = .3; tt = t_(d); f = 220 * np.exp(-tt * 4) + 80; return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .1)
def finalstab(): return norm(sum(sq(m, .6, .5) for m in (52, 64, 67, 71, 76)) * env_exp(.6, .25) + np.sin(2 * np.pi * 45 * t_(.6)) * env_exp(.6, .2))
def crowd(): d = 3.; tt = t_(d); return norm(bp(rng.standard_normal(len(tt)), 300, 2500) * np.minimum(1, tt / .15) * np.exp(-tt / 1.4))
FOL = {'stab': (stab, .2), 'whistle': (whistle, .1), 'spring': (spring, .12), 'ok': (ok, .16), 'fail': (fail, .18), 'crack': (crack, .25), 'flip': (flip, .14),
       'speedup': (speedup, .16), 'beep': (beep, .12), 'slide': (slide, .14), 'squeak': (squeak, .1), 'land': (land, .3), 'thunk': (thunk, .3), 'stamp': (stampf, .2),
       'type': (typew, .2), 'swish': (swish, .14), 'clave': (clave, .2), 'bonk': (bonk, .4), 'finalstab': (finalstab, .5), 'crowd': (crowd, .25)}
fol = np.zeros((N, 2))
for e in E:
    if e['type'] == 'coin': add(fol, coin(e['k']), e['t'], .18); continue
    if e['type'] in FOL: fn, g = FOL[e['type']]; add(fol, np.asarray(fn(), float), e['t'], g, pan=float(rng.uniform(-.2, .2)))

# ---------- voice: compressed; music −11 dB and foley −6 dB under it ----------
vo = np.zeros((N, 2)); vad = np.zeros(N)
for e in E:
    if e['type'] != 'voice': continue
    y, sr = sf.read(os.path.join(HERE, 'voices', e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    y = hp(resample_poly(y, SR, sr), 110); y = y + .5 * bp(y, 2500, 5000)
    y = norm(sfx.compress(y / (np.abs(y).max() + 1e-9), thr=.2, ratio=5, att=.002, rel=.08), .9)
    add(vo, y, e['t'], .85); s0 = int(e['t'] * SR); vad[s0:s0 + len(y)] = 1
vad = uniform_filter1d(maximum_filter1d(vad, size=int(.16 * SR)), size=int(.3 * SR))
mus *= (1 - .72 * vad)[:, None] * .5; fol *= (1 - .5 * vad)[:, None]
mix = mus + vo + fol
for c in range(2): mix[:, c] = sfx.limit(mix[:, c], .95)
assert np.isfinite(mix).all()
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); m = vad > .5
print(f'voice {db(vo[m]):.1f} dB  music under voice {db(mus[m]):.1f} dB  foley under voice {db(fol[m]):.1f}  peak {20*np.log10(np.abs(mix).max()):.2f}')
