#!/usr/bin/env python3
"""Narrated vertical video from a scene spec: free TTS (edge-tts) + gameplay clips + animated labels,
word-by-word captions, punch zooms, flashes and SFX.

Usage: make_video.py SPECS.json OUTDIR [slug ...]
SPECS.json: {"sources": {key: [path, [x0, x1]]}, "outro": {"img", "say"}, "sfx": dir,
             "videos": [{"slug", "scenes": [{"src", "t", "say", "label", "punch": [rel s], "game": vol}]}]}
The first scene is the hook: it gets a punch zoom + flash + boom at t=0.
"""
import asyncio, json, os, ssl, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_shorts import build_ass, video_filter, W, H  # noqa: E402

import edge_tts  # noqa: E402
import edge_tts.communicate as ec  # noqa: E402

VOICE, RATE = "es-PR-VictorNeural", "+12%"
CA = "/root/.ccr/ca-bundle.crt"
if os.path.exists(CA):  # sandbox proxy re-signs TLS
    ec._SSL_CTX = ssl.create_default_context(cafile=CA)
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", "30",
       "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2"]


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True).stdout)


async def _tts(text, mp3):
    words = []
    c = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary", proxy=PROXY)
    with open(mp3, "wb") as f:
        async for ch in c.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] == "WordBoundary":
                s = ch["offset"] / 1e7
                words.append({"w": ch["text"], "s": s, "e": s + ch["duration"] / 1e7})
    return words


def tts(text, mp3):
    js = mp3 + ".json"
    if not os.path.exists(js):  # cache: re-renders don't re-synthesize
        json.dump(asyncio.run(_tts(text, mp3)), open(js, "w"))
    return json.load(open(js))


def render_scene(sc, i, spec, tmp, hook):
    mp3 = f"{tmp}/s{i}.mp3"
    words = tts(sc["say"], mp3)
    L = dur(mp3) + 0.45
    lead = 0.15
    words = [{**w, "s": w["s"] + lead, "e": w["e"] + lead} for w in words]
    ass = f"{tmp}/s{i}.ass"
    build_ass(ass, words, L, sc.get("label", ""), "Anton", "&H0000F0FF", True, hook_y=230, cap_y=430)
    s = open(ass, encoding="utf-8").read().replace("Style: Hook,Anton,78,", "Style: Hook,Anton,104,")  # bigger section labels for mobile
    open(ass, "w", encoding="utf-8").write(s)
    punch = ([0.0] if hook else []) + sc.get("punch", [])
    z = "1+0.05*t/%.2f" % L + "".join(f"+0.2*exp(-pow((t-{p:.2f})/0.3,2))" for p in punch)
    fl = "+".join(f"0.4*exp(-pow((t-{p:.2f})/0.07,2))" for p in punch) or "0"
    if sc["src"] == "img":
        inp = ["-loop", "1", "-t", f"{L:.2f}", "-i", spec["outro"]["img"], "-f", "lavfi", "-t", f"{L:.2f}",
               "-i", "anullsrc=r=48000:cl=stereo"]
        v0 = f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps=30[v0]"
    else:
        path, region = spec["sources"][sc["src"]]
        inp = ["-ss", f"{sc['t']:.2f}", "-t", f"{L:.2f}", "-i", path]
        v0 = video_filter("region", None, 0, 0, region).replace("[v0]", ",fps=30[v0]")
    sfx = spec["sfx"]
    g = 1 if sc["src"] == "img" else 0  # input index of the game/silence track
    k = 2 if sc["src"] == "img" else 1  # next input index
    inp += ["-i", mp3, "-i", f"{sfx}/whoosh.mp3"] + sum((["-i", f"{sfx}/impact.mp3"] for _ in punch), [])
    ad = lambda s: f"adelay={int(s * 1000)}|{int(s * 1000)}"
    a = f"[{g}:a]volume={sc.get('game', 0.14)}[g];[{k}:a]{ad(lead)},apad[n];[{k + 1}:a]volume=0.5,apad[w]"
    mix = "[g][n][w]"
    for j, p in enumerate(punch):
        a += f";[{k + 2 + j}:a]volume=0.7,{ad(p)},apad[i{j}]"
        mix += f"[i{j}]"
    a += f";{mix}amix=inputs={3 + len(punch)}:duration=first:normalize=0,atrim=0:{L:.2f}[aout]"
    vf = (f"{v0};[v0]scale=w='{W}*({z})':h='{H}*({z})':eval=frame,crop={W}:{H},"
          f"eq=brightness='{fl}':eval=frame,ass={os.path.basename(ass)},format=yuv420p[v]")
    out = f"{tmp}/s{i}.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *inp, "-filter_complex", vf + ";" + a,
                    "-map", "[v]", "-map", "[aout]", "-t", f"{L:.2f}", *ENC, out], check=True, cwd=tmp)
    return out


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    outdir, only = sys.argv[2], set(sys.argv[3:])
    os.makedirs(outdir, exist_ok=True)
    outro_tmp = f"{outdir}/_outro"
    os.makedirs(outro_tmp, exist_ok=True)
    outro = render_scene({"src": "img", "say": spec["outro"]["say"], "label": "", "punch": [0.0]}, 0, spec,
                         outro_tmp, False)
    for v in spec["videos"]:
        if only and v["slug"] not in only:
            continue
        tmp = f"{outdir}/_{v['slug']}"
        os.makedirs(tmp, exist_ok=True)
        parts = [render_scene(sc, i, spec, tmp, i == 0) for i, sc in enumerate(v["scenes"])] + [outro]
        lst = f"{tmp}/list.txt"
        open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
        cat, final = f"{tmp}/cat.mp4", f"{outdir}/{v['slug']}.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", cat],
                       check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", cat, "-c:v", "copy", "-af",
                        "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                        "-movflags", "+faststart", final], check=True)
        print(f"✓ {final} {dur(final):.1f}s", flush=True)


if __name__ == "__main__":
    main()
