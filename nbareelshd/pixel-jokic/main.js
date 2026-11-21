// Pixel Jokić — vertical 16-bit RPG reel. 180×320 indexed framebuffer ×6. Voice drives the timeline (one scene per line).
import { W, H, FB, C, T, LUT, makeOut, mosaic, bayer, hash, clamp, eo } from './px.js';
import { text, textW, textOutlined, wrap } from './font.js';
import { textES } from './font.js';
import { win, hand } from './ui.js';

let fb = new FB(); const out = makeOut(document.getElementById('c'));
const reel = await (await fetch('reel.json')).json();
const dur = await (await fetch('voices/dur.json')).json();

// ---- timeline: 140 bpm grid, each line starts on the next beat; one silent beat before the gold swirl ----
const BEAT = 60 / 140, ceilB = t => Math.ceil(t / BEAT - 1e-6) * BEAT;
const L = reel.lines; let t = .35;
for (const l of L) { if (l.scene.type === 'gold') t += BEAT * 2; l.t = l === L[0] ? t : ceilB(t); l.d = dur[l.id]; t = l.t + l.d + .2; }
L.forEach((l, i) => { l.s0 = i ? (l.scene.type === 'gold' ? L[i - 1].t + L[i - 1].d + .1 : l.t - .1) : 0; });
L.forEach((l, i) => { l.s1 = i < L.length - 1 ? L[i + 1].s0 : 1e9; });   // second pass: every s0 exists now
const DUR = ceilB(t + .9);
const S = Object.fromEntries(L.map(l => [l.scene.type, l]));

// ---- events for the mix (every sound sits on its frame) ----
const EV = [], ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
ev(0, 'boom');
for (const l of L) {
  ev(l.t, 'voice', { id: l.id });
  ev(l.s0, 'section', { name: { hook: 'A', tv: 'A', level: 'B', gold: 'G', menu: 'M' }[l.scene.type] });
  if (l.scene.type !== 'menu') { const cps = l.text.length / (l.d * .9); for (let i = 0; i < l.text.length; i += 2) if (l.text[i] !== ' ') ev(l.t + i / cps, 'blip'); }
}
ev(S.gold.s0, 'section', { name: 'D' }); ev(S.gold.t - BEAT, 'swirl');
ev(S.gold.t, 'section', { name: 'G' }); ev(S.gold.t, 'fanfare'); ev(S.gold.t, 'crowd');
ev(S.tv.s0, 'static', { d: S.tv.s1 - S.tv.s0 });
ev(S.menu.s0 + .5, 'select');
// dribble: the ball hits the floor every half second while dribbling (hook + tv)
const DRIB = .5;
for (let k = 0; ; k++) { const tt = .25 + k * DRIB; if (tt >= S.level.s0) break; ev(tt, 'dribble'); }
// three shots in the level scene: set, release, swish + level up
const SHOT = i => { const l = S.level, span = Math.max(1.6, (l.s1 - l.s0) / 3), a = l.s0 + i * span; return { a, rel: a + .3, swish: a + .95, span }; };
for (let i = 0; i < 3; i++) { const s = SHOT(i); ev(s.rel, 'shoot'); ev(s.swish, 'swish'); ev(s.swish + .05, 'levelup'); }
EV.push({ t: DUR - .1, type: 'section', name: 'end' });

