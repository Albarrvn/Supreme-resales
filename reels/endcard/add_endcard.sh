#!/bin/bash
# usage: add_endcard.sh INPUT.mp4 OUTPUT.mp4  -> appends the "Sígueme / Instagram @luisgabb17" card (matches the input fps)
D=$(cd "$(dirname "$0")" && pwd)
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=nw=1:nk=1 "$1" | python3 -c "import sys;n,d=sys.stdin.read().strip().split('/');print(round(int(n)/int(d)))")
CARD=$D/card_$FPS.mp4; [ -f "$CARD" ] || { echo "no card for ${FPS}fps"; exit 1; }
ffmpeg -y -v error -i "$1" -i "$CARD" -i "$D/vo.wav" -filter_complex \
 "[0:v]scale=1080:1920,setsar=1[v0];[1:v]setsar=1[v1];[0:a]aresample=48000,aformat=channel_layouts=stereo[a0];[2:a]adelay=150|150,aresample=48000,aformat=channel_layouts=stereo,apad,atrim=0:$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CARD")[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]" \
 -map "[v]" -map "[a]" -c:v libx264 -crf 14 -preset slow -tune animation -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart "$2"
