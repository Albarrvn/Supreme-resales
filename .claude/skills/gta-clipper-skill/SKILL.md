---
name: gta-clipper-skill
description: Turn any livestream or long video link (YouTube live/VOD, Twitch VOD, Kick, etc.) into ready-to-post viral vertical shorts (9:16, burned-in captions, hook text). Use when the user pastes a stream/video link and asks for shorts, reels, clips, or "is stream se viral shorts banao".
---

# Stream → Viral Shorts Clipper

The user pastes a stream link. You download it, transcribe it, find the most
engaging moments, and render each one as a finished 1080x1920 short with
word-by-word captions. Work in a `work/<stream-id>/` folder next to this skill
(or the user's current folder) and deliver the shorts in `shorts/`.

All scripts live in `scripts/` inside this skill folder. Call them with
`python3 <skill-dir>/scripts/<name>.py`. Speak to the user in the language they
used (Hinglish is fine) and keep progress updates short, like:

- ✓ Stream download ho raha hai…
- ✓ Transcribe kar raha hoon…
- ✓ High-engagement moments mile: N
- ● Shorts edit ho rahe hain (3/N)…

## Step 0 — Setup check (first run only)

```bash
python3 scripts/check_setup.py
```

If anything is missing, run the install command it prints
(`pip install -r requirements.txt` and install ffmpeg). Don't continue until it
says everything is OK.

## Step 1 — Download the stream

```bash
python3 scripts/download.py "<URL>" --out work/<id>
```

- Downloads best quality up to 1080p as `work/<id>/source.mp4`, plus
  `info.json` and, when the platform has it, live chat replay (`chat.json`).
- For very long streams (3h+), ask the user if they want only a section, then
  pass `--section 01:00:00-02:30:00`. If they don't answer, do the whole thing.
- If a download fails because of sign-in/age/region, tell the user and ask them
  to pass browser cookies: `--cookies-from-browser chrome`.

## Step 2 — Transcribe

```bash
python3 scripts/transcribe.py work/<id>/source.mp4 --model small
```

Writes `transcript.json` (word-level timestamps) and `transcript.txt`
(compact `[hh:mm:ss] text` lines for you to read). Use `--model medium` for
Hindi/Hinglish-heavy streams if the machine is fast enough; `--language hi`
forces Hindi. On a GPU it auto-uses CUDA.

## Step 3 — Find the high-engagement moments

First get the objective signals:

```bash
python3 scripts/find_hype.py work/<id>
```

This writes `hype.json` and prints the top windows ranked by a combined score of:
audio loudness spikes (screaming, laughing, explosions), speech excitement
(fast talk, caps-worthy words), and chat activity spikes (if `chat.json` exists).

Then **read `transcript.txt` yourself** around each candidate window (and skim
the whole thing for moments the signals missed). Pick the best clips using
`references/viral-rules.md`. Default target: 8–15 clips for a 2–4h stream,
fewer for short videos. Each clip:

- 20–59 seconds (sweet spot 25–45s).
- Starts on the hook — the first 1–2 seconds must be the most interesting
  line or action. Cut setup; never start on "so, uh…".
- Ends right after the payoff/punchline. No trailing dead air.
- Is understandable with zero context.

Write `work/<id>/clips.json`:

```json
[
  {
    "id": 1,
    "start": "01:12:05.4",
    "end": "01:12:41.0",
    "hook": "COPS KO CHAKMA DE DIYA 😂",
    "title": "Cops ko aise chakma diya 😂 #gta5",
    "reason": "loud spike + chat spam + funny payoff",
    "score": 9
  }
]
```

`hook` is the big text shown at the top for the first ~3 seconds (max ~6
words, all caps OK, 1 emoji max). Snap `start`/`end` to word boundaries from
`transcript.json` so no word is cut in half.

## Step 4 — Render the shorts

```bash
python3 scripts/make_shorts.py work/<id> --layout blur
```

Layouts:
- `blur` (default, safe for anything): full 16:9 frame centered on a blurred
  zoomed copy of itself.
- `crop`: center crop to 9:16 — good when the action is in the middle.
- `facecam`: streamer cam on top, gameplay on the bottom. Needs the cam
  position as fractions of the frame:
  `--facecam 0.72,0.68,0.27,0.30` (x,y,w,h). To find it, run
  `python3 scripts/make_shorts.py work/<id> --snapshot` and look at
  `work/<id>/snapshot.jpg`, then estimate the box.

Other useful flags: `--only 3,5` (re-render some clips), `--no-captions`,
`--caption-color yellow`, `--font "Montserrat"`.

Output: `work/<id>/shorts/short_01.mp4 …` with loudness-normalised audio,
word-by-word highlighted captions in the lower-middle safe zone, and the hook
title at the top.

## Step 5 — Check and deliver

1. Run `python3 scripts/make_shorts.py work/<id> --preview` — it writes a
   contact sheet `shorts/preview.jpg` (3 frames per short). Look at it: captions
   readable, nothing important cropped, hook not covering faces. Fix and
   re-render with `--only` if needed.
2. Write `shorts/posting-kit.md`: for each short — title (<70 chars), a 1–2
   line description, 5–8 hashtags, and the best clip to post first.
3. Tell the user where the `shorts/` folder is, how many shorts were made, and
   which 3 you'd post first and why. Don't recap every step.

## Notes

- Only clip streams the user owns or has permission to repost. If the link is
  clearly someone else's channel, mention that reposting needs the creator's
  permission (clipping for the creator / with credit is common practice).
- Long streams: transcription is the slow part (~5–15 min per hour of video on
  a laptop CPU with `small`). Tell the user roughly how long it'll take.
- Everything runs locally; nothing is uploaded anywhere.
