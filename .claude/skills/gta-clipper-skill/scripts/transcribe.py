#!/usr/bin/env python3
"""Transcribe a video with word-level timestamps (faster-whisper).

Usage: transcribe.py work/<id>/source.mp4 [--model small] [--language hi]
Writes transcript.json and transcript.txt next to the video.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile


def ts(s):
    s = int(s)
    return f"{s // 3600:02d}:{s % 3600 // 60:02d}:{s % 60:02d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--model", default="small", help="tiny|base|small|medium|large-v3")
    ap.add_argument("--language", default=None, help="e.g. en, hi (auto if omitted)")
    a = ap.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("faster-whisper missing: pip install -r requirements.txt")

    out_dir = os.path.dirname(os.path.abspath(a.video))
    wav = os.path.join(tempfile.gettempdir(), "clipper_audio.wav")
    print("Extracting audio…")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.video, "-vn", "-ac", "1",
                    "-ar", "16000", wav], check=True)

    device, ctype = "cpu", "int8"
    try:
        import ctranslate2
        if ctranslate2.get_cuda_device_count() > 0:
            device, ctype = "cuda", "float16"
    except Exception:
        pass
    print(f"Loading whisper '{a.model}' on {device}…")
    model = WhisperModel(a.model, device=device, compute_type=ctype)

    segs, info = model.transcribe(wav, language=a.language, word_timestamps=True,
                                  vad_filter=True, beam_size=5)
    print(f"Language: {info.language}  |  Duration: {ts(info.duration)}")

    segments, words = [], []
    for s in segs:
        ws = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)}
              for w in (s.words or []) if w.word.strip()]
        segments.append({"s": round(s.start, 2), "e": round(s.end, 2), "text": s.text.strip()})
        words.extend(ws)
        print(f"\r  transcribed {ts(s.end)} / {ts(info.duration)}", end="", flush=True)
    print()

    json.dump({"language": info.language, "duration": info.duration,
               "segments": segments, "words": words},
              open(os.path.join(out_dir, "transcript.json"), "w"), ensure_ascii=False)
    with open(os.path.join(out_dir, "transcript.txt"), "w", encoding="utf-8") as f:
        for s in segments:
            f.write(f"[{ts(s['s'])}] {s['text']}\n")
    os.remove(wav)
    print(f"✓ {len(segments)} segments, {len(words)} words → transcript.json / transcript.txt")


if __name__ == "__main__":
    main()
