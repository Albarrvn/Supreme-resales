#!/bin/bash
# Waits for the running chunk pass, re-renders missing chunks, muxes the mix, appends the end card.
cd "$(dirname "$0")"
while pgrep -f render_chunks.sh >/dev/null; do sleep 30; done
./render_chunks.sh 2 || exit 1
ffmpeg -y -v error -i out/silent.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/junta_sin_cierre.mp4 || exit 1
../endcard/add_endcard.sh out/junta_sin_cierre.mp4 junta_t_solape_final.mp4 && echo "FINAL OK $(date +%T)" >> out/render.log
