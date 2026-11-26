// MJ vs LBJ — fighting-game reel in chunky big-head pixel art. 180×320 indexed framebuffer ×6; the voice drives the rounds.
import { W, H, FB, C, T, LUT, makeOut, hash, clamp, eo } from './px.js';
import { text, textW, textES } from './font.js';

const fb = new FB(), out = makeOut(document.getElementById('c'));
const FLOOR = 262;
const reel = await (await fetch('reel.json')).json();
const dur = await (await fetch('voices/dur.json')).json();

// ───────── sprite rig ─────────
const SW = 96, SH = 140, OX = 48, OY = 134;            // sprite buffer, origin = between the feet
const sb = new FB(SW, SH);
// two looks, same rig: what survives is the silhouette (bald + goatee vs headband + full beard) and the jersey colours (no logos)
const MJ = { skin: C.dbrown, skinS: C.umber, hair: 'bald', beard: 'goatee', hairC: C.ink, hairL: C.umber, band: false, jer: C.red, jerS: C.crimson, gold: C.ink, blue: C.white, num: '23', shoe: C.red, shoeS: C.crimson, shoeL: C.white, sock: C.white, sockS: C.silver };
const LBJ = { skin: C.brown, skinS: C.dbrown, hair: 'short', beard: 'full', hairC: C.ink, hairL: C.umber, band: true, jer: C.plum, jerS: C.umber, gold: C.amber, blue: C.yellow, num: '23', shoe: C.amber, shoeS: C.orange, shoeL: C.yellow, sock: C.white, sockS: C.silver };
let P_ = MJ;
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
const D3 = { '2': ['###', '..#', '###', '#..', '###'], '3': ['###', '..#', '.##', '..#', '###'], '0': ['###', '#.#', '#.#', '#.#', '###'] };
function digits(s, x, y, sc, c, mir = false) {   // mir: pre-mirrored so a flipped sprite still reads "23"
  const chars = mir ? [...s].reverse() : [...s];
  chars.forEach((ch, i) => D3[ch].forEach((r, j) => { for (let q = 0; q < 3; q++) if (r[mir ? 2 - q : q] === '#') sb.rect(OX + x + i * (3 * sc + sc) + q * sc, OY + y + j * sc, sc, sc, c); }));
}

