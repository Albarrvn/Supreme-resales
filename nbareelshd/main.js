// Swiss Motion engine for vertical reels. One page, five reels: ?reel=klay|kobe|wilt|curry|lebron
// Rules (STYLE.md): one ease cubic-bezier(.7,0,.2,1) + linear, snaps land on the beat, clip reveals, knife cuts, one signal colour.
const W = 1080, H = 1920, M = 72, GUT = 24, COLS = 6, CW = (W - 2 * M - GUT * (COLS - 1)) / COLS;
const PAGE = '#F2F0EA', INK = '#141414', SIG = '#FF5A00', G1 = '#DAD7CE', G2 = '#B9B5AA';
const BPM = 120, BEAT = 60 / BPM, E8 = BEAT / 2, E16 = BEAT / 4, BAR = BEAT * 4;
const colX = c => M + c * (CW + GUT);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
function bez(x1, y1, x2, y2) {
  const bx = u => 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3, by = u => 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3;
  return t => { if (t <= 0) return 0; if (t >= 1) return 1; let lo = 0, hi = 1, u = t; for (let i = 0; i < 30; i++) { const x = bx(u); if (Math.abs(x - t) < 1e-6) break; x < t ? lo = u : hi = u; u = (lo + hi) / 2; } return by(u); };
}
const E = bez(.7, 0, .2, 1);
const snap = (t, t1, d = E8) => E(seg(t, t1 - d, t1));
const steps = (t, a, b, n) => { const p = seg(t, a, b) * n, i = Math.floor(p); return i >= n ? 1 : (i + E(p - i)) / n; };
const ceilBeat = t => Math.ceil(t / BEAT - 1e-6) * BEAT;

const Q = new URLSearchParams(location.search), REEL = Q.get('reel') || 'klay';
const cv = document.getElementById('c'), g = cv.getContext('2d');
await Promise.all(['500', '800', '900'].map(w => document.fonts.load(`${w} 40px Archivo`)));
const reel = await (await fetch(`reels/${REEL}.json`)).json();
const dur = await (await fetch(`voices/${REEL}/dur.json`)).json();
let words = {}; try { words = await (await fetch(`voices/${REEL}/words.json`)).json(); } catch (e) { }

// ---- timeline: the voice drives it; every line starts on a beat ----
let t = BEAT, L = reel.lines;
L.forEach((l, i) => {
  if (l.pause) t += BAR / 2;                   // half a bar of silence before the exception (the turn)
  l.t = ceilBeat(t); l.d = dur[l.id]; t = l.t + l.d + .25;
  if (i === 0) l.s0 = 0;                       // the hook is on screen from frame 1
});
L.forEach((l, i) => { l.s0 = i === 0 ? 0 : l.t - (l.pause ? BAR / 2 : E8); l.s1 = i < L.length - 1 ? L[i + 1].t - (L[i + 1].pause ? BAR / 2 : E8) : 1e9; });
const DUR = ceilBeat(t + .75);   // short end card: a static tail costs retention
const EV = [];
L.forEach((l, i) => {
  EV.push({ t: l.t, type: 'voice', id: l.id });
  const sc = l.scene, s = Math.max(l.s0, 0) + E8;
  EV.push({ t: l.s0, type: 'section', name: { num: 'A', caption: i < 2 ? 'A' : 'C', cells: 'C', bars: 'C', exception: 'E', question: 'F' }[sc.type] });
  if (l.pause) { EV.push({ t: l.s0, type: 'section', name: 'D' }); EV.push({ t: l.s0 + E8, type: 'knife' }); EV.push({ t: l.t - E8, type: 'section', name: 'E' }); }
  if (sc.type === 'num') for (let k = 1; k <= 4; k++) EV.push({ t: s + k * E16, type: 'thunk' });
  if (sc.type === 'caption') sc.rows.forEach((_, k) => EV.push({ t: s + k * E8, type: 'paper' }));
  if (sc.type === 'cells') { sc.iv = Math.max(E16, Math.min(E8, Math.floor((l.d - .5) / sc.n / E16) * E16)); for (let k = 0; k < sc.n; k++) EV.push({ t: s + k * sc.iv, type: 'dribble' }); if (sc.cut) EV.push({ t: s + sc.n * sc.iv + E8, type: 'knife' }); }
  if (sc.type === 'bars') sc.items.forEach((_, k) => { for (let j = 1; j <= 4; j++) EV.push({ t: s + k * BEAT + j * E16, type: 'snap', g: .6 }); });
  if (sc.type === 'exception') { EV.push({ t: l.t, type: 'thump' }); EV.push({ t: l.t, type: 'horn' }); }
  if (i === 0) EV.push({ t: 0, type: 'boom' });
  else if (l.pause) EV.push({ t: l.s0, type: 'riser', d: l.t - l.s0 });
  else { EV.push({ t: l.s0, type: 'whoosh' }); EV.push({ t: l.s0 + E8, type: 'squeak' }); }
  if (sc.type === 'question') EV.push({ t: s + BEAT, type: 'stamp' });
});
EV.push({ t: DUR - E8, type: 'section', name: 'end' });

