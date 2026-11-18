#!/usr/bin/env python3
"""Score every moment of the stream for 'hype' using objective signals.

Signals (each z-scored, then combined):
  - audio: loudness spikes vs. the stream's own baseline (screams, laughs, explosions)
  - speech: words per second + excited words / repeated words
  - chat: messages per second + reaction spam (only if chat.json exists)

Usage: find_hype.py work/<id> [--window 30] [--top 25]
Writes hype.json and prints the top candidate windows with transcript snippets.
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np

EXCITED = re.compile(
    r"\b(no+|yes+|what+|bro+|oh+|omg|wow|wtf|lol|haha+|bhai|arre+|abe+|kya+|"
    r"run+|bhaag+|go+|holy|insane|crazy|let'?s go|chal+|maar|mar gaya|dead|clip it)\b",
    re.I)
CHAT_HYPE = re.compile(r"(😂|🤣|💀|🔥|lol|lmao|kekw|omegalul|pog|clip|w+\b|omg|haha|xd)", re.I)


def ts(s):
    s = int(s)
    return f"{s // 3600:02d}:{s % 3600 // 60:02d}:{s % 60:02d}"


def audio_db_per_sec(video):
    sr = 8000
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vn", "-ac", "1", "-ar", str(sr),
                          "-f", "s16le", "-"], stdout=subprocess.PIPE)
    out = []
    while True:
        buf = p.stdout.read(sr * 2)
        if not buf:
            break
        x = np.frombuffer(buf, dtype=np.int16).astype(np.float32) / 32768.0
        # use the loudest 100ms inside each second — catches short screams
        n = len(x) // 800 * 800
        if n == 0:
            out.append(-90.0); continue
        rms = np.sqrt(np.mean(x[:n].reshape(-1, 800) ** 2, axis=1) + 1e-10)
        out.append(float(20 * np.log10(rms.max())))
    p.wait()
    return np.array(out)


def chat_per_sec(path, n, offset):
    msgs = np.zeros(n); hype = np.zeros(n)
    if not os.path.exists(path):
        return None, None
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                d = json.loads(line)
                act = d.get("replayChatItemAction", {})
                t = int(act.get("videoOffsetTimeMsec", 0)) / 1000.0 - offset
                text = ""
                for a in act.get("actions", []):
                    item = a.get("addChatItemAction", {}).get("item", {})
                    r = item.get("liveChatTextMessageRenderer") or item.get("liveChatPaidMessageRenderer")
                    if r:
                        text = "".join(run.get("text", run.get("emoji", {}).get("shortcuts", [""])[0])
                                       for run in r.get("message", {}).get("runs", []))
            except Exception:
                continue
            i = int(t)
            if 0 <= i < n:
                msgs[i] += 1
                if CHAT_HYPE.search(text or ""):
                    hype[i] += 1
    return msgs, hype


def z(x):
    x = np.asarray(x, dtype=float)
    sd = x.std()
    return (x - x.mean()) / sd if sd > 0 else np.zeros_like(x)


def window_sum(x, w):
    c = np.concatenate([[0], np.cumsum(x)])
    return c[w:] - c[:-w]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("workdir")
    ap.add_argument("--window", type=int, default=30)
    ap.add_argument("--top", type=int, default=25)
    a = ap.parse_args()

    video = os.path.join(a.workdir, "source.mp4")
    tr = json.load(open(os.path.join(a.workdir, "transcript.json"), encoding="utf-8"))
    sec_path = os.path.join(a.workdir, "section.json")
    offset = json.load(open(sec_path))["offset"] if os.path.exists(sec_path) else 0.0

    print("Measuring audio loudness…")
    db = audio_db_per_sec(video)
    n = len(db)
    if n < a.window:
        a.window = max(5, n // 2)

    # audio: how far above the local (2-min rolling median) baseline each second is
    k = 120
    pad = np.pad(db, (k // 2, k - k // 2 - 1), mode="edge")
    base = np.convolve(pad, np.ones(k) / k, mode="valid")[:n]
    audio = np.clip(db - base, 0, None)

    wps = np.zeros(n); exc = np.zeros(n)
    for w in tr["words"]:
        i = int(w["s"])
        if 0 <= i < n:
            wps[i] += 1
            if EXCITED.search(w["w"]) or (w["w"].isupper() and len(w["w"]) > 2):
                exc[i] += 1

    msgs, chype = chat_per_sec(os.path.join(a.workdir, "chat.json"), n, offset)

    W = a.window
    score = 1.0 * z(window_sum(audio, W)) + 0.6 * z(window_sum(wps, W)) + 0.8 * z(window_sum(exc, W))
    signals = ["audio", "speech", "excited-words"]
    if msgs is not None and msgs.sum() > 20:
        # chat reacts ~5-15s late: shift it back
        lag = 8
        m = np.concatenate([msgs[lag:], np.zeros(lag)]); h = np.concatenate([chype[lag:], np.zeros(lag)])
        score += 1.2 * z(window_sum(m, W)) + 1.0 * z(window_sum(h, W))
        signals += ["chat", "chat-reactions"]

    # pick non-overlapping top windows
    order = np.argsort(-score)
    picked = []
    for i in order:
        if all(abs(i - j) >= W for j, _ in picked):
            picked.append((int(i), float(score[i])))
        if len(picked) >= a.top:
            break

    segs = tr["segments"]
    results = []
    for rank, (i, sc) in enumerate(picked, 1):
        s, e = i, i + W
        text = " ".join(x["text"] for x in segs if x["e"] > s and x["s"] < e)
        peak = s + int(np.argmax(audio[s:e])) if e <= n else s
        results.append({"rank": rank, "start": s, "end": e, "start_ts": ts(s), "end_ts": ts(e),
                        "peak_ts": ts(peak), "score": round(sc, 2), "text": text[:400]})

    json.dump({"signals": signals, "window": W, "candidates": results},
              open(os.path.join(a.workdir, "hype.json"), "w"), indent=1, ensure_ascii=False)
    print(f"Signals used: {', '.join(signals)}\n")
    for r in results:
        print(f"#{r['rank']:>2}  {r['start_ts']}–{r['end_ts']}  peak {r['peak_ts']}  score {r['score']}")
        print(f"     {r['text'][:180]}")
    print(f"\n✓ {len(results)} candidates → hype.json  (now read transcript.txt and choose clips)")


if __name__ == "__main__":
    main()
