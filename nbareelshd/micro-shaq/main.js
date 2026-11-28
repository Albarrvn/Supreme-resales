// Micro Luka — Microgame Frenzy, vertical 1080×1920. Voice drives the timeline; each line is one microgame in its own medium.
import { P, K, setCtx, part } from './toon.js';

const W = 1080, H = 1920, TAU = Math.PI * 2, HERO = '#2f7bff';   // the hero's accent: the 34 in electric blue, in every medium
const cv = document.getElementById('c'), G0 = cv.getContext('2d');
const off = document.createElement('canvas'); off.width = W; off.height = H; const GO = off.getContext('2d');
const lo = document.createElement('canvas'); lo.width = 180; lo.height = 320; const GL = lo.getContext('2d');   // pixel medium buffer
await Promise.all(['Titan', 'Lilita', 'VT', 'Gochi', 'Arch'].map(f => document.fonts.load(`40px ${f}`)).concat([document.fonts.load('700 40px Silk'), document.fonts.load('900 40px Inter'), document.fonts.load('500 40px Inter')]));
const reel = await (await fetch('reel.json')).json();
const dur = await (await fetch('voices/dur.json')).json();

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a)), eo = t => 1 - (1 - t) ** 3, eio = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const hash = (x, y = 0, z = 0) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ───────── timeline ─────────
// push into the TV (.25) → command slams → voice → stamp → shrink back (.33) → stage dwell (shorter after SPEED UP)
const L = reel.lines, games = L.filter(l => l.scene.type !== 'end'), END = L.find(l => l.scene.type === 'end');
const SPEED_AT = 3;          // SPEED UP before game index 3
let t = 0; const BEATS = [];   // [t, bpm] tempo map for the music
games.forEach((l, i) => {
  if (i === SPEED_AT) { l.speed = t; t += .7; }
  const fast = i >= SPEED_AT;
  l.t0 = t;                                   // push-in starts (game 0 starts already inside)
  l.c = i === 0 ? 0 : t + .22;                // command slam
  l.v = l.c + (i === 0 ? .45 : .28);          // the voice starts after the stab
  l.d = dur[l.id]; l.ve = l.v + l.d;
  l.r = l.ve + .05;                           // result stamp
  l.out = l.r + (fast ? .32 : .4);            // shrink back to the stage
  l.back = l.out + .26;
  t = l.back + (fast ? .08 : .2);             // stage dwell (shrinks after SPEED UP)
});
END.dark = t;                  // lights cut to one spot: near-silence
END.v = t + .65; END.d = dur[END.id]; END.ve = END.v + END.d;
const DUR = Math.ceil((END.ve + 1.4) * 24) / 24;

// ───────── events ─────────
const EV = [], ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
games.forEach((l, i) => {
  ev(l.v, 'voice', { id: l.id }); ev(l.c, 'stab'); ev(l.c + .02, 'whistle');
  if (i) ev(l.t0, 'spring');
  ev(l.t0, 'medium', { m: l.scene.type, fast: i >= SPEED_AT ? 1 : 0, end: l.out });
  ev(l.r, l.scene.ok === false ? 'fail' : 'ok');
  if (l.scene.ok === false && games.filter(x => x.scene.ok === false && x.r <= l.r).length <= 3) ev(l.r + .05, 'crack');   // glass crack only while lives remain
  ev(l.out, 'flip');
  if (l.speed !== undefined) ev(l.speed, 'speedup');
  const p = k => l.v + k * l.d;   // a moment inside the voice
  ({
    term: () => { for (let k = 0; k < 14; k++) ev(l.c + .5 + k * .09, 'beep'); ev(p(.55), 'slide'); },
    term2: () => { for (let k = 0; k < 12; k++) ev(l.c + .4 + k * .07, 'beep'); ev(p(.5), 'slide'); },
    crayon: () => { ev(p(.25), 'squeak'); ev(p(.55), 'squeak'); ev(p(.62), 'land'); },
    riso: () => { ev(p(.45), 'thunk'); ev(p(.47), 'stamp'); },
    pixel: () => { for (let k = 0; k < 18; k++) ev(p(.08 + k * .05), 'coin', { k }); },
    blue: () => { for (let k = 0; k < 16; k++) ev(p(.1 + k * .045), 'type'); ev(p(.5), 'swish'); },
    swiss: () => { ev(p(.35), 'clave'); ev(p(.55), 'clave'); ev(p(.78), 'bonk'); },
  })[l.scene.type]();
});
ev(END.dark, 'section', { name: 'dark' }); ev(END.v - .05, 'finalstab'); ev(END.v, 'voice', { id: END.id }); ev(END.v, 'crowd');
const CARDS = END.scene.cards || [[.9, 'COMENTA "LUKA"']];
CARDS.forEach(([c]) => ev(END.v + c, 'stab'));
ev(DUR - .1, 'section', { name: 'end' });
for (const l of games) if (l.speed !== undefined) BEATS.push([l.speed, 136]);
window.TEMPO = [[0, 118], ...BEATS];

