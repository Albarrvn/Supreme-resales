import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, paintTex, ink} from './kit.js';
import {character, PALETTES} from './char.js';

const g = () => new THREE.Group();
const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; return o; };

// ---------- vehicles ----------
export function car(color = '#c43d32', {taxi = false, seed = 1, lights = false} = {}) {
  const c = g();
  const body = box(4.2, 0.9, 1.8, taxi ? '#f2c12e' : color, {y: 0.75});
  const cab = box(2.3, 0.75, 1.65, taxi ? '#f2c12e' : color, {y: 1.55, x: -0.2});
  c.add(body, cab);
  // windows
  for (const z of [0.84, -0.84]) {
    const w = box(1.9, 0.5, 0.02, '#8fc3dd', {x: -0.2, y: 1.58, z, thick: 0.01, edges: false});
    c.add(w);
  }
  c.add(box(0.02, 0.5, 1.4, '#8fc3dd', {x: 0.96, y: 1.58, thick: 0.01, edges: false}));
  c.add(box(0.02, 0.5, 1.4, '#8fc3dd', {x: -1.36, y: 1.58, thick: 0.01, edges: false}));
  // bumpers, wheels
  c.add(box(0.15, 0.3, 1.9, '#d9d9d9', {x: 2.15, y: 0.5, thick: 0.01}), box(0.15, 0.3, 1.9, '#d9d9d9', {x: -2.15, y: 0.5, thick: 0.01}));
  for (const [x, z] of [[1.35, 0.9], [-1.35, 0.9], [1.35, -0.9], [-1.35, -0.9]]) {
    const w = cyl(0.42, 0.42, 0.3, '#2b2b2e', {x, y: 0.42, z, seg: 14, thick: 0.02}); w.rotation.x = Math.PI / 2; c.add(w);
    const hub = cyl(0.18, 0.18, 0.32, '#cfcfcf', {x, y: 0.42, z, seg: 10, thick: 0.01}); hub.rotation.x = Math.PI / 2; c.add(hub);
  }
  const hl = new THREE.MeshBasicMaterial({color: lights ? '#fff3b0' : '#f4eecf'});
  for (const z of [0.6, -0.6]) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), hl); h.position.set(2.2, 0.8, z); c.add(h); }
  const tl = new THREE.MeshBasicMaterial({color: '#d33a2c'});
  for (const z of [0.6, -0.6]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.3), tl); h.position.set(-2.22, 0.8, z); c.add(h); }
  if (taxi) { const t = sign('TAXI', 0.8, 0.28, {bg: '#fff1b8', w: 256, h: 96, font: 'bold 60px Arial'}); at(t, -0.2, 2.1, 0); t.rotation.y = Math.PI / 2; c.add(t); }
  return c;
}
export function bus() {
  const b = g();
  b.add(box(9, 2.6, 2.4, '#2f6db3', {y: 1.7}), box(9.02, 0.8, 2.42, '#f2f0e6', {y: 2.2, edges: false, thick: 0.01}));
  for (let i = 0; i < 7; i++) for (const z of [1.22, -1.22]) b.add(box(0.9, 0.6, 0.02, '#8fc3dd', {x: -3.6 + i * 1.2, y: 2.2, z, thick: 0.01, edges: false}));
  for (const [x, z] of [[3, 1.15], [-3, 1.15], [3, -1.15], [-3, -1.15]]) { const w = cyl(0.5, 0.5, 0.35, '#2b2b2e', {x, y: 0.5, z, seg: 14, thick: 0.02}); w.rotation.x = Math.PI / 2; b.add(w); }
  return b;
}

