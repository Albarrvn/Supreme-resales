#!/bin/bash
# usage: render_cloud.sh PROJECT  -> PROJECT/final.mp4
cd "$1"; mkdir -p out; rm -f out/full_silent.mp4
REMOTION_NOBOKEH=1 npx remotion render src/index.jsx Story out/full_silent.mp4 --gl=swangle --concurrency=${CONC:-3} --image-format=jpeg --jpeg-quality=92 --crf=18 --browser-executable=/usr/bin/google-chrome > out/render.log 2>&1
ffmpeg -y -v error -i out/full_silent.mp4 -i voiceover.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest final.mp4 && echo "DONE $(date)" >> out/render.log
