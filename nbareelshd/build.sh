#!/bin/sh
# One command per reel: sh build.sh klay   (or no argument: all five)
set -e
LIB=${LIB:-/root/lemo-opuscar}; export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
for R in ${@:-sga jokic luka giannis wemby edwards tatum brown lebron}; do
  mkdir -p "$HERE/out/$R"; cd "$LIB"
  node core/render/events.mjs "$HERE" --size 1080x1920 --q "reel=$R" --out "$HERE/out/$R/events.json"
  node core/render/video.mjs "$HERE" --size 1080x1920 --q "reel=$R" --fps 24 --workers 4 --out "$HERE/out/$R/video.mp4"
  "$LIB/.venv/bin/python" "$HERE/mix.py" "$R"
  sh "$HERE/mux6.sh" "$HERE/out/$R/video.mp4" "$HERE/out/$R/mix.wav" "$HERE/$R.mp4"
done
