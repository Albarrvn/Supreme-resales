// Pixel Curry — 15 s style sample: chunky big-head pixel caricature (thick outline per part, 2-tone shading) on a 180×320 ×6 framebuffer.
import { W, H, FB, C, T, LUT, makeOut, hash, clamp, eo } from './px.js';
import { text, textW, textES } from './font.js';

const fb = new FB(), out = makeOut(document.getElementById('c'));
const DUR = 15, FLOOR = 262;   // feet line; the 2× chibi reaches up to y ≈ 98
const S = { run: [0, 3.5], shot: [3.5, 8], party: [8, 11.5], cta: [11.5, 15] };

// ───────── events (sound on its frame) ─────────
const EV = [], ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
ev(0, 'section', { name: 'A' }); ev(.6, 'boom');
for (let t = .15; t < 3.1; t += .25) ev(t, 'dribble');                 // footsteps on the run
ev(3.5, 'section', { name: 'B' }); ev(3.9, 'shoot');
for (let t = 4.0; t < 7.4; t += .12) ev(t, 'coin');
ev(7.45, 'swish'); ev(7.5, 'levelup'); ev(7.5, 'crowd');
ev(8, 'section', { name: 'G' }); ev(8, 'swirl'); ev(8.3, 'fanfare');
ev(11.5, 'section', { name: 'M' }); ev(11.8, 'select'); ev(12.6, 'select');
ev(14.9, 'section', { name: 'end' });