// ---- scenery ----
const FLOOR = 206;                 // floor line, just above the dialog box (y 210–254, above Instagram's caption)
function crowd(t, dim = false) {
  fb.rect(0, 40, W, FLOOR - 60, C.night);
  for (let y = 52; y < FLOOR - 26; y += 6) for (let x = (y / 6 % 2) * 3; x < W; x += 6) {
    const h = hash(x, y), bob = Math.floor(t * 4 + h * 8) % 4 === 0 ? 1 : 0;
    const col = dim ? C.dslate : [C.slate, C.steel, C.rust, C.navy, C.plum, C.dslate][Math.floor(h * 6)];
    fb.rect(x, y - bob, 3, 3, col); fb.px(x + 1, y - bob + 3, C.dslate);
  }
  fb.dither(0, FLOOR - 40, W, 14, (x, y) => (y - (FLOOR - 40)) / 14, C.night, C.ink);   // shadow under the stands
}
function court() {
  for (let y = FLOOR - 26; y < H; y++) fb.hline(0, W - 1, y, (y >> 2) % 2 ? C.tan : C.sand);
  fb.dither(0, FLOOR - 26, W, 26, (x, y) => .35 + .3 * Math.sin(x * .07), C.tan, C.brown);
  fb.rect(104, FLOOR - 26, 76, 26, C.rust); fb.dither(104, FLOOR - 26, 76, 26, () => .25, C.rust, C.clay);   // the paint
  fb.hline(0, W - 1, FLOOR, C.white); fb.vline(104, FLOOR - 26, FLOOR, C.white);
  // hoop: pole, backboard, rim, net
  fb.rect(172, 90, 5, FLOOR - 90, C.steel); fb.rect(160, 90, 14, 3, C.steel);
  fb.rect(157, 70, 5, 44, C.white); fb.rect(157, 70, 1, 44, C.silver); fb.rect(158, 86, 3, 10, C.red);
  fb.rect(134, 106, 23, 3, C.orange); fb.px(133, 106, C.rust);
}
function net(t, swishT) {
  const k = swishT !== null ? clamp(1 - (t - swishT) / .35, 0, 1) : 0;
  for (let i = 0; i < 7; i++) { const x = 135 + i * 3; fb.line(x, 109, x + (i < 3 ? 2 : i > 3 ? -2 : 0) + Math.round(k * 2 * Math.sin(t * 40 + i)), 124 + Math.round(k * 4), C.white); }
}

