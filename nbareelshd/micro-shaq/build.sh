#!/bin/sh
# One command: voices must exist in ../voices/microshaq (voice.py microshaq + asr.py microshaq from the parent folder)
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$HERE/voices" "$HERE/out"
# VOICE=microshaq (cloned, sped up 12 %) or VOICE=microshaq (ElevenLabs take, already fast); durations re-measured
VOICE=${VOICE:-microshaq_el}; TEMPO=${TEMPO:-$([ "$VOICE" = microshaq ] && echo 1.12 || echo 1.0)}
rm -f "$HERE/voices/"*.wav
for f in "$HERE/../voices/$VOICE/"*.wav; do ffmpeg -v error -y -i "$f" -filter:a atempo=$TEMPO "$HERE/voices/$(basename "$f")"; done
python3 -c "import json,glob,os,subprocess as s; print(json.dumps({os.path.basename(f)[:-4]: float(s.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f])) for f in glob.glob('$HERE/voices/*.wav')}))" > "$HERE/voices/dur.json"
cp "$HERE/../reels/microshaq.json" "$HERE/reel.json"
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920 --out "$HERE/out/events.json"
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh "$HERE/../mux6.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/micro-shaq.mp4"
