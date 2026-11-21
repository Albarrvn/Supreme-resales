"""Whisper check of every cloned line + word times for the subtitles: voices/<reel>/words.json
~/lemo-opuscar/.venv/bin/python asr.py reel [...]   exit 1 if a line scores below 0.85"""
import sys, os, json, re, difflib, unicodedata
from faster_whisper import WhisperModel
HERE = os.path.dirname(os.path.abspath(__file__))
m = WhisperModel(os.environ.get('WHISPER_MODEL', 'small'), device='cpu', compute_type='int8')
norm = lambda s: re.sub(r'[^a-z0-9ñ ]', '', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode().replace('n~', 'ñ'))
bad = 0
for reel in sys.argv[1:]:
    d = os.path.join(HERE, 'voices', reel); out = {}
    for L in json.load(open(os.path.join(HERE, 'reels', reel + '.json')))['lines']:
        segs, _ = m.transcribe(os.path.join(d, L['id'] + '.wav'), language='es', word_timestamps=True)
        ws = [w for s in segs for w in s.words]; heard = ''.join(w.word for w in ws)
        r = max(difflib.SequenceMatcher(None, norm(heard).split(), norm(L[k]).split()).ratio() for k in ('say', 'text'))
        flag = 'OK ' if r >= .85 else 'BAD'; bad += r < .85
        print(f'{flag} {reel}/{L["id"]} {r:.2f} | {heard.strip()}')
        # subtitle word i appears when the voice reaches the same fraction of the spoken text
        sub = L['text'].split(); tot = sum(len(x) for x in sub); acc = 0; cum = []; c = 0
        for w in ws: cum.append((c, max(0.0, w.start))); c += len(w.word.strip())
        times = []
        for wd in sub:
            f = acc / tot * c; times.append(round(max([tt for cc, tt in cum if cc <= f + 1e-6] or [0]), 3)); acc += len(wd)
        out[L['id']] = times
    json.dump(out, open(os.path.join(d, 'words.json'), 'w'))
sys.exit(1 if bad else 0)
