"""Mix one reel: synthesized motorik score (sections from events.json) + print foley + cloned voice → out/<reel>/mix.wav
LIB=... $LIB/.venv/bin/python mix.py <reel>"""
import sys, os, json, numpy as np, soundfile as sf
from scipy.signal import resample_poly
from scipy.ndimage import maximum_filter1d, uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__)); REEL = sys.argv[1]
sys.path.insert(0, os.path.join(os.environ['LIB'], 'core/audio'))
import sfx
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, add
rng = np.random.default_rng(81)
ev = json.load(open(os.path.join(HERE, 'out', REEL, 'events.json')))
DUR = ev['dur']; N = int((DUR + .3) * SR); BEAT = .5; S16 = BEAT / 4

# ---------- foley: print materials, dry ----------
def thunk(): d = .12; tt = t_(d); return norm(np.sin(2 * np.pi * 95 * tt) * env_exp(d, .025) + bp(noise(d), 300, 1500) * env_exp(d, .006) * .6)
def paper(): d = .25; tt = t_(d); return norm(lp(noise(d), 900) * env_exp(d, .03) + np.sin(2 * np.pi * 110 * tt) * env_exp(d, .04) * .6 + hp(noise(d), 3000) * env_exp(d, .006) * .4)
def snapf(): d = .05; tt = t_(d); return norm(hp(noise(d), 1500) * env_exp(d, .002) + np.sin(2 * np.pi * 1900 * tt) * env_exp(d, .007) * .6 + np.sin(2 * np.pi * 620 * tt) * env_exp(d, .01) * .4)
def thump(): d = .45; tt = t_(d); return norm(np.sin(2 * np.pi * 58 * tt * (1 - .25 * tt)) * env_exp(d, .09) + lp(noise(d), 250) * env_exp(d, .02) * .4)
def knife(d=.3):
    tt = t_(d); f = np.linspace(1500, 6000, len(tt)); x = bp(noise(d), 1500, 7000) * (tt / d) ** 1.5
    sn = t_(.08); x[-len(sn):] += (np.sin(2 * np.pi * 4200 * sn) * env_exp(.08, .012) + hp(noise(.08), 4000) * env_exp(.08, .003)) * .8; return norm(x)
def stamp(): d = .18; tt = t_(d); return norm(np.sin(2 * np.pi * 140 * tt) * env_exp(d, .03) + bp(noise(d), 600, 3000) * env_exp(d, .008))
def boom():   # cinematic impact on frame 1: pitch-dropping sub + noise burst
    d = 1.1; tt = t_(d); f = 40 + 45 * np.exp(-tt / .08)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .35) + lp(noise(d), 3000) * env_exp(d, .04) * .7)
def dribble(): # basketball bounce: low rubbery thud + short ping of the floor
    d = .14; tt = t_(d); f = 70 + 50 * np.exp(-tt / .015)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .035) + np.sin(2 * np.pi * 640 * tt) * env_exp(d, .008) * .3 + bp(noise(d), 800, 3000) * env_exp(d, .003) * .4)
def squeak(): # sneaker on hardwood: fast rising glide with vibrato
    d = .13; tt = t_(d); f = 2400 + 900 * tt / d + 120 * np.sin(2 * np.pi * 45 * tt)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) ** .5)
def riser(d):  # tension sweep that ends exactly on the record
    tt = t_(d); out = np.zeros(len(tt)); n = noise(d); hop = 512
    for i in range(0, len(n), hop):
        fc = 400 + 5000 * (i / len(n)) ** 2; seg = bp(n[max(0, i - 2048):i + hop], fc * .7, min(fc * 1.4, 20000))[-hop:]; out[i:i + len(seg)] = seg
    return norm(out * (tt / d) ** 2)
def horn():    # arena buzzer: two detuned square-ish tones
    d = .75; tt = t_(d); x = sum(np.tanh(4 * np.sin(2 * np.pi * f * tt)) for f in (220, 233))
    return norm(lp(x, 2500) * np.minimum(1, tt / .01) * np.minimum(1, (d - tt) / .05))
FOL = {'riser': (None, .28), 'boom': (boom, .7), 'dribble': (dribble, .32), 'squeak': (squeak, .07), 'horn': (horn, .16),
       'whoosh': (lambda: sfx.whoosh(.35), .14), 'thunk': (thunk, .22), 'paper': (paper, .26), 'snap': (snapf, .14), 'thump': (thump, .5), 'knife': (knife, .25), 'stamp': (stamp, .35)}
fol = np.zeros((N, 2))
for e in ev['ev']:
    if e['type'] in FOL:
        fn, gain = FOL[e['type']]; x = riser(e['d']) if e['type'] == 'riser' else fn(); at = e['t'] - (len(x) / SR - .03 if e['type'] == 'knife' else 0)
        add(fol, x, max(0, at), gain * e.get('g', 1), pan=float(rng.uniform(-.2, .2)))

