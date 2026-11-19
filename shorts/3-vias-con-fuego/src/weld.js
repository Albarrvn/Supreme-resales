// Shared welding-story kit: harbor, shipyard, ocean, rooms, rail line, ship, crucible.
import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, facade, lampPost, crate, ground, sidewalk, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import * as P from './props.js';

export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

export function glowMat(c) { return new THREE.MeshBasicMaterial({color: c}); }

export function sparks(seed, count = 120, size = 0.35) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({color: '#ffcc55', size, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false});
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
  const r = rng(seed);
  const seeds = Array.from({length: count}, () => [r(), r(), r(), r()]);
  pts.userData.update = (t, origins, on = 1, spread = 1) => {
    mat.opacity = on; pts.visible = on > 0.01;
    for (let i = 0; i < count; i++) {
      const [a, b, c, d] = seeds[i];
      const o = origins[i % origins.length];
      const life = (t * (1.2 + a) + d) % 1;
      pos[i * 3] = o[0] + (b - 0.5) * 2.2 * life * spread;
      pos[i * 3 + 1] = o[1] + (0.5 - life * 1.5) * 1.4 * c * spread;
      pos[i * 3 + 2] = o[2] + (a - 0.3) * 1.4 * life * spread;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}

export function room(ox, {w = 14, h = 5, d = 10, wall = '#efe0c4', floor = '#a7764e', seed = 4} = {}) {
  const g = new THREE.Group();
  const wt = paintTex(wall, {seed, stains: 14}); wt.repeat.set(2, 1);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon('#ffffff', wt, {side: THREE.BackSide}));
  walls.position.set(ox, h / 2, 0); walls.receiveShadow = true; g.add(walls);
  const ft = paintTex(floor, {seed: seed + 1, stripes: (gg, W, H) => { gg.strokeStyle = 'rgba(60,30,15,0.35)'; gg.lineWidth = 2; for (let i = 0; i < 10; i++) { gg.beginPath(); gg.moveTo(0, i * H / 10); gg.lineTo(W, i * H / 10); gg.stroke(); } }});
  ft.repeat.set(3, 2);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.1, d - 0.02), toon('#ffffff', ft)); fl.position.set(ox, 0.0, 0); fl.receiveShadow = true; g.add(fl);
  g.add(box(w, 0.25, 0.15, '#6b4a36', {x: ox, y: 0.12, z: -d / 2 + 0.1, thick: 0.01}));
  for (const x of [ox - w / 4, ox + w / 4]) { g.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: h - 0.4, z: -1})); g.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y: h - 0.9, z: -1, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), glowMat('#fff1c0')); b.position.set(x, h - 1.05, -1); g.add(b); }
  return g;
}

// canvas board (chalkboard / calendar / map) with a redraw function
export function board(w, h, draw, {frame = '#5a3a26', cw = 640, ch = 360} = {}) {
  const c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const b = box(w, h, 0.12, '#ffffff', {thick: 0.02});
  b.material = [toon(frame), toon(frame), toon(frame), toon(frame), new THREE.MeshBasicMaterial({map: tex}), toon(frame)];
  let last = null;
  b.userData.redraw = (...args) => { const key = JSON.stringify(args.map((a) => (typeof a === 'number' ? Math.round(a * 40) / 40 : a))); if (key === last) return; last = key; draw(g, cw, ch, ...args); tex.needsUpdate = true; };
  b.userData.redraw(0, 0);
  return b;
}

export function water(ox, w, d, {z = 0, color = '#3f86b3', y = 0} = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), toon(color)); m.position.set(ox, y - 0.1, z); m.receiveShadow = true; g.add(m);
  const r = rng(ox + 3);
  const foam = [];
  for (let i = 0; i < 60; i++) { const f = box(1 + r() * 2.5, 0.02, 0.12, '#e6f2f7', {x: ox + (r() - 0.5) * w * 0.9, y: y + 0.02, z: z + (r() - 0.5) * d * 0.9, edges: false, thick: 0.001}); g.add(f); foam.push([f, r() * 6]); }
  g.userData.update = (t) => { for (const [f, ph] of foam) f.position.x += Math.sin(t * 0.8 + ph) * 0.004; };
  return g;
}

