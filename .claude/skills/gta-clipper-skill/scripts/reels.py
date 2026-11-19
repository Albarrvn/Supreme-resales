#!/usr/bin/env python3
"""Meme-style reels: fixed white caption box on top, gameplay band, punch zoom + flash + boom at the climax.
Usage: reels.py OUTDIR"""
import os, subprocess, sys, textwrap

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_shorts import video_filter  # noqa: E402

W = "/home/user/Supreme-resales/.claude/skills/gta-clipper-skill/work"
SFX = f"{W}/top8_champs/sfx"
FONT = os.path.expanduser("~/.fonts/Anton-Regular.ttf")
SRC = {"hazard": (f"{W}/PH6WdBYOzSI/source.mp4", [0.08, 0.78]),
       "fish": (f"{W}/Hrbt-cvHMkc/source.mp4", [0.15, 0.85]),
       "millz": (f"{W}/sNZUPxg8KLE/source.mp4", [0.12, 0.88])}
# (slug, source, start, end, climax (source s), caption)
REELS = [
    ("1_karma_camioneta", "hazard", 4024.0, 4040.0, 4033.5, "Cuando por fin te sale algo bien en GTA 6:"),
    ("2_tiburones", "fish", 326.0, 338.0, 331.0, "Los tiburones de GTA 6 NO están jugando"),
    ("3_vida_real", "fish", 614.0, 631.0, 627.5, "Esto NO es la vida real. Es GTA 6"),
    ("4_maletero", "millz", 318.0, 333.0, 329.5, "Nunca abras el maletero de un desconocido en GTA 6"),
    ("5_gato", "hazard", 10802.0, 10815.0, 10806.2, "POV: tocaste al gato equivocado en GTA 6"),
]


def build(slug, src, s, e, climax, cap, out):
    path, region = SRC[src]
    L, p = e - s, climax - s
    tf = f"{out}/{slug}.txt"
    open(tf, "w", encoding="utf-8").write("\n".join(textwrap.wrap(cap.replace("GTA 6", "GTA\u00a06"), 20)))
    band_h = 1080 * 1080 / ((region[1] - region[0]) * 1920)  # height of the gameplay band from video_filter
    cap_bottom = int((1920 - band_h) / 2 - 40 - 50)
    z = f"(1+0.04*t/{L}+0.22*exp(-pow((t-{p})/0.3,2)))"
    vf = (video_filter("region", None, 0, 0, region).replace("[v0]", ",fps=30[v0]") + ";[v0]"
          f"drawtext=fontfile={FONT}:expansion=none:textfile={tf}:fontsize=74:fontcolor=black:line_spacing=12:"
          f"box=1:boxcolor=white:boxborderw=28:x=(w-tw)/2:y={cap_bottom}-th,"
          f"scale=w='1080*{z}':h='1920*{z}':eval=frame,crop=1080:1920,"
          f"eq=brightness='0.45*exp(-pow((t-{p})/0.07,2))':eval=frame,format=yuv420p[v]")
    ms = int(max(0, p - 0.05) * 1000)
    a = (f"[0:a]volume=0.9[g];[1:a]volume=0.9,adelay={ms}|{ms},apad[b];"
         f"[g][b]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14:TP=-1.5[aout]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(s), "-t", str(L), "-i", path, "-i", f"{SFX}/impact.mp3",
                    "-filter_complex", vf + ";" + a, "-map", "[v]", "-map", "[aout]", "-t", str(L),
                    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-c:a", "aac", "-b:a", "192k",
                    "-ar", "48000", "-movflags", "+faststart", f"{out}/reel_{slug}.mp4"], check=True)


if __name__ == "__main__":
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for r in REELS:
        build(*r, out)
        print("✓", r[0], flush=True)
