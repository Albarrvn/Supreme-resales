# @NBAreelsHD: 9 reels in Swiss Motion Graphics (one per player)

Vertical 1080×1920, 24 fps, 18–26 s each, Spanish, the user's cloned voice (Chatterbox, local).
One shared system (one `index.html`), nine content files (`reels/*.json`).

## 1. Three candidate structures

1. **Countdown**: the five records as a top 5 in a single long video. Rejected: a reel needs one hook, and five short reels give five chances to go viral.
2. **Timetable**: each reel as a column of minutes/quarters filling in. Only works for Klay and Kobe; Wilt and the LeBron block don't break down that way.
3. **Giant numeral → dismantling → the exception** (chosen). Each reel opens with ONE fact at a scale that fills the frame (13/13, 81, 100, 402, 1:50). The grid then breaks it into modules (shots, halves, seasons, seconds), and at the end a single orange element, the exception, is the record itself. It works for all five, and the hook is visual, legible with the sound off and with no "hello".

## 2. Logline and arc
A number nobody believes → the grid shows how it was built, piece by piece → the number returns, now in orange, and the question goes to the viewer.
Setup (hook 0–3 s) → construction (modules snapping on the beat) → turn (silence, then the record in orange) → loop-back question.

## 3. Benchmark
- Learn from: 1960s Swiss sports posters (scale contrast, flush-left type), the sports-stat explainer reel (a single fact per screen, the number before the word).
- Don't take: team or league logos, broadcast typefaces, real photos, any copied poster composition.

## 4. System and shot list (the same for all nine)
| Shot | Framing / move | Duration | Why |
|---|---|---|---|
| A. Hook | giant numeral filling the width, flush left; the camera pulls back 1 module on the beat | 2.5–3.5 s | the number is the hook; readable without sound |
| B. Context | push to the caption row (date, game) | 2–3 s | credibility: real date and opponent |
| C. Modules | 6-column grid; cells or bars snap one per beat | 4–7 s | the record "built" piece by piece (Snap = beat) |
| D. Silence | everything stops for half a bar; knife cut through the old | 1 s | the turn |
| E. The exception | the record in orange, the only element off the grid, linear move | 3–4 s | the protagonist (signal colour) |
| F. Question | vertical scroll to a flush-left question + `@NBAreelsHD` in the corner | 3 s | comment/save CTA; loops back to A |

Camera moves used: pull-out, push, hard pan by one column, vertical scroll, the exception's linear drift.

## 5. Beat sheet
Driven by the voice: each line starts on the next beat (120 bpm, 0.5 s) after the previous one ends + 0.25 s. Scene changes on downbeats.

## 6. Cue map
120 bpm, 4/4. Motorik kick + hat + bass in a minor key, synthesized (numpy). A: kick + bass only. C: hat added (one instrument per new rule). D: everything cut for half a bar. E: full band + sine glide following the exception. F: bass only, until the cut.

## 7. Sound design
| Section | Bed | Foley | Music |
|---|---|---|---|
| A | room tone | numeral thunk | kick+bass |
| B | – | paper slap on each caption | kick+bass |
| C | – | block snap per cell / bar | + hats |
| D | silence | guillotine snick (knife cut) | stop |
| E | – | felt thump when it lands | full + glide |
| F | – | stamp on the question | bass |
Voice compressed, ≥6 dB above the music, music ducked ~10 dB under the voice, −14 LUFS.

## 8. Type and subtitles
Archivo (OFL) 500/800/900, the only family. Paper `#F2F0EA`, ink `#141414`, signal `#FF5A00` (the profile's orange). Grid: 6 columns, 72 px margins, 24 px gutters. Subtitles in the layout, flush left at column 1, y 1180–1420 (above Instagram's bottom UI), each word clip-revealed on its Whisper timestamp. Safe zone: nothing important below y 1500 or to the right of x 920.