// ---------- ship (tanker / cargo) built in two halves for the crack ----------
function hullHalf(x0, x1, bowAt, color) {
  const s = new THREE.Shape();
  if (bowAt === 1) { s.moveTo(x0, -2); s.lineTo(x1 - 3, -2); s.lineTo(x1, 4.2); s.lineTo(x0, 4.2); }
  else if (bowAt === -1) { s.moveTo(x0 + 1.5, -2); s.lineTo(x1, -2); s.lineTo(x1, 4.2); s.lineTo(x0, 4.2); s.lineTo(x0, 1); }
  else { s.moveTo(x0, -2); s.lineTo(x1, -2); s.lineTo(x1, 4.2); s.lineTo(x0, 4.2); }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, {depth: 7, bevelEnabled: false}); geo.translate(0, 0, -3.5);
  const m = new THREE.Mesh(geo, toon(color)); m.castShadow = true; m.receiveShadow = true; ink(m, 0.06, true, 40);
  return m;
}
export function ship({len = 40, color = '#4f5d6b', deckColor = '#8a5a3b', cargo = false, lit = false, name = ''} = {}) {
  const root = new THREE.Group();
  const halves = [new THREE.Group(), new THREE.Group()]; // back (x<0), front (x>0)
  const L = len / 2;
  halves[0].add(hullHalf(-L, 0, -1, color)); halves[1].add(hullHalf(0, L, 1, color));
  for (const [hh, a, b] of [[halves[0], -L, 0], [halves[1], 0, L - 2]]) {
    hh.add(box(b - a, 0.35, 7.1, '#b03a2e', {x: (a + b) / 2, y: 0.35, thick: 0.01, edges: false}));
    hh.add(box(b - a, 0.25, 6.6, deckColor, {x: (a + b) / 2, y: 4.3, thick: 0.02}));
    for (const z of [-3.45, 3.45]) hh.add(box(b - a, 0.6, 0.08, '#d8d2c4', {x: (a + b) / 2, y: 4.7, z, thick: 0.005, edges: false}));
  }
  // portholes + hull lamps so the hull reads at night
  for (const [hh, a, b] of [[halves[0], -L + 1, -0.6], [halves[1], 0.6, L - 4]]) for (let x = a; x < b; x += 2.2) for (const z of [3.52, -3.52]) { const ph = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), glowMat(lit ? '#ffd27a' : '#bcd3e6')); ph.position.set(x, 2.6, z); if (z < 0) ph.rotation.y = Math.PI; hh.add(ph); }
  // superstructure aft
  const sup = new THREE.Group();
  sup.add(box(7, 3.4, 6, '#e8e0cf', {y: 1.7}));
  sup.add(box(5, 2.2, 5, '#e8e0cf', {y: 4.5}));
  for (let i = 0; i < 4; i++) for (const z of [3.01, -3.01]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), glowMat(lit ? '#ffd27a' : '#5f7d99')); w.position.set(-2.4 + i * 1.6, 2.2, z); if (z < 0) w.rotation.y = Math.PI; sup.add(w); }
  for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), glowMat(lit ? '#ffd27a' : '#5f7d99')); w.position.set(2.51, 4.8, -1.6 + i * 1.6); w.rotation.y = Math.PI / 2; sup.add(w); }
  const fun = cyl(0.9, 1.1, 3.2, '#2b2b2e', {x: -2, y: 7.0}); sup.add(fun); sup.add(cyl(0.95, 0.95, 0.6, '#c43d32', {x: -2, y: 7.6, thick: 0.01}));
  sup.position.set(-L + 5, 4.4, 0); halves[0].add(sup);
  // deck gear
  if (cargo) {
    for (const x of [-L + 14, -4, 6, 13]) { const hh = x < 0 ? halves[0] : halves[1]; hh.add(box(4, 0.8, 4.4, '#6e5a46', {x, y: 4.8, thick: 0.02})); }
    for (const x of [-L + 12, 10]) { const hh = x < 0 ? halves[0] : halves[1]; hh.add(cyl(0.18, 0.22, 7, '#c9b48a', {x, y: 8, thick: 0.01})); const boom = box(0.15, 0.15, 6, '#c9b48a', {x, y: 6, thick: 0.005}); boom.rotation.x = 0.9; hh.add(boom); }
  } else {
    for (const z of [-1.2, 0, 1.2]) for (const hh of halves) { const a = hh === halves[0] ? -L + 9 : 0.4, b = hh === halves[0] ? -0.4 : L - 4; const p = cyl(0.14, 0.14, b - a, '#c9b48a', {x: (a + b) / 2, y: 4.8, z, seg: 8, thick: 0.004}); p.rotation.z = Math.PI / 2; hh.add(p); }
    for (const x of [-8, 8]) { const hh = x < 0 ? halves[0] : halves[1]; hh.add(box(1.6, 1.2, 1.6, '#c43d32', {x, y: 5.0, thick: 0.01})); }
  }
  const mast = cyl(0.15, 0.18, 6, '#c9b48a', {x: L - 6, y: 7.2}); halves[1].add(mast);
  if (name) { const n = sign(name, 7, 1.1, {bg: color, fg: '#f2e6cc', w: 900, h: 140, font: 'bold 100px Arial', border: false}); n.position.set(L - 9, 3.1, 3.56); halves[1].add(n); }
  // crack glow
  const crackMat = glowMat('#ffb347');
  const crack = new THREE.Group();
  const side1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 6.4, 0.05), crackMat); side1.position.set(0, 1.1, 3.6);
  const side2 = side1.clone(); side2.position.z = -3.6;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 7.2), crackMat); deck.position.set(0, 4.45, 0);
  crack.add(side1, side2, deck); crack.scale.set(1, 0.001, 0.001);
  root.add(halves[0], halves[1], crack);
  root.userData = {halves, crack, crackMat,
    setBreak(p, crackP = p) { // p: 0..1 bend amount
      const a = 0.11 * p;
      halves[1].rotation.z = a; halves[0].rotation.z = -a;
      halves[1].position.x = 0.15 * p; halves[0].position.x = -0.15 * p;
      crack.visible = crackP > 0.01; crack.scale.set(1 + p * 0.8, Math.max(0.001, crackP), Math.max(0.001, crackP));
      root.position.y = root.userData.baseY - 0.5 * p;
    }, baseY: 0};
  return root;
}

