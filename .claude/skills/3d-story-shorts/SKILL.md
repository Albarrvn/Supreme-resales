---
name: 3d-story-shorts
description: Make a 45-65 s vertical story Short in the "true fact told as a mini-movie" style (2D cartoon people in busy 3D worlds, one-word captions), from idea to a rendered final.mp4.
---

# 3D Story Shorts

Makes a finished YouTube Short / TikTok in one proven style: a **true, surprising fact told as a one-minute mini-movie**. Flat 2D cartoon characters act inside bright, busy 3D worlds. The camera always moves, a white one-word caption pops in with every spoken word, and there is a fast cream fade between locations. The whole video is code (Remotion + three.js), so no image or model files are needed, and it renders in about 2 minutes on a normal gaming or office PC.

The user does four things: picks an idea, approves the script, approves a voice sample, and double-clicks one file to render. Claude does everything else.

## Files that come with this skill
- `template/`: a complete, working video project (the "Skyscraper Fixed in Secret" Short). Always start from a copy of it. Never rebuild the kit from scratch.
  - `src/kit.js`: materials, ink outlines, painted textures, signs, facades, the tower model.
  - `src/char.js`: the 2D character (palettes, hats, glasses, idle animation, turns to camera).
  - `src/props.js`: cars, taxis, buses, trees, hydrants, shop fronts, shelves, desks, lamps, tools, barrels and more.
  - `src/dress.js`: fills each location with props and people.
  - `src/worlds.js`: the locations, the story-specific objects, and the per-frame events tied to words.
  - `src/camera.js`: the camera plan per shot, light presets, cuts, and cream dips.
  - `src/Full.jsx`: renderer, sky, bloom, colour grade, vignette, captions.
  - `src/timing.json`: shot start/end times (written by `prepare_voice.py`).
  - `render.bat` (Windows), `render.sh` (Mac/Linux), `test_render.bat`, `check.bat` (writes a diagnostic log).
- `scripts/prepare_voice.py`: tightens the narration, sets the pace, and writes `timing.json`.
- `scripts/stills.sh`: renders check frames in the cloud and tiles them into a contact sheet.
- `example/`: the example script, its SHOTS.txt, and frames of the approved look.

If these files are not in the skill folder, ask the user once to attach the starter kit zip they downloaded with this skill.

## Hard rules
- **Fact-check everything.** Every on-screen claim needs two independent sources. Leave out anything single-source or disputed, and keep a fact map in `script.md`.
- **Stay inside YouTube policy:** no medical or financial advice, no invented quotes from real people, no graphic injury, and no "gambling systems". Real people are never shown as villains.
- **Label dramatisation.** Invented characters around a real fact are fine, but never present invented events as documented history.
- **Never copy another creator.** No reference channel's scripts, character designs, logos or exact sets. Use the style idea only.
- **Don't assume the audience or niche.** Ask the user, or take it from their message.
- Use simple words, one idea per sentence. Write numbers the way the narrator says them ("nineteen seventy-eight").
- **Keep approved things fixed:** script, voice, timing and facts. If a policy concern makes you want to change the user's content, tell them exactly what you changed.
- **Be honest about what was checked:** stills versus the full video.

## Step 1: Ideas (start immediately)
Search the web and give **5 true stories** that fit the formula:
- something strange happens;
- a real fact, law, loophole, invention or piece of science explains it;
- it can be shown on screen.

For each idea give:
- a one-line hook in the pattern **"[He/They] + [strange action] + [one exact detail]"**, for example "They painted the jail cell pink.";
- what moves on screen;
- the twist;
- 2-3 confirmed numbers or names.

Ask "Which one should I write?"

Real fact plus story plus twist is the format that performs. Plain explainers with no story, and pure fiction with no real fact, do far worse.

## Step 2: Script
Write 10-13 shots, 150-180 words, about 55-65 s at about 170 words per minute. One sentence or two short ones per shot, and one location per shot.

The beats:
1. **Hook (0-5 s):** the strange action stated as plain fact. No intro, no "did you know".
2. **Optional CTA line:** only if the user asks for one, right after the hook.
3. **"You see," plus stakes:** a rival, a race, a deadline.
4. **The doubt or the mocking:** someone laughs, or the rules say it's fine. Never invent a quote for a real person.
5. **Escalation with a ladder of numbers or time:** "In May... by July...".
6. **The problem:** "But..." / "Then...".
7. **Second "You see,":** the real science or reason, explained with one everyday object (blowing on soup, a phone sliding off a table).
8. **"So...":** what they did.
9. **Twist closing line** (5-19 words). No outro. Optionally cut mid-sentence so the replay loops into the hook.

Output:
- `script.md`: shot table, fact map with sources, what was left out on purpose, wording to watch;
- `SHOTS.txt`: one line per shot, `key | exact spoken text`, keys short and unique;
- a voice-over PDF.

Show the shot table and ask "Make the video from this script?"

## Step 3: Voice
- **User records it:** take their WAV/MP3.
- **Otherwise, use a connected text-to-speech tool:**
  1. Generate **3 short samples** of the hook in different voices and let the user pick one.
  2. Generate the **whole script in one single generation** with the chosen voice, so it never changes voice between batches.
  3. Keep each generation within the user's credit limits.
- Download the audio and run:
  `python3 scripts/prepare_voice.py RAW.wav SHOTS.txt <project>` (defaults: 170 wpm, max 1.12x speed, pitch kept).
- It tightens the pauses, matches every comma and full stop to a pause, and writes `<project>/voiceover.wav` and `<project>/src/timing.json`.
- If it says it can't find a pause, `SHOTS.txt` doesn't match the audio word for word. Fix the text and run it again.

