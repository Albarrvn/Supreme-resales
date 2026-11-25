# Soldadura Animada (@luisgabb17)

Creador de contenido de soldadura de Puerto Rico. Este repo hace reels y Shorts verticales (1080×1920, HD) sobre soldadura.
Perfil de voz y tono: `.claude/youtube/voice.md` (léelo antes de escribir un guion).

## Reglas fijas (siempre)
- **Tarjeta final SIEMPRE** al terminar cada video: `reels/endcard/add_endcard.sh ENTRADA SALIDA` ("Sígueme para más contenido de soldadura" + "Instagram @luisgabb17").
- **Entregar 3 cosas** con SendUserFile: `<nombre>_final.mp4` + `miniatura.jpg` + `caption.md` (caption de IG con hashtags, título de YouTube Shorts con hashtags, listos para copiar).
- **No subir nada a redes**: el creador sube él mismo.
- **Hook intenso** desde el primer cuadro (texto en pantalla en el frame 0, arco/sacudida/golpe de sonido) + efectos de sonido en cada momento clave. Meta: seguidores, likes, comentarios y compartidos. Cerrar con una pregunta para comentar.
- **Guion en español con acento boricua** cuando lo pida ("acho", "pa'", "na'", "mano", "¡wepa!"). Tú, nunca usted. Mandar el guion listo para copiar si va a grabar o usar ElevenLabs.
- Escribirle al creador en español, corto y claro.

## Voz
1. Audio que mande el creador (ElevenLabs o grabado) → usarlo tal cual.
2. Si no, **su voz clonada**: `reels/_lemo/voz/` (Chatterbox, `referencia.flac`, `voz.py`, energía EX=1.0) y luego `shorts/build_voice.py --tempo 1.08`.
3. Piper es_MX solo como último recurso.
Timing: `SHOTS.txt` ("clave | texto") → `shorts/build_voice.py <dir> --gap 0.3` → `timing.json`.

## Estilos de video (preguntar o elegir según el tema)
- **Muñequitos planos (cartoon)**: el soldador animado en escenarios (taller, calle, estructuras). Referencia: `reels/estilos-soldadura/` (`estilos.html`, render con `render.js`: `PAGE= DUR= FPS=60 SCALE=2 node render.js`). Base de personaje: `reels/coche-vs-golpe/fuente/`.
- **Línea minimalista 3D (Lemo)**: fondo azul petróleo #0B1C22–#14505C, líneas #E6F1F3, cian #38E1FF (cordones), naranja #FF8C2A (arco), Poppins Black. Motor compartido `reels/_lemo/engine.js`; ejemplos `reels/cuanto-aguanta/`, `reels/electrodo-pegado/`.
- **"¿Cómo funciona?" (despiece)**: `reels/_lemo/ESTILO_DESPIECE.md`; ejemplo `reels/dentro-electrodo/`.

## Herramientas compartidas
- Efectos + mezcla: `reels/_lemo/sfx.py` (voz + música ×0.22 + sfx ×0.35 → `mix.wav`).
- Miniatura: `reels/_lemo/thumb.py`.
- Final: `ffmpeg` (video + `mix.wav`) → `sin_cierre.mp4` → `add_endcard.sh` → `<nombre>_final.mp4`.
- Revisar antes de entregar: hoja de contacto + primer cuadro + que tenga la tarjeta final.

## Producto
Guía "El cordón perfecto no es suerte" ($29.99 → $14.99). CTA: "Comenta GUÍA".