// ---- drawing helpers ----
const font = (w, px) => `${w} ${px}px Archivo`;
function fit(txt, w, maxW, maxPx) { g.font = font(w, maxPx); const m = g.measureText(txt).width; return Math.min(maxPx, maxPx * maxW / m); }
// clip-reveal: text rises out of a clip rect from below its baseline (p 0→1), leaves upward (q 0→1)
function riseText(txt, x, y, px, w, col, p, q = 0) {
  if (p <= 0 || q >= 1) return;
  g.save(); g.font = font(w, px); g.letterSpacing = px >= 90 ? `${-0.02 * px}px` : '0px';
  const asc = px * .78, desc = px * .24;
  g.beginPath(); g.rect(x - 4, y - asc - 4, W, asc + desc + 8); g.clip();
  g.fillStyle = col; g.fillText(txt, x - (g.measureText(txt).actualBoundingBoxLeft || 0) * 0, y + (1 - p) * (asc + desc) - q * (asc + desc));
  g.restore();
}
function wrap(txt, px, w, maxW) { g.font = font(w, px); const out = []; let cur = ''; for (const wd of txt.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (g.measureText(tr).width > maxW && cur) { out.push(cur); cur = wd; } else cur = tr; } out.push(cur); return out; }
function knifeCut(t, t0, y0, y1, draw) {          // a line crosses in 1/16, then the element collapses to its midline in 1/8
  const a = seg(t, t0, t0 + E16), b = E(seg(t, t0 + E16, t0 + E16 + E8)), mid = (y0 + y1) / 2;
  if (b >= 1) return;
  g.save(); g.translate(0, mid); g.scale(1, 1 - b); g.translate(0, -mid); draw(); g.restore();
  if (a > 0 && b < 1) { g.fillStyle = INK; g.fillRect(0, mid - 1, W * a, 2); }
}
const TX = [];  // texts on screen this frame, for readcheck

function grid(t) {
  const p = seg(t, 0, E8 * 3);
  g.fillStyle = G1;
  for (let c = 0; c <= COLS; c++) { const x = c === COLS ? W - M : colX(c) - (c ? GUT / 2 : 0); g.fillRect(Math.round(x), 0, 1, H * p); }
  for (let y = 240; y < 1520; y += 160) g.fillRect(M, y, (W - 2 * M) * p, 1);
}
function chrome(t) {
  g.fillStyle = INK; g.font = font(800, 26); g.fillText('@NBAreelsHD', M, 132);
  g.font = font(500, 22); g.fillStyle = G2; g.fillText(`${reel.no} · ${reel.title.toUpperCase()}`, colX(3), 132);
  g.fillStyle = INK; g.fillRect(M, 150, W - 2 * M, 2);
  const bar = Math.floor(t / BAR) + 1, b = Math.floor(t / BEAT) % 4 + 1;
  g.font = font(500, 20); g.fillStyle = G2; g.fillText(`bar ${String(bar).padStart(2, '0')}.${b}  ·  ${BPM} bpm  ·  6 col × ${Math.round(CW)} px`, M, 1490);
}

