#!/bin/bash
# usage: render_cloud.sh PROJECT  -> PROJECT/final.mp4
# Renders in 300-frame chunks and skips finished chunks, so a killed worker only loses the current chunk.
cd "$1"; mkdir -p out/chunks
N=$(python3 -c "import json;print(round(json.load(open('src/timing.json'))['duration']*30))")
: > out/chunks/list.txt
for ((s=0; s<N; s+=300)); do
  e=$((s+299 < N-1 ? s+299 : N-1)); f=out/chunks/c_$(printf %05d $s).mp4
  if [ ! -s "$f" ]; then
    REMOTION_NOBOKEH=1 npx remotion render src/index.jsx Story "$f.tmp.mp4" --frames=$s-$e --gl=swangle --concurrency=${CONC:-3} --image-format=jpeg --jpeg-quality=92 --crf=16 --scale=${SCALE:-1} --browser-executable=/usr/bin/google-chrome >> out/render.log 2>&1 && mv "$f.tmp.mp4" "$f" || { echo "FAILED chunk $s" >> out/render.log; exit 1; }
  fi
  echo "file 'c_$(printf %05d $s).mp4'" >> out/chunks/list.txt
done
ffmpeg -y -v error -f concat -safe 0 -i out/chunks/list.txt -i voiceover.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest final.mp4 && echo "DONE $(date)" >> out/render.log