// ───────── home stage ─────────
const TV = { x: 150, y: 470, w: 780, h: 700 };   // the frame-within-the-frame
function sunburst(g, t, col1 = P.deep, col2 = P.vio) {
  g.fillStyle = col1; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, 820); g.rotate(t * .15); g.fillStyle = col2;
  for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 2000, i / 18 * TAU, (i + .5) / 18 * TAU); g.fill(); }
  g.restore();
}
function outlined(g, txt, x, y, o) {   // heavy outlined display text
  g.save(); g.font = o.font; g.textAlign = o.align || 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
  if (o.shadow) { g.fillStyle = o.shadow; g.strokeStyle = o.shadow; g.lineWidth = o.lw; g.strokeText(txt, x + o.sd[0], y + o.sd[1]); g.fillText(txt, x + o.sd[0], y + o.sd[1]); }
  g.strokeStyle = o.stroke || P.ink; g.lineWidth = o.lw; g.strokeText(txt, x, y); g.fillStyle = o.fill; g.fillText(txt, x, y); g.restore();
}
function host(g, t, mood = 'happy', x = 190, y = 1330) {   // a basketball mascot that ticks on every beat
  const beat = beatPhase(t), sq = 1 - .08 * Math.max(0, 1 - beat * 4);
  g.save(); g.translate(x, y); g.scale(1 / sq, sq); setCtx(g); K.s = 1;
  part(c => c.arc(0, -100, 100, 0, TAU), P.orange, P.orangeD);
  g.strokeStyle = P.ink; g.lineWidth = 6; g.beginPath(); g.moveTo(-100, -100); g.lineTo(100, -100); g.moveTo(0, -200); g.lineTo(0, 0); g.stroke();
  g.beginPath(); g.ellipse(-60, -100, 40, 100, 0, -1.2, 1.2); g.stroke(); g.beginPath(); g.ellipse(60, -100, 40, 100, 0, Math.PI - 1.2, Math.PI + 1.2); g.stroke();
  for (const ex of [-35, 35]) { g.fillStyle = P.white; g.beginPath(); g.arc(ex, -125, 24, 0, TAU); g.fill(); g.stroke(); g.fillStyle = P.ink; g.beginPath(); g.arc(ex + 4, mood === 'sad' ? -118 : -128, 11, 0, TAU); g.fill(); }
  g.lineWidth = 8; g.beginPath(); if (mood === 'sad') g.arc(0, -40, 30, Math.PI + .5, -.5); else g.arc(0, -75, 34, .3, Math.PI - .3); g.stroke();
  g.restore();
}
function lives(g, n, blinkLast, t, small = false) {
  for (let i = 0; i < 3; i++) {
    const x = small ? 860 + i * 66 : 760 + i * 92, y = small ? 196 : 300, r = small ? 24 : 34, on = i < n; if (i === n - 1 && blinkLast && Math.floor(t * 6) % 2) continue;
    g.save(); g.globalAlpha = on ? 1 : .25; g.fillStyle = P.orange; g.strokeStyle = P.ink; g.lineWidth = small ? 5 : 7; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.stroke(); g.restore();
  }
}
function badge(g, n) {
  g.save(); g.translate(90, 300); g.rotate(-.06); g.fillStyle = P.gold; g.strokeStyle = P.ink; g.lineWidth = 7;
  g.beginPath(); g.roundRect(0, -50, 300, 100, 24); g.fill(); g.stroke();
  outlined(g, `NIVEL ${n}`, 150, 22, { font: '62px Titan', lw: 12, fill: P.white, stroke: P.ink });
  g.restore();
}
function tvFrame(g) {
  g.save(); g.fillStyle = P.ink; g.beginPath(); g.roundRect(TV.x - 34, TV.y - 34, TV.w + 68, TV.h + 68, 48); g.fill();
  g.fillStyle = P.magD; g.beginPath(); g.roundRect(TV.x - 24, TV.y - 24, TV.w + 48, TV.h + 48, 40); g.fill();
  g.fillStyle = P.mag; g.beginPath(); g.roundRect(TV.x - 30, TV.y - 30, TV.w + 48, TV.h + 48, 40); g.fill();
  g.fillStyle = P.ink; g.fillRect(TV.x, TV.y, TV.w, TV.h);
  g.fillStyle = P.ink; g.fillRect(W / 2 - 50, TV.y + TV.h + 34, 100, 90); g.beginPath(); g.roundRect(W / 2 - 180, TV.y + TV.h + 110, 360, 40, 14); g.fill();
  g.restore();
}

