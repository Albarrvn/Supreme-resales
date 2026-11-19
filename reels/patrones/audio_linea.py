import numpy as np, wave
SR=44100; DUR=24.12
MAP=[(0,0),(2.75,3.0),(5.95,8.0),(9.72,14.0),(13.02,20.0),(16.62,26.0),(20.25,32.0),(22.6,34.9),(24.2,37.3),(27.5,38.0)]
def inv(a):
    for i in range(1,len(MAP)):
        if a<=MAP[i][1]:
            (r0,a0),(r1,a1)=MAP[i-1],MAP[i]; return r0+(r1-r0)*(a-a0)/(a1-a0)
    return 27.5
sfx=np.zeros(int(SR*DUR)); mus=np.zeros(int(SR*DUR))
rng=np.random.default_rng(1)
def add(buf,t0,x,g=1.0):
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
add(sfx,0.05,whoosh(),.7)
add(sfx,0.3,zap(0.9)*0.5,.6)
add(sfx,1.48,boing(),.9)
add(sfx,1.48,thud(),.9)
add(sfx,3.22,whoosh(),.8)
add(sfx,3.27,popf(),.7)
add(sfx,6.43,whoosh(),.8)
add(sfx,6.48,popf(),.7)
add(sfx,10.32,whoosh(),.8)
add(sfx,10.37,popf(),.7)
add(sfx,14.06,whoosh(),.8)
add(sfx,14.11,popf(),.7)
add(sfx,19.28,whoosh(),.8)
add(sfx,19.33,popf(),.7)
add(sfx,3.62,popf(),.6)
add(sfx,3.87,popf(),.6)
add(sfx,4.12,popf(),.6)
add(sfx,5.55,click(),.5)
add(sfx,5.80,click(),.5)
add(sfx,6.05,click(),.5)
add(sfx,6.30,click(),.5)
add(sfx,6.55,click(),.5)
add(sfx,6.80,click(),.5)
add(sfx,6.88,whoosh(.3),.6)
add(sfx,6.98,zap(1.86)*0.55,.6)
add(sfx,8.84,whoosh(.3),.5)
add(sfx,10.77,whoosh(.3),.6)
add(sfx,10.87,zap(1.77)*0.55,.6)
add(sfx,12.64,whoosh(.3),.5)
add(sfx,14.51,whoosh(.3),.6)
add(sfx,14.61,zap(2.69)*0.55,.6)
add(sfx,17.30,whoosh(.3),.5)
add(sfx,7.66,ding(),.55)
add(sfx,9.09,ding(),.55)
add(sfx,11.04,ding(),.55)
add(sfx,12.76,ding(),.55)
add(sfx,15.85,ding(),.55)
add(sfx,18.15,ding(),.55)
add(sfx,19.53,popf(),.6)
add(sfx,19.73,popf(),.6)
add(sfx,19.93,popf(),.6)
add(sfx,23.04,cash(),.8)
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
w('sfx.wav',sfx); w('mus.wav',mus)
