# usage: thumb.py PLATE.jpg x0,y0,x1,y1 "LINE 1" "LINE 2" OUT.jpg  -> 1080x1920 thumbnail: big text band, scene crop, presenter, handle
import sys, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'junta-t-lemo')
from PIL import Image, ImageDraw, ImageFont
plate, crop, l1, l2, out = sys.argv[1:6]; x0, y0, x1, y1 = map(int, crop.split(','))
W, H = 1080, 1920; INK = (230, 241, 243); OR = (255, 140, 42); CY = (56, 225, 255); RD = (255, 77, 77)
im = Image.new('RGB', (W, H), (12, 27, 33)); d = ImageDraw.Draw(im)
pl = Image.open(plate).crop((x0, y0, x1, y1)); s = max(W / pl.width, 860 / pl.height); pl = pl.resize((int(pl.width * s), int(pl.height * s)), Image.LANCZOS)
cx, cy = (pl.width - W) // 2, (pl.height - 860) // 2; im.paste(pl.crop((cx, cy, cx + W, cy + 860)), (0, 560))
f = lambda n: ImageFont.truetype(os.path.join(D, 'poppins900.ttf'), n)
def fit(t, n):
    while d.textlength(t, font=f(n)) > W - 60: n -= 6
    return n
for y, t, c in [(60, l1, INK), (290, l2, OR)]: n = fit(t, 190); w = d.textlength(t, font=f(n)); d.text(((W - w) / 2, y + (190 - n) * .6), t, font=f(n), fill=c)
p = Image.open(os.path.join(D, 'presenter.png')).convert('RGBA'); ph = 470; p = p.resize((int(p.width * ph / p.height), ph), Image.LANCZOS)
x, y = W - p.width - 40, H - ph - 40; m = Image.new('L', p.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, p.width - 1, ph - 1), 36, fill=255)
im.paste(p, (x, y), m); d.rounded_rectangle((x - 4, y - 4, x + p.width + 3, y + ph + 3), 40, outline=CY, width=7)
d.text((40, 1780), '@luisgabb17', font=f(56), fill=INK); im.save(out, quality=94)