// ---- scenes: each draws in the visual zone y 240–1120 ----
const SC = {
  num(sc, t, s, q) {
    const px = fit(sc.big, 900, W - 2 * M, 560), y = 240 + px * .86;
    const p = steps(t, s, s + 4 * E16, 4);
    riseText(sc.big, M, y, px, 900, INK, p, q);
    riseText(sc.note, M, y + 120, 40, 800, INK, snap(t, s + 5 * E16, E16), q);
    TX.push({ id: 'big', text: sc.big + ' ' + sc.note });
  },
  caption(sc, t, s, q) {
    sc.rows.forEach((r, k) => {
      const px = k === 0 ? 72 : fit(r, 900, W - 2 * M, 150), y = 360 + k * 200;
      if (k === 0) { g.fillStyle = INK; g.fillRect(M, y - 100, (W - 2 * M) * seg(t, s, s + E8), 2); }
      riseText(r, M, y, px, k === 0 ? 500 : 900, INK, snap(t, s + k * E8, E16), q);
    });
    TX.push({ id: 'cap', text: sc.rows.join(' ') });
  },
  cells(sc, t, s, q) {
    const n = sc.n, cols = n <= 6 ? n : Math.ceil(n / 2), cw = (W - 2 * M - GUT * (cols - 1)) / cols, sz = Math.min(cw, 300);
    for (let k = 0; k < n; k++) {
      const x = M + (k % cols) * (cw + GUT), y = 300 + Math.floor(k / cols) * (sz + GUT), p = snap(t, s + k * sc.iv, E16);
      const cut = sc.cut && k < sc.cut, draw = () => { g.fillStyle = INK; g.fillRect(x, y + sz * (1 - p), cw + .5, sz * p); };
      g.strokeStyle = G2; g.lineWidth = 1; g.strokeRect(x + .5, y + .5, cw, sz);
      if (cut) knifeCut(t, s + n * sc.iv + E8 - E16, y, y + sz, draw); else draw();
    }
    const rows = Math.ceil(n / cols), ly = 300 + rows * (sz + GUT) + 80;
    riseText(sc.label, M, ly, 64, 900, INK, snap(t, s + E8, E16), q);
    TX.push({ id: 'cells', text: sc.label });
  },
  bars(sc, t, s, q) {
    sc.items.forEach(([lab, v], k) => {
      // one row per item: number + name on one line, the bar under it (rows never overlap, up to 3 items)
      const rh = sc.items.length > 2 ? 250 : 330, y = 360 + k * rh, w = (W - 2 * M) * v / sc.max, p = steps(t, s + k * BEAT, s + k * BEAT + 4 * E16, 4);
      const num = String(Math.round(v * p)); g.font = font(900, 96); const nw = g.measureText(String(v)).width;
      riseText(num, M, y, 96, 900, INK, snap(t, s + k * BEAT, E16), q);
      riseText(lab, M + nw + 24, y, 40, 800, INK, snap(t, s + k * BEAT, E16), q);
      g.fillStyle = INK; g.fillRect(M, y + 36, w * p * (1 - q), rh > 300 ? 140 : 100);
    });
    TX.push({ id: 'bars', text: sc.items.map(x => x.join(' ')).join(' ') });
  },
  exception(sc, t, s, q, l) {
    // the only orange element, the only one off the grid: linear, unsnapped, drifting
    const px = fit(sc.big, 900, W - 2 * M - 60, 640), u = seg(t, l.t, l.s1), land = snap(t, l.t, E8);
    const dx = 40 * u, dy = -30 * u, x = M + dx, y = 260 + px * .82 + dy;
    g.save(); g.beginPath(); g.rect(0, 200, W, 1000); g.clip();
    g.font = font(900, px); g.letterSpacing = `${-0.02 * px}px`; g.fillStyle = SIG;
    g.fillText(sc.big, x, y + (1 - land) * px - q * px * 1.2);
    g.restore();
    const col = (dx / (CW + GUT)).toFixed(2), off = u > .02;
    g.font = font(500, 22); g.fillStyle = off ? SIG : G2;
    if (land > 0 && q <= 0) g.fillText(`col ${(1 + +col).toFixed(2)} · row ${(-dy / 160).toFixed(2)} · ${off ? 'off grid' : 'on grid'}`, colX(0), y + 70);
    riseText(sc.note, M, y + 150, 44, 800, INK, snap(t, l.t + E8, E16), q);
    TX.push({ id: 'exc', text: sc.big + ' ' + sc.note });
  },
  question(sc, t, s, q, l) {
    // vertical scroll of the page by one module, then the question flush left, stamp with the handle
    const lines = wrap(l.text, 104, 900, W - 2 * M);
    lines.forEach((ln, k) => riseText(ln, M, 420 + k * 116, 104, 900, INK, snap(t, s + k * E16, E16)));
    const p = snap(t, s + BEAT, E16);
    if (p > 0) { g.fillStyle = INK; g.fillRect(M, 420 + lines.length * 116, 420 * p, 84); g.font = font(800, 40); g.fillStyle = PAGE; if (p >= 1) g.fillText('@NBAreelsHD', M + 24, 420 + lines.length * 116 + 56); }
    riseText('+ SÍGUENOS PARA MÁS', M, 420 + lines.length * 116 + 170, 48, 900, INK, snap(t, s + BEAT + E8, E16));
    TX.push({ id: 'q', text: l.text + ' @NBAreelsHD + SÍGUENOS PARA MÁS' });
  },
};