// ───────── beat helpers ─────────
function bpmAt(t) { let b = 118; for (const [a, v] of window.TEMPO) if (t >= a) b = v; return b; }
function beatPhase(t) { const b = 60 / bpmAt(t); return (t % b) / b; }

// ───────── HUD ─────────
function command(g, txt, lt, hold = .75) {   // slams in, holds, shrinks to a corner tag before the action
  if (lt < 0 || !txt) return;
  const big = txt.length > 11 ? 120 : 150;
  let s, x = W / 2, y = 760;
  if (lt < .12) s = lerp(1.9, .92, eo(lt / .12)); else if (lt < .2) s = lerp(.92, 1, (lt - .12) / .08);
  else if (lt < hold) s = 1 + (lt - .12) * .03;
  else { const u = eo(clamp((lt - hold) / .22)); s = lerp(1.02, .38, u); x = lerp(W / 2, 80 + txt.length * big * .38 * .2, u); y = lerp(760, 200, u); }
  const tag = lt >= hold + .22;
  g.save(); g.translate(x, y); g.rotate(-.06); g.transform(1, 0, -.12, 1, 0, 0); g.scale(s, s);
  if (!tag) {
    g.fillStyle = P.gold; g.strokeStyle = P.ink; g.lineWidth = 10; g.beginPath();
    const w = big * txt.length * .5 + 120, h = big * 1.1;
    for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, r = i % 2 ? .78 : 1.04; g.lineTo(Math.cos(a) * w * .5 * r, Math.sin(a) * h * r - big * .3); }
    g.closePath(); g.fill(); g.stroke();
  }
  outlined(g, txt, 0, 0, { font: `${big}px Titan`, lw: 22, fill: P.white, shadow: tag ? P.ink : P.mag, sd: [8, 14] });
  g.restore();
}
function stamp(g, ok, lt) {
  if (lt < 0) return;
  const k = lt < .1 ? lerp(2.2, .95, eo(lt / .1)) : lt < .18 ? lerp(.95, 1, (lt - .1) / .08) : 1;
  g.save(); g.translate(W / 2, 820); g.scale(k, k); g.rotate(ok ? -.12 : .1);
  g.fillStyle = ok ? P.green : P.red; g.strokeStyle = P.ink; g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 170, 0, TAU); g.fill(); g.stroke();
  g.strokeStyle = P.white; g.lineWidth = 46; g.lineCap = 'round'; g.beginPath();
  if (ok) { g.moveTo(-80, 0); g.lineTo(-20, 60); g.lineTo(90, -60); } else { g.moveTo(-70, -70); g.lineTo(70, 70); g.moveTo(70, -70); g.lineTo(-70, 70); }
  g.stroke(); g.restore();
  outlined(g, ok ? '¡BIEN!' : '¡UPS!', W / 2, 1090, { font: '120px Titan', lw: 18, fill: P.white, shadow: ok ? P.greenD : P.redD, sd: [6, 10] });
}
function fuse(g, l, t) {   // the timer: one knot per beat, the spark passes each knot on the beat
  if (t < l.v - .2 || t > l.r) return;
  const x0 = 120, x1 = 960, y = 1470, u = clamp((t - l.v + .2) / (l.r - l.v + .2)), b = 60 / bpmAt(t), n = Math.max(2, Math.round((l.r - l.v + .2) / b));
  g.save(); g.strokeStyle = P.ink; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
  g.strokeStyle = P.dial; g.lineWidth = 10; g.beginPath(); g.moveTo(lerp(x0, x1, u), y); g.lineTo(x1, y); g.stroke();
  for (let k = 0; k <= n; k++) { const x = lerp(x0, x1, k / n); g.fillStyle = P.ink; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); }
  const sx = lerp(x0, x1, u); g.fillStyle = P.gold; g.strokeStyle = P.ink; g.lineWidth = 5;
  g.beginPath(); for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU + t * 20, r = i % 2 ? 16 : 34; g.lineTo(sx + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke();
  g.restore();
}
function subtitle(g, txt, lt, d, y = 1260) {   // rounded card in the home palette, the narrator's line
  if (lt < 0 || lt > Math.max(1.8, d + .6)) return;
  g.save(); g.font = '56px Lilita';
  const words = txt.split(' '), lines = []; let cur = '';
  for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (g.measureText(tr).width > 860 && cur) { lines.push(cur); cur = w; } else cur = tr; } lines.push(cur);
  const h = 40 + lines.length * 66, k = lt < .12 ? eo(lt / .12) : 1;
  g.translate(W / 2, y + h / 2); g.scale(k, k); g.translate(-W / 2, -(y + h / 2));
  g.fillStyle = P.ink; g.beginPath(); g.roundRect(70, y + 10, 940, h, 34); g.fill();
  g.fillStyle = P.dial; g.strokeStyle = P.ink; g.lineWidth = 7; g.beginPath(); g.roundRect(60, y, 940, h, 34); g.fill(); g.stroke();
  g.fillStyle = P.ink; g.textAlign = 'center'; lines.forEach((ln, i) => g.fillText(ln, W / 2, y + 74 + i * 66));
  g.restore();
}