// ---------- harbor (dock + warehouses) ----------
export function harbor(ox, {lit = false, seed = 3, chars} = {}) {
  const g = new THREE.Group();
  g.add(water(ox, 400, 260, {z: -110, color: lit ? '#1f3550' : '#3f86b3'}));
  // pier
  g.add(box(140, 1.4, 12, '#9a958c', {x: ox, y: 0.5, z: 10, thick: 0.03}));
  g.add(ground(140, 40, lit ? '#3b3a48' : '#a39a8a', {x: ox, z: 34, seed: seed + 3, repeat: 12}));
  for (let i = -12; i <= 12; i++) g.add(cyl(0.25, 0.3, 0.6, '#3a3a3f', {x: ox + i * 5, y: 1.5, z: 4.8, seg: 10}));
  // warehouses
  const cols = ['#a86f5c', '#8f6c5e', '#b8775e', '#9e7b66', '#c98f6b'];
  const r = rng(seed);
  for (let i = -5; i <= 5; i++) {
    const w = 11 + r() * 3, h = 7 + r() * 6;
    const f = facade({w, h, color: cols[(i + 10) % cols.length], cols: 3, rows: Math.max(1, Math.floor(h / 3.8)), seed: seed + i * 5, lit, interior: lit ? '#ffcf7d' : '#3b2b33'});
    f.position.set(ox + i * 13, 1.2, 22); f.rotation.y = Math.PI; g.add(f);
    g.add(box(w, h, 9, '#7d6050', {x: ox + i * 13, y: 1.2 + h / 2, z: 26.6, thick: 0.04}));
  }
  for (let i = -6; i <= 6; i++) g.add(lampPost(ox + i * 10 + 3, 15.5, 6));
  // crates, barrels, people
  const rr = rng(seed + 9);
  for (let i = 0; i < 14; i++) { const x = ox - 40 + rr() * 80, z = 12 + rr() * 6; if (Math.abs(x - ox) < 5 && z < 14) continue; g.add(rr() > 0.5 ? crate(['STEEL', 'OIL', 'CARGO', 'NAVY'][i % 4], {x, y: 1.8, z, ry: rr() - 0.5, s: 1.1}) : P.at(P.barrel(['#2f6db3', '#c43d32', '#4f8a4a', '#d9a441'][i % 4]), x, 1.2, z)); }
  g.add(P.at(P.crane(30), ox + 30, 1.2, 14));
  g.add(P.at(P.crane(26), ox - 34, 1.2, 15));
  return g;
}