// ---- the player rig (big man, faces right; feet on the floor line) ----
const DIG = { '1': ['.#.', '##.', '.#.', '.#.', '###'], '5': ['###', '#..', '##.', '..#', '##.'] };
function digit(ch, x, y, c) { DIG[ch].forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === '#') fb.px(x + i, y + j, c); }); }
function limb(x0, y0, x1, y1, c, cs) { fb.line(x0, y0, x1, y1, c); fb.line(x0 + 1, y0, x1 + 1, y1, c); fb.line(x0 + 2, y0, x1 + 2, y1, cs); }
function ball(x, y) { fb.disc(x, y, 3, C.orange); fb.px(x - 1, y - 1, C.amber); fb.hline(x - 3, x + 3, y, C.rust); fb.vline(x, y - 3, y + 3, C.rust); }
function player(x, t, pose, k = 0, f = FLOOR) {
  const breath = Math.floor(t * 2) % 2;   // shoulders rise 1 px
  const bob = pose === 'dribble' ? (Math.floor(t / (DRIB / 2)) % 2) : 0;
  const hy = f - 50 + bob + (pose === 'shoot' ? -Math.round(4 * k) : 0);   // head top; jump on the shot
  const jump = pose === 'shoot' ? Math.round(4 * k) : 0;
  // legs
  limb(x + 2, f - 18 - jump, x + 1, f - 2 - jump, C.skin, C.skinS); limb(x + 8, f - 18 - jump, x + 10, f - 2 - jump, C.skin, C.skinS);
  fb.rect(x - 1, f - 3 - jump, 7, 3, C.white); fb.rect(x + 8, f - 3 - jump, 7, 3, C.white); fb.hline(x - 1, x + 5, f - 1 - jump, C.steel); fb.hline(x + 8, x + 14, f - 1 - jump, C.steel);
  // shorts + jersey
  fb.rect(x, hy + 30, 13, 8, C.navy); fb.rect(x, hy + 30, 13, 1, C.blue);
  fb.rect(x, hy + 11 - breath, 13, 20 + breath, C.navy); fb.rect(x + 11, hy + 11, 2, 20, C.night); fb.rect(x, hy + 11 - breath, 13, 1, C.white);
  fb.vline(x, hy + 12, hy + 30, C.blue); digit('1', x + 3, hy + 16, C.white); digit('5', x + 7, hy + 16, C.white);
  // head: hair, face, eye, beard shadow
  fb.rect(x + 2, hy + 1, 10, 10, C.skin); fb.rect(x + 2, hy, 10, 3, C.dbrown); fb.rect(x + 2, hy, 2, 6, C.dbrown);
  fb.px(x + 9, hy + 5, C.ink); fb.rect(x + 5, hy + 8, 7, 3, C.skinS); fb.px(x + 12, hy + 6, C.skin);
  fb.rect(x + 5, hy + 10, 4, 1, C.skinS);
  // arms + ball by pose
  if (pose === 'dribble') {
    const ph = ((t - .25) / DRIB % 1 + 1) % 1, by = Math.round(f - 26 + 22 * Math.abs(Math.sin(Math.PI * ph)));
    limb(x + 10, hy + 13, x + 17, hy + 24, C.skin, C.skinS); ball(x + 19, by);
    limb(x + 1, hy + 13, x - 2, hy + 27, C.skin, C.skinS);
  } else if (pose === 'shoot') {
    limb(x + 10, hy + 13, x + 13, hy - 4, C.skin, C.skinS); limb(x + 3, hy + 13, x + 9, hy - 3, C.skin, C.skinS);
  } else if (pose === 'celebrate') {
    limb(x + 10, hy + 13, x + 16, hy - 6, C.skin, C.skinS); limb(x + 1, hy + 13, x - 4, hy - 6, C.skin, C.skinS);
  } else { limb(x + 10, hy + 13, x + 12, hy + 28, C.skin, C.skinS); limb(x + 1, hy + 13, x - 1, hy + 28, C.skin, C.skinS); }
  return hy;
}
const PW = 44, PH = 64, PF = 62, pfb = new FB(PW, PH);
function big(X, draw) {   // run draw() into pfb (feet at PF), paste ×2 with its feet on FLOOR; returns local→world mapping
  const main = fb; fb = pfb; pfb.clear(T); const r = draw(); fb = main;
  const oy = FLOOR - 2 * PF;
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) { const c = pfb.d[y * PW + x]; if (c !== T) fb.rect(X + 2 * x, oy + 2 * y, 2, 2, c); }
  return { r, wx: lx => X + 2 * lx, wy: ly => oy + 2 * ly };
}
function ballBig(x, y) { fb.disc(x, y, 6, C.orange); fb.rect(x - 3, y - 4, 2, 2, C.amber); fb.hline(x - 6, x + 6, y, C.rust); fb.vline(x, y - 6, y + 6, C.rust); }
function trophy(x, y) {
  fb.rect(x, y, 12, 10, C.yellow); fb.rect(x + 1, y + 1, 3, 8, C.white); fb.rect(x + 9, y, 3, 10, C.amber);
  fb.rect(x - 3, y + 1, 3, 2, C.amber); fb.rect(x + 12, y + 1, 3, 2, C.amber); fb.rect(x + 4, y + 10, 4, 4, C.amber); fb.rect(x + 1, y + 14, 10, 3, C.orange);
}