// ---------- street furniture ----------
export function tree(s = 1, seed = 1) {
  const t = g(); const r = rng(seed);
  t.add(cyl(0.12 * s, 0.18 * s, 2.2 * s, '#6b4430', {y: 1.1 * s}));
  const cols = ['#4f8a4a', '#5f9e4f', '#3f7a45', '#6aa84f'];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry((0.7 + r() * 0.4) * s, 1), toon(cols[i % 4]));
    m.position.set((r() - 0.5) * 1.2 * s, (2.4 + r() * 1.0) * s, (r() - 0.5) * 1.2 * s); ink(m, 0.03 * s, false); t.add(m);
  }
  t.add(box(1.2 * s, 0.35 * s, 1.2 * s, '#8a7a6a', {y: 0.17 * s, thick: 0.02}));
  return t;
}
export const hydrant = () => { const h = g(); h.add(cyl(0.16, 0.2, 0.7, '#c43d32', {y: 0.35}), cyl(0.2, 0.2, 0.1, '#c43d32', {y: 0.72})); const n = cyl(0.07, 0.07, 0.5, '#c43d32', {y: 0.45}); n.rotation.z = Math.PI / 2; h.add(n); return h; };
export const trashCan = () => { const h = g(); h.add(cyl(0.3, 0.26, 0.95, '#6f7a7d', {y: 0.48, seg: 12}), cyl(0.33, 0.33, 0.08, '#5a6366', {y: 0.98, seg: 12})); return h; };
export const mailbox = () => { const h = g(); h.add(box(0.55, 0.8, 0.5, '#2f5d9e', {y: 0.85}), box(0.08, 0.5, 0.08, '#2f5d9e', {y: 0.25})); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.275, 0.275, 0.5, 14, 1, false, 0, Math.PI), toon('#2f5d9e')); t.rotation.z = Math.PI / 2; t.rotation.y = Math.PI / 2; t.position.y = 1.25; ink(t, 0.02, false); h.add(t); return h; };
export const bench = () => { const h = g(); h.add(box(2.0, 0.1, 0.5, '#8a5a3b', {y: 0.5}), box(2.0, 0.4, 0.08, '#8a5a3b', {y: 0.8, z: -0.24})); for (const x of [-0.85, 0.85]) h.add(box(0.08, 0.5, 0.5, '#2c3a3b', {x, y: 0.25})); return h; };
export const newsBox = (c = '#c43d32') => { const h = g(); h.add(box(0.5, 0.9, 0.45, c, {y: 0.6}), box(0.42, 0.3, 0.02, '#e9e2cf', {y: 0.85, z: 0.235, thick: 0.005, edges: false})); return h; };
export function trafficLight() {
  const h = g(); h.add(cyl(0.08, 0.1, 4, '#3a3f40', {y: 2}), box(0.4, 1.1, 0.35, '#2b3030', {y: 4.3}));
  [['#e0453a', 4.65], ['#f2c12e', 4.3], ['#4fb35a', 3.95]].forEach(([c, y], i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.12, 14), new THREE.MeshBasicMaterial({color: i === 2 ? c : new THREE.Color(c).multiplyScalar(0.35)})); m.position.set(0, y, 0.18); h.add(m); });
  return h;
}
export function flag(color = '#c43d32', seed = 1) {
  const h = g(); h.add(cyl(0.04, 0.04, 2.2, '#cfcfcf', {y: 1.1}));
  const f = box(1.0, 0.6, 0.03, color, {x: 0.5, y: 1.9, thick: 0.01}); h.add(f); return h;
}
export const barrel = (c = '#2f6db3') => { const h = g(); h.add(cyl(0.38, 0.38, 1.1, c, {y: 0.55, seg: 14})); for (const y of [0.25, 0.85]) h.add(cyl(0.395, 0.395, 0.05, '#5a5a5a', {y, seg: 14, thick: 0.005})); return h; };
export const pallet = () => { const h = g(); for (let i = 0; i < 5; i++) h.add(box(0.2, 0.05, 1.2, '#b98a52', {x: -0.48 + i * 0.24, y: 0.17, thick: 0.01})); for (const z of [-0.5, 0, 0.5]) h.add(box(1.2, 0.12, 0.12, '#9a6f40', {y: 0.06, z, thick: 0.01})); return h; };
export function beamStack(n = 4, len = 6) { const h = g(); for (let i = 0; i < n; i++) h.add(box(len, 0.3, 0.35, '#8d9199', {y: 0.2 + i * 0.32, z: (i % 2) * 0.4 - 0.2, thick: 0.02})); return h; }
export const cone = () => { const h = g(); h.add(cyl(0.02, 0.22, 0.6, '#f07a2b', {y: 0.3, seg: 12})); h.add(box(0.5, 0.05, 0.5, '#f07a2b', {y: 0.03})); return h; };
export function fence(len = 10) { const h = g(); for (let i = 0; i <= len / 2; i++) h.add(cyl(0.04, 0.04, 2, '#8a8f93', {x: -len / 2 + i * 2, y: 1})); const m = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.9), new THREE.MeshBasicMaterial({color: '#8a8f93', transparent: true, opacity: 0.35, side: THREE.DoubleSide})); m.position.y = 1; h.add(m); return h; }
export function crane(h = 40) {
  const c = g(); for (let i = 0; i < h / 2; i++) { c.add(box(1.2, 0.1, 0.1, '#f2c12e', {y: i * 2, thick: 0.01})); c.add(box(0.1, 2, 0.1, '#f2c12e', {x: 0.55, y: i * 2 + 1, thick: 0.01}), box(0.1, 2, 0.1, '#f2c12e', {x: -0.55, y: i * 2 + 1, thick: 0.01})); }
  c.add(box(22, 0.8, 0.8, '#f2c12e', {x: 7, y: h, thick: 0.02}), box(2, 1.5, 1.5, '#d9a441', {x: -3, y: h, thick: 0.02}));
  return c;
}
export function shopFront(name, color, seed = 1) {
  const s = g();
  s.add(box(7, 3, 0.3, color, {y: 1.5, thick: 0.02}));
  const win = box(4.4, 1.8, 0.05, '#9fd0e6', {x: -0.8, y: 1.5, z: 0.18, thick: 0.015}); s.add(win);
  s.add(box(1.2, 2.3, 0.08, '#6b3f37', {x: 2.4, y: 1.15, z: 0.18, thick: 0.015}));
  const awn = box(7.2, 0.2, 1.4, ['#c43d32', '#2f6db3', '#4f8a4a', '#d9a441'][seed % 4], {y: 3.1, z: 0.7, thick: 0.02}); awn.rotation.x = 0.25; s.add(awn);
  const sg = sign(name, 4.5, 0.8, {bg: '#f2e6cc', w: 640, h: 128, font: 'bold 84px Arial'}); at(sg, 0, 3.8, 0.25); s.add(sg);
  // goods in the window
  const r = rng(seed); for (let i = 0; i < 5; i++) s.add(box(0.4, 0.3 + r() * 0.5, 0.3, ['#e0533d', '#f2c12e', '#4f86b8', '#6aa84f', '#c47ac0'][i], {x: -2.6 + i * 0.9, y: 0.8 + r() * 0.2, z: 0.05, thick: 0.01}));
  return s;
}