// ---------- shipyard (day) ----------
export function shipyard(ox, {seed = 5, chars} = {}) {
  const g = new THREE.Group();
  g.add(ground(200, 140, '#b39a72', {x: ox, z: 20, seed: seed, repeat: 14}));
  g.add(water(ox, 260, 160, {z: -120, color: '#3f86b3'}));
  // slipway concrete
  g.add(box(52, 0.6, 14, '#a8a294', {x: ox, y: 0.3, z: -6, thick: 0.02}));
  for (let i = -5; i <= 5; i++) g.add(box(1.2, 1.2, 8, '#6e5a46', {x: ox + i * 4, y: 1.1, z: -6, thick: 0.02}));
  // scaffolding
  for (let i = -5; i <= 5; i++) for (const z of [-11, -1]) g.add(cyl(0.08, 0.08, 9, '#c9b48a', {x: ox + i * 4, y: 4.5, z, seg: 6, thick: 0.004}));
  for (const y of [3, 6]) for (const z of [-11, -1]) g.add(box(44, 0.12, 0.12, '#c9b48a', {x: ox, y, z, thick: 0.004}));
  for (const y of [3, 6]) for (const z of [-11.4, -0.6]) g.add(box(44, 0.08, 0.9, '#9a7448', {x: ox, y: y - 0.06, z, thick: 0.004}));
  g.add(P.at(P.crane(36), ox - 30, 0, -14), P.at(P.crane(40), ox + 26, 0, 4));
  // sheds + stacks
  for (let i = 0; i < 4; i++) { const f = facade({w: 14, h: 9, color: ['#a86f5c', '#8f6c5e', '#b8775e', '#9e7b66'][i], cols: 4, rows: 2, door: true, seed: seed + i}); f.position.set(ox - 30 + i * 18, 0, 30); f.rotation.y = Math.PI; g.add(f); g.add(box(14, 9, 9, '#7d6050', {x: ox - 30 + i * 18, y: 4.5, z: 34.6, thick: 0.04})); }
  const r = rng(seed + 7);
  for (let i = 0; i < 10; i++) { const x = ox - 34 + r() * 68, z = 6 + r() * 14; g.add(r() > 0.5 ? P.at(P.beamStack(3 + (i % 3), 5), x, 0.05, z, r()) : P.at(P.pallet(), x, 0.05, z)); }
  for (let i = 0; i < 6; i++) g.add(P.at(P.barrel(['#2f6db3', '#c43d32', '#d9a441'][i % 3]), ox - 20 + i * 7, 0.05, 9 + (i % 2) * 2));
  return g;
}

// big welded block hanging from a crane hook
export function block(color = '#6b7885') {
  const g = new THREE.Group();
  g.add(box(6, 3.5, 6.8, color, {y: 0, thick: 0.04}));
  for (const x of [-2, 0, 2]) g.add(box(0.12, 3.6, 6.9, '#ffb347', {x, thick: 0.002, edges: false}));
  g.add(cyl(0.05, 0.05, 14, '#2b2b2e', {y: 8.7, seg: 6, thick: 0.002}));
  g.add(box(0.8, 0.8, 0.3, '#f2c12e', {y: 2.2, thick: 0.01}));
  return g;
}

