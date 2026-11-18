#!/usr/bin/env python3
"""Check that everything the clipper needs is installed."""
import importlib.util
import platform
import shutil
import sys

ok = True
print(f"Python {sys.version.split()[0]} on {platform.system()}")
if sys.version_info < (3, 9):
    print("  ✗ Python 3.9+ required"); ok = False

for tool in ("ffmpeg", "ffprobe"):
    if shutil.which(tool):
        print(f"  ✓ {tool}")
    else:
        ok = False
        print(f"  ✗ {tool} not found")

for mod, pkg in (("yt_dlp", "yt-dlp"), ("faster_whisper", "faster-whisper"), ("numpy", "numpy")):
    if importlib.util.find_spec(mod):
        print(f"  ✓ {pkg}")
    else:
        ok = False
        print(f"  ✗ {pkg} not installed")

if not ok:
    sysname = platform.system()
    print("\nInstall what's missing:")
    print("  pip install -r requirements.txt   (run inside the skill folder)")
    if not shutil.which("ffmpeg"):
        if sysname == "Darwin":
            print("  brew install ffmpeg")
        elif sysname == "Windows":
            print("  winget install Gyan.FFmpeg     (then restart the terminal)")
        else:
            print("  sudo apt install ffmpeg")
    sys.exit(1)

print("\nAll good ✓ — ready to clip.")