// ───────── the hero, redrawn per medium (marks: headband + 34 in electric blue) ─────────
// ───────── media: each draws the full 1080×1920 game screen into g at local time lt, p = 0..1 across the voice ─────────
const M = {
  term(g, lt, p, l, two = false) {   // amber phosphor terminal; the hero is an inverse glyph block
    g.fillStyle = '#120a02'; g.fillRect(0, 0, W, H);
    g.save(); g.font = '64px VT'; g.fillStyle = '#ffb000'; g.shadowColor = '#ff9a00'; g.shadowBlur = 14;
    const log = two ? ['> SHAQ.EXE --triple', '> fecha: 16.02.1996', '> rival: MIL', '> resultado: ¡¡ENTRÓ!!', '> esa noche: 100 %'] : ['> SHAQ.EXE --triple', '> temporadas: 19', '> triples: 1', '> estado: ERROR'];
    const n = Math.floor(lt * 22); let used = 0;
    log.forEach((s, i) => { g.fillText(s.slice(0, Math.max(0, n - used)), 90, 360 + i * 74); used += s.length + 4; });
    // two boxes drawn with box characters
    const box = (x, lab) => { g.strokeStyle = '#ffb000'; g.lineWidth = 6; g.strokeRect(x, 760, 380, 420); g.fillText(lab, x + 140, 840); };
    box(80, two ? 'MANO' : 'MANO'); box(620, two ? 'ARO' : 'GRADA');
    const u = eio(seg(p, .35, .7)), hx = lerp(170, 710, u);
    g.shadowBlur = 24; g.fillStyle = HERO; g.fillRect(hx, 930, 200, 150); g.fillStyle = '#120a02'; g.font = '120px VT'; g.fillText('32', hx + 42, 1040);
    if (two) { g.fillStyle = '#ffb000'; g.font = '64px VT'; if (p > .7) g.fillText('1 / 22', 690, 1150); }
    g.restore();
    for (let y = 0; y < H; y += 6) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, y, W, 3); }
  },
  term2(g, lt, p, l) { M.term(g, lt, p, l, true); },
  crayon(g, lt, p) {   // wax on paper: jittered multi-strokes with alpha, paper tooth
    g.fillStyle = '#fbf5e6'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(120,100,70,.06)'; g.fillRect(hash(i) * W, hash(i, 3) * H, 3, 3); }
    const cray = (pts, col, w = 10) => { for (let k = 0; k < 4; k++) { g.strokeStyle = col; g.globalAlpha = .45; g.lineWidth = w * (.6 + hash(k, 9) * .6); g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => { const jx = (hash(i, k, Math.floor(lt * 8)) - .5) * 8, jy = (hash(k, i, Math.floor(lt * 8)) - .5) * 8; i ? g.lineTo(x + jx, y + jy) : g.moveTo(x + jx, y + jy); }); g.stroke(); } g.globalAlpha = 1; };
    cray([[80, 1250], [1000, 1250]], '#e8741c', 14); cray([[620, 1250], [620, 1000], [1000, 1000]], '#e8741c', 12);
    cray([[880, 1000], [880, 700], [940, 700]], '#555', 10); cray([[800, 760], [880, 760]], '#d22', 10);
    // "16" big, and a crayon kid who jumps onto the court
    g.save(); g.font = '190px Gochi'; g.fillStyle = 'rgba(46,111,255,.85)'; g.fillText('AIRBALL', 90, 560); g.restore();
    { const u = seg(p, .3, 1), bx = lerp(260, 1200, u), by = lerp(1000, -200, u) - 200 * Math.sin(Math.PI * u); cray([[bx - 26, by], [bx + 26, by]], '#e8741c', 40); if (p > .55) { g.font = '80px Gochi'; g.fillStyle = '#333'; g.fillText('¡adiós!', 640, 760); } }
    const j = seg(p, .3, .62), x = lerp(180, 560, j), y = 1250 - Math.sin(Math.PI * j) * 380;
    cray([[x, y - 150], [x, y - 60]], '#333', 12); cray([[x, y - 60], [x - 34, y]], '#333', 10); cray([[x, y - 60], [x + 34, y]], '#333', 10);
    cray([[x, y - 130], [x - 50, y - 90 - 60 * j]], '#333', 10); cray([[x, y - 130], [x + 50, y - 90 - 60 * j]], '#333', 10);
    // Giannis in crayon: dark skin, short black coils, big smile, goatee
    g.fillStyle = 'rgba(105,64,42,.92)'; g.beginPath(); g.arc(x, y - 190, 40, 0, TAU); g.fill(); g.strokeStyle = '#333'; g.lineWidth = 8; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 20, y - 222, 12, 6);   // bald: a shine instead of hair
    g.fillStyle = '#111'; g.fillRect(x - 16, y - 202, 7, 7); g.fillRect(x + 9, y - 202, 7, 7);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y - 182, 17, .08 * Math.PI, .92 * Math.PI); g.closePath(); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 4; g.stroke();
    cray([[x - 7, y - 156], [x + 7, y - 156]], '#111', 9);
    g.font = '54px Gochi'; g.fillStyle = HERO; g.fillText('32', x + 26, y - 96);
    cray([[x + 60, y - 120], [x + 80, y - 140]], '#e8741c', 22);
  },
  riso(g, lt, p) {   // two plates (pink, blue), multiply, misregistered, halftone
    g.fillStyle = '#f3eee2'; g.fillRect(0, 0, W, H);
    const plate = (col, dx, dy, draw) => { g.save(); g.globalCompositeOperation = 'multiply'; g.translate(dx, dy); g.fillStyle = col; g.strokeStyle = col; draw(); g.restore(); };
    const half = (x0, y0, w, h, d, col) => { g.fillStyle = col; for (let y = y0; y < y0 + h; y += 18) for (let x = x0; x < x0 + w; x += 18) { g.beginPath(); g.arc(x + ((y / 18) % 2) * 9, y, 9 * d, 0, TAU); g.fill(); } };
    plate('#ff48b0', 0, 0, () => { half(0, 0, W, 420, .45, '#ff48b0'); g.font = '900 120px Inter'; g.fillText('4,5 %', 90, 330); g.font = '900 64px Inter'; g.fillText('1 DE 22', 90, 440); });
    plate('#0078bf', 7, -5, () => {
      g.font = '900 64px Inter'; g.fillText('TRIPLES EN SU CARRERA', 90, 530);
      // the hero: bold shapes on the blue plate (short coils around the crown, goatee), the 34 knocked out
      g.beginPath(); g.arc(540, 820, 90, 0, TAU); g.fill(); g.fillRect(526, 884, 28, 26); g.fillRect(440, 920, 200, 300); g.fillRect(450, 1220, 70, 220); g.fillRect(560, 1220, 70, 220);
      g.fillRect(380, 930, 60, 200); g.fillRect(640, 930, 60, 200);
    });
    g.save(); g.font = '900 110px Inter'; g.fillStyle = '#f3eee2'; g.fillText('32', 470, 1110); g.fillRect(500, 798, 16, 16); g.fillRect(566, 798, 16, 16); g.beginPath(); g.arc(541, 836, 38, .08 * Math.PI, .92 * Math.PI); g.closePath(); g.fill(); g.restore();
    // the ball drops, bonks off his head and bounces away on the pink plate
    const d = seg(p, .25, .5), e = seg(p, .5, .9), bxx = lerp(540, 980, e), byy = d < 1 ? lerp(-200, 700, eo(d)) : 700 - Math.sin(Math.PI * e) * 380 + e * 500;
    plate('#ff48b0', -6, 4, () => { g.beginPath(); g.arc(bxx, byy, 70, 0, TAU); g.fill(); if (p > .5 && p < .75) { g.font = '900 90px Inter'; g.fillText('¡BONK!', 640, 700); } });
  },
  pixel(g, lt, p) {   // low-res buffer ×6, limited palette; three bars fill 60/21/10
    const q = GL; q.fillStyle = '#1b1430'; q.fillRect(0, 0, 180, 320);
    for (let y = 0; y < 320; y += 2) for (let x = (y / 2) % 2; x < 180; x += 4) if (y > 230) { q.fillStyle = '#5b3a29'; q.fillRect(x, y, 1, 1); }
    q.fillStyle = '#8a5a3c'; q.fillRect(0, 232, 180, 88); q.fillStyle = '#f3efe0'; q.fillRect(0, 232, 180, 1);
    q.font = '700 10px Silk'; q.textBaseline = 'top';
    const bars = [['TL', 52, '#ffcd38']];   // career free throws, %
    bars.forEach(([lab, v, col], i) => {
      const u = clamp((p - .08 - i * .25) / .25), y = 44 + i * 26, n = Math.round(v * u);
      q.fillStyle = '#f3efe0'; q.fillText(lab, 6, y); q.fillText(String(n), 146, y);
      q.fillStyle = '#3a2f5c'; q.fillRect(36, y, 104, 9); q.fillStyle = col; q.fillRect(36, y, Math.round(104 * n / 100), 9);
      q.fillStyle = '#fff'; q.fillRect(36, y, Math.round(104 * n / 100), 2);
    });
    // pixel hero: 16×30, headband + blue 34
    q.save(); q.translate(58, 120); q.scale(2, 2); const hx = 0, hy = 0 - (Math.floor(lt * 6) % 2);
    q.fillStyle = '#6b4430'; q.fillRect(hx + 4, hy - 1, 8, 9); q.fillStyle = '#8a5a40'; q.fillRect(hx + 5, hy - 1, 2, 1); q.fillStyle = '#111'; q.fillRect(hx + 6, hy + 3, 1, 1); q.fillRect(hx + 9, hy + 3, 1, 1); q.fillStyle = '#fff'; q.fillRect(hx + 6, hy + 5, 4, 1); q.fillStyle = '#111'; q.fillRect(hx + 7, hy + 7, 2, 1);
    q.fillStyle = '#fafafa'; q.fillRect(hx + 2, hy + 8, 12, 12); q.fillStyle = '#c8102e'; q.fillRect(hx + 2, hy + 8, 1, 12); q.fillRect(hx + 13, hy + 8, 1, 12); q.fillStyle = HERO; q.fillRect(hx + 5, hy + 11, 2, 4); q.fillRect(hx + 9, hy + 11, 2, 4);
    q.fillStyle = '#fafafa'; q.fillRect(hx + 3, hy + 20, 10, 5); q.fillStyle = '#6b4430'; q.fillRect(hx + 4, hy + 25, 3, 7); q.fillRect(hx + 9, hy + 25, 3, 7);
    q.fillStyle = '#ff8a1e'; q.fillRect(hx + 15, hy + 14 + (Math.floor(lt * 4) % 2) * 10, 5, 5); q.restore();
    if (p > .85) { q.fillStyle = '#ffcd38'; q.fillText('¡CLANK!', 62, 108); }
    g.imageSmoothingEnabled = false; g.drawImage(lo, 0, 0, W, H); g.imageSmoothingEnabled = true;
  },
  blue(g, lt, p) {   // blueprint: white line weights, dimensions, hand lettering
    g.fillStyle = '#0d3b8a'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(80, 1250); g.lineTo(1000, 1250); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(900, 1250); g.lineTo(900, 820); g.lineTo(940, 820); g.moveTo(860, 900); g.lineTo(900, 900); g.stroke();
    // the shot: a dashed arc drawn as the line goes, with a dimension
    const u = seg(p, .15, .55), bx = t => lerp(250, 860, t), by = t => 1000 - Math.sin(Math.PI * t) * 420 + (900 - 1000) * t;
    g.setLineDash([18, 14]); g.lineWidth = 4; g.beginPath(); for (let k = 0; k <= 40 * u; k++) { const t = k / 40; k ? g.lineTo(bx(t), by(t)) : g.moveTo(bx(t), by(t)); } g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(bx(u), by(u), 26, 0, TAU); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(250, 1320); g.lineTo(900, 1320); g.stroke(); g.font = '46px Arch'; g.fillText('7,24 m', 500, 1300);
    // the hero in line: headband and 34
    g.lineWidth = 5; g.beginPath(); g.arc(230, 920, 40, 0, TAU); g.moveTo(230, 960); g.lineTo(230, 1110); g.moveTo(230, 1110); g.lineTo(190, 1250); g.moveTo(230, 1110); g.lineTo(270, 1250); g.moveTo(230, 990); g.lineTo(260, 1010 - 80 * (1 - u)); g.stroke();
    g.beginPath(); g.arc(230, 928, 16, .1 * Math.PI, .9 * Math.PI); g.moveTo(224, 958); g.lineTo(236, 958); g.stroke();
    g.fillStyle = HERO; g.font = '50px Arch'; g.fillText('32', 205, 1060);
    g.fillStyle = '#fff'; g.font = '200px Arch'; g.fillText(Math.round(5317 * clamp(seg(p, .1, .8))).toLocaleString('es-ES'), 120, 470); g.font = '60px Arch'; g.fillText('TIROS LIBRES FALLADOS', 130, 560);
  },
  swiss(g, lt, p) {   // strict grid, one sans, one signal colour (the hero): his bar overshoots and bonks
    g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#d8d5cc'; for (let c = 0; c <= 6; c++) g.fillRect(72 + c * 156, 0, 2, H);
    g.fillStyle = '#141414'; g.font = '900 120px Inter'; g.fillText('HACK-', 72, 430); g.fillText('A-SHAQ', 72, 560);
    g.font = '500 44px Inter'; g.fillText('faltas a propósito · desde 1999', 72, 640);
    g.fillStyle = HERO; g.beginPath(); g.arc(780, 900, 150, 0, TAU); g.fill(); g.fillStyle = '#f2f0ea'; g.font = '900 120px Inter'; g.fillText('32', 706, 942);
    [.3, .5, .7].forEach((k, i) => { if (p < k) return; g.save(); g.translate(120 + i * 60, 760 + i * 150); g.rotate(-.12 + i * .1); g.strokeStyle = '#e8262b'; g.lineWidth = 10; g.strokeRect(0, 0, 400, 110); g.fillStyle = '#e8262b'; g.font = '900 84px Inter'; g.fillText('FALTA', 40, 88); g.restore(); });
  },
};