// ---------- rail line (country) ----------
export function railLine(ox, {len = 260, seed = 7, jointed = false} = {}) {
  const g = new THREE.Group();
  g.add(ground(len, 140, '#7fa35a', {x: ox, z: -20, seed, repeat: 16}));
  g.add(box(len, 0.3, 4.2, '#8f8679', {x: ox, y: 0.15, z: 0, thick: 0.01}));
  for (let i = -len / 2; i < len / 2; i += 0.9) g.add(box(0.28, 0.18, 3.0, '#6b4a36', {x: ox + i, y: 0.38, thick: 0.004, edges: false}));
  for (const z of [-0.75, 0.75]) {
    g.add(box(len, 0.16, 0.14, '#8d9199', {x: ox, y: 0.55, z, thick: 0.006}));
    g.add(box(len, 0.05, 0.3, '#7a7e86', {x: ox, y: 0.49, z, thick: 0.004, edges: false}));
  }
  const joints = [];
  if (jointed) for (let i = -60; i <= 60; i += 12) for (const z of [-0.75, 0.75]) {
    const j = new THREE.Group();
    j.add(box(0.9, 0.14, 0.04, '#5a5f66', {y: 0.55, z: 0.1, thick: 0.004}), box(0.9, 0.14, 0.04, '#5a5f66', {y: 0.55, z: -0.1, thick: 0.004}));
    const bolts = [];
    for (const dx of [-0.3, -0.1, 0.1, 0.3]) { const b = cyl(0.035, 0.035, 0.3, '#3a3a3f', {x: dx, y: 0.55, seg: 6, thick: 0.002}); b.rotation.x = Math.PI / 2; j.add(b); bolts.push(b); }
    j.add(box(0.03, 0.17, 0.15, '#2b2b2e', {y: 0.55, thick: 0.001, edges: false}));
    j.position.set(ox + i, 0, z); j.userData.bolts = bolts; g.add(j); joints.push(j);
  }
  // scenery
  const r = rng(seed + 1);
  for (let i = 0; i < 30; i++) g.add(P.at(P.tree(1 + r() * 0.8, seed * 10 + i), ox - len / 2 + r() * len, 0.05, (r() > 0.5 ? -1 : 1) * (8 + r() * 26)));
  for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(18 + r() * 14, 24 + r() * 20, 6), toon(['#6f8fa8', '#7d9ab0', '#8aa5b8'][i % 3])); m.position.set(ox - 120 + i * 30, 10, -95 - r() * 20); ink(m, 0.2, false); g.add(m); }
  for (let i = -10; i <= 10; i++) g.add(cyl(0.08, 0.08, 4.5, '#6b4a36', {x: ox + i * 12, y: 2.25, z: -4.5, seg: 6, thick: 0.004}));
  g.add(box(len, 0.03, 0.03, '#2b2b2e', {x: ox, y: 4.2, z: -4.5, thick: 0.001, edges: false}));
  const sig = new THREE.Group(); sig.add(cyl(0.1, 0.1, 4, '#3a3a3f', {y: 2})); sig.add(box(0.5, 1.2, 0.4, '#2b2b2e', {y: 4.2})); const l1 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), glowMat('#ff5a3c')); l1.position.set(0, 4.5, 0.21); sig.add(l1); const l2 = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), glowMat('#55e07a')); l2.position.set(0, 4.0, 0.21); sig.add(l2); sig.position.set(ox + 14, 0, 3); g.add(sig);
  g.userData.joints = joints;
  return g;
}

export function train({color = '#2f5d9e', cars = 4, modern = false} = {}) {
  const g = new THREE.Group();
  const loco = new THREE.Group();
  if (modern) { loco.add(box(16, 3.0, 2.9, '#e8e0cf', {y: 2.5})); const nose = box(3, 2.4, 2.8, color, {x: 9, y: 2.2}); loco.add(nose); loco.add(box(16, 0.5, 2.95, color, {y: 1.5, thick: 0.01})); }
  else { loco.add(box(12, 2.6, 2.8, color, {y: 2.3})); loco.add(box(4, 1.6, 2.6, '#2b2b2e', {x: -3, y: 4.3})); loco.add(cyl(0.4, 0.5, 1.4, '#2b2b2e', {x: 4, y: 4.2})); }
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), glowMat('#cfe8f5')); w.position.set(-4 + i * 2.4, 2.9, 1.42 + (modern ? 0.04 : 0)); loco.add(w); }
  for (let i = 0; i < 4; i++) { const wh = cyl(0.45, 0.45, 0.2, '#2b2b2e', {x: -4 + i * 2.6, y: 0.95, z: 1.3, seg: 12}); wh.rotation.x = Math.PI / 2; loco.add(wh); }
  g.add(loco);
  for (let c = 1; c <= cars; c++) { const car = new THREE.Group(); car.add(box(modern ? 16 : 11, 2.6, 2.8, modern ? '#e8e0cf' : ['#c43d32', '#4f8a4a', '#d9a441', '#7a4f73'][c % 4], {y: 2.3})); if (modern) car.add(box(16, 0.5, 2.95, color, {y: 1.5, thick: 0.01})); for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), glowMat('#cfe8f5')); w.position.set(-5 + i * 2.5, 2.9, 1.42 + (modern ? 0.04 : 0)); car.add(w); } car.position.x = -c * (modern ? 16.6 : 11.6); g.add(car); }
  return g;
}

