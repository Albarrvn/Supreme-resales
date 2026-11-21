#!/bin/sh
# mux6.sh video.mp4 mix.wav out.mp4 — two-pass loudnorm to -14 LUFS with ffmpeg 6 (the library's mux.sh wants 7);
# checks that the audio covers the whole picture, since ffmpeg 6 loudnorm can cut it short.
set -e
V=$1; A=$2; O=$3
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
J=$(ffmpeg -hide_banner -i "$A" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | sed -n "s/.*\"$1\" : \"\([^\"]*\)\".*/\1/p"; }
ffmpeg -v error -y -i "$V" -i "$A" -map 0:v -map 1:a -c:v copy \
  -af "apad,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000,alimiter=limit=0.84:level=false" \
  -t "$D" -c:a aac -b:a 192k -movflags +faststart "$O.part.mp4"
AD=$(ffprobe -v error -select_streams a -show_entries stream=duration -of csv=p=0 "$O.part.mp4")
python3 -c "import sys; d,a=float('$D'),float('$AD'); sys.exit(0 if a>=d-0.1 else print(f'audio {a:.2f}s < video {d:.2f}s') or 1)"
mv "$O.part.mp4" "$O"
ffmpeg -hide_banner -i "$O" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tr -s ' ' | tr '\n' ' '; echo "→ $O (${D}s)"