// poses: joint positions relative to the feet origin (y up is negative). B = back limb, F = front limb
const POSES = {
  run0: { lift: 0, legB: [[-5, -40], [-9, -22], [-16, -8]], legF: [[5, -40], [9, -22], [12, -2]], armB: [[-10, -70], [-4, -56], [4, -50]], armF: [[11, -70], [16, -58], [10, -48]] },
  run1: { lift: 2, legB: [[-5, -40], [-4, -22], [-6, -2]], legF: [[5, -40], [14, -26], [6, -12]], armB: [[-10, -70], [-14, -58], [-8, -48]], armF: [[11, -70], [6, -56], [-2, -50]] },
  shoot: { lift: 0, legB: [[-5, -40], [-7, -22], [-6, -2]], legF: [[5, -40], [7, -22], [7, -2]], armB: [[-10, -70], [-2, -86], [6, -100]], armF: [[11, -70], [16, -88], [12, -104]] },
  party: { lift: 0, legB: [[-5, -40], [-12, -21], [-20, -2]], legF: [[5, -40], [12, -22], [20, -1]], armB: [[-10, -70], [-24, -76], [-40, -80]], armF: [[11, -70], [22, -62], [32, -54]] },
  guard: { lift: 0, legB: [[-5, -40], [-10, -22], [-14, -2]], legF: [[5, -40], [10, -22], [13, -2]], armB: [[-10, -70], [6, -60], [14, -72]], armF: [[11, -70], [22, -62], [24, -76]] },
  punch: { lift: 0, legB: [[-5, -40], [-12, -22], [-18, -2]], legF: [[5, -40], [12, -24], [16, -2]], armB: [[-10, -70], [-4, -58], [6, -66]], armF: [[11, -70], [28, -72], [46, -74]] },
  hurt: { lift: 0, legB: [[-5, -40], [-8, -22], [-10, -2]], legF: [[5, -40], [2, -22], [4, -2]], armB: [[-10, -70], [-20, -84], [-16, -98]], armF: [[11, -70], [2, -86], [6, -100]] },
  idle: { lift: 0, legB: [[-5, -40], [-6, -22], [-6, -2]], legF: [[5, -40], [6, -22], [7, -2]], armB: [[-10, -70], [-14, -56], [-12, -44]], armF: [[11, -70], [15, -56], [14, -44]] },
};
function limb([a, b, c], r1, r2, upper, lower) { paint(capsule(a, b, r1), upper[0], upper[1]); paint(capsule(b, c, r2), lower[0], lower[1]); }
function player(pose, look, mouthOpen = true, flip = false) {
  P_ = look; sb.clear(T); const p = POSES[pose], ly = -p.lift, sh = (q) => q.map(([x, y]) => [Math.round(x * .8), Math.round(y * .66) + ly]);   // chibi: short body, big head
  const legB = sh(p.legB), legF = sh(p.legF), armB = sh(p.armB), armF = sh(p.armF);
  const shoe = (f) => { paint(ell(f[0] + 3, f[1] - 1, 6, 3), P_.shoe, P_.shoeS); sb.rect(OX + f[0] - 1, OY + f[1] - 3, 4, 1, P_.shoeL); };
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
  digits(P_.num, -6, nk + 7, 2, C.white, flip); digits(P_.num, -5, nk + 8, 2, C.white, flip);
  // front leg
  limb(legF, 3, 3, [P_.skin, P_.skinS], [P_.sock, P_.sockS]); shoe(legF[2]);
  // the big head: face, ear, hair with a fade, beard, brows, eyes, nose, open mouth
  const hx = 3, hy = -66 + ly;
  paint(ell(hx - 13, hy + 1, 3, 4), P_.skin, P_.skinS);
  const face = mask((x, y) => ((x - hx) / 14) ** 2 + ((y - hy) / 17) ** 2 <= 1 || (y > hy && y < hy + 15 && Math.abs(x - hx) < 12 - (y - hy) * .35), hx - 16, hy - 18, hx + 16, hy + 17);
  paint(face, P_.skin, P_.skinS);
  if (P_.hair === 'short') for (let y = hy - 18; y <= hy - 6; y++) for (let x = hx - 15; x <= hx + 15; x++) {
    const inHair = ((x - hx) / 15) ** 2 + ((y - hy + 5) / 13) ** 2 <= 1 && (y < hy - 9 || x < hx - 11 || x > hx + 13);
    if (inHair) sb.px(OX + x, OY + y, (hash(x, y) < .18 && y < hy - 12) ? P_.hairL : y === hy - 18 || ((x - hx) / 15) ** 2 + ((y - hy + 5) / 13) ** 2 > .86 ? C.ink : P_.hairC);
  }
  if (P_.hair === 'bald') { sb.rect(OX + hx - 6, OY + hy - 14, 4, 2, P_.skin === C.dbrown ? C.brown : C.tan); sb.px(OX + hx - 7, OY + hy - 12, C.brown); }   // scalp shine
  if (P_.band) for (let x = hx - 14; x <= hx + 14; x++) for (let y = hy - 10; y <= hy - 8; y++) if (has(face, x, y)) sb.px(OX + x, OY + y, y === hy - 8 ? C.silver : C.white);
  if (P_.beard === 'full') for (let y = hy + 3; y <= hy + 16; y++) for (let x = hx - 13; x <= hx + 12; x++) if (has(face, x, y) && (y > hy + 9 || x < hx - 9 || x > hx + 10)) sb.px(OX + x, OY + y, hash(x, y, 3) < .3 ? P_.hairL : P_.hairC);
  if (P_.beard === 'goatee') { for (let x = hx - 4; x <= hx + 6; x++) sb.px(OX + x, OY + hy + 7, P_.hairC); for (let y = hy + 13; y <= hy + 16; y++) for (let x = hx - 2; x <= hx + 4; x++) if (has(face, x, y)) sb.px(OX + x, OY + y, P_.hairC); }
  sb.rect(OX + hx - 7, OY + hy - 4, 5, 2, C.ink); sb.rect(OX + hx + 3, OY + hy - 5, 6, 2, C.ink);                       // heavy brows
  sb.rect(OX + hx - 6, OY + hy - 1, 3, 2, C.ink); sb.rect(OX + hx + 4, OY + hy - 1, 3, 2, C.ink); sb.px(OX + hx - 5, OY + hy - 1, C.white); sb.px(OX + hx + 5, OY + hy - 1, C.white);
  sb.rect(OX + hx, OY + hy + 2, 2, 4, P_.skinS); sb.px(OX + hx + 2, OY + hy + 5, P_.skinS);
  if (mouthOpen) { sb.rect(OX + hx - 3, OY + hy + 9, 8, 4, C.ink); sb.rect(OX + hx - 2, OY + hy + 9, 6, 1, C.white); sb.rect(OX + hx - 1, OY + hy + 11, 4, 1, C.crimson); }
  else sb.rect(OX + hx - 2, OY + hy + 10, 6, 1, C.ink);
  // front arm on top
  limb(armF, 3, 3, [P_.skin, P_.skinS], [P_.skin, P_.skinS]); paint(ell(armF[2][0], armF[2][1], 3, 3), P_.skin, P_.skinS);
  return { hand: armF[2], handB: armB[2] };
}
function blitPlayer(x, y, flip = false, flash = false) {   // chunky 2× pixels, feet on (x, y); flip faces left; flash = white hit frame
  for (let j = 0; j < SH; j++) for (let i = 0; i < SW; i++) { let c = sb.d[j * SW + i]; if (c === T) continue; if (flash && c !== C.ink) c = C.white; fb.rect(x + 2 * (flip ? OX - i : i - OX), y + 2 * (j - OY), 2, 2, c); }
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

// ───────── timeline: voice-driven, one round per line ─────────
const L = reel.lines; let t0 = .45;
for (const l of L) { if (l.scene.type === 'end') t0 += .5; l.v = t0; l.d = dur[l.id]; l.hit = l.v + l.d - .15; t0 = l.v + l.d + .3; }
const DUR = Math.ceil((t0 + .9) * 24) / 24, END = L[L.length - 1];
const DMG = { r1: [0, 25], r2: [0, 10], r3: [35, 0], r4: [15, 15] };   // [MJ loses, LBJ loses] — ends 50/50 on purpose
const ROUND = { r1: ['ROUND 1', 'TÍTULOS', '6', '4'], r2: ['ROUND 2', 'MVP', '5', '4'], r3: ['ROUND 3', 'PUNTOS', '32.292', '40.000+'], r4: ['ROUND 4', 'FINALES', '6/6', '10'] };
const EV = [], ev = (t, type, o = {}) => EV.push({ t: +t.toFixed(3), type, ...o });
ev(0, 'section', { name: 'A' }); ev(0, 'boom'); ev(.05, 'swirl');
for (const l of L) {
  ev(l.v, 'voice', { id: l.id }); const k = l.scene.type;
  if (ROUND[k]) { ev(l.v - .3, 'section', { name: 'B' }); ev(l.v - .25, 'select'); ev(l.v + l.d * .55, 'coin'); ev(l.v + l.d * .62, 'coin'); ev(l.hit - .15, 'shoot'); ev(l.hit, 'hit'); if (k === 'r3') ev(l.hit, 'boom'); }
}
ev(END.v - .5, 'section', { name: 'D' }); ev(END.v, 'section', { name: 'G' }); ev(END.v, 'fanfare'); ev(END.v, 'crowd'); ev(END.v + END.d * .55, 'select');
ev(DUR - .1, 'section', { name: 'end' });

function hpAt(t) {   // [MJ, LBJ] health, plus the white "trail" that drains a beat later
  let a = 100, b = 100, ta = 100, tb = 100;
  for (const l of L) { const d = DMG[l.scene.type]; if (!d) continue; const u = clamp((t - l.hit) / .5, 0, 1); if (t >= l.hit) { a -= d[0]; b -= d[1]; ta -= d[0] * u; tb -= d[1] * u; } }
  return [a, b, Math.max(a, ta), Math.max(b, tb)];
}
function bars(t) {
  const [a, b, ta, tb] = hpAt(t), w = 76, blink = Math.floor(t * 6) % 2;
  for (const [x, hp, tr, right] of [[6, a, ta, false], [98, b, tb, true]]) {
    fb.rect(x - 1, 15, w + 2, 11, C.ink); fb.rect(x, 16, w, 9, C.crimson);
    const fw = Math.round(w * tr / 100), hw = Math.round(w * hp / 100), col = hp <= 50 && blink ? C.orange : C.yellow;
    fb.rect(right ? x + w - fw : x, 16, fw, 9, C.white); fb.rect(right ? x + w - hw : x, 16, hw, 9, col); fb.rect(right ? x + w - hw : x, 16, hw, 2, C.white);
  }
  textES(fb, 'MJ', 6, 29, C.white, C.ink); textES(fb, 'LBJ', 174 - textW('LBJ'), 29, C.white, C.ink);
  fb.disc(90, 21, 7, C.ink); fb.disc(90, 21, 6, C.red); textES(fb, 'VS', 90 - Math.round(textW('VS') / 2), 18, C.white);
}
function spark(x, y, t, big2) {   // star burst at the point of contact
  if (t < 0 || t > .3) return; const r = (big2 ? 16 : 10) * (1 - t / .3) + 3;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, rr = i % 2 ? r : r * .5; fb.line(x, y, Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr), i % 3 ? C.yellow : C.white); }
}
function fighter(look, x, flip, t, foe) {   // pose and knockback from the round events
  let pose = 'guard', dx = 0, flash = false, bob = Math.floor(t * 4 + (flip ? 2 : 0)) % 2;
  for (const l of L) { const d = DMG[l.scene.type]; if (!d) continue; const me = flip ? 1 : 0, them = 1 - me;
    if (d[them] && t > l.hit - .18 && t < l.hit + .25) pose = 'punch';
    if (d[me] && t >= l.hit && t < l.hit + .5) { pose = 'hurt'; const u = (t - l.hit) / .5; dx = Math.round((d[me] > 20 ? 14 : 8) * Math.sin(Math.PI * u)); flash = t - l.hit < .09; } }
  if (t < .3) dx = Math.round((1 - eo(t / .3)) * 90);   // slides in from its side
  player(pose, look, pose !== 'guard' || Math.floor(t * 3) % 2 === 0, flip); blitPlayer(x + (flip ? dx : -dx), FLOOR - (pose === 'guard' ? bob : 0), flip, flash);
}
function render(t) {
  fb.clear(C.ink); arena(t); net(t, null);
  const l = L.find(x => t < x.v + x.d + .3) || END, k = l.scene.type;
  fighter(MJ, 44, false, t); fighter(LBJ, 136, true, t);
  for (const r of L) if (DMG[r.scene.type]) spark(90, 150, t - r.hit, r.scene.type === 'r3');
  if (k === 'intro') {
    big('¿QUIÉN ES', 24, 3, C.white, .15, t); big('EL GOAT?', 48, 3, C.yellow, .3, t);
    if (t > .05) big('VS', 72, 4, C.red, .05, t, C.yellow);
  } else if (ROUND[k]) {
    bars(t); const [r, lab, a, b] = ROUND[k], d = DMG[k];
    big(r, 42, 2, C.silver, l.v - .3, t); big(lab, 58, 3, C.yellow, l.v - .2, t);
    if (t > l.v + l.d * .55) { const sc = a.length > 3 ? 2 : 3; textES(fb, a, 8, 84, d[1] ? C.yellow : C.steel, C.ink, sc); }
    if (t > l.v + l.d * .62) { const sc = b.length > 3 ? 2 : 3; textES(fb, b, 172 - textW(b, sc), 84, d[0] ? C.yellow : C.steel, C.ink, sc); }
    if (t >= l.hit && t < l.hit + .6) big(k === 'r3' ? '¡CRÍTICO!' : k === 'r4' ? '¡DOBLE!' : '¡GOLPE!', 112, 2, C.white, l.hit, t, C.red);
  } else {
    bars(t);
    if (t < l.v + l.d * .55) { big('¿EMPATE?', 44, 3, C.white, l.v, t); big('TÚ DECIDES', 70, 3, C.yellow, l.v + .3, t); }
    else { big('COMENTA', 44, 3, C.yellow, l.v + l.d * .55, t); big('MJ o LBJ', 70, 3, C.white, l.v + l.d * .55 + .15, t); }
    textES(fb, '@NBAreelsHD · SÍGUENOS', Math.round((W - textW('@NBAreelsHD · SIGUENOS')) / 2), 94, C.silver, C.ink);
  }
  out.present(fb, LUT.full);
  const shakes = [[0, 3], ...L.filter(r => DMG[r.scene.type]).map(r => [r.hit, r.scene.type === 'r3' ? 5 : 3])];
  for (const [s0, m] of shakes) if (t >= s0 && t < s0 + .33) { const sh = Math.round(m * (1 - (t - s0) / .33)); if (sh) out.post(u => { const c = u.slice(); for (let i = 0; i < u.length; i++) u[i] = c[Math.max(0, i - sh * W - sh)]; }); }
  if (t < .08) out.post(u => { for (let i = 0; i < u.length; i++) u[i] ^= 0x00ffffff; });   // two inverted frames on the VS slam
  out.show();
}
window.DUR = DUR; window.EV = EV; window.render = render; window.READY = true;
