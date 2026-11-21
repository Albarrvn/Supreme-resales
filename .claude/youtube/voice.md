# Voice profile: Soldadura Animada (@soldaduraanimada / @luisgabb17)
Inferred from 6 of the creator's own reels (cordón, día 1 vs hoy, 5 señales, guía electrodo, vertical subida/bajada, plana vs vertical).

- Language: Spanish, Latin American (Puerto Rico). Tú, never usted or vosotros.
- Talks in first person, as a welder who learned the hard way: "No nací sabiendo. Aprendí." / "Practiqué."
- Short, punchy lines. One idea per sentence. Questions to the viewer: "¿Llevas semanas soldando con electrodo y sigue saliendo mal?", "¿Subes o bajas?", "¿Cuántas haces tú?"
- Reframes blame: "No es mala suerte. Son 5 cosas." Encouraging, never mocking the beginner: "Tú también puedes."
- Audience: beginner and intermediate welders (electrodo / SMAW), plus curious people.
- Recurring CTA: "Comenta GUÍA" (guide "El cordón perfecto no es suerte", link in bio).
- Never claims what he can't show; no fake numbers. Uses real welding words: cordón, charco, escoria, pase de raíz, arco, electrodo.
- ALWAYS end every video with the end card "Sígueme para más contenido de soldadura" + "Instagram @luisgabb17" (avatar, IG colors). Tool: reels/endcard/add_endcard.sh INPUT OUTPUT (auto-matches 30/60 fps).
- NARRATION VOICE: use the creator's own cloned voice (reels/_lemo/voz/: referencia.flac + voz.py, Chatterbox, EX=1.0, then build_voice --tempo 1.08), with energy, not calm. Piper es_MX-claude-high is only the fallback.
- REEL FORMAT (from now on): follow reels/_lemo/ESTILO_DESPIECE.md ("¿Cómo funciona?" explainer: paradox hook, comments proof, mechanism, 'aquí es donde cambian', verdict by use, one-line synthesis, '¿Qué más quieres que desmontemos?'). Engine: start({ subStyle: 'top', keys }), comments(), no big titles. Keep IG colors, cloned voice, presenter, end card.
