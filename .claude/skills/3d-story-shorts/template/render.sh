#!/bin/bash
# Mac / Linux: open Terminal, drag this file in, press Enter.
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js LTS from https://nodejs.org first."; exit 1; }
[ -f voiceover.wav ] || { echo "voiceover.wav is missing."; exit 1; }
echo "[1/4] Installing tools..."; npm install
echo "[2/4] Preparing..."; npm install-scripts approve esbuild >/dev/null 2>&1; npm rebuild esbuild >/dev/null 2>&1
mkdir -p out; rm -f out/full_silent.mp4; [ -f final.mp4 ] && mv -f final.mp4 final_previous.mp4
R="npx remotion render src/index.jsx Story out/full_silent.mp4 --gl=angle --concurrency=4 --image-format=jpeg --jpeg-quality=92 --crf=17"
echo "[3/4] Rendering..."; $R || true
if [ ! -f out/full_silent.mp4 ]; then echo "Retrying with a fresh render browser..."; rm -rf node_modules/.remotion; $R || true; fi
[ -f out/full_silent.mp4 ] || { echo "RENDER FAILED - send Claude the error text above."; exit 1; }
echo "[4/4] Adding the voiceover..."
npx remotion ffmpeg -y -hide_banner -loglevel error -i out/full_silent.mp4 -i voiceover.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest final.mp4
[ -f final.mp4 ] && echo "DONE - your video is final.mp4 in this folder." || echo "RENDER FAILED at the voiceover step."
