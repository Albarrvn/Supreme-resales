@echo off
cd /d "%~dp0"
title Rendering your video - do not close this window
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org then restart your PC and run this again.
  goto end
)
if not exist voiceover.wav (
  echo voiceover.wav is missing. Put your narration file named voiceover.wav in this folder.
  goto end
)
echo [1/4] Installing tools (first run takes a few minutes)...
call npm install
echo [2/4] Preparing...
call npm install-scripts approve esbuild >nul 2>&1
call npm rebuild esbuild >nul 2>&1
if not exist out mkdir out
if exist out\full_silent.mp4 del /q out\full_silent.mp4
if exist final.mp4 move /y final.mp4 final_previous.mp4 >nul
echo [3/4] Rendering video (watch the frame count go up)...
call npx remotion render src/index.jsx Story out\full_silent.mp4 --gl=angle --concurrency=4 --image-format=jpeg --jpeg-quality=92 --crf=17
if exist out\full_silent.mp4 goto mux
echo.
echo First try failed. Re-downloading the render browser and trying again...
if exist node_modules\.remotion rmdir /s /q node_modules\.remotion
call npx remotion render src/index.jsx Story out\full_silent.mp4 --gl=angle --concurrency=4 --image-format=jpeg --jpeg-quality=92 --crf=17
if not exist out\full_silent.mp4 goto fail
:mux
echo [4/4] Adding the voiceover...
call npx remotion ffmpeg -y -hide_banner -loglevel error -i out\full_silent.mp4 -i voiceover.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest final.mp4
if not exist final.mp4 goto fail
echo.
echo DONE - your video is final.mp4 in this folder.
goto end
:fail
echo.
echo RENDER FAILED. Double-click check.bat, wait for it to finish, then tell Claude "checked"
echo (or send Claude the file out\check_log.txt).
:end
pause
