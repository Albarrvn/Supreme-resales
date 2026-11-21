# Estilo "¿Cómo funciona?" (de @despiecetv) aplicado a Soldadura Animada

Reference analysed: 102 s TikTok explainer, electrode vs wire welder (despiecetv). Keep OUR look: IG colors (teal paper, light ink, cyan weld, orange arc), Poppins, the creator's cloned voice with energy (reels/_lemo/voz), the presenter character, the end card.

## Script (60–100 s, one idea per sentence)
1. **Hook = question + paradox** (0–6 s): "¿Cómo funciona X? Los dos hacen A, pero uno sirve para B y el otro para C. ¿Por qué?" Include a vivid number ("más caliente que el sol").
2. **Social proof** (6–10 s): "Este video lo pidieron en los comentarios." On screen, 2–3 comment bubbles pop in.
3. **Shared mechanism, step by step** (3–5 short beats): what physically happens, in plain words.
4. **The pivot line:** "Y aquí es donde cambian."
5. **Side A, then side B**: how it works → advantage → "pero…" disadvantage.
6. **Verdict by use**: "A es para… (3 concrete examples). B es para… (3 examples)."
7. **One-line synthesis**: "Lo mismo es…, lo que cambia es…"
8. **CTA as a request**: "¿Qué más quieres que desmontemos? Escríbelo en comentarios." Then the end card.

Write the analogies into the script: sponge (porosity), umbrella (gas shielding), crust (slag), and so on. Each analogy gets an object that pops in next to the piece.

## Picture
- **One set, few cuts**: a plate on a table in the same space all the reel. About one cut every 8 s. Slow push-ins and orbits instead of cuts.
- **Cross-sections** to show the inside (section clip). Highlight the part being explained.
- **Analogy objects** pop in beside the piece (simple line-art props).
- **Number badges** ("6000 °C", "+5 TON") as pills near the subject.
- **No big titles.** The subtitles carry the text.
- **Subtitles at the top** (engine `start({ subStyle: 'top', keys: [...] })`):
  - two lines, about 3 words each, centred at y ≈ 250–330;
  - spoken words in INK, upcoming words dim, the current word bold;
  - key words in a cyan box.
- **Comment bubbles** (engine `comments(t, t0, [...])`) for the social-proof beat.
- Presenter bottom-left and end card as usual.
