@echo off
cd /d "%~dp0"
call npm install
call npm rebuild esbuild >nul 2>&1
if not exist out mkdir out
call npx remotion render src/index.jsx Story out\test.mp4 --gl=angle --concurrency=4 --frames=0-89
echo Test done: out\test.mp4 (first 3 seconds, no sound)
pause