# ---------- score: motorik 120 bpm, A minor; one layer per section ----------
secs = sorted([(e['t'], e['name']) for e in ev['ev'] if e['type'] == 'section'])
def sec_at(t):
    n = 'A'
    for a, s in secs:
        if a <= t + 1e-6: n = s
    return n
ROOT = [45, 45, 41, 43]; hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def kick(): d = .3; tt = t_(d); f = 45 + 75 * np.exp(-tt / .03); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(d, .12)
def snare(): d = .18; tt = t_(d); return (bp(noise(d), 1200, 6000) * env_exp(d, .04) + np.sin(2 * np.pi * 190 * tt) * env_exp(d, .03) * .5) * .5
def hat(): d = .04; return hp(noise(d), 7000) * env_exp(d, .008) * .35
def bass(m, d=.22):
    tt = t_(d); f = hz(m); x = sum(a * np.sin(2 * np.pi * f * k * tt) for k, a in [(1, 1), (2, .5), (3, .3), (4, .12)])
    return x * np.minimum(1, tt / .005) * env_exp(d, .12) * .5
def arp(m, d=.11): tt = t_(d); return np.sign(np.sin(2 * np.pi * hz(m) * tt)) * env_exp(d, .04) * .06
mus = np.zeros((N, 2)); n16 = int(DUR / S16)
for i in range(n16):
    t = i * S16; s = sec_at(t); bar = int(t // 2); st = i % 16; root = ROOT[bar % 4]
    if s in ('D', 'end'): continue
    if st in (0, 8, 10): add(mus, kick(), t, .55)
    if st % 2 == 0: add(mus, bass(root + (12 if st in (6, 14) else 0)), t, .42)
    if s in ('C', 'E') and st % 2 == 0: add(mus, hat(), t, .5, pan=.2)
    if s == 'E':
        if st in (4, 12): add(mus, snare(), t, .45)
        add(mus, arp(root + 24 + [0, 3, 7, 12][st % 4]), t, .6, pan=-.2)
    if s == 'F' and st in (4, 12): add(mus, snare(), t, .25)
# the exception sings: a sine glide over its scene
for (a, s), nxt in zip(secs, secs[1:] + [(DUR, 'end')]):
    if s == 'E':
        d = min(nxt[0] - a, 4.0); tt = t_(d); f = np.linspace(hz(69), hz(76), len(tt))
        add(mus, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) * .08, a)

# ---------- voice: compressed, music ducked ~10 dB under it ----------
vo = np.zeros((N, 2)); vad = np.zeros(N)
for e in ev['ev']:
    if e['type'] != 'voice': continue
    y, sr = sf.read(os.path.join(HERE, 'voices', REEL, e['id'] + '.wav'))
    if y.ndim > 1: y = y.mean(1)
    # broadcast chain: low cut, presence lift (2.5–5 kHz), heavy compression, like a commentary mic
    y = hp(resample_poly(y, SR, sr), 120); y = y + .6 * bp(y, 2500, 5000) + .25 * bp(y, 150, 300)
    y = norm(sfx.compress(y / (np.abs(y).max() + 1e-9), thr=.2, ratio=5, att=.002, rel=.08), .9)
    add(vo, y, e['t'], .8); s = int(e['t'] * SR); vad[s:s + len(y)] = 1
vad = uniform_filter1d(maximum_filter1d(vad, size=int(.16 * SR)), size=int(.25 * SR))
mus *= (1 - .68 * vad)[:, None] * .8
# arena crowd bed: filtered noise breathing slowly, swelling into a roar when the record (section E) lands
nz = lambda: bp(rng.standard_normal(N), 250, 2500)
crowd = np.stack([nz(), nz()], 1); crowd /= np.abs(crowd).max()
tt = np.arange(N) / SR; lvl = .05 + .015 * np.sin(2 * np.pi * .23 * tt)
for a, s_ in secs:
    if s_ == 'E': lvl += .22 * np.clip((tt - a + .3) / .3, 0, 1) * np.exp(-np.clip(tt - a, 0, None) / 1.6)
crowd *= lvl[:, None] * (1 - .5 * vad)[:, None]
mix = mus + vo + fol + crowd
for c in range(2): mix[:, c] = sfx.limit(mix[:, c], .95)
assert np.isfinite(mix).all()
sf.write(os.path.join(HERE, 'out', REEL, 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
db = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); m = vad > .5
print(f'{REEL}: voice {db(vo[m]):.1f} dB  music under voice {db(mus[m]):.1f} dB  peak {20*np.log10(np.abs(mix).max()):.2f}')
