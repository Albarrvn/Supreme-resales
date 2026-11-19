#!/usr/bin/env python3
"""'¿Real o GTA 6?' split-screen quiz shorts: two clips stacked, countdown, reveal with boom + flash.
Usage: real_or_gta.py OUTDIR   (rounds are defined below)"""
import os, subprocess, sys

W = "/home/user/Supreme-resales/.claude/skills/gta-clipper-skill/work"
REAL = f"{W}/realogta/real"
SFX = f"{W}/top8_champs/sfx"
FONT = os.path.expanduser("~/.fonts/Anton-Regular.ttf")
T, REVEAL = 12.0, 7.5  # total length, reveal time

# (name, top clip, bottom clip, which is GTA: "A"=top/"B"=bottom); clip = (path, start, x, y, w) crop as fractions
ROUNDS = [
    ("playa", (f"{REAL}/beach.webm", 0.5, 0.00, 0.10, 0.40), (f"{W}/8-DRGbQ1IXc/source.mp4", 277.0, 0.10, 0.00, 0.35), "B"),
    ("oceano", (f"{W}/Hrbt-cvHMkc/source.mp4", 616.0, 0.55, 0.05, 0.32), (f"{REAL}/beach.webm", 9.5, 0.20, 0.15, 0.45), "A"),
    ("persecucion", (f"{W}/8-DRGbQ1IXc/source.mp4", 57.0, 0.00, 0.02, 0.42), (f"{REAL}/chase.webm", 46.0, 0.25, 0.12, 0.50), "A"),
]


def build(name, top, bot, gta, out):
    inp, f = [], []
    for i, (p, s, x, y, w) in enumerate((top, bot)):
        inp += ["-ss", str(s), "-t", str(T), "-i", p]
        # crop keeps a 1080x960 (1.125) panel shape; fps/scale normalise both sources
        f.append(f"[{i}:v]crop=iw*{w}:iw*{w}/1.125:iw*{x}:ih*{y},scale=1080:960,setsar=1,fps=30[p{i}]")
    real = "B" if gta == "A" else "A"
    gy, ry = (0, 960) if gta == "A" else (960, 0)
    dt = lambda txt, size, y, color="white", en="1", x="(w-tw)/2": (
        f"drawtext=fontfile={FONT}:expansion=none:text='{txt}':fontsize={size}:fontcolor={color}:borderw=8:bordercolor=black:"
        f"x={x}:y={y}:enable='{en}'")
    pre, post = f"lt(t,{REVEAL})", f"gte(t,{REVEAL})"
    v = ";".join(f) + ";[p0][p1]vstack[s];[s]" + ",".join([
        "drawbox=x=0:y=954:w=1080:h=12:color=black:t=fill",
        dt("A", 120, 40, "0xFFE600", "1", "40"), dt("B", 120, 1000, "0xFFE600", "1", "40"),
        dt("SOLO EL 1% ACIERTA", 92, 330, "white", pre), dt("¿CUÁL ES REAL?", 120, 450, "0xFFE600", pre),
        *[dt(str(n), 260, 1540, "white", f"between(t,{REVEAL - 3 + k},{REVEAL - 2 + k - 0.01})")
          for k, n in enumerate((3, 2, 1))],
        f"drawbox=x=0:y={gy}:w=1080:h=960:color=0xFF3060:t=18:enable='{post}'",
        f"drawbox=x=0:y={ry}:w=1080:h=960:color=0x35F2A0:t=18:enable='{post}'",
        dt("GTA 6", 150, gy + 380, "0xFF3060", post), dt("REAL", 150, ry + 380, "0x35F2A0", post),
        dt(f"¡{gta} ERA GTA 6!", 96, 870, "white", post),
        dt("¿ACERTASTE? COMENTA", 64, 1780, "0xFFE600", f"gte(t,{REVEAL + 1})"),
        f"eq=brightness='0.5*exp(-pow((t-{REVEAL})/0.08,2))':eval=frame",
        f"scale=w='1080*(1+0.08*exp(-pow((t-{REVEAL})/0.25,2)))':h='1920*(1+0.08*exp(-pow((t-{REVEAL})/0.25,2)))':eval=frame",
        "crop=1080:1920,format=yuv420p"]) + "[v]"
    inp += ["-i", f"{SFX}/impact.mp3", "-i", f"{SFX}/riser.mp3", "-i", f"{SFX}/drop.mp3"]
    ms = lambda s: f"adelay={int(s * 1000)}|{int(s * 1000)}"
    a = ("[0:a]volume=0.35,apad[a0];[1:a]volume=0.35,apad[a1];"
         + f"[3:a]volume=0.6,{ms(REVEAL - 2.1)},apad[r];[4:a]volume=1.0,{ms(REVEAL)},apad[d];"
         f"[a0][a1][r][d]amix=inputs=4:normalize=0,atrim=0:{T},loudnorm=I=-14:TP=-1.5[aout]")
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", v + ";" + a, "-map", "[v]",
                    "-map", "[aout]", "-t", str(T), "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", out], check=True)


if __name__ == "__main__":
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    parts = []
    for i, (name, top, bot, gta) in enumerate(ROUNDS, 1):
        p = f"{out}/real_o_gta_{i}_{name}.mp4"
        build(name, top, bot, gta, p)
        parts.append(p)
        print("✓", p, flush=True)
    ins = sum((["-i", p] for p in parts), [])  # re-encode: stream-copy concat broke timestamps here
    cat = "".join(f"[{i}:v][{i}:a]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=1:a=1[v][a]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ins, "-filter_complex", cat, "-map", "[v]", "-map", "[a]",
                    "-c:v", "libx264", "-crf", "19", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
                    f"{out}/real_o_gta_3_rondas.mp4"], check=True)
    print("✓", f"{out}/real_o_gta_3_rondas.mp4")
