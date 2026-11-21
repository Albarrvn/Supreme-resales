#!/bin/sh
# One command: voices must exist in ../voices/pixjokic (voice.py pixjokic + asr.py pixjokic from the parent folder)
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$HERE/voices" "$HERE/out"
cp "$HERE/../voices/pixjokic/"*.wav "$HERE/../voices/pixjokic/dur.json" "$HERE/voices/"
cp "$HERE/../reels/pixjokic.json" "$HERE/reel.json"
cd "$LIB"
node core/render/events.mjs "$HERE" --size 1080x1920 --out "$HERE/out/events.json"
node core/render/video.mjs "$HERE" --size 1080x1920 --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh "$HERE/../mux6.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/pixel-jokic.mp4"