// crucible on a tripod + mold around the rail joint + molten stream
export function thermitRig() {
  const g = new THREE.Group();
  const mold = new THREE.Group();
  mold.add(box(0.7, 0.55, 0.45, '#c9b48a', {y: 0.6, thick: 0.01}));
  mold.add(box(0.75, 0.08, 0.5, '#9a8a6a', {y: 0.9, thick: 0.005}));
  g.add(mold); g.userData.mold = mold;
  const tri = new THREE.Group();
  for (const [x, z] of [[-0.8, -0.6], [0.8, -0.6], [0, 0.9]]) { const l = cyl(0.04, 0.04, 2.8, '#3a3a3f', {seg: 6, thick: 0.003}); l.position.set(x / 2, 1.3, z / 2); l.rotation.z = -x * 0.35; l.rotation.x = z * 0.35; tri.add(l); }
  const cru = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.2, 0.8, 16), toon('#5a5f66')); cru.position.y = 2.45; ink(cru, 0.02, true); tri.add(cru);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.08, 16), toon('#3a3a3f')); lid.position.y = 2.88; tri.add(lid);
  g.add(tri); g.userData.crucible = cru;
  const hotMat = glowMat('#ffd27a');
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.2, 10), hotMat); stream.position.y = 1.5; g.add(stream); g.userData.stream = stream;
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), new THREE.MeshBasicMaterial({color: '#ffcf5a', transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false}));
  glow.position.y = 2.45; g.add(glow); g.userData.glow = glow;
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.2), hotMat); seam.position.y = 0.55; g.add(seam); g.userData.seam = seam;
  return g;
}

export function jar(label, color, liquid = '#c9c9c9') {
  const g = new THREE.Group();
  const j = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 14), new THREE.MeshBasicMaterial({color: '#d8ecf2', transparent: true, opacity: 0.45})); j.position.y = 0.28; g.add(j);
  g.add(cyl(0.2, 0.2, 0.35, liquid, {y: 0.19, thick: 0.004}));
  g.add(cyl(0.24, 0.24, 0.08, color, {y: 0.6, thick: 0.004}));
  const s = sign(label, 0.42, 0.2, {bg: '#f7f0de', w: 300, h: 140, font: 'bold 64px Arial', border: false}); s.position.set(0, 0.3, 0.23); g.add(s);
  return g;
}

export function cookie() {
  const halves = [];
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 16, 1, false, s > 0 ? 0 : Math.PI, Math.PI), toon('#c99355')); ink(h, 0.01, true); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), toon('#4a2a1a')); c.position.set(s * (0.05 + i * 0.05), 0.03, (i - 1) * 0.07); h.add(c); } g.add(h); halves.push(h); }
  g.userData.halves = halves; return g;
}

export function charpy() {
  const g = new THREE.Group();
  g.add(box(1.6, 0.3, 0.8, '#3e5a7a', {y: 0.15}));
  for (const x of [-0.6, 0.6]) g.add(box(0.15, 2.4, 0.15, '#3e5a7a', {x, y: 1.5}));
  g.add(box(1.4, 0.15, 0.2, '#3e5a7a', {y: 2.7}));
  const arm = new THREE.Group(); const rod = box(0.06, 1.9, 0.06, '#8d9199', {y: -0.95, thick: 0.004}); const ham = box(0.35, 0.3, 0.25, '#c43d32', {y: -1.95}); arm.add(rod, ham); arm.position.y = 2.65; g.add(arm);
  const sample = box(0.5, 0.1, 0.1, '#9aa0a8', {y: 0.55, thick: 0.004}); g.add(sample);
  const ice = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.4), new THREE.MeshBasicMaterial({color: '#bfe6f5', transparent: true, opacity: 0.7})); ice.position.set(0, 0.45, 0); g.add(ice);
  g.userData.arm = arm; g.userData.sample = sample;
  return g;
}

export function addChar(W, chars, opts, x, y, z, ry = 0) { const c = character(opts); c.position.set(x, y, z); c.rotation.y = ry; W.add(c); chars.push(c); return c; }
export {P, character, sign, box, cyl, crate, cloud, ground, facade, lampPost, toon, ink, rng, INK};
