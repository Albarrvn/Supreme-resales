#!/bin/bash
# Resumable render: 6 s chunks via ?off=&len=; finished chunks are skipped, so a killed worker only loses one chunk.
# usage: render_chunks.sh [JIT]  -> out/silent.mp4
LIB=${LIB:-$HOME/lemo-opuscar}; P=$(cd "$(dirname "$0")" && pwd); J=${1:-3}; FPS=30; L=6
cd "$P"; mkdir -p out/chunks
END=$(python3 -c "import json;print(json.load(open('timing.json'))['duration'])")
: > out/chunks/list.txt
for off in $(python3 -c "import math;print(*range(0,math.ceil($END/$L)*$L,$L))"); do
  f=out/chunks/c_$(printf %03d $off).mp4
  for try in 1 2 3; do [ -s "$f" ] && break
    (cd "$LIB" && node core/render/video.mjs "$P" --size 1080x1920 --fps $FPS --workers ${WK:-3} --q "off=$off&len=$L&jit=$J" --out "$P/$f") >> out/render.log 2>&1 || echo "retry $off ($try)" >> out/render.log
  done
  [ -s "$f" ] || { echo "FAILED $off" >> out/render.log; exit 1; }
  echo "file 'c_$(printf %03d $off).mp4'" >> out/chunks/list.txt; echo "chunk $off done $(date +%T)" >> out/render.log
done
ffmpeg -y -v error -f concat -safe 0 -i out/chunks/list.txt -c copy out/silent.mp4 && echo "DONE $(date)" >> out/render.log
