#!/usr/bin/env python3
"""Render clips.json into finished 9:16 shorts with burned-in captions + hook text.

Usage:
  make_shorts.py work/<id> [--layout blur|crop|facecam] [--facecam x,y,w,h]
                 [--only 1,4] [--no-captions] [--caption-color yellow] [--font Arial]
  make_shorts.py work/<id> --snapshot     # save a frame to locate the facecam
  make_shorts.py work/<id> --preview      # contact sheet of rendered shorts
"""
import argparse
import glob
import json
import math
import os
import re
import shutil
import subprocess
import sys
import tempfile

W, H = 1080, 1920
COLORS = {  # ASS colours are &HBBGGRR
    "yellow": "&H0000F0FF", "green": "&H0040FF40", "red": "&H004040FF",
    "cyan": "&H00FFFF00", "white": "&H00FFFFFF", "orange": "&H00008CFF",
}


def secs(t):
    if isinstance(t, (int, float)):
        return float(t)
    v = 0.0
    for p in str(t).split(":"):
        v = v * 60 + float(p)
    return v


def ass_time(t):
    t = max(0.0, t)
    cs = int(round(t * 100))
    return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def clean(w):
    return w.replace("{", "(").replace("}", ")").replace("\\", "")


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", path], capture_output=True, text=True).stdout
    return float(out.strip() or 0)


def group_words(words, max_words=3, max_gap=0.6):
    groups, cur = [], []
    for w in words:
        if cur and (len(cur) >= max_words or w["s"] - cur[-1]["e"] > max_gap
                    or re.search(r"[.!?,]$", cur[-1]["w"])):
            groups.append(cur); cur = []
        cur.append(w)
    if cur:
        groups.append(cur)
    return groups


