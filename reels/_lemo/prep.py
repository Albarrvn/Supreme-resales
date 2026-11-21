# usage: prep.py REEL_DIR -> timing.json (from src/timing.json) + amp.json (60/s mouth level from voiceover.wav)
import json, subprocess, sys, numpy as np
d = sys.argv[1]; json.dump(json.load(open(f'{d}/src/timing.json')), open(f'{d}/timing.json', 'w'), ensure_ascii=False)
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{d}/voiceover.wav', '-f', 's16le', '-ac', '1', '-ar', '48000', '-'], capture_output=True).stdout, np.int16).astype(float) / 32768
n = 800; r = np.array([np.sqrt((x[i*n:(i+1)*n]**2).mean()) for i in range(len(x)//n)]); assert len(r) > 60, 'voiceover too short'
a = np.convolve(np.clip(r / np.percentile(r, 95), 0, 1), np.ones(3) / 3, 'same'); json.dump([round(float(v), 2) for v in a], open(f'{d}/amp.json', 'w'))