function subtitle(l, t) {
  if (l.scene.type === 'question') return;                 // the question is its own subtitle
  const lt = t - l.t, ws = l.text.split(' '), wt = words[l.id] || ws.map((_, i) => i * l.d / ws.length);
  const hold = Math.max(1.8, l.d + .6), q = snap(t, l.t + Math.max(hold, l.s1 - l.t - E8), E8);
  if (lt < -E16 || q >= 1) return;
  const lines = wrap(l.text, 56, 800, W - 2 * M - 120); let k = 0;
  g.fillStyle = G2; g.font = font(500, 22); g.fillText('—', M, 1190);
  lines.forEach((ln, r) => {
    let x = M; g.font = font(800, 56);
    for (const wd of ln.split(' ')) {
      const p = snap(t, l.t + (wt[k] ?? 0) + E16, E16);
      riseText(wd, x, 1270 + r * 68, 56, 800, INK, p, q); g.font = font(800, 56); x += g.measureText(wd + ' ').width; k++;
    }
  });
  TX.push({ id: 'sub' + l.id, text: l.text });
}

window.DUR = DUR; window.EV = EV;
window.TEXTS = tt => { TX.length = 0; render(tt); return TX.map(x => ({ ...x, x0: M, y0: 200, x1: W - M, y1: 1450 })); };
const i0 = l => l === L[0] ? -5 * E16 : l.s0;   // the hook lands by frame 3: it is the reel's cover
function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = PAGE; g.fillRect(0, 0, W, H); TX.length = 0;
  grid(t); chrome(t);
  for (const l of L) {
    if (t < l.s0 || t >= l.s1 + E8) continue;
    const s = i0(l) + (l.pause ? BAR / 2 : 0), q = l.s1 < 1e8 ? snap(t, l.s1 + E8, E8) : 0;
    if (l.pause && t < l.t - E8) continue;                  // the silent bar: empty grid after the knife cut
    const slam = l === L[0] && t < .17 ? 1 + .35 * (1 - E(t / .17)) : 1;
    if (slam > 1) { g.save(); g.translate(M, 560); g.scale(slam, slam); g.translate(-M, -560); }
    SC[l.scene.type](l.scene, t, s, q, l);
    if (slam > 1) g.restore();
    subtitle(l, t);
  }
  if (t < .09) { g.save(); g.globalCompositeOperation = 'difference'; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); }
  // knife cut of the previous scene at the start of the silent bar
  L.forEach((l, i) => { if (l.pause && i > 0 && t >= l.s0 && t < l.s0 + E8 * 2) { const p = L[i - 1]; knifeCut(t, l.s0, 240, 1120, () => { SC[p.scene.type](p.scene, l.s0 - .001, i0(p), 0, p); }); } });
}
window.render = render;
window.READY = true;
