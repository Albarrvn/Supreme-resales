#!/bin/bash
# usage: stills.sh PROJECT TAG  -> renders the middle frame of every shot (+ optional extra frames) and tiles them
P=$1; TAG=$2; shift 2; cd "$P"; mkdir -p stills
FR=$(python3 -c "import json;d=json.load(open('src/timing.json'));print(' '.join(str(int((s['start']+s['end'])/2*30)) for s in d['shots']))")
FR="$FR $@"
for f in $FR; do npx remotion still src/index.jsx Story stills/${TAG}_$(printf %04d $f).png --frame=$f --scale=0.5 --gl=swangle --browser-executable=/usr/bin/google-chrome >/dev/null 2>&1 || echo "fail $f"; done
python3 - "$TAG" <<'PY'
import sys,glob
from PIL import Image, ImageDraw
tag=sys.argv[1]; fs=sorted(glob.glob(f"stills/{tag}_*.png"))
ims=[Image.open(f).resize((240,427)) for f in fs]; w,h=ims[0].size; cols=6; rows=(len(ims)+cols-1)//cols
sheet=Image.new('RGB',(cols*w,rows*h),'black'); d=ImageDraw.Draw(sheet)
for i,(f,im) in enumerate(zip(fs,ims)):
    x,y=(i%cols)*w,(i//cols)*h; sheet.paste(im,(x,y)); d.text((x+6,y+6),f.split('_')[-1][:-4],fill='red')
sheet.save(f"stills/sheet_{tag}.jpg",quality=85); print("sheet", f"stills/sheet_{tag}.jpg", len(ims))
PY
