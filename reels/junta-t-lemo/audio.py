# Music + foley for the T/lap reel, keyed to timing.json (treatment §Sound design). Writes sfx.wav, mus.wav, mix.wav.
import numpy as np, wave, json
SR=48000; TM=json.load(open('timing.json')); DUR=TM['duration']
S={s['key']:s['start'] for s in TM['shots']}; E={s['key']:s['end'] for s in TM['shots']}
rng=np.random.default_rng(7); tt=lambda d: np.arange(int(d*SR))/SR
def env(d,a=.005,dec=8): t=tt(d); return np.minimum(t/a,1)*np.exp(-t*dec)
def add(b,t0,x,g=1.):
    i=int(t0*SR); n=min(len(x),len(b)-i)
    if n>0: b[i:i+n]+=x[:n]*g
def lp(x,a):  # one-pole lowpass
    y=np.zeros_like(x); v=0
    for i in range(len(x)): v+=a*(x[i]-v); y[i]=v
    return y
def sweep(d=.5): t=tt(d); return lp(rng.standard_normal(len(t)),.15)*np.sin(np.pi*t/d)**2*1.4
def click(): t=tt(.06); return rng.standard_normal(len(t))*env(.06,.001,90)*.4+np.sin(2*np.pi*2400*t)*env(.06,.001,70)*.3
def knock(): t=tt(.35); return (np.sin(2*np.pi*np.cumsum(140*np.exp(-t*8)+60)/SR)*env(.35,.002,10)+np.sin(2*np.pi*1900*t)*env(.35,.001,25)*.25)*.8
def crackle(d):
    t=tt(d); n=lp(rng.standard_normal(len(t)),.5)*.15; pops=(rng.random(len(t))<.006)*rng.standard_normal(len(t))*1.5
    e=np.minimum(t/.08,1)*np.minimum((d-t)/.2,1); return (n+pops)*e*(.8+.2*np.sin(2*np.pi*6*t))
def sting():  # thud + falling tone
    t=tt(1.1); f=520*np.exp(-t*1.8)+80; k=knock(); return np.sin(2*np.pi*np.cumsum(f)/SR)*env(1.1,.003,2.5)*.6+np.pad(k,(0,len(t)-len(k)))
def ding(f=1318): t=tt(.9); return (np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*1.5*t)+.25*np.sin(2*np.pi*f*2*t))*env(.9,dec=5)*.5
sfx=np.zeros(int(SR*DUR)); mus=np.zeros(int(SR*DUR))
for k,t0 in S.items():
    if k!='hook': add(sfx,t0-.25,sweep(),.5)
add(sfx,.1,sweep(.8),.6)
for t0 in [S['t1']+1.6,S['t1']+3.2,S['s1']+1.4,S['s1']+3.0]: add(sfx,t0,knock(),.7); add(sfx,t0+.02,click(),.6)
add(sfx,S['t3']+.4,crackle(E['t3']-S['t3']-.6),.35)       # electrode at 45°
add(sfx,S['s4']+.6,crackle(E['s4']-S['s4']-1.0),.35)      # lap fix weld
add(sfx,S['t5'],sting(),.9); add(sfx,S['s3'],sting(),.9) # traps
add(sfx,S['t5']+.3,crackle(2.5),.3); add(sfx,S['s3']+.6,crackle(2.0),.35)
add(sfx,S['t4']+1.6,ding(),.6); add(sfx,E['s4']-1.2,ding(),.6); add(sfx,S['cierre']+.3,ding(1568),.5)
for t0 in np.arange(S['cierre']+.6,S['cierre']+4.5,.9): add(sfx,t0,click(),.5)
# score 96 bpm: soft kick, plotter-tick 16ths, vibraphone plucks; out before each trap
bpm=96; beat=60/bpm; mt=lambda m:440*2**((m-69)/12)
mel=[69,72,76,74,72,76,79,76]; bass=[45,45,41,43]
for b in range(int(DUR/beat)+1):
    t0=b*beat
    k=tt(.22); add(mus,t0,np.sin(2*np.pi*np.cumsum(55+80*np.exp(-k*30))/SR)*env(.22,.002,14),.6)
    for s in range(4): add(mus,t0+s*beat/4,click(),.12 if s else .18)
    tb=tt(beat*.95); f=mt(bass[(b//4)%4]); add(mus,t0,np.sin(2*np.pi*f*tb)*env(beat*.95,.01,3),.3)
    if b%2==0:
        tp=tt(.6); f=mt(mel[(b//2)%8]); add(mus,t0+beat/2,(np.sin(2*np.pi*f*tp)+.3*np.sin(2*np.pi*f*4*tp))*env(.6,.002,6),.22)
g=np.ones(len(mus))
def duck(a,b,lvl=.08,r=.3):  # music near-silent in [a,b], ramps r
    t=np.arange(len(g))/SR; m=np.clip(np.minimum((t-a)/r,(b+r-t)/r),0,1); g[:]=np.minimum(g,1-(1-lvl)*m)
duck(S['t5']-1.0,S['t5']+1.4); duck(S['s3']-1.0,S['s3']+1.4)
n=int(1.5*SR); g[-n:]*=np.linspace(1,0,n); mus*=g
def rd(p):
    with wave.open(p) as f: x=np.frombuffer(f.readframes(f.getnframes()),np.int16).astype(float)/32767; return x,f.getframerate(),f.getnchannels()
v,vsr,ch=rd('voiceover.wav'); assert vsr==SR, vsr
if ch==2: v=v.reshape(-1,2).mean(1)
v=np.pad(v,(0,max(0,len(sfx)-len(v))))[:len(sfx)]
nrm=lambda x: x/max(1e-9,np.abs(x).max())
mix=nrm(v)*1.0+nrm(mus)*.22+nrm(sfx)*.35   # voice ~10 dB over the bed
def w(p,x):
    x=x/max(1e-9,np.abs(x).max())*.89
    with wave.open(p,'wb') as f: f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((x*32767).astype(np.int16).tobytes())
w('sfx.wav',sfx); w('mus.wav',mus); w('mix.wav',mix)
