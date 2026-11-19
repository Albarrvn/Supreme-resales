#!/usr/bin/env python3
"""Add a powerful hook to rendered shorts: punch-in zoom + white flash + big pop-in text
+ voiceover (game audio ducked under it) + boom/whoosh SFX.
Usage: hookify.py WORKDIR VOICEDIR SFXDIR
"""
import json, os, subprocess, sys

WD, VO, SFX = sys.argv[1], sys.argv[2], sys.argv[3]
FONT = os.path.expanduser("~/.fonts/Anton-Regular.ttf")
SH = f"{WD}/shorts"
OUT = f"{WD}/final"
os.makedirs(OUT, exist_ok=True)
HOOK_T = 3.0
TEASE = 1.6
# climax moment (source seconds) shown first as a flash-forward
CLIMAX = {int(k): v for k, v in json.load(open(f"{WD}/climax.json")).items()}
REGION = json.load(open(f"{WD}/climax_region.json")) if os.path.exists(f"{WD}/climax_region.json") else [0.03, 0.99]


def teaser_from_source(t0, out):
    """Render a flash-forward from the original video with the same region layout (no captions)."""
    x0, x1 = REGION
    vf = (f"[0:v]split[a][b];[a]crop=iw*{x1-x0}:ih:iw*{x0}:0,scale=1080:1920:force_original_aspect_ratio=increase,"
          f"crop=1080:1920,boxblur=24:3,eq=brightness=-0.12[bg];[b]crop=iw*{x1-x0}:ih:iw*{x0}:0,scale=1080:-2[fg];"
          f"[bg][fg]overlay=0:(H-h)/2-40,fps=30,format=yuv420p[v]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t0:.2f}", "-t", f"{TEASE}", "-i", f"{WD}/source.mp4",
                    "-filter_complex", vf, "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-crf", "18",
                    "-preset", "medium", "-c:a", "aac", "-ar", "48000", "-ac", "2", out], check=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True).stdout)


clips = json.load(open(f"{WD}/clips_hooks.json", encoding="utf-8"))
for c in clips:
    i = c["id"]
    src, vo = f"{SH}/short_{i:02d}.mp4", f"{VO}/v{i}.wav"
    if not (os.path.exists(src) and os.path.exists(vo)):
        print(f"skip {i}"); continue
    es, en = [x.strip() for x in c["hook"].split("\\N")]
    es = "".join(ch for ch in es if ord(ch) < 0x2190)  # drop emoji: Anton has none
    t1, t2 = f"{OUT}/h{i}a.txt", f"{OUT}/h{i}b.txt"
    open(t1, "w", encoding="utf-8").write(es.strip())
    open(t2, "w", encoding="utf-8").write(en)
    tt = CLIMAX[i] - c["start"]
    if 0 <= tt <= c["end"] - c["start"] - TEASE:
        tin = ["-ss", f"{tt:.2f}", "-t", f"{TEASE}", "-i", src]
    else:
        tz = f"{OUT}/teaser_{i}.mp4"
        teaser_from_source(CLIMAX[i], tz)
        tin = ["-i", tz]
    L = dur(src) + TEASE
    vd = dur(vo)
    fs1 = int(min(118, 960 / (0.46 * max(1, len(es.strip())))))
    fs2 = int(min(62, 980 / (0.42 * max(1, len(en)))))
    duck = vd + 0.35
    # pop-in scale for text: fontsize grows from 70% to 100% in 0.18s
    pop = "min(1,0.7+0.3*t/0.18)"
    vf = (
        "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[cv][ca];[cv]scale=w='1080*(1+0.22*exp(-pow(t/0.28,2)))':h='1920*(1+0.22*exp(-pow(t/0.28,2)))':eval=frame,"
        "crop=1080:1920,"
        "eq=brightness='0.45*exp(-pow(t/0.07,2))':eval=frame,"
        f"drawbox=x=0:y=170:w=1080:h=330:color=black@0.55:t=fill:enable='lt(t,{HOOK_T})',"
        f"drawtext=fontfile={FONT}:textfile={t1}:fontsize='{fs1}*{pop}':fontcolor=0xFFE600:"
        f"borderw=10:bordercolor=black:x=(w-tw)/2:y=200:enable='lt(t,{HOOK_T})',"
        f"drawtext=fontfile={FONT}:textfile={t2}:fontsize='{fs2}*{pop}':fontcolor=white:"
        f"borderw=6:bordercolor=black:x=(w-tw)/2:y=360:enable='lt(t,{HOOK_T})'[v]"
    )
    af = (
        f"[ca]volume='if(lt(t,{duck:.2f}),0.25,1)':eval=frame[g];"
        "[2:a]adelay=120|120,apad[n];"
        "[3:a]volume=0.9,apad[b];"
        f"[4:a]volume=0.6,adelay={int(TEASE * 1000 - 250)}|{int(TEASE * 1000 - 250)},apad[w];"
        "[g][n][b][w]amix=inputs=4:duration=first:normalize=0,"
        "loudnorm=I=-14:TP=-1.5:LRA=11[a]"
    )
    out = f"{OUT}/short_{i:02d}_hook.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *tin, "-i", src, "-i", vo, "-i", f"{SFX}/impact.mp3",
                    "-i", f"{SFX}/whoosh.mp3", "-filter_complex", vf + ";" + af, "-map", "[v]", "-map", "[a]",
                    "-t", f"{L:.2f}", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", out], check=True)
    print(f"✓ {out} ({L:.1f}s, voice {vd:.1f}s)", flush=True)
