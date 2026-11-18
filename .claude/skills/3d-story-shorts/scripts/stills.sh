#!/bin/bash
# Render check stills in the cloud workspace (no graphics card: ~20-40 s per still) and tile them.
# usage: scripts/stills.sh PROJECT_DIR TAG FRAME [FRAME ...]
P=$1; tag=$2; shift 2; mkdir -p "$P/stills"; cd "$P"
CH=$(command -v google-chrome || command -v chromium || command -v chromium-browser)
for f in "$@"; do
  npx remotion still src/index.jsx Story stills/${tag}_$(printf %04d $f).png --frame=$f --scale=0.5 --gl=swangle ${CH:+--browser-executable=$CH} >/dev/null 2>&1 || echo "fail $f"
done
python3 - "$tag" <<'PY'
import sys,glob
from PIL import Image, ImageDraw
tag=sys.argv[1]; fs=sorted(glob.glob(f"stills/{tag}_*.png"))
ims=[Image.open(f) for f in fs]; w,h=ims[0].size; cols=6; rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(cols*w,rows*h),'black'); d=ImageDraw.Draw(sheet)
for i,(f,im) in enumerate(zip(fs,ims)):
    x,y=(i%cols)*w,(i//cols)*h; sheet.paste(im,(x,y)); d.text((x+6,y+6),f.split('_')[-1][:-4],fill='red')
sheet.save(f"stills/sheet_{tag}.jpg",quality=85); print("sheet", f"stills/sheet_{tag}.jpg", len(ims))
PY
