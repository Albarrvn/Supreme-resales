import numpy as np, wave
SR=44100; DUR=27.5
MAP=[(0,0),(2.75,3.0),(5.95,8.0),(9.72,14.0),(13.02,20.0),(16.62,26.0),(20.25,32.0),(22.6,34.9),(24.2,37.3),(27.5,38.0)]
def inv(a):
    for i in range(1,len(MAP)):
        if a<=MAP[i][1]:
            (r0,a0),(r1,a1)=MAP[i-1],MAP[i]; return r0+(r1-r0)*(a-a0)/(a1-a0)
    return 27.5
sfx=np.zeros(int(SR*DUR)); mus=np.zeros(int(SR*DUR))
rng=np.random.default_rng(1)
def add(buf,t0,x,g=1.0):
    if buf is sfx: t0=inv(t0)
    i=int(t0*SR); n=min(len(x),len(buf)-i)
    if n<=0: return
    buf[i:i+n]+=x[:n]*g
def tt(d): return np.arange(int(d*SR))/SR
def env(d,a=.005,dec=8):
    t=tt(d); return np.minimum(t/a,1)*np.exp(-t*dec)
def ding(f=1318):
    t=tt(.9); return (np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*1.5*t)+.25*np.sin(2*np.pi*f*2*t))*env(.9,dec=5)*.5
def boing():
    t=tt(.55); f=420*np.exp(-t*3)+90+25*np.sin(2*np.pi*14*t); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*env(.55,dec=4)*.8
def whoosh(d=.4):
    t=tt(d); n=rng.standard_normal(len(t)); out=np.zeros_like(n); y=0
    a=np.linspace(.02,.35,len(t))**1.2
    for i in range(len(t)): y+=a[i]*(n[i]-y); out[i]=y
    e=np.sin(np.pi*t/d)**2; return out*e*1.6
def popf():
    t=tt(.09); f=np.linspace(600,1600,len(t)); return np.sin(2*np.pi*np.cumsum(f)/SR)*env(.09,a=.002,dec=30)*.6
def thud():
    t=tt(.3); f=110*np.exp(-t*10)+45; return (np.sin(2*np.pi*np.cumsum(f)/SR)*env(.3,dec=12)+rng.standard_normal(len(t))*env(.3,a=.001,dec=60)*.3)*.9
def click():
    t=tt(.05); return rng.standard_normal(len(t))*env(.05,a=.001,dec=90)*.5+np.sin(2*np.pi*2500*t)*env(.05,a=.001,dec=80)*.3
def zap(d=1.5):
    t=tt(d); n=rng.standard_normal(len(t)); buzz=np.sign(np.sin(2*np.pi*100*t))*.3
    crack=(rng.random(len(t))<.004)*rng.standard_normal(len(t))*3
    e=np.minimum(t/.02,1)*np.minimum((d-t)/.1,1)
    return (n*.25+buzz+crack)*e*(.7+.3*np.sin(2*np.pi*7*t))*.45
def sizzle(d=1.0):
    t=tt(d); n=rng.standard_normal(len(t)); n=np.diff(n,prepend=0)
    return n*.12*np.minimum(t/.05,1)*np.exp(-t*2)
def cough():
    out=np.zeros(int(1.2*SR))
    for k in range(3):
        t=tt(.18); s=rng.standard_normal(len(t))*env(.18,a=.005,dec=18)*.5
        i=int(k*.32*SR); out[i:i+len(s)]+=s
    return out
def cash():
    return np.concatenate([ding(2093)*.6,np.zeros(1)])+0
# events
for t0 in [0.0,3.0,8.0,14.0,20.0,26.0,32.0,34.9]: add(sfx,t0,whoosh(),.8)
for R in [3,8,14,20,26]: add(sfx,R+0.05,popf(),.7)
add(sfx,0.2,popf(),.7); add(sfx,0.6,popf(),.6)
add(sfx,1.1,click(),.8); add(sfx,1.5,click(),.8); add(sfx,2.4,click(),.6)
# fails
for t0 in [4.4,9.4,15.4,21.4]: add(sfx,t0,boing(),.8)
for t0 in [4.5,9.5,15.5,21.5,29.9]: add(sfx,t0,thud(),.9)
add(sfx,4.4,sizzle(),1); add(sfx,9.5,cough(),1); add(sfx,15.3,sizzle(1.6),1); add(sfx,21.35,sizzle(),1)
# wins
for t0 in [5.0,10.0,16.0,22.0,28.0]: add(sfx,t0,ding(),.8)
add(sfx,5.0,boing()*.0,0)
# careta
add(sfx,26.45,click(),.9); add(sfx,27.2,zap(1.6),1)
add(sfx,28.85,whoosh(.5),.8); add(sfx,29.6,boing(),.8); add(sfx,29.85,click(),.7); add(sfx,29.9,popf(),.6)
# result fanfare
for i,f in enumerate([523,659,784,1046]): add(sfx,32.3+i*.12,ding(f),.5)
# cta
add(sfx,35.15,popf(),.7); add(sfx,36.0,whoosh(.3),.5); add(sfx,36.35,cash(),.9); add(sfx,36.8,popf(),.8); add(sfx,37.1,popf(),.5)
# music: 112 bpm
bpm=112; beat=60/bpm
notes=[45,45,48,50, 43,43,47,50]  # midi bass pattern per bar
def mtof(m): return 440*2**((m-69)/12)
nb=int(DUR/beat)+1
for b in range(nb):
    t0=b*beat
    k=tt(.25); kick=np.sin(2*np.pi*np.cumsum(60+90*np.exp(-k*30))/SR)*env(.25,a=.002,dec=14)
    add(mus,t0,kick,.9)
    hat=rng.standard_normal(int(.04*SR))*env(.04,a=.001,dec=70)
    add(mus,t0+beat/2,np.diff(hat,prepend=0),.35)
    if b%2==1: 
        sn=rng.standard_normal(int(.15*SR))*env(.15,a=.001,dec=25); add(mus,t0,sn,.35)
    m=notes[(b//2)%len(notes)]
    d=beat*.9; tb=tt(d); f=mtof(m)
    bass=(np.sign(np.sin(2*np.pi*f*tb))*.3+np.sin(2*np.pi*f*tb))*env(d,a=.005,dec=5)
    add(mus,t0,bass,.35)
    # pluck melody on offbeats
    mel=[69,72,74,76,74,72,69,67][b%8]
    tp=tt(.2); add(mus,t0+beat/2,np.sin(2*np.pi*mtof(mel)*tp)*env(.2,a=.003,dec=16),.18)
fade=np.ones(len(mus)); n=int(1.0*SR); fade[-n:]=np.linspace(1,0,n); mus*=fade
def w(name,x):
    x=x/ max(1e-9,np.max(np.abs(x)))*.89
    with wave.open(name,'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes((x*32767).astype(np.int16).tobytes())
w('sfx_v.wav',sfx); w('mus_v.wav',mus)
