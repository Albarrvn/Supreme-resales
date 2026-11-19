import * as THREE from 'three';

export const INK = '#351f22';
const INK_C = new THREE.Color(INK);

// ---------- seeded random ----------
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 3-band toon gradient ----------
let _grad = null;
export function toonGradient() {
  if (_grad) return _grad;
  const data = new Uint8Array([150, 150, 150, 255, 200, 200, 200, 255, 236, 236, 236, 255, 255, 255, 255, 255]);
  _grad = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  _grad.minFilter = THREE.NearestFilter;
  _grad.magFilter = THREE.NearestFilter;
  _grad.needsUpdate = true;
  return _grad;
}

const _matCache = new Map();
export function toon(color, map = null, extra = {}) {
  const key = map ? null : color + JSON.stringify(extra);
  if (key && _matCache.has(key)) return _matCache.get(key);
  const m = new THREE.MeshToonMaterial({color, gradientMap: toonGradient(), map, ...extra});
  if (key) _matCache.set(key, m);
  return m;
}

// ---------- painted flat texture with wear ----------
export function paintTex(base, {w = 256, h = 256, seed = 1, stains = 10, chips = 14, scratches = 10, stripes = null} = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  if (stripes) stripes(g, w, h, r);
  const col = new THREE.Color(base);
  const dark = col.clone().multiplyScalar(0.82).getStyle();
  const light = col.clone().lerp(new THREE.Color('#fff8ea'), 0.25).getStyle();
  for (let i = 0; i < stains; i++) {
    g.globalAlpha = 0.10 + r() * 0.12; g.fillStyle = dark;
    g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 30, 4 + r() * 18, r() * 3, 0, 7); g.fill();
  }
  for (let i = 0; i < chips; i++) {
    g.globalAlpha = 0.35; g.fillStyle = light;
    g.beginPath(); const x = r() * w, y = r() * h;
    g.moveTo(x, y); g.lineTo(x + 3 + r() * 6, y + r() * 4); g.lineTo(x + r() * 4, y + 3 + r() * 6); g.fill();
  }
  g.strokeStyle = dark; g.lineWidth = 1;
  for (let i = 0; i < scratches; i++) {
    g.globalAlpha = 0.25; g.beginPath(); const x = r() * w, y = r() * h;
    g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 12); g.stroke();
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

