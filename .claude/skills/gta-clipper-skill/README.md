# GTA Clipper Skill — paste a stream link, get viral shorts

Paste any stream/VOD link (YouTube live, Twitch VOD, Kick…) and Claude will:

1. ✓ Download the stream (plus live-chat replay if available)
2. ✓ Transcribe it with word-level timestamps
3. ✓ Find the high-engagement moments (loudness spikes, hype words, chat spam + its own read of the transcript)
4. ✓ Edit each one into a 1080×1920 short with a hook title and word-by-word captions
5. ✓ Write a posting kit (titles, descriptions, hashtags)

Works for any game or IRL stream, not just GTA.

## Setup (one time, ~5 minutes)

1. **Install Claude Code** (included with the Claude Pro plan) — https://claude.com/claude-code
2. **Install Python 3.9+** — https://www.python.org/downloads/
3. **Install ffmpeg**
   - Windows: `winget install Gyan.FFmpeg`
   - Mac: `brew install ffmpeg`
   - Linux: `sudo apt install ffmpeg`
4. **Extract this zip** anywhere, e.g. `Desktop/gta-clipper-skill`.
5. Open a terminal in that folder and run:
   ```
   pip install -r requirements.txt
   python scripts/check_setup.py
   ```
   It should say **All good ✓**.

## Use it

Open Claude Code, **choose the `gta-clipper-skill` folder**, and type:

```
Is stream se viral shorts banao 👉 https://www.youtube.com/live/XXXXXXX
```

Claude handles the rest. Your shorts appear in `work/<stream-id>/shorts/`.

Handy extras you can just say in chat:
- "Sirf 1:00:00 se 2:30:00 tak ka part use karo" — clip only a section
- "Facecam upar, gameplay neeche wala layout chahiye" — stacked facecam layout
- "Captions green karo" / "10 shorts banao" / "clip 3 ko 5 second chhota karo"

### Also works as an installable skill
- **Claude Code (all projects):** copy the folder to `~/.claude/skills/gta-clipper-skill/`
- **Claude app:** Settings → Capabilities → Skills → upload this zip
  (the app runs in the cloud, so long stream downloads may be blocked — Claude Code on your own computer is recommended)

## Tips
- First run downloads the speech model (~500 MB for `small`). After that it's offline.
- A 2-hour stream takes roughly 15–30 minutes on a normal laptop. With an NVIDIA GPU it's much faster.
- Hindi/Hinglish streams: ask Claude to use the `medium` model for better captions.
- Only repost streams you own or have permission to clip.

## What's inside
```
gta-clipper-skill/
├── SKILL.md              ← the instructions Claude follows
├── CLAUDE.md             ← makes it work when you open this folder in Claude Code
├── requirements.txt
├── references/viral-rules.md   ← what makes a clip go viral
└── scripts/
    ├── check_setup.py    ← checks ffmpeg / python packages
    ├── download.py       ← yt-dlp download + chat replay
    ├── transcribe.py     ← faster-whisper, word timestamps
    ├── find_hype.py      ← scores every moment (audio + speech + chat)
    └── make_shorts.py    ← 9:16 render, captions, hook text, preview sheet
```