## Step 4: Build (automatic)
1. Copy `template/` to a new project folder, `npm install`, then put the timing in place with Step 3.
2. **Plan locations:** 4-7 locations that fit the story (street, office, yard, workshop, control room, ship deck and so on). Re-use and re-dress the existing ones where possible. Each location sits at its own x offset in `LOC` (worlds.js).
3. **`src/camera.js` → `PLAN`:** one entry per shot key, exactly matching `timing.json`.
   - Each entry has a light preset (`day, night, storm, office, yard, joint, weather, morning`, or add your own), an `anchor` point for the light, and 3 camera keys `{p: position, l: look-at}`.
   - Use `beats: 'words:<key>:0,<word index>,<last>'` so the camera reaches a subject when it's named.
   - Shots whose camera continues from the previous shot go in the `CONT` set, so they get no cream dip.
4. **`src/worlds.js`:** story objects, in-world signs (`sign('TEXT', w, h, ...)`) and word-synced events using `wordT('<key>', wordIndex)`, for example a label appearing on its number word or a light going off on "emptied".
5. **`src/dress.js`:** fill every location. Street = `dressStreet` (traffic, pedestrians, shop fronts, trees, hydrants). Interiors: copy the office, workshop or weather patterns.
6. Replace the example's signs, magazine and posters with the new story's details.

### The look (do not drift from this)
- Bright, saturated colours: blue sky dome with sun and soft clouds, warm key light from the upper left, cool fill.
- Light bloom on lamps and windows, a colour grade (saturation 1.2), and a light vignette. Nights are deep blue with warm windows.
- Soft 4-band toon shading with dark ink outlines (#351f22) on everything.
- **Busy frames.** Every shot has a foreground, a midground and a background, with props and people in all three. Users reject "clean" empty sets.
- Interiors get contrast: cool walls (teal, blue) against warm wood, plus shelves, papers, posters, lamps and a clock.
- **Characters fill 35-50% of the frame height** in character shots, with the camera 2.5-4 m away. Wide shots are only for buildings and establishing views.
- Camera: always moving, eased in and out, net travel every shot. Cream dip (0.4 s) at location changes.
- Captions (in Full.jsx) are automatic from `timing.json`:
  - one word at a time, white Arial Black with a thick dark outline;
  - placed at 67% of frame height, below faces;
  - if a caption covers a key sign in a shot, move it for that shot (see the `close` override).

## Step 5: Check stills (automatic)
- Run `scripts/stills.sh <project> a <frames>`:
  - one frame from the middle of every shot;
  - plus the frames right after each word-synced event.
- Read the contact sheet and check that:
  - nothing hides a face, label or caption;
  - no character is cut off at the frame edge;
  - the camera isn't inside a wall or a car;
  - no room is blown out (too yellow or too white) or too dark;
  - the frames are busy enough;
  - the facts on screen are correct.
- Fix and repeat.
- In the cloud each still takes 20-40 s. Never render the whole video in the cloud unless the user can't render: it's about 6 s per frame, or about 1.7 s per frame without the BokehPass.

## Step 6: Get the project onto the user's computer
- **If the device tools are available:**
  1. Call `get_device_info` first and confirm the platform and device name. The linked computer can change mid-chat, and a Mac needs `render.sh`.
  2. Request one folder (for example Videos).
  3. Commit the project zip there and extract it with `device_bash` using `python3 -c "import zipfile; zipfile.ZipFile('x.zip').extractall('.')"`.
  4. Rename any old `final.mp4` first, so it isn't lost.
- **Otherwise:** send the zip, and tell the user to unzip it with Extract All. Windows browsers block downloading `.bat` files, so never send one on its own. Always send it inside the zip, or write it into their folder.
- Leave out `node_modules`, `out` and `stills` from the zip, but include `voiceover.wav`.

## Step 7: Render (user)
- **Windows:** press Windows+R, paste `%USERPROFILE%\Videos\<folder>\render.bat`, press Enter. If "Windows protected your PC" appears, click More info, then Run anyway.
- **Mac:** open Terminal, type `bash `, drag `render.sh` into the window, press Enter.
- Needs Node.js LTS (from nodejs.org); `node -v` checks it. The first run downloads tools for a few minutes. Then the frame count rises, and it prints `DONE - your video is final.mp4`.

## Troubleshooting (all seen in real runs)
- **No frame count after "Got Headless Shell", or the log says `spawn EFTYPE`:** the render browser was only half-unpacked. `render.bat` retries with a fresh download automatically. If it still fails and you can reach the folder, re-extract `node_modules/.remotion/chrome-headless-shell/chrome-headless-shell-win64.zip` into `win64/` yourself (compare the size of the .exe inside the zip with the file on disk).
- **"npm warn install-scripts esbuild" / "14 vulnerabilities":** normal. Never run `npm audit fix --force`.
- **It says RENDER FAILED, or something unclear:** have the user run `check.bat` and read `out/check_log.txt` (directly if you have folder access).
- **Caption timing feels off:** the captions follow `timing.json`. Re-run `prepare_voice.py` with the exact spoken text.
- **Shots look empty or dull:** add props with `dress.js` and move the camera closer. Don't lower the saturation or bloom below the template values.

## Step 8: Verify and deliver
- Check `final.mp4` with:
  - `ffprobe`: 720x1280, 30 fps, an audio stream, duration close to `timing.json`;
  - a contact sheet with one frame per shot;
  - `volumedetect`: a mean of roughly -16 to -20 dB.
- Send it, and say what was checked (frames and audio levels, not every second).
- Offer one next step: a fact-checked title and description, or background music mixed low under the voice.
