#!/bin/bash
# After voz.py writes raw.wav for each reel: ASR, timing (tempo 1.08), mouth, mix, then render+finish each reel in turn.
cd "$(dirname "$0")/.."; S=$1; shift
while pgrep -f voz.py >/dev/null; do sleep 30; done
for d in "$@"; do
  python3 $S/asr.py $d/raw.wav > /dev/null 2>&1 && python3 ../shorts/build_voice.py $d --tempo 1.08 && python3 _lemo/prep.py $d && (cd $d && python3 audio.py) || { echo "PREP FAILED $d"; continue; }
  echo "prepped $d $(date +%T)"
done
for d in "$@"; do rm -rf $d/out; mkdir -p $d/out; (cd $d && ./finish.sh >> out/finish.log 2>&1); echo "reel $d: $(tail -1 $d/out/render.log) $(date +%T)"; done
