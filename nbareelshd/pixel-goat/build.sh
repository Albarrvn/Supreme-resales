#!/bin/sh
# MJ vs LBJ: voices from ../voices/pixgoat (voice.py + asr.py pixgoat), then frames → chiptune mix → master
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd); mkdir -p "$HERE/out" "$HERE/voices"
VOICE=${VOICE:-pixgoat_el}
rm -f "$HERE/voices/"*.wav; cp "$HERE/../voices/$VOICE/"*.wav "$HERE/../voices/$VOICE/dur.json" "$HERE/voices/"
cp "$HERE/../reels/pixgoat.json" "$HERE/reel.json"
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920 --out "$HERE/out/events.json"
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh "$HERE/../mux6.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/mj-vs-lbj.mp4"