// ---------- ink outline: inverted hull + edge lines ----------
const hullMat = new THREE.ShaderMaterial({
  uniforms: {thick: {value: 0.035}, color: {value: INK_C}},
  vertexShader: `uniform float thick; void main(){ vec3 p = position + normal * thick; gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
  fragmentShader: `uniform vec3 color; void main(){ gl_FragColor = vec4(color,1.0); }`,
  side: THREE.BackSide,
});
const hullCache = new Map();
function hullFor(thick) {
  if (!hullCache.has(thick)) { const m = hullMat.clone(); m.uniforms.thick.value = thick; m.uniforms.color.value = INK_C; hullCache.set(thick, m); }
  return hullCache.get(thick);
}
const edgeMat = new THREE.LineBasicMaterial({color: INK});
export function ink(mesh, thick = 0.035, edges = true, angle = 30) {
  const h = new THREE.Mesh(mesh.geometry, hullFor(thick));
  h.raycast = () => {};
  mesh.add(h);
  if (edges) {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, angle), edgeMat);
    mesh.add(e);
  }
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

export function box(w, h, d, color, {map = null, x = 0, y = 0, z = 0, thick = 0.035, edges = true, ry = 0} = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), map ? toon('#ffffff', map) : toon(color));
  m.position.set(x, y, z); m.rotation.y = ry;
  return ink(m, thick, edges);
}
export function cyl(rt, rb, h, color, {x = 0, y = 0, z = 0, seg = 16, thick = 0.03} = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), toon(color));
  m.position.set(x, y, z);
  return ink(m, thick, true, 50);
}

// ---------- painted sign (label inside the world) ----------
export function signTex(text, {bg = '#f2e6cc', fg = INK, w = 512, h = 192, font = 'bold 96px Arial, Helvetica, sans-serif', border = true, sub = null} = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const r = rng(text.length * 31 + w);
  g.globalAlpha = 0.12; g.fillStyle = '#000';
  for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 40, 5 + r() * 15, 0, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  if (border) { g.strokeStyle = fg; g.lineWidth = Math.max(6, h * 0.05); g.strokeRect(10, 10, w - 20, h - 20); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font;
  // shrink to fit inside the border
  let fs = parseInt(font.match(/(\d+)px/)?.[1] || '96', 10);
  while (fs > 10 && g.measureText(text).width > w * 0.86) { fs -= 4; g.font = font.replace(/\d+px/, fs + 'px'); }
  g.fillText(text, w / 2, sub ? h * 0.42 : h / 2);
  if (sub) { let ss = Math.round(h * 0.16); g.font = `bold ${ss}px Arial, sans-serif`; while (ss > 8 && g.measureText(sub).width > w * 0.84) { ss -= 2; g.font = `bold ${ss}px Arial, sans-serif`; } g.fillText(sub, w / 2, h * 0.76); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
export function sign(text, w, h, opts = {}) {
  const tex = signTex(text, opts);
  const grp = new THREE.Group();
  const board = box(w, h, 0.08, '#ffffff', {map: tex, thick: 0.02});
  // only the front face carries the text; others plain
  const plain = toon(opts.bg || '#f2e6cc');
  board.material = [plain, plain, plain, plain, toon('#ffffff', tex), plain];
  grp.add(board);
  grp.userData.board = board;
  return grp;
}

// ---------- extruded facade with window reveals ----------
export function facade({w = 10, h = 8, d = 0.5, color = '#c98f6b', cols = 3, rows = 2, winW = 1.2, winH = 1.6, door = true, seed = 3, interior = '#3b2b33', lit = false}) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  // door as a notch in the outline (not a hole touching the bottom)
  const dw = 1.4, dh = 2.4, dx = 0;
  if (door) {
    shape.moveTo(-w / 2, 0); shape.lineTo(dx - dw / 2, 0); shape.lineTo(dx - dw / 2, dh); shape.lineTo(dx + dw / 2, dh);
    shape.lineTo(dx + dw / 2, 0); shape.lineTo(w / 2, 0);
  } else { shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); }
  shape.lineTo(w / 2, h); shape.lineTo(-w / 2, h); shape.closePath();
  const wins = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = -w / 2 + (c + 0.5) * (w / cols);
    const y = (r === 0 ? 3.4 : 3.4 + r * (h - 3.6) / rows) + 0.2;
    if (door && r === 0 && Math.abs(x - dx) < dw) continue;
    if (y + winH > h - 0.4) continue;
    const hole = new THREE.Path();
    hole.moveTo(x - winW / 2, y); hole.lineTo(x + winW / 2, y); hole.lineTo(x + winW / 2, y + winH); hole.lineTo(x - winW / 2, y + winH); hole.closePath();
    shape.holes.push(hole); wins.push([x, y]);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {depth: d, bevelEnabled: false});
  const tex = paintTex(color, {seed, w: 256, h: 256});
  tex.repeat.set(0.12, 0.12);
  const wall = new THREE.Mesh(geo, toon('#ffffff', tex));
  ink(wall, 0.03, true, 20);
  g.add(wall);
  // interior backdrop
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, h - 0.2), new THREE.MeshBasicMaterial({color: lit ? '#ffd58a' : interior}));
  back.position.set(0, h / 2, -0.6); g.add(back);
  g.userData.interior = back;
  // sills + cornice
  for (const [x, y] of wins) g.add(box(winW + 0.3, 0.15, 0.35, '#e9dcc3', {x, y: y - 0.05, z: d + 0.1, thick: 0.015}));
  g.add(box(w + 0.6, 0.45, 0.9, '#8c5a4a', {y: h + 0.1, z: d / 2, thick: 0.03}));
  if (door) {
    const panel = box(dw - 0.1, dh - 0.05, 0.1, '#6b3f37', {y: dh / 2, z: 0.15, thick: 0.02});
    g.add(panel);
    g.add(box(dw + 0.8, 0.12, 1.0, '#2f5d62', {y: dh + 0.5, z: d + 0.4, thick: 0.02})); // awning
  }
  return g;
}

// ---------- vertical ribbon-window texture for the tower ----------
export function ribbonTex({lit = false, seed = 7} = {}) {
  const w = 256, h = 1024;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const r = rng(seed);
  g.fillStyle = '#d9d4c7'; g.fillRect(0, 0, w, h);
  const bands = 59;
  const bh = h / bands;
  for (let i = 0; i < bands; i++) {
    const y = i * bh;
    if (lit) {
      for (let x = 0; x < w; x += 16) {
        const on = r() > 0.25;
        g.fillStyle = on ? (r() > 0.5 ? '#ffd27a' : '#ffbf5e') : '#36304a';
        g.fillRect(x + 1, y + bh * 0.42, 14, bh * 0.5);
      }
    } else {
      g.fillStyle = '#5f7f97'; g.fillRect(0, y + bh * 0.42, w, bh * 0.5);
      g.fillStyle = '#9fc0d4'; g.globalAlpha = 0.5; g.fillRect(0, y + bh * 0.45, w, bh * 0.12); g.globalAlpha = 1;
    }
    g.fillStyle = '#b9b2a3'; g.fillRect(0, y + bh * 0.4, w, 1);
  }
  g.globalAlpha = 0.05; g.fillStyle = '#000';
  for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 6, 4 + r() * 14, 0, 0, 7); g.fill(); }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// ---------- the tower: square shaft on four stilts + center column, sloped crown ----------
export function tower({lit = false} = {}) {
  const g = new THREE.Group();
  const W = 22, H = 86, base = 14;
  const tex = ribbonTex({lit});
  const plain = toon('#d9d4c7');
  const side = lit ? new THREE.MeshToonMaterial({map: tex, gradientMap: toonGradient(), emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.55}) : toon('#ffffff', tex);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(W, H, W), [side, side, plain, plain, side, side]);
  shaft.position.y = base + H / 2; ink(shaft, 0.12, true);
  g.add(shaft); g.userData.shaft = shaft; g.userData.sideMat = side;
  // sloped crown (45 degrees, facing south = +z)
  const crownShape = new THREE.Shape();
  crownShape.moveTo(-W / 2, 0); crownShape.lineTo(W / 2, 0); crownShape.lineTo(-W / 2, W * 0.9); crownShape.closePath();
  const crown = new THREE.Mesh(new THREE.ExtrudeGeometry(crownShape, {depth: W, bevelEnabled: false}), toon('#c9c3b5'));
  crown.position.set(0, base + H, -W / 2); // slope faces +x
  ink(crown, 0.12, true); g.add(crown);
  // stilts: centered on each side + center column
  const stiltC = '#cfc8b8';
  for (const [x, z] of [[0, W / 2 - 1.6], [0, -W / 2 + 1.6], [W / 2 - 1.6, 0], [-W / 2 + 1.6, 0]]) g.add(box(3.2, base, 3.2, stiltC, {x, y: base / 2, z, thick: 0.08}));
  g.add(box(6, base, 6, '#bdb5a3', {y: base / 2, thick: 0.08}));
  // underside slab
  g.add(box(W + 0.4, 1.2, W + 0.4, '#a9a293', {y: base + 0.2, thick: 0.08}));
  return g;
}

// ---------- props ----------
export function lampPost(x, z, h = 5) {
  const g = new THREE.Group();
  g.add(cyl(0.09, 0.12, h, '#2c3a3b', {y: h / 2}));
  g.add(box(0.6, 0.12, 0.12, '#2c3a3b', {x: 0.25, y: h - 0.1}));
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'}));
  bulb.position.set(0.5, h - 0.3, 0); g.add(bulb);
  g.position.set(x, 0, z);
  return g;
}
export function crate(label, {x = 0, y = 0.6, z = 0, ry = 0, color = '#b98a52', s = 1.2, stamp = null} = {}) {
  const g = new THREE.Group();
  const tex = signTex(label, {bg: color, w: 256, h: 256, font: 'bold 64px Arial, sans-serif', border: true});
  if (stamp) {
    const cv = tex.image; const ctx = cv.getContext('2d');
    ctx.save(); ctx.translate(128, 128); ctx.rotate(-0.35); ctx.strokeStyle = '#b3261e'; ctx.lineWidth = 10;
    ctx.strokeRect(-110, -30, 220, 60); ctx.fillStyle = '#b3261e'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(stamp, 0, 2); ctx.restore(); tex.needsUpdate = true;
  }
  const plainTex = paintTex(color, {seed: label.length + 5, stripes: (gg, w, h) => { gg.strokeStyle = 'rgba(60,30,20,0.35)'; gg.lineWidth = 3; for (let i = 1; i < 5; i++) { gg.beginPath(); gg.moveTo(0, i * h / 5); gg.lineTo(w, i * h / 5); gg.stroke(); } }});
  const fm = toon('#ffffff', tex), pm = toon('#ffffff', plainTex);
  const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), [pm, pm, pm, pm, fm, pm]);
  ink(m, 0.025, true);
  g.add(m); g.position.set(x, y, z); g.rotation.y = ry;
  return g;
}
export function ground(w, d, color, {x = 0, z = 0, seed = 9, repeat = 6} = {}) {
  const tex = paintTex(color, {seed, stains: 30, chips: 30, scratches: 30});
  tex.repeat.set(repeat, repeat * d / w);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), toon('#ffffff', tex));
  m.position.set(x, -0.2, z); m.receiveShadow = true;
  return m;
}
export function sidewalk(len, {x = 0, z = 0, w = 4} = {}) {
  const tex = paintTex('#bdb3a2', {seed: 21, stripes: (g, W, H) => { g.strokeStyle = 'rgba(70,50,40,0.4)'; g.lineWidth = 2; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * W / 12, 0); g.lineTo(i * W / 12, H); g.stroke(); } }});
  tex.repeat.set(len / 8, 1);
  const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.25, w), toon('#ffffff', tex));
  m.position.set(x, 0.12, z); ink(m, 0.02, true);
  return m;
}
export function arrow(color = '#e0533d', len = 3) {
  const sh = 0.09 * len, hh = 0.22 * len, hl = 0.34 * len;
  const s = new THREE.Shape();
  s.moveTo(0, -sh); s.lineTo(len - hl, -sh); s.lineTo(len - hl, -hh); s.lineTo(len, 0); s.lineTo(len - hl, hh); s.lineTo(len - hl, sh); s.lineTo(0, sh); s.closePath();
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, {depth: 0.05 * len, bevelEnabled: false}), toon(color));
  return ink(m, 0.008 * len, true);
}
export function cloud(x, y, z, s = 1, color = '#e9e4dc') {
  const g = new THREE.Group(); const r = rng(Math.floor(x * 7 + y * 3));
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s * (1 + r() * 0.8), 14, 10), toon(color));
    m.position.set((i - 2) * s * 1.3, r() * s * 0.6, r() * s * 0.5);
    ink(m, 0.05 * s, false); g.add(m);
  }
  g.position.set(x, y, z);
  return g;
}