// ---- UI ----
function topWin(lines, y, t0, t, big = false) {   // slides down from above, integer px
  const L2 = lines.map(s => Array.isArray(s) ? s : [s, C.white]), SC = L2.map(s => s[2] || (big ? 3 : 1)), LH = SC.map(c => c === 3 ? 25 : c === 2 ? 18 : 11);
  const w = W - 12, h = 12 + LH.reduce((a, b) => a + b, 0);
  const yy = Math.round(y - (1 - eo(clamp((t - t0) / .15, 0, 1))) * (y + h + 4));
  win(fb, 6, yy, w, h);
  let ly = yy + 7;
  L2.forEach(([str, col], i) => { const sc = SC[i], tw = textW(str.normalize('NFD').replace(/[\u0301\u0303]/g, ''), sc); textES(fb, str, Math.round((W - tw) / 2), ly + (sc > 1 ? 3 : 0), col, C.night, sc); ly += LH[i]; });
}
function dialog(l, t) {   // the dialog box IS the subtitle: types with the voice
  const X = 4, Y = 210, Wd = W - 8, Hd = 44;
  win(fb, X, Y, Wd, Hd);
  const cps = l.text.length / (l.d * .9), n = Math.max(0, Math.floor((t - l.t) * cps));
  let used = 0;
  wrap(l.text, Wd - 16).forEach((ln, i) => { const vis = ln.slice(0, Math.max(0, n - used)); used += ln.length + 1; textES(fb, vis, X + 8, Y + 8 + i * 11, C.white, C.night); });
  if (n >= l.text.length && Math.floor(t * 3) % 2 === 0) text(fb, '▼', X + Wd - 13, Y + Hd - 11, C.white);
  textES(fb, '@NBAreelsHD', X + 8, Y + Hd - 11, C.steel);
}
function chrome() { }   // the handle lives in the dialog box (the top of the frame is under Instagram's header)