def build_ass(path, words, clip_len, hook, font, hi_color, captions=True):
    lines = [
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {W}", f"PlayResY: {H}",
        "WrapStyle: 0", "ScaledBorderAndShadow: yes", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, "
        "BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, "
        "BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        f"Style: Cap,{font},92,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,1,0,1,7,3,2,60,60,560,1",
        f"Style: Hook,{font},78,&H00000000,&H00FFFFFF,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,18,0,8,70,70,230,1",
        "", "[Events]",
        "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ]
    if hook:
        end = min(3.2, clip_len)
        lines.append(f"Dialogue: 1,{ass_time(0)},{ass_time(end)},Hook,,0,0,0,,"
                     f"{{\\fad(120,200)}}{clean(hook)}")
    if captions:
        for g in group_words(words):
            g_end = g[-1]["e"]
            for i, w in enumerate(g):
                s = w["s"]
                e = g[i + 1]["s"] if i + 1 < len(g) else g_end + 0.15
                parts = []
                for j, x in enumerate(g):
                    txt = clean(x["w"]).upper()
                    if j == i:
                        parts.append(f"{{\\c{hi_color}\\fscx112\\fscy112}}{txt}{{\\c&H00FFFFFF&\\fscx100\\fscy100}}")
                    else:
                        parts.append(txt)
                lines.append(f"Dialogue: 0,{ass_time(s)},{ass_time(min(e, clip_len))},Cap,,0,0,0,,"
                             + " ".join(parts))
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def video_filter(layout, facecam, src_w, src_h):
    if layout == "crop":
        return f"[0:v]scale=-2:{H},crop={W}:{H}[v0]"
    if layout == "facecam":
        x, y, w, h = facecam
        cam_h = 760
        game_h = H - cam_h
        return (f"[0:v]split[c][g];"
                f"[c]crop=iw*{w}:ih*{h}:iw*{x}:ih*{y},scale={W}:{cam_h}:force_original_aspect_ratio=increase,"
                f"crop={W}:{cam_h}[cam];"
                f"[g]scale=-2:{game_h},crop={W}:{game_h}[game];"
                f"[cam][game]vstack[v0]")
    # blur (default): slightly zoomed full frame over blurred fill
    fg_w = 1160
    return (f"[0:v]split[a][b];"
            f"[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=24:3,eq=brightness=-0.08[bg];"
            f"[b]scale={fg_w}:-2,crop={W}:ih[fg];"
            f"[bg][fg]overlay=(W-w)/2:(H-h)/2-60[v0]")


def render(workdir, clip, words, args, src_w, src_h):
    out_dir = os.path.join(workdir, "shorts")
    s, e = secs(clip["start"]), secs(clip["end"])
    if e <= s:
        print(f"  skip #{clip['id']}: end before start"); return None
    s = max(0, s - 0.05)
    length = e - s
    cw = [{"w": w["w"], "s": round(w["s"] - s, 3), "e": round(w["e"] - s, 3)}
          for w in words if w["s"] >= s - 0.01 and w["e"] <= e + 0.3]
    name = f"short_{int(clip['id']):02d}"
    ass_name = f"{name}.ass"
    build_ass(os.path.join(out_dir, ass_name), cw, length, clip.get("hook", ""),
              args.font, COLORS.get(args.caption_color, args.caption_color), not args.no_captions)

    vf = video_filter(args.layout, args.facecam, src_w, src_h) + f";[v0]ass={ass_name},format=yuv420p[v]"
    cmd = ["ffmpeg", "-v", "error", "-y", "-ss", f"{s:.3f}", "-i", os.path.abspath(args.source),
           "-t", f"{length:.3f}", "-filter_complex", vf, "-map", "[v]", "-map", "0:a?",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-r", "30",
           "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
           "-movflags", "+faststart", f"{name}.mp4"]
    subprocess.run(cmd, check=True, cwd=out_dir)
    os.remove(os.path.join(out_dir, ass_name))
    return os.path.join(out_dir, f"{name}.mp4")


def preview(workdir):
    out_dir = os.path.join(workdir, "shorts")
    shorts = sorted(glob.glob(os.path.join(out_dir, "short_*.mp4")))
    if not shorts:
        sys.exit("No shorts rendered yet.")
    tmp = tempfile.mkdtemp()
    k = 0
    for p in shorts:
        d = duration(p)
        for frac in (0.08, 0.45, 0.85):
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{d * frac:.2f}", "-i", p,
                            "-frames:v", "1", "-vf", "scale=270:480",
                            os.path.join(tmp, f"{k:04d}.jpg")], check=True)
            k += 1
    cols = 6
    rows = math.ceil(k / cols)
    out = os.path.join(out_dir, "preview.jpg")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(tmp, "%04d.jpg"),
                    "-vf", f"tile={cols}x{rows}:padding=6:color=black", "-frames:v", "1", out], check=True)
    shutil.rmtree(tmp)
    print(f"✓ Preview → {out}  (3 frames per short, 2 shorts per row)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--layout", default="blur", choices=["blur", "crop", "facecam"])
    ap.add_argument("--facecam", help="x,y,w,h as fractions of the frame, e.g. 0.72,0.68,0.27,0.30")
    ap.add_argument("--only", help="comma-separated clip ids")
    ap.add_argument("--no-captions", action="store_true")
    ap.add_argument("--caption-color", default="yellow")
    ap.add_argument("--font", default="Arial Black")
    ap.add_argument("--snapshot", action="store_true")
    ap.add_argument("--preview", action="store_true")
    args = ap.parse_args()
    wd = args.workdir
    args.source = os.path.join(wd, "source.mp4")

    if args.preview:
        return preview(wd)
    if args.snapshot:
        d = duration(args.source)
        out = os.path.join(wd, "snapshot.jpg")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{d * 0.3:.1f}", "-i", args.source,
                        "-frames:v", "1", "-vf", "scale=1280:-2", out], check=True)
        print(f"✓ {out}"); return

    if args.layout == "facecam":
        if not args.facecam:
            sys.exit("--layout facecam needs --facecam x,y,w,h (run --snapshot to find it)")
        args.facecam = [float(v) for v in args.facecam.split(",")]

    clips = json.load(open(os.path.join(wd, "clips.json"), encoding="utf-8"))
    if args.only:
        keep = {int(i) for i in args.only.split(",")}
        clips = [c for c in clips if int(c["id"]) in keep]
    tr_path = os.path.join(wd, "transcript.json")
    words = json.load(open(tr_path, encoding="utf-8"))["words"] if os.path.exists(tr_path) else []

    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                            "stream=width,height", "-of", "csv=p=0", args.source],
                           capture_output=True, text=True).stdout.strip().split(",")
    src_w, src_h = int(probe[0]), int(probe[1])
    os.makedirs(os.path.join(wd, "shorts"), exist_ok=True)

    done = []
    for n, c in enumerate(clips, 1):
        print(f"● Shorts edit ho rahe hain ({n}/{len(clips)}) — #{c['id']} {c.get('hook', '')}")
        p = render(wd, c, words, args, src_w, src_h)
        if p:
            done.append(p)
    print(f"✓ {len(done)} shorts → {os.path.join(wd, 'shorts')}")


if __name__ == "__main__":
    main()
