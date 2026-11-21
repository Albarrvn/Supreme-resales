# Voz clonada del creador (@luisgabb17)

- `referencia.flac`: 22 s of the creator's own voice (uploaded recording, silence trimmed, loudness normalized to -18 LUFS). Use only for this creator's own videos.
- `voz.py`: Chatterbox Multilingual (MIT license, free, runs on CPU, about 8x slower than real time). One take per line of `SHOTS.txt`; Whisper transcribes each take and retries up to 4 times until every word matches.
- Energy: `EX=1.0` (default, energetic). 0.5 is calm. Above about 1.2 the intonation can turn odd. Then speed it up with `build_voice.py REEL --tempo 1.08`.

## Setup (once per new machine), in a venv outside the repo
```
python3 -m venv cbx && . cbx/bin/activate
pip install torch==2.6.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cpu
pip install chatterbox-tts==0.1.7 faster-whisper --extra-index-url https://download.pytorch.org/whl/cpu
```

## Per reel
```
python reels/_lemo/voz/voz.py reels/_lemo/voz/referencia.flac reels/<reel>     # -> raw.wav
python3 shorts/build_voice.py reels/<reel> --tempo 1.08                       # -> voiceover.wav + src/timing.json
```
