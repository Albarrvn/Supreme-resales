#!/bin/bash
cd /home/user/Supreme-resales/shorts
until grep -q DONE 1-barco-partido/out/render.log 2>/dev/null; do sleep 20; done
CONC=4 ./render_cloud.sh 2-barco-4-dias
CONC=4 ./render_cloud.sh 3-vias-con-fuego