// ───────── render ─────────
function render(t) {
  const g = G0; g.setTransform(1, 0, 0, 1, 0, 0);
  const l = games.find(x => t >= x.t0 && t < x.back + (x.next ?? 0)) || null;
  const lost = Math.min(3, games.filter(x => x.scene.ok === false && t >= x.r).length), nLives = 3 - lost;
  // home stage (always underneath)
  const dark = t >= END.dark;
  sunburst(g, t, dark ? '#0b0418' : P.deep, dark ? '#14082a' : P.vio);
  badge(g, Math.min(games.length, games.filter(x => t >= x.t0).length) || 1); lives(g, nLives, nLives === 1 && !dark, t);
  tvFrame(g);
  host(g, t, lost && t < (games.find(x => x.scene.type === 'term2')?.t0 ?? 1e9) ? 'sad' : 'happy');
  if (dark) {   // lights cut to one spot on the host, then the final card
    g.save(); g.fillStyle = 'rgba(0,0,0,.72)'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(W / 2, 900, 40, W / 2, 900, 640); gr.addColorStop(0, 'rgba(255,240,200,.28)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
    const lt = t - END.v;
    if (lt > -.05) {
      const k = lt < .12 ? lerp(1.8, 1, eo(lt / .12)) : 1;
      g.save(); g.translate(W / 2, 720); g.scale(k, k); g.rotate(-.05);
      outlined(g, '¿LE GANAS A', 0, -60, { font: '108px Titan', lw: 18, fill: P.white, shadow: P.mag, sd: [6, 10] });
      outlined(g, 'SHAQ DE TRES?', 0, 70, { font: '112px Titan', lw: 20, fill: P.gold, shadow: P.mag, sd: [6, 10] });
      g.restore();
      // end cards slam in on the words that say them (times relative to the last line, from reel.json)
      CARDS.forEach(([c, txt], i) => { if (lt <= c) return; const k2 = lt < c + .12 ? lerp(1.8, 1, eo((lt - c) / .12)) : 1, y = 1000 + i * 170;
        g.save(); g.translate(W / 2, y); g.scale(k2, k2); g.rotate(i ? .04 : -.03); g.fillStyle = i ? P.mag : P.gold; g.strokeStyle = P.ink; g.lineWidth = 10; g.beginPath(); g.roundRect(-400, -90, 800, 150, 40); g.fill(); g.stroke();
        outlined(g, txt, 0, 22, { font: '84px Titan', lw: 14, fill: P.white, stroke: P.ink }); g.restore(); });
      outlined(g, '@NBAreelsHD · SÍGUENOS', W / 2, 1000 + CARDS.length * 170, { font: '56px Lilita', lw: 10, fill: P.white, stroke: P.ink });
    }
  } else if (!l) {
    // stage between games: TV shows a sunburst test card; SPEED UP banner
    g.fillStyle = P.night; g.fillRect(TV.x, TV.y, TV.w, TV.h);
    const sp = games.find(x => x.speed !== undefined && t >= x.speed && t < x.t0);
    outlined(g, sp ? '¡MÁS RÁPIDO!' : '¡LISTO!', W / 2, TV.y + TV.h / 2 + 40, { font: `${sp ? 120 : 130}px Titan`, lw: 18, fill: sp ? P.gold : P.white, shadow: P.mag, sd: [6, 10] });
  }
  if (l && !dark) {
    // the game screen, pushed from the TV to full frame and back
    const inK = l === games[0] ? 1 : eio(seg(t, l.t0, l.t0 + .22)), outK = 1 - eio(seg(t, l.out, l.back)), k = Math.min(inK, outK);
    const lt = t - l.c, p = clamp((t - l.v) / l.d);
    GO.setTransform(1, 0, 0, 1, 0, 0); GO.globalAlpha = 1; GO.globalCompositeOperation = 'source-over';
    M[l.scene.type](GO, lt, p, l);
    if (t >= l.r && t < l.out + .05) stamp(GO, l.scene.ok !== false, t - l.r);
    const x = lerp(TV.x, 0, k), y = lerp(TV.y, 0, k), w = lerp(TV.w, W, k), h = lerp(TV.h, H, k);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.drawImage(off, 0, 0, W, H, x, y, w, h); g.restore();
    if (k > .98) {   // HUD over the game
      command(g, l.scene.cmd, t - l.c, l === games[0] ? .9 : .7);
      if (t < l.r) fuse(g, l, t);
      subtitle(g, l.text, t - l.v, l.d);
      lives(g, nLives, false, t, true);
    }
  }
  if (t < .08) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 0, W, H); }   // capped flash on the very first frames
}
window.DUR = DUR; window.EV = EV; window.render = render; window.READY = true;
