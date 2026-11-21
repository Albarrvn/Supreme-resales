"""Clone the user's voice (Chatterbox Multilingual, local) for every line: voices/<reel>/<id>.wav + dur.json.
.venv-voice/bin/python voice.py [reel ...]   (skips lines already rendered)"""
import sys, os, json, numpy as np, torch, soundfile as sf
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
HERE = os.path.dirname(os.path.abspath(__file__)); REF = os.path.join(HERE, 'voices/ref.wav')
torch.manual_seed(7)
m = ChatterboxMultilingualTTS.from_pretrained(device='cpu')
def trim(y, sr, thr=.02):
    a = np.abs(y); idx = np.where(a > thr * a.max())[0]
    s, e = max(0, idx[0] - int(.03 * sr)), min(len(y), idx[-1] + int(.12 * sr)); return y[s:e]
for reel in sys.argv[1:] or ['sga', 'jokic', 'luka', 'giannis', 'wemby', 'edwards', 'tatum', 'brown', 'lebron']:
    d = os.path.join(HERE, 'voices', reel); os.makedirs(d, exist_ok=True)
    durf = os.path.join(d, 'dur.json'); dur = json.load(open(durf)) if os.path.exists(durf) else {}
    for L in json.load(open(os.path.join(HERE, 'reels', reel + '.json')))['lines']:
        out = os.path.join(d, L['id'] + '.wav')
        if os.path.exists(out) and L['id'] in dur: continue
        wav = m.generate(L['say'], language_id='es', audio_prompt_path=REF, exaggeration=.6, cfg_weight=.4)
        y = trim(wav.squeeze(0).numpy(), m.sr); sf.write(out, y, m.sr)
        dur[L['id']] = round(len(y) / m.sr, 3); json.dump(dur, open(durf, 'w'), indent=0); print(reel, L['id'], dur[L['id']], flush=True)
