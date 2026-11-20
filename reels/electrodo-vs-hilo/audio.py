# Music + foley keyed to src/timing.json (same word times as reel.html). Writes mix.wav.
import numpy as np, wave, json
SR=48000; TM=json.load(open('src/timing.json')); DUR=TM['duration']; SH=TM['shots']
S={s['key']:s for s in SH}; keys=[s['key'] for s in SH]
cut=lambda k: 0 if k==keys[0] else (SH[keys.index(k)-1]['end']+S[k]['start'])/2
W=lambda k,i: S[k]['start']+(S[k]['end']-S[k]['start'])*i/S[k]['words']
rng=np.random.default_rng(5); tt=lambda d: np.arange(int(d*SR))/SR
def env(d,a=.005,dec=8): t=tt(d); return np.minimum(t/a,1)*np.exp(-t*dec)
def add(b,t0,x,g=1.):
    i=int(t0*SR); n=min(len(x),len(b)-i)
    if n>0: b[i:i+n]+=x[:n]*g
def lp(x,a): # one-pole lowpass
    y=np.zeros_like(x); v=0
    for i in range(len(x)): v+=a*(x[i]-v); y[i]=v
    return y
def sweep(d=.45): t=tt(d); return lp(rng.standard_normal(len(t)),.15)*np.sin(np.pi*t/d)**2*1.4
def pop_(): t=tt(.09); return np.sin(2*np.pi*np.cumsum(np.linspace(600,1500,len(t)))/SR)*env(.09,.002,30)*.6
def thud(): t=tt(.4); return np.sin(2*np.pi*np.cumsum(120*np.exp(-t*9)+45)/SR)*env(.4,.002,9)+rng.standard_normal(len(t))*env(.4,.001,50)*.3
def crackle(d):
    t=tt(d); n=lp(rng.standard_normal(len(t)),.5)*.15; p=(rng.random(len(t))<.006)*rng.standard_normal(len(t))*1.5
    return (n+p)*np.minimum(t/.08,1)*np.minimum((d-t)/.2,1)
def windn(d): t=tt(d); return lp(rng.standard_normal(len(t)),.03)*(.6+.4*np.sin(2*np.pi*.7*t))*np.minimum(t/.4,1)*np.minimum((d-t)/.4,1)*3
def ding(f=1318): t=tt(.9); return (np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*1.5*t))*env(.9,dec=5)*.5
def chip(): return np.concatenate([np.pad(rng.standard_normal(int(.03*SR))*env(.03,.001,120),(0,int(.09*SR))) for _ in range(4)])
sfx=np.zeros(int(SR*DUR)); mus=np.zeros(int(SR*DUR))
for k in keys[1:]: add(sfx,cut(k)-.22,sweep(),.6)
for t0 in [.05,.25,.45]: add(sfx,t0,pop_(),.6)
add(sfx,.3,crackle(cut('e1')-.4),.3)                                # both arcs on in the hook
add(sfx,W('hook',7),thud(),1.); add(sfx,W('hook',12),pop_(),.8)      # stamp, ¿?
add(sfx,W('e1',9),crackle(cut('e2')-W('e1',9)),.35)                 # rod melting
add(sfx,cut('e2'),crackle(W('e2',10)-cut('e2')),.35); add(sfx,W('e2',1),windn(W('e2',10)-W('e2',1)),.5)
for i in [2,4,9]: add(sfx,W('e2',i),pop_(),.7)
add(sfx,W('e2',13),thud(),.6); add(sfx,W('e2',18),chip(),.7); add(sfx,W('e2',19),pop_(),.7)
add(sfx,W('h1',2),crackle(cut('h2')-W('h1',2)),.3); [add(sfx,W('h1',i),pop_(),.6) for i in (4,10,13)]
add(sfx,cut('h2'),crackle(cut('v')-cut('h2')-.3),.35); add(sfx,W('h2',7),windn(cut('v')-W('h2',7)),.55)
add(sfx,W('h2',2),pop_(),.6); add(sfx,W('h2',12),pop_(),.7); add(sfx,W('h2',19),thud(),1.)
add(sfx,W('v',5),ding(),.6); add(sfx,W('v',11),ding(1568),.6)
add(sfx,W('cierre',9),pop_(),.7); add(sfx,W('cierre',11),ding(1760),.5)
bpm=100; beat=60/bpm; mt=lambda m:440*2**((m-69)/12); mel=[69,72,76,74,72,76,79,76]; bass=[45,45,41,43]
def click(): t=tt(.05); return rng.standard_normal(len(t))*env(.05,.001,90)*.4
for b in range(int(DUR/beat)+1):
    t0=b*beat; k=tt(.22); add(mus,t0,np.sin(2*np.pi*np.cumsum(55+80*np.exp(-k*30))/SR)*env(.22,.002,14),.6)
    for q in range(4): add(mus,t0+q*beat/4,click(),.15 if q else .2)
    tb=tt(beat*.95); add(mus,t0,np.sin(2*np.pi*mt(bass[(b//4)%4])*tb)*env(beat*.95,.01,3),.3)
    if b%2==0: tp=tt(.6); f=mt(mel[(b//2)%8]); add(mus,t0+beat/2,(np.sin(2*np.pi*f*tp)+.3*np.sin(2*np.pi*f*4*tp))*env(.6,.002,6),.22)
g=np.ones(len(mus)); tm_=np.arange(len(g))/SR
for a in [W('hook',7)-.6, W('h2',19)-.6]: g=np.minimum(g,1-.9*np.clip(np.minimum((tm_-a)/.15,(a+1.1-tm_)/.3),0,1))  # drop before the stings
n=int(1.2*SR); g[-n:]*=np.linspace(1,0,n); mus*=g
with wave.open('voiceover.wav') as f: v=np.frombuffer(f.readframes(f.getnframes()),np.int16).astype(float)/32767; ch=f.getnchannels(); assert f.getframerate()==SR
v=v.reshape(-1,ch).mean(1); v=np.pad(v,(0,max(0,len(sfx)-len(v))))[:len(sfx)]
nrm=lambda x: x/max(1e-9,np.abs(x).max())
mix=nrm(v)+nrm(mus)*.22+nrm(sfx)*.35
mix=mix/np.abs(mix).max()*.89
with wave.open('mix.wav','wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((mix*32767).astype(np.int16).tobytes())
