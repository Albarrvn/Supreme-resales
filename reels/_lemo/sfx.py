# Shared synth SFX + music bed for the line-art reels. A reel's audio.py: `from sfx import *`, add events, then `write_mix(drops)`.
import numpy as np, wave, json
SR = 48000; TM = json.load(open('timing.json')); DUR = TM['duration']; SH = TM['shots']
S = {s['key']: s for s in SH}; KEYS = [s['key'] for s in SH]
cut = lambda k: 0 if k == KEYS[0] else (SH[KEYS.index(k) - 1]['end'] + S[k]['start']) / 2
W = lambda k, i: S[k]['start'] + (S[k]['end'] - S[k]['start']) * i / S[k]['words']
rng = np.random.default_rng(5); tt = lambda d: np.arange(int(d * SR)) / SR
sfx = np.zeros(int(SR * DUR)); mus = np.zeros(int(SR * DUR))
def env(d, a=.005, dec=8): t = tt(d); return np.minimum(t / a, 1) * np.exp(-t * dec)
def add(t0, x, g=1., b=None):
    b = sfx if b is None else b; i = int(t0 * SR); n = min(len(x), len(b) - i)
    if n > 0: b[i:i + n] += x[:n] * g
def lp(x, a):  # one-pole lowpass
    y = np.zeros_like(x); v = 0
    for i in range(len(x)): v += a * (x[i] - v); y[i] = v
    return y
def sweep(d=.45): t = tt(d); return lp(rng.standard_normal(len(t)), .15) * np.sin(np.pi * t / d) ** 2 * 1.4
def pop(): t = tt(.09); return np.sin(2 * np.pi * np.cumsum(np.linspace(600, 1500, len(t))) / SR) * env(.09, .002, 30) * .6
def thud(): t = tt(.4); return np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t * 9) + 45) / SR) * env(.4, .002, 9) + rng.standard_normal(len(t)) * env(.4, .001, 50) * .3
def clank(): t = tt(.7); return sum(np.sin(2 * np.pi * f * t) * env(.7, .001, 6 + i * 3) for i, f in enumerate([523, 1307, 2210, 3170])) * .4 + rng.standard_normal(len(t)) * env(.7, .001, 80) * .5
def crackle(d):
    t = tt(d); n = lp(rng.standard_normal(len(t)), .5) * .15; p = (rng.random(len(t)) < .006) * rng.standard_normal(len(t)) * 1.5
    return (n + p) * np.minimum(t / .08, 1) * np.minimum((d - t) / .2, 1)
def hiss(d): t = tt(d); n = rng.standard_normal(len(t)); n = n - lp(n, .3); return n * np.exp(-t * 1.2) * np.minimum(t / .02, 1) * .5
def pour(d): t = tt(d); return lp(rng.standard_normal(len(t)), .08) * (.7 + .3 * np.sin(2 * np.pi * 9 * t)) * np.minimum(t / .1, 1) * np.minimum((d - t) / .2, 1) * 2
def crack(): t = tt(.25); return rng.standard_normal(len(t)) * env(.25, .0005, 30) + np.sin(2 * np.pi * 3000 * t) * env(.25, .0005, 60) * .3
def ding(f=1318): t = tt(.9); return (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * f * 1.5 * t)) * env(.9, dec=5) * .5
def whooshes(): [add(cut(k) - .22, sweep(), .6) for k in KEYS[1:]]
def write_mix(drops=()):
    bpm = 100; beat = 60 / bpm; mt = lambda m: 440 * 2 ** ((m - 69) / 12); mel = [69, 72, 76, 74, 72, 76, 79, 76]; bass = [45, 45, 41, 43]
    click = lambda: rng.standard_normal(int(.05 * SR)) * env(.05, .001, 90) * .4
    for b in range(int(DUR / beat) + 1):
        t0 = b * beat; k = tt(.22); add(t0, np.sin(2 * np.pi * np.cumsum(55 + 80 * np.exp(-k * 30)) / SR) * env(.22, .002, 14), .6, mus)
        for q in range(4): add(t0 + q * beat / 4, click(), .15 if q else .2, mus)
        tb = tt(beat * .95); add(t0, np.sin(2 * np.pi * mt(bass[(b // 4) % 4]) * tb) * env(beat * .95, .01, 3), .3, mus)
        if b % 2 == 0: tp = tt(.6); f = mt(mel[(b // 2) % 8]); add(t0 + beat / 2, (np.sin(2 * np.pi * f * tp) + .3 * np.sin(2 * np.pi * f * 4 * tp)) * env(.6, .002, 6), .22, mus)
    g = np.ones(len(mus)); tm = np.arange(len(g)) / SR
    for a in drops: g = np.minimum(g, 1 - .9 * np.clip(np.minimum((tm - a + .6) / .15, (a + .5 - tm) / .3), 0, 1))  # music drops out before each sting
    n = int(1.2 * SR); g[-n:] *= np.linspace(1, 0, n)
    with wave.open('voiceover.wav') as f: v = np.frombuffer(f.readframes(f.getnframes()), np.int16).astype(float) / 32767; ch = f.getnchannels(); assert f.getframerate() == SR
    v = v.reshape(-1, ch).mean(1); v = np.pad(v, (0, max(0, len(sfx) - len(v))))[:len(sfx)]
    nrm = lambda x: x / max(1e-9, np.abs(x).max()); mix = nrm(v) + nrm(mus * g) * .22 + nrm(sfx) * .35; mix = mix / np.abs(mix).max() * .89
    with wave.open('mix.wav', 'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix * 32767).astype(np.int16).tobytes())