// ---- scenes ----
function render(tt) {
  fb.clear(C.ink); let lut = LUT.full;
  const l = L.find(x => tt >= x.s0 && tt < x.s1) || L[L.length - 1], sc = l.scene.type;
  if (sc === 'gold' && tt >= S.gold.t - .05) {
    // gold flood: the whole court turns to a trophy room
    fb.dither(0, 0, W, H, (x, y) => .5 + .4 * Math.sin(y * .05 + tt * 2), C.amber, C.yellow);
    for (let i = 0; i < 60; i++) { const x = Math.floor(hash(i) * W), y = Math.floor((hash(i, 1) * H + (tt - S.gold.t) * (40 + hash(i, 2) * 50)) % H); fb.rect(x, y, 2, 2, [C.white, C.red, C.navy, C.orange][i % 4]); }
    fb.rect(0, FLOOR, W, H - FLOOR, C.orange); fb.hline(0, W - 1, FLOOR, C.white);
    big(46, () => { const hy = player(14, tt, 'celebrate', 0, PF); trophy(27, hy + 2); });
    topWin([['¡CAMPEÓN!', C.yellow, 3], ['2023', C.white, 2], ['MVP DE LAS FINALES', C.yellow, 1]], 22, S.gold.t, tt);
  } else {
    crowd(tt, sc === 'menu'); court();
    // the silent beat before the gold swirl freezes the last level-up (all three MVPs on screen)
    const pre = sc === 'gold', lt = pre ? S.level.s1 - .01 : tt;
    let swishT = null;
    if (sc === 'level' || pre) for (let i = 2; i >= 0; i--) { const s = SHOT(i); if (lt >= s.swish) { swishT = s.swish; break; } }
    net(tt, swishT);
    if (sc === 'level' || pre) {
      const tt = lt;
      const i = Math.min(2, Math.floor((tt - S.level.s0) / SHOT(0).span)), s = SHOT(Math.max(0, i)), u = tt - s.a;
      const k = clamp(u / .3, 0, 1) * (1 - clamp((u - .45) / .3, 0, 1));
      const m = big(30, () => player(10, tt, u < .75 ? 'shoot' : 'idle', k, PF)), hx = m.wx(22), hy = m.wy(m.r - 6);
      if (u < .3) ballBig(hx, hy);
      else if (u < .95) { const p = (u - .3) / .65, bx = hx + (145 - hx) * p, by = hy + (100 - hy) * p - 60 * Math.sin(Math.PI * p); ballBig(Math.round(bx), Math.round(by)); }
      else if (u < 1.4) ballBig(145, Math.round(110 + (u - .95) * 180));
      // stats window: one MVP per level up
      const got = [0, 1, 2].filter(j => tt >= SHOT(j).swish).length, yrs = ['2021', '2022', '2024'];
      topWin([['NIVEL ' + (41 + got * 19 > 99 ? 99 : 41 + got * 19), C.yellow], ...yrs.slice(0, got).map(y => [`* MVP ${y}`, C.white])], 24, S.level.s0, tt);
      if (swishT !== null && tt - swishT < .9) textOutlined(fb, 'LEVEL UP!', Math.round((W - textW('LEVEL UP!', 2)) / 2), 86, C.yellow, C.ink, 2);
    } else if (sc === 'menu') {
      lut = LUT.faded; big(10, () => player(10, tt, 'idle', 0, PF));
      const qy = 40, lines = wrap('¿EL MEJOR PÍVOT DE LA HISTORIA?', W - 40);
      win(fb, 8, qy, W - 16, 30 + lines.length * 11 + 26);
      lines.forEach((s, i) => textES(fb, s, 18, qy + 12 + i * 11, C.yellow, C.night));
      const oy = qy + 18 + lines.length * 11; textES(fb, 'SÍ', 40, oy, C.white, C.night); textES(fb, 'NO', 100, oy, C.white, C.night); hand(fb, 26, oy - 1, tt);
      win(fb, 8, 214, W - 16, 36); textES(fb, 'COMENTA ABAJO', Math.round((W - textW('COMENTA ABAJO')) / 2), 222, C.white, C.night);
      textES(fb, '+ SÍGUENOS @NBAreelsHD', Math.round((W - textW('+ SIGUENOS @NBAreelsHD')) / 2), 235, C.yellow, C.night);
    } else {
      big(24, () => player(10, tt, 'dribble', 0, PF));
      if (sc === 'hook') topWin([['NADIE LO QUERÍA', C.white, 1], ['PICK #41', C.yellow, 3]], 30, 0, tt);
      if (sc === 'tv') {
        // the draft on TV: static noise and "ANUNCIOS" — he was never shown
        const x0 = 22, y0 = 44, w = 136, h = 76; win(fb, x0 - 6, y0 - 16, w + 12, h + 22);
        textES(fb, 'DRAFT 2014 · PICK 41', x0 + 4, y0 - 10, C.yellow, C.night);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) fb.px(x0 + x, y0 + y, hash(x, y, Math.floor(tt * 24)) < .5 ? C.slate : C.steel);
        if (Math.floor(tt * 3) % 2 === 0) { fb.rect(x0 + 24, y0 + 32, 88, 18, C.ink); textES(fb, 'ANUNCIOS', x0 + Math.round((w - textW('ANUNCIOS')) / 2), y0 + 37, C.white); }
      }
    }
  }
  // swirl into gold: mosaic grows over the silent beat
  chrome();
  if (sc !== 'menu' || true) { const l2 = L.find(x => tt >= x.t && tt < x.s1 + .3 && x.scene.type !== 'menu'); if (l2 && tt < l2.t + Math.max(l2.d + .6, 1.8) && tt < l2.s1) dialog(l2, tt); }
  out.present(fb, lut);
  const sw = S.gold.t - tt;
  if (sw > 0 && sw < BEAT * 2) out.post(u => mosaic(u, 1 + Math.floor((1 - sw / (BEAT * 2)) * 12)));
  if (tt < .33) { const s = [3, 3, 2, 2, 1, 1, 0, 0][Math.floor(tt * 24)] || 0; if (s) out.post(u => { const c = u.slice(); for (let i = 0; i < u.length; i++) u[i] = c[Math.max(0, i - s * W - s)]; }); }
  if (tt < .09) out.post(u => { for (let i = 0; i < u.length; i++) u[i] ^= 0x00ffffff; });
  out.show();
}

window.DUR = DUR; window.EV = EV; window.render = render; window.READY = true;