// ───────── sprite rig: parts are pixel masks; each part gets light/shade fill and its own ink edge ─────────
const SW = 96, SH = 140, OX = 48, OY = 134;            // sprite buffer, origin = between the feet
const sb = new FB(SW, SH);
const P_ = { skin: C.tan, skinS: C.brown, hair: C.umber, hairL: C.dbrown, jer: C.dslate, jerS: C.night, gold: C.amber, gold2: C.yellow, blue: C.blue, shoe: C.orange, shoeL: C.amber, sock: C.silver, sockS: C.steel };
const key = (x, y) => (y + 200) * 1000 + x + 200;
function mask(fn, x0, y0, x1, y1) { const m = new Set(); for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) if (fn(x, y)) m.add(key(x, y)); return m; }
const has = (m, x, y) => m.has(key(x, y));
function paint(m, light, shade, edge = C.ink) {   // shade = lower-right side (light from upper left), ink on the part's own edge
  for (const k of m) {
    const x = k % 1000 - 200, y = Math.floor(k / 1000) - 200;
    const isEdge = !has(m, x + 1, y) || !has(m, x - 1, y) || !has(m, x, y + 1) || !has(m, x, y - 1);
    const c = isEdge ? edge : (!has(m, x + 2, y + 1) || !has(m, x + 1, y + 2)) ? shade : light;
    sb.px(OX + x, OY + y, c);
  }
}
function capsule(a, b, r) {   // pixels within r of segment ab
  const [ax, ay] = a, [bx, by] = b, dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
  return mask((x, y) => { const u = clamp(((x - ax) * dx + (y - ay) * dy) / L2, 0, 1), px = ax + u * dx - x, py = ay + u * dy - y; return px * px + py * py <= r * r + .5; },
    Math.min(ax, bx) - r - 1, Math.min(ay, by) - r - 1, Math.max(ax, bx) + r + 1, Math.max(ay, by) + r + 1);
}
const ell = (cx, cy, rx, ry) => mask((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, cx - rx - 1, cy - ry - 1, cx + rx + 1, cy + ry + 1);
const D3 = { '3': ['###', '..#', '.##', '..#', '###'], '0': ['###', '#.#', '#.#', '#.#', '###'] };
function digits(s, x, y, sc, c) { [...s].forEach((ch, i) => D3[ch].forEach((r, j) => { for (let q = 0; q < 3; q++) if (r[q] === '#') sb.rect(OX + x + i * (3 * sc + sc) + q * sc, OY + y + j * sc, sc, sc, c); })); }

// poses: joint positions relative to the feet origin (y up is negative). B = back limb, F = front limb
const POSES = {
  run0: { lift: 0, legB: [[-5, -40], [-9, -22], [-16, -8]], legF: [[5, -40], [9, -22], [12, -2]], armB: [[-10, -70], [-4, -56], [4, -50]], armF: [[11, -70], [16, -58], [10, -48]] },
  run1: { lift: 2, legB: [[-5, -40], [-4, -22], [-6, -2]], legF: [[5, -40], [14, -26], [6, -12]], armB: [[-10, -70], [-14, -58], [-8, -48]], armF: [[11, -70], [6, -56], [-2, -50]] },
  shoot: { lift: 0, legB: [[-5, -40], [-7, -22], [-6, -2]], legF: [[5, -40], [7, -22], [7, -2]], armB: [[-10, -70], [-2, -86], [6, -100]], armF: [[11, -70], [16, -88], [12, -104]] },
  party: { lift: 0, legB: [[-5, -40], [-12, -21], [-20, -2]], legF: [[5, -40], [12, -22], [20, -1]], armB: [[-10, -70], [-24, -76], [-40, -80]], armF: [[11, -70], [22, -62], [32, -54]] },
  idle: { lift: 0, legB: [[-5, -40], [-6, -22], [-6, -2]], legF: [[5, -40], [6, -22], [7, -2]], armB: [[-10, -70], [-14, -56], [-12, -44]], armF: [[11, -70], [15, -56], [14, -44]] },
};
function limb([a, b, c], r1, r2, upper, lower) { paint(capsule(a, b, r1), upper[0], upper[1]); paint(capsule(b, c, r2), lower[0], lower[1]); }
function player(pose, mouthOpen = true) {
  sb.clear(T); const p = POSES[pose], ly = -p.lift, sh = (q) => q.map(([x, y]) => [Math.round(x * .8), Math.round(y * .66) + ly]);   // chibi: short body, big head
  const legB = sh(p.legB), legF = sh(p.legF), armB = sh(p.armB), armF = sh(p.armF);
  const shoe = (f) => { paint(ell(f[0] + 3, f[1] - 1, 6, 3), P_.shoe, C.rust); sb.rect(OX + f[0] - 1, OY + f[1] - 3, 4, 1, P_.shoeL); };
  // back limbs first
  limb(armB, 3, 3, [P_.skin, P_.skinS], [P_.skin, P_.skinS]); paint(ell(armB[2][0], armB[2][1], 3, 3), P_.skin, P_.skinS);
  limb(legB, 3, 3, [P_.skin, P_.skinS], [P_.sock, P_.sockS]); shoe(legB[2]);
  // shorts + jersey
  const hip = -26 + ly, nk = -48 + ly;
  paint(mask((x, y) => y >= hip - 3 && y <= hip + 8 && Math.abs(x) <= 11 + (y - hip) * .25, -16, hip - 3, 16, hip + 8), P_.jer, P_.jerS);
  for (let y = hip - 1; y <= hip + 6; y++) { sb.px(OX + 11 + Math.floor((y - hip) * .25), OY + y, P_.gold); sb.px(OX + 10 + Math.floor((y - hip) * .25), OY + y, P_.blue); }
  const torso = mask((x, y) => y >= nk && y <= hip && Math.abs(x - 1) <= 12 - (y - nk) * .12 && !(Math.abs(x - 1) > 8 && y < nk + 5), -15, nk, 17, hip);
  paint(torso, P_.jer, P_.jerS);
  for (let i = 0; i < 6; i++) { sb.px(OX + 1 - 4 + i, OY + nk + 1 + Math.abs(i - 2.5) * -1 + 3, P_.gold); }                  // V-neck trim
  for (let y = nk; y < nk + 6; y++) { sb.px(OX + 1 - 9, OY + y, P_.gold); sb.px(OX + 1 + 9, OY + y, P_.gold); }             // armhole trim
  digits('30', -6, nk + 7, 2, C.white); digits('30', -5, nk + 8, 2, C.white);
  // front leg
  limb(legF, 3, 3, [P_.skin, P_.skinS], [P_.sock, P_.sockS]); shoe(legF[2]);
  // the big head: face, ear, hair with a fade, beard, brows, eyes, nose, open mouth
  const hx = 3, hy = -66 + ly;
  paint(ell(hx - 13, hy + 1, 3, 4), P_.skin, P_.skinS);
  const face = mask((x, y) => ((x - hx) / 14) ** 2 + ((y - hy) / 17) ** 2 <= 1 || (y > hy && y < hy + 15 && Math.abs(x - hx) < 12 - (y - hy) * .35), hx - 16, hy - 18, hx + 16, hy + 17);
  paint(face, P_.skin, P_.skinS);
  for (let y = hy - 18; y <= hy - 6; y++) for (let x = hx - 15; x <= hx + 15; x++) {
    const inHair = ((x - hx) / 15) ** 2 + ((y - hy + 5) / 13) ** 2 <= 1 && (y < hy - 9 || x < hx - 11 || x > hx + 13);
    if (inHair) sb.px(OX + x, OY + y, (hash(x, y) < .18 && y < hy - 12) ? P_.hairL : y === hy - 18 || ((x - hx) / 15) ** 2 + ((y - hy + 5) / 13) ** 2 > .86 ? C.ink : P_.hair);
  }
  for (let y = hy + 3; y <= hy + 16; y++) for (let x = hx - 13; x <= hx + 12; x++) if (has(face, x, y) && (y > hy + 9 || x < hx - 9 || x > hx + 10)) sb.px(OX + x, OY + y, hash(x, y, 3) < .3 ? P_.hairL : P_.hair);   // beard
  sb.rect(OX + hx - 7, OY + hy - 4, 5, 2, C.ink); sb.rect(OX + hx + 3, OY + hy - 5, 6, 2, C.ink);                       // heavy brows
  sb.rect(OX + hx - 6, OY + hy - 1, 3, 2, C.ink); sb.rect(OX + hx + 4, OY + hy - 1, 3, 2, C.ink); sb.px(OX + hx - 5, OY + hy - 1, C.white); sb.px(OX + hx + 5, OY + hy - 1, C.white);
  sb.rect(OX + hx, OY + hy + 2, 2, 4, P_.skinS); sb.px(OX + hx + 2, OY + hy + 5, P_.skinS);
  if (mouthOpen) { sb.rect(OX + hx - 3, OY + hy + 9, 8, 4, C.ink); sb.rect(OX + hx - 2, OY + hy + 9, 6, 1, C.white); sb.rect(OX + hx - 1, OY + hy + 11, 4, 1, C.crimson); }
  else sb.rect(OX + hx - 2, OY + hy + 10, 6, 1, C.ink);
  // front arm on top
  limb(armF, 3, 3, [P_.skin, P_.skinS], [P_.skin, P_.skinS]); paint(ell(armF[2][0], armF[2][1], 3, 3), P_.skin, P_.skinS);
  return { hand: armF[2], handB: armB[2] };
}
function blitPlayer(x, y) {   // chunky 2× pixels, feet on (x, y)
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { const c = sb.d[j * SW + i]; if (c !== T) fb.rect(x + 2 * (i - OX), y + 2 * (j - OY), 2, 2, c); }
}
const at = (x, y, h) => [x + 2 * h[0], y + 2 * h[1]];   // a sprite joint in screen pixels
function ball(x, y) { fb.disc(x, y, 6, C.ink); fb.disc(x, y, 5, C.orange); fb.disc(x - 2, y - 2, 2, C.amber); fb.hline(x - 5, x + 5, y, C.rust); fb.vline(x, y - 5, y + 5, C.rust); }

// ───────── arena ─────────
function arena(t) {
  fb.rect(0, 0, W, 160, C.night);
  for (let y = 40; y < 150; y += 5) for (let x = (y / 5 % 2) * 2; x < W; x += 5) {
    const h = hash(x, y), on = Math.floor(t * 4 + h * 8) % 5 ? 0 : 1;
    fb.rect(x, y - on, 3, 3, [C.dslate, C.slate, C.plum, C.navy, C.umber][Math.floor(h * 5)]);
    if (h > .97 && Math.floor(t * 8 + h * 10) % 3 === 0) fb.px(x + 1, y - 1, C.white);        // phone flashes
  }
  fb.dither(0, 140, W, 20, (x, y) => (y - 140) / 20, C.night, C.ink);
  // floor: wood boards with perspective, three-point arc, paint
  for (let y = 160; y < H; y++) { const k = (y - 160) / (H - 160), band = Math.floor((y - 160) / (2 + k * 8)) % 2; fb.hline(0, W - 1, y, band ? C.tan : C.sand); }
  fb.dither(0, 160, W, H - 160, (x, y) => .25 + .2 * Math.sin(x * .09 + y * .02), C.sand, C.tan);
  fb.rect(118, 160, 62, 70, C.rust); fb.dither(118, 160, 62, 70, () => .3, C.rust, C.clay);
  for (let a = 0; a <= 60; a++) { const u = a / 60 * Math.PI, x = Math.round(176 - Math.sin(u) * 120), y = Math.round(163 + (1 - Math.cos(u)) * 36); fb.px(x, y, C.white); fb.px(x, y + 1, C.white); }
  fb.hline(0, W - 1, 160, C.white);
  // hoop
  fb.rect(170, 100, 5, 60, C.steel); fb.rect(156, 100, 16, 3, C.steel);   // hoop below the title band
  fb.rect(152, 80, 6, 46, C.white); fb.rect(152, 80, 1, 46, C.silver); fb.rect(153, 100, 4, 12, C.red);
  fb.rect(132, 118, 21, 3, C.orange); fb.px(131, 118, C.rust);
}
function net(t, swish) {
  const k = swish === null ? 0 : clamp(1 - (t - swish) / .4, 0, 1);
  for (let i = 0; i < 7; i++) { const x = 133 + i * 3; fb.line(x, 121, x + (i < 3 ? 2 : i > 3 ? -2 : 0) + Math.round(k * 2 * Math.sin(t * 40 + i)), 134 + Math.round(k * 4), C.white); }
}
function big(s, y, sc, col, t0, t, outline = C.ink) {   // slams in from 2× in 0.12 s, with an 8-neighbour outline
  if (t < t0) return; const k = t - t0 < .12 ? 2 - eo((t - t0) / .12) : 1, s2 = Math.max(1, Math.round(sc * k)), w = textW(s.normalize('NFD').replace(/[̀-ͯ]/g, ''), s2), x = Math.round((W - w) / 2);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2], [1, 2], [2, 2]]) textES(fb, s, x + dx * Math.max(1, s2 >> 1), y + dy * Math.max(1, s2 >> 1), outline, null, s2);
  textES(fb, s, x, y, col, null, s2);
}

