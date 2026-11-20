#!/bin/bash
# Rebuild: audio mix, resumable chunked render, mux, end card -> junta_t_solape_final.mp4
LIB=${LIB:-$HOME/lemo-opuscar}; export LIB
cd "$(dirname "$0")" && python3 audio.py && ./finish.sh