// ---------- interior furniture ----------
export function bookshelf(seed = 1, w = 2.4, h = 2.6) {
  const s = g(); const r = rng(seed);
  s.add(box(w, h, 0.45, '#7a4f33', {y: h / 2}));
  const cols = ['#c43d32', '#2f6db3', '#4f8a4a', '#d9a441', '#7a4f73', '#e0b04a', '#3e5a7a', '#b8775e'];
  for (let shelf = 0; shelf < 4; shelf++) {
    const y = 0.25 + shelf * (h - 0.3) / 4;
    s.add(box(w - 0.1, 0.05, 0.42, '#5a3a26', {y: y - 0.03, z: 0.02, thick: 0.005, edges: false}));
    let x = -w / 2 + 0.1;
    while (x < w / 2 - 0.2) { const bw = 0.06 + r() * 0.08, bh = 0.35 + r() * 0.2; s.add(box(bw, bh, 0.3, cols[Math.floor(r() * 8)], {x: x + bw / 2, y: y + bh / 2, z: 0.07, thick: 0.004, edges: false})); x += bw + 0.01; }
  }
  return s;
}
export function filingCabinet(c = '#7d8a8f') { const s = g(); s.add(box(0.7, 1.5, 0.7, c, {y: 0.75})); for (let i = 0; i < 3; i++) s.add(box(0.3, 0.05, 0.05, '#cfcfcf', {y: 0.35 + i * 0.45, z: 0.37, thick: 0.004})); return s; }
export function papers(n = 6, seed = 1) { const s = g(); const r = rng(seed); for (let i = 0; i < n; i++) { const p = box(0.3, 0.005, 0.4, '#f7f0de', {x: (r() - 0.5) * 0.8, y: i * 0.006, z: (r() - 0.5) * 0.5, thick: 0.003, edges: false}); p.rotation.y = (r() - 0.5) * 1.2; s.add(p); } return s; }
export function deskLamp() { const s = g(); s.add(cyl(0.12, 0.14, 0.04, '#2f5d62', {y: 0.02}), cyl(0.02, 0.02, 0.5, '#2f5d62', {y: 0.27})); const sh = cyl(0.06, 0.16, 0.18, '#2f5d62', {y: 0.55, x: 0.08}); sh.rotation.z = 0.6; s.add(sh); const b = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(0.12, 0.48, 0); s.add(b); return s; }
export const mug = (c = '#e0533d') => cyl(0.05, 0.045, 0.11, c, {y: 0.055, seg: 10, thick: 0.005});
export function poster(text, w = 1.2, h = 1.6, bg = '#e6d39a') { const p = sign(text, w, h, {bg, w: 300, h: 400, font: 'bold 70px Arial'}); return p; }
export function wallClock() { const c = g(); const f = cyl(0.35, 0.35, 0.06, '#f7f0de', {seg: 24, thick: 0.02}); f.rotation.x = Math.PI / 2; c.add(f); c.add(box(0.03, 0.22, 0.02, INK, {y: 0.08, z: 0.04, edges: false, thick: 0.001}), box(0.16, 0.03, 0.02, INK, {x: 0.06, z: 0.04, edges: false, thick: 0.001})); return c; }
export function rug(w, d, c1 = '#a8433a', c2 = '#e0b04a') { const tex = paintTex(c1, {seed: 3, stains: 4, stripes: (gg, W, H) => { gg.strokeStyle = c2; gg.lineWidth = 14; gg.strokeRect(20, 20, W - 40, H - 40); gg.lineWidth = 5; gg.strokeRect(48, 48, W - 96, H - 96); }}); const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), toon('#ffffff', tex)); m.position.y = 0.07; return m; }
export function chair(c = '#5a3a26') { const s = g(); s.add(box(0.5, 0.06, 0.5, c, {y: 0.48}), box(0.5, 0.55, 0.06, c, {y: 0.78, z: -0.22})); for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) s.add(box(0.05, 0.46, 0.05, c, {x, y: 0.23, z, thick: 0.005})); return s; }
export function desk(w = 2.2, c = '#8a5a3b') { const s = g(); s.add(box(w, 0.1, 1.0, c, {y: 0.95})); s.add(box(0.6, 0.85, 0.9, new THREE.Color(c).multiplyScalar(0.85).getStyle(), {x: w / 2 - 0.35, y: 0.45})); s.add(box(0.08, 0.9, 0.9, c, {x: -w / 2 + 0.06, y: 0.45})); return s; }
export function phone() { const s = g(); s.add(box(0.3, 0.1, 0.25, '#2b2b2e', {y: 0.05}), box(0.32, 0.06, 0.08, '#2b2b2e', {y: 0.14})); return s; }
export function radio() { const s = g(); s.add(box(0.6, 0.35, 0.3, '#6b4a36', {y: 0.18})); const sp = cyl(0.1, 0.1, 0.02, '#2b2b2e', {x: -0.15, y: 0.18, z: 0.16, thick: 0.004}); sp.rotation.x = Math.PI / 2; s.add(sp); s.add(box(0.2, 0.08, 0.02, '#f2c12e', {x: 0.15, y: 0.22, z: 0.16, thick: 0.003})); return s; }
export function tvMonitor(text = 'STORM') { const s = g(); s.add(box(0.9, 0.7, 0.6, '#3a3a3f', {y: 0.35})); const sc = sign(text, 0.72, 0.52, {bg: '#7fb3cf', w: 256, h: 180, font: 'bold 54px Arial', border: false}); at(sc, 0, 0.36, 0.28); s.add(sc); return s; }
export function toolRack(seed = 1) {
  const s = g(); s.add(box(2.6, 1.6, 0.06, '#9a6f40', {y: 1.6}));
  const r = rng(seed); const cols = ['#c43d32', '#2f6db3', '#d9a441', '#5a5f66'];
  for (let i = 0; i < 9; i++) { const x = -1.1 + (i % 5) * 0.55, y = 2.0 - Math.floor(i / 5) * 0.7; s.add(box(0.08, 0.45 + r() * 0.2, 0.05, cols[i % 4], {x, y, z: 0.06, thick: 0.005})); s.add(box(0.22, 0.08, 0.06, '#8d9199', {x, y: y + 0.25, z: 0.07, thick: 0.004})); }
  return s;
}
export function ladder(h = 3) { const s = g(); s.add(box(0.06, h, 0.06, '#d9a441', {x: -0.25, y: h / 2}), box(0.06, h, 0.06, '#d9a441', {x: 0.25, y: h / 2})); for (let i = 1; i < h / 0.35; i++) s.add(box(0.5, 0.04, 0.04, '#d9a441', {y: i * 0.35, thick: 0.004})); s.rotation.x = -0.18; return s; }
export function toolbox() { const s = g(); s.add(box(0.7, 0.35, 0.35, '#c43d32', {y: 0.18}), box(0.4, 0.05, 0.05, '#2b2b2e', {y: 0.42})); return s; }
export function hardhat(c = '#f2c12e') { const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(c)); ink(m, 0.01, false); return m; }

// crowd of pedestrians along a line
export function crowd(n, x0, x1, z, seed = 1, chars = []) {
  const grp = g(); const r = rng(seed);
  const pals = Object.keys(PALETTES); const hats = ['none', 'cap', 'bowler', 'top', 'none'];
  for (let i = 0; i < n; i++) {
    const c = character({palette: pals[Math.floor(r() * pals.length)], hat: hats[Math.floor(r() * hats.length)], glasses: r() > 0.7, seed: seed * 100 + i});
    c.position.set(x0 + (x1 - x0) * (i + r() * 0.6) / n, 0.25, z + (r() - 0.5) * 1.6);
    grp.add(c); chars.push(c);
  }
  return grp;
}
export {at};