// ───────── render ─────────
function render(t) {
  fb.clear(C.ink); arena(t);
  const swish = t >= 7.45 ? 7.45 : null;
  net(t, swish);
  if (t < S.run[1]) {   // runs in from the left, 8 fps cycle, dribbling
    const x = Math.round(-40 + 100 * eo(clamp(t / 2.6, 0, 1))), moving = t < 2.7, f = moving ? (Math.floor(t * 8) % 2 ? 'run1' : 'run0') : 'idle';
    const r = player(f); blitPlayer(x, FLOOR); const [hx, hy] = at(x, FLOOR, r.hand);
    if (moving) ball(hx + 6, Math.round(FLOOR - 6 - Math.abs(Math.sin(t * Math.PI * 4)) * (FLOOR - 6 - hy))); else ball(hx, hy - 6);
    textES(fb, 'STEPHEN CURRY', Math.round((W - textW('STEPHEN CURRY')) / 2), 14, C.silver, C.ink);
    big('402', 24, 7, C.yellow, .6, t); big('TRIPLES', 76, 3, C.white, .75, t);
  } else if (t < S.shot[1]) {   // the shot: jump, release, a long arc, the counter climbs to 402
    const u = t - S.shot[0], jump = Math.round(12 * Math.sin(Math.PI * clamp(u / .7, 0, 1)));
    const r = player(u < .9 ? 'shoot' : 'idle'); blitPlayer(54, FLOOR - jump); const [hx, hy] = at(54, FLOOR - jump, r.hand);
    if (u < .4) ball(hx, hy - 6);
    else if (u < 3.95) { const p = (u - .4) / 3.55, bx = hx + (142 - hx) * p, by = (hy - 6) + (114 - hy + 6) * p - 70 * Math.sin(Math.PI * p); ball(Math.round(bx), Math.round(by)); }
    else ball(142, Math.round(120 + (u - 3.95) * 120));
    const n = Math.round(402 * clamp((t - 4.0) / 3.4, 0, 1));
    textES(fb, 'TRIPLES 2015-16', Math.round((W - textW('TRIPLES 2015-16')) / 2), 14, C.silver, C.ink);
    big(String(n), 26, 6, n === 402 ? C.yellow : C.white, 3.6, t);
    if (t > 7.45 && t < 8) fb.dither(0, 0, W, H, () => .45 * (1 - (t - 7.45) / .55), T, C.white);
  } else if (t < S.party[1]) {   // celebration: arm out (the reference pose), shimmy on the beat, confetti
    for (let i = 0; i < 40; i++) { const x = Math.floor(hash(i) * W), y = Math.floor((hash(i, 1) * 240 + (t - 8) * (30 + hash(i, 2) * 40)) % 240); fb.rect(x, y, 2, 2, [C.yellow, C.blue, C.white, C.orange][i % 4]); }
    player('party'); blitPlayer(86, FLOOR - Math.floor(t * 4) % 2);
    big('+116', 14, 4, C.yellow, 8.2, t); textES(fb, 'AL RÉCORD ANTERIOR', Math.round((W - textW('AL RECORD ANTERIOR')) / 2), 46, C.white, C.ink);
    big('EN UNA', 60, 2, C.white, 9.2, t); big('TEMPORADA', 78, 2, C.white, 9.35, t);
  } else {   // CTA in a box above the head
    player('idle', Math.floor(t * 3) % 2 === 0); blitPlayer(60, FLOOR - Math.floor(t * 2) % 2);
    const bx = 8, by = 16, bw = W - 16, bh = 104;
    fb.rect(bx, by, bw, bh, C.ink); fb.rect(bx + 2, by + 2, bw - 4, bh - 4, C.white); fb.rect(bx + 4, by + 4, bw - 8, bh - 8, C.navy);
    big('¿EL MEJOR', 26, 2, C.yellow, 11.6, t); big('TIRADOR DE LA', 44, 2, C.white, 11.75, t); big('HISTORIA?', 62, 2, C.white, 11.9, t);
    big('COMENTA', 82, 3, C.yellow, 12.6, t);
    textES(fb, '@NBAreelsHD · SÍGUENOS', Math.round((W - textW('@NBAreelsHD · SIGUENOS')) / 2), 108, C.silver, C.night);
  }
  out.present(fb, LUT.full);
  for (const s0 of [.6, 7.45]) if (t >= s0 && t < s0 + .33) { const sh = [3, 3, 2, 2, 1, 1, 0, 0][Math.floor((t - s0) * 24)] || 0; if (sh) out.post(u => { const c = u.slice(); for (let i = 0; i < u.length; i++) u[i] = c[Math.max(0, i - sh * W - sh)]; }); }   // 3-2-1 px shake on the slams
  out.show();
}
window.DUR = DUR; window.EV = EV; window.render = render; window.READY = true;
