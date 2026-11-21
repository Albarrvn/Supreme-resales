# Cloned-voice narration, one take per shot line; each take is transcribed and retried (up to 4) until the words match.
# usage: [EX=1.0] voz.py referencia.flac REEL_DIR...  -> <reel>/raw.wav (then: build_voice.py REEL --tempo 1.08)
import os, sys, re, unicodedata, numpy as np, torch, torchaudio
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
torch.set_num_threads(4); m = ChatterboxMultilingualTTS.from_pretrained(device='cpu'); asr = WhisperModel('small', device='cpu', compute_type='int8')
N = {'6': 'seis', '5': 'cinco', '1000': 'mil'}
norm = lambda s: [N.get(w, w) for w in re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode()).split()]
def wer(a, b):
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, y in enumerate(b, 1): p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (x != y))
    return d[-1] / max(1, len(a))
def heard(w):
    x = torchaudio.functional.resample(w, m.sr, 16000)[0].numpy().astype(np.float32)
    return ' '.join(s.text for s in asr.transcribe(x, language='es', beam_size=5)[0])
ref = sys.argv[1]; EX = float(os.environ.get('EX', 1.0))  # 1.0 = energetic (0.5 = calm)
for d in sys.argv[2:]:
    parts = []
    for l in open(f'{d}/SHOTS.txt', encoding='utf-8'):
        if '|' not in l: continue
        txt = l.split('|', 1)[1].strip(); best = None
        for k in range(4):
            w = m.generate(txt, language_id='es', audio_prompt_path=ref, exaggeration=EX, cfg_weight=.5); h = heard(w); e = wer(norm(txt), norm(h))
            if w.shape[-1] / m.sr > .6 * len(txt.split()) + 1.5: e += 1  # babble the ASR ignores makes the take too long
            if best is None or e < best[0]: best = (e, w, h)
            if e == 0: break
        print(f'{d} wer={best[0]:.2f} tries={k+1} | {best[2].strip()}', flush=True)
        parts += [best[1], torch.zeros(1, int(m.sr * .25))]
    torchaudio.save(f'{d}/raw.wav', torch.cat(parts, 1), m.sr)
