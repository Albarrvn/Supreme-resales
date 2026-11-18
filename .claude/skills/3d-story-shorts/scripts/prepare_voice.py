#!/usr/bin/env python3
"""Tighten a narration and write the video's timing file.

Usage:
  python3 prepare_voice.py RAW.wav SHOTS.txt PROJECT_DIR [--wpm 155] [--max-speed 1.12]

SHOTS.txt: one shot per line, "key | sentence text" (the exact words that are spoken,
numbers written as words). Lines in spoken order. Example:
  hook | In nineteen seventy-eight, welders secretly patched a skyscraper.
  cta  | Before we go deep into today's story, take a second to like this video ...

What it does:
  1. finds pauses with ffmpeg silencedetect,
  2. picks the pause that ends each shot's text (closest to where it should be by text length),
  3. shortens pauses (0.42 s between shots, 0.2 s inside a shot),
  4. speeds the voice up (pitch kept, atempo) to about the target words per minute, never above --max-speed,
  5. writes PROJECT_DIR/voiceover.wav and PROJECT_DIR/src/timing.json (shot start/end times).
Needs: ffmpeg, ffprobe on PATH.
"""
import argparse, json, re, subprocess, sys, os


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def duration(path):
    r = run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path])
    return float(r.stdout.strip())


def silences(path, noise='-35dB', d=0.2):
    r = run(['ffmpeg', '-hide_banner', '-i', path, '-af', f'silencedetect=noise={noise}:d={d}', '-f', 'null', '-'])
    s, out = None, []
    for line in r.stderr.splitlines():
        m = re.search(r'silence_start: ([\d.]+)', line)
        if m: s = float(m.group(1))
        m = re.search(r'silence_end: ([\d.]+)', line)
        if m and s is not None: out.append((s, float(m.group(1)))); s = None
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('raw'); ap.add_argument('shots'); ap.add_argument('project')
    ap.add_argument('--wpm', type=float, default=170); ap.add_argument('--max-speed', type=float, default=1.12)
    ap.add_argument('--between', type=float, default=0.42); ap.add_argument('--inside', type=float, default=0.2)
    a = ap.parse_args()

    shots = []
    for line in open(a.shots, encoding='utf-8'):
        if '|' not in line: continue
        k, t = line.split('|', 1); shots.append((k.strip(), t.strip()))
    if len(shots) < 2: sys.exit('Need at least 2 shots in SHOTS.txt')

    total = duration(a.raw)
    sil = silences(a.raw)
    start = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
    if sil and sil[0][0] < 0.05: sil = sil[1:]
    end = sil[-1][0] if sil and sil[-1][1] > total - 0.05 else total
    if sil and sil[-1][1] > total - 0.05: sil = sil[:-1]
    span = end - start

    # align every comma / sentence end in the script to a pause in the audio (dynamic programming)
    full = ''; shot_end_char = []
    for _, t in shots: full += t + ' '; shot_end_char.append(len(full) - 1)
    events = []  # (char position, is_sentence_end, shot index if this ends a shot)
    for m in re.finditer(r'[,;:.!?]+(?=\s)', full):
        pos = m.end(); end_of_shot = None
        for si, ce in enumerate(shot_end_char):
            if abs(ce - pos) <= 1: end_of_shot = si
        events.append((pos, any(c in m.group() for c in '.!?'), end_of_shot))
    events = [e for e in events if e[2] != len(shots) - 1]  # final shot end = audio end
    exp = [start + span * e[0] / len(full) for e in events]
    E, S = len(events), len(sil)
    INF = 1e9
    def mcost(i, j):
        a0, b0 = sil[j]; c = abs((a0 + b0) / 2 - exp[i]) / span * 10
        if events[i][1] and b0 - a0 < 0.35: c += 0.6
        if not events[i][1] and b0 - a0 > 0.7: c += 0.3
        return c
    skipE = lambda i: 2.5 if events[i][2] is not None else (1.2 if events[i][1] else 0.6)
    skipS = lambda j: 0.25 + 1.0 * min(sil[j][1] - sil[j][0], 1.2)
    D = [[INF] * (S + 1) for _ in range(E + 1)]; B = [[None] * (S + 1) for _ in range(E + 1)]
    D[0][0] = 0
    for i in range(E + 1):
        for j in range(S + 1):
            if i == 0 and j == 0: continue
            best, bk = INF, None
            if i > 0 and j > 0 and D[i-1][j-1] + mcost(i-1, j-1) < best: best, bk = D[i-1][j-1] + mcost(i-1, j-1), 'm'
            if i > 0 and D[i-1][j] + skipE(i-1) < best: best, bk = D[i-1][j] + skipE(i-1), 'e'
            if j > 0 and D[i][j-1] + skipS(j-1) < best: best, bk = D[i][j-1] + skipS(j-1), 's'
            D[i][j], B[i][j] = best, bk
    i, j, match = E, S, {}
    while i > 0 or j > 0:
        bk = B[i][j]
        if bk == 'm': match[i-1] = j-1; i -= 1; j -= 1
        elif bk == 'e': i -= 1
        else: j -= 1
    chosen = []
    for si in range(len(shots) - 1):
        idx = [k for k, e in enumerate(events) if e[2] == si]
        if not idx or idx[0] not in match: sys.exit(f'Could not find the pause after shot "{shots[si][0]}". Check that SHOTS.txt matches the audio word for word.')
        chosen.append(match[idx[0]])
    bset = set(chosen)

    # rebuild: speech pieces + shortened gaps
    pieces, cur = [], start
    for j, (a0, b0) in enumerate(sil):
        pieces.append(('speech', cur, a0))
        pieces.append(('gap', min(b0 - a0, a.between if j in bset else a.inside), j in bset))
        cur = b0
    pieces.append(('speech', cur, end))
    tight = sum((p[2] - p[1]) if p[0] == 'speech' else p[1] for p in pieces)
    words = sum(len(t.split()) for _, t in shots)
    speed = min(a.max_speed, max(1.0, tight / (words / (a.wpm / 60.0))))

    filt, labels = [], []
    for n, p in enumerate(pieces):
        if p[0] == 'speech': filt.append(f'[0:a]atrim={p[1]:.3f}:{p[2]:.3f},asetpts=PTS-STARTPTS[s{n}]')
        else: filt.append(f'anullsrc=r=48000:cl=stereo,atrim=0:{p[1]:.3f}[s{n}]')
        labels.append(f'[s{n}]')
    lead, tail = 0.15, 0.8
    filt.append(''.join(labels) + f'concat=n={len(pieces)}:v=0:a=1,aresample=48000,atempo={speed:.4f},adelay={int(lead*1000)}|{int(lead*1000)},apad=pad_dur={tail}[out]')
    out_wav = os.path.join(a.project, 'voiceover.wav')
    r = run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', a.raw, '-filter_complex', ';'.join(filt), '-map', '[out]', '-ar', '48000', '-ac', '2', out_wav])
    if r.returncode: sys.exit(r.stderr)

    # shot times on the new timeline
    t, starts, ends, si = 0.0, [0.0], [], 0
    for p in pieces:
        if p[0] == 'speech': t += p[2] - p[1]
        else:
            if p[2]: ends.append(t); starts.append(t + p[1])
            t += p[1]
    ends.append(t)
    out = []
    for i, (k, txt) in enumerate(shots):
        out.append(dict(key=k, start=round(starts[i] / speed + lead, 3), end=round(ends[i] / speed + lead, 3), words=len(txt.split()), text=txt))
    timing = dict(fps=30, duration=round(out[-1]['end'] + 0.75, 2), shots=out)
    os.makedirs(os.path.join(a.project, 'src'), exist_ok=True)
    json.dump(timing, open(os.path.join(a.project, 'src', 'timing.json'), 'w'), indent=1)
    print(f'speed x{speed:.3f}, {words} words, {timing["duration"]} s')
    for o in out: print(f"  {o['key']:10} {o['start']:6.2f}-{o['end']:6.2f}  {o['text'][:60]}")


if __name__ == '__main__':
    main()
