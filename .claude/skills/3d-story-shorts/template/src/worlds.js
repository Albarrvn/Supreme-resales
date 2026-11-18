import * as THREE from 'three';
import {INK, rng, toon, box, cyl, sign, signTex, facade, tower, lampPost, crate, ground, sidewalk, arrow, cloud, paintTex, ink} from './kit.js';
import {character} from './char.js';
import {wordT} from './camera.js';
import {dressStreet, dressPlaza, dressOffice, dressYard, dressJoint, dressWeather} from './dress.js';

export const LOC = {night: 0, day: 300, office: 600, yard: 700, joint: 800, weather: 900};

// smooth 0..1 between a and b (seconds)
export const ease = (t, a, b) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

function street(ox, {lit = false, seed = 1} = {}) {
  const g = new THREE.Group();
  g.add(ground(260, 200, lit ? '#3b3a48' : '#9c958a', {x: ox, z: -30, seed: seed + 2, repeat: 20}));
  // road stripe
  const road = new THREE.Mesh(new THREE.BoxGeometry(260, 0.05, 9), toon(lit ? '#34303e' : '#6e6670'));
  road.position.set(ox, 0.03, 12); g.add(road);
  for (let i = 0; i < 8; i++) g.add(box(0.7, 0.06, 7.6, '#efe7d2', {x: ox - 15.5 + (i % 4) * 1.1 + (i < 4 ? 0 : 31), y: 0.07, z: 12, edges: false, thick: 0.001}));
  for (let i = -12; i < 12; i++) g.add(box(3, 0.06, 0.35, '#e8d28a', {x: ox + i * 10, y: 0.08, z: 12, edges: false, thick: 0.001}));
  g.add(sidewalk(260, {x: ox, z: 5.5, w: 4}));
  g.add(sidewalk(260, {x: ox, z: 18.5, w: 4}));
  // low buildings along the street (both sides of the plaza)
  const cols = ['#c98f6b', '#b8775e', '#d1a47a', '#a86f5c', '#c4a27c', '#9e7b66'];
  const r = rng(seed);
  for (let i = 0; i < 7; i++) {
    for (const side of [-1, 1]) {
      const w = 9 + r() * 3, h = 9 + r() * 10;
      const f = facade({w, h, color: cols[(i + (side > 0 ? 2 : 0)) % cols.length], cols: 3, rows: Math.floor(h / 3.6), seed: seed + i * 7 + side, lit, interior: lit ? '#ffcf7d' : '#3b2b33'});
      f.position.set(ox + side * (18 + i * 12.5), 0, 3);
      g.add(f);
      // side wall + roof to give depth
      g.add(box(w, h, 8, '#8f6c5e', {x: ox + side * (18 + i * 12.5), y: h / 2, z: -1.4, thick: 0.04}));
    }
  }
  // far side of the street
  for (let i = -6; i < 7; i++) {
    const w = 10 + r() * 3, h = 8 + r() * 9;
    const f = facade({w, h, color: cols[(i + 9) % cols.length], cols: 3, rows: Math.floor(h / 3.6), seed: seed + 100 + i, lit, interior: lit ? '#ffcf7d' : '#3b2b33'});
    f.position.set(ox + i * 13, 0, 22); f.rotation.y = Math.PI; g.add(f);
    g.add(box(w, h, 8, '#8f6c5e', {x: ox + i * 13, y: h / 2, z: 26.4, thick: 0.04}));
  }
  // lamp posts
  for (let i = -5; i <= 5; i++) g.add(lampPost(ox + i * 11 + 4, 6.8, 5.5));
  // distant skyline blocks behind the tower
  for (let i = 0; i < 14; i++) {
    const h = 25 + r() * 45, w = 10 + r() * 10;
    g.add(box(w, h, 10, lit ? '#3a3658' : '#b9c3c9', {x: ox - 90 + i * 14 + r() * 4, y: h / 2, z: -80 - r() * 30, thick: 0.08}));
  }
  return g;
}

function sparks(seed, count = 120) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({color: '#ffcc55', size: 1.1, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false});
  const pts = new THREE.Points(geo, mat);
  const r = rng(seed);
  const seeds = Array.from({length: count}, () => [r(), r(), r(), r()]);
  pts.userData.update = (t, origins, on = 1) => {
    mat.opacity = on;
    for (let i = 0; i < count; i++) {
      const [a, b, c, d] = seeds[i];
      const o = origins[i % origins.length];
      const life = (t * (1.2 + a) + d) % 1;
      pos[i * 3] = o[0] + (b - 0.5) * 3 * life;
      pos[i * 3 + 1] = o[1] + (0.6 - life * 1.6) * 1.8 * c;
      pos[i * 3 + 2] = o[2] + life * 1.5 * a;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return pts;
}

function room(ox, {w = 14, h = 5, d = 10, wall = '#efe0c4', floor = '#a7764e', seed = 4} = {}) {
  const g = new THREE.Group();
  const wt = paintTex(wall, {seed, stains: 14}); wt.repeat.set(2, 1);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon('#ffffff', wt, {side: THREE.BackSide}));
  walls.position.set(ox, h / 2, 0); walls.receiveShadow = true; g.add(walls);
  const ft = paintTex(floor, {seed: seed + 1, stripes: (gg, W, H) => { gg.strokeStyle = 'rgba(60,30,15,0.35)'; gg.lineWidth = 2; for (let i = 0; i < 10; i++) { gg.beginPath(); gg.moveTo(0, i * H / 10); gg.lineTo(W, i * H / 10); gg.stroke(); } }});
  ft.repeat.set(3, 2);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.02, 0.1, d - 0.02), toon('#ffffff', ft)); fl.position.set(ox, 0.0, 0); fl.receiveShadow = true; g.add(fl);
  // skirting + ceiling beam for depth
  g.add(box(w, 0.25, 0.15, '#6b4a36', {x: ox, y: 0.12, z: -d / 2 + 0.1, thick: 0.01}));
  return g;
}

export function buildWorld() {
  const W = new THREE.Group();
  const up = []; // per-frame updaters (t, cam)
  const chars = [];

  // ======== NIGHT CITY ========
  W.add(street(LOC.night, {lit: true, seed: 11}));
  const towerN = tower({lit: true}); towerN.position.set(LOC.night, 0, -40); W.add(towerN);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(6, 32), new THREE.MeshBasicMaterial({color: '#f6ecc8', fog: false}));
  moon.position.set(LOC.night - 60, 120, -150); W.add(moon);
  const trafficN = dressStreet(W, LOC.night, {lit: true, seed: 11, chars, avoid: [LOC.night - 3]});
  const welder1 = character({palette: 'welder', hat: 'cap', seed: 31}); welder1.position.set(LOC.night - 3, 0.25, 6.2); W.add(welder1); chars.push(welder1);
  const spN = sparks(5, 160); W.add(spN);
  // spark origins on the front face of the tower (z = -40 + 11)
  const sparkOrigins = [[LOC.night - 5, 62, -28.6], [LOC.night + 6, 48, -28.6], [LOC.night - 2, 36, -28.6], [LOC.night + 4, 74, -28.6], [LOC.night + 11.2, 55, -36]];
  for (let i = 0; i < 6; i++) { const c = cloud(LOC.night - 70 + i * 30, 95 + (i % 2) * 12, -120, 6, '#3d3f6b'); W.add(c); }

  // ======== DAY CITY ========
  W.add(street(LOC.day, {seed: 23}));
  const towerD = tower(); towerD.position.set(LOC.day, 0, -40); W.add(towerD);
  const trafficD = dressStreet(W, LOC.day, {seed: 23, chars, avoid: [LOC.day - 35, LOC.day + 20.5, LOC.day + 18.3]});
  dressPlaza(W, LOC.day, chars);
  // plaza + NOW OPEN banner on two poles
  W.add(ground(40, 30, '#d8cdb8', {x: LOC.day, z: -22, seed: 5, repeat: 5}));
  const banner = sign('NOW OPEN', 9, 2.4, {bg: '#c43d32', fg: '#fff4dc', font: 'bold 120px Arial, sans-serif', w: 768, h: 200});
  banner.position.set(LOC.day, 6.2, -6); W.add(banner);
  W.add(cyl(0.12, 0.14, 7.4, '#3a3a3a', {x: LOC.day - 4.7, y: 3.7, z: -6}), cyl(0.12, 0.14, 7.4, '#3a3a3a', {x: LOC.day + 4.7, y: 3.7, z: -6}));
  for (let i = 0; i < 7; i++) W.add(cloud(LOC.day - 80 + i * 28, 100 + (i % 3) * 10, -130, 7));
  // CTA billboard by the street (in-world label)
  const bill = sign('LIKE  +  SUBSCRIBE', 7.5, 2.6, {bg: '#f2e6cc', w: 900, h: 300, font: 'bold 104px Arial, sans-serif'});
  bill.position.set(LOC.day - 35.5, 4.2, 4.2); W.add(bill);
  W.add(cyl(0.1, 0.1, 3, '#3a3a3a', {x: LOC.day - 38.5, y: 1.5, z: 4.2}), cyl(0.1, 0.1, 3, '#3a3a3a', {x: LOC.day - 32.5, y: 1.5, z: 4.2}));
  const host = character({palette: 'clerk', hat: 'bowler', seed: 41}); host.position.set(LOC.day - 35.0, 0.25, 6.4); W.add(host); chars.push(host);
  // storm: rain + dark clouds (only during the storm shot)
  const rainGeo = new THREE.BufferGeometry(); const RN = 900; const rp = new Float32Array(RN * 6); rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({color: '#d7e3ef', transparent: true, opacity: 0.55}));
  const rr = rng(77); const rs = Array.from({length: RN}, () => [rr(), rr(), rr()]);
  W.add(rain);
  const stormClouds = new THREE.Group(); for (let i = 0; i < 9; i++) stormClouds.add(cloud(LOC.day - 70 + i * 18, 60 + (i % 3) * 10, -70 + (i % 2) * 10, 8, '#59606e')); W.add(stormClouds);
  // newsstand for the closing shot (morning)
  const stand = new THREE.Group();
  stand.add(box(4, 2.4, 1.6, '#2f5d62', {y: 1.2}));
  stand.add(box(4.6, 0.2, 2.2, '#c43d32', {y: 2.5}));
  const mag = sign('1995', 1.3, 1.7, {bg: '#f4ead4', w: 260, h: 340, font: 'bold 92px Arial, sans-serif', sub: 'THE SECRET FIX'});
  mag.position.set(-0.8, 1.4, 0.86); stand.add(mag);
  const mag2 = sign('NEWS', 1.1, 1.5, {bg: '#e6d39a', w: 220, h: 300, font: 'bold 70px Arial, sans-serif'}); mag2.position.set(0.9, 1.3, 0.86); stand.add(mag2);
  stand.position.set(LOC.day + 20.5, 0.25, 5.8); W.add(stand);
  const reader = character({palette: 'official', hat: 'none', glasses: true, seed: 51}); reader.position.set(LOC.day + 18.3, 0.25, 7.2); W.add(reader); chars.push(reader);

  // ======== OFFICE (rules + student) ========
  const O = LOC.office;
  W.add(room(O, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', seed: 8}));
  const desk = new THREE.Group();
  desk.add(box(4.2, 0.18, 2, '#8a5a3b', {y: 1.05}));
  for (const [x, z] of [[-1.9, -0.8], [1.9, -0.8], [-1.9, 0.8], [1.9, 0.8]]) desk.add(box(0.15, 1.0, 0.15, '#6b4430', {x, y: 0.5, z}));
  desk.position.set(O - 2.5, 0, 0.5); W.add(desk);
  // open rule book: page drawing shows a square with arrows at its flat sides
  const bookTex = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 320; const g = c.getContext('2d');
    g.fillStyle = '#f7f0de'; g.fillRect(0, 0, 512, 320); g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 320); g.stroke();
    g.fillStyle = INK; g.font = 'bold 34px Arial, sans-serif'; g.textAlign = 'center'; g.fillText('BUILDING', 128, 52); g.fillText('CODE', 128, 92);
    g.font = 'bold 24px Arial'; g.fillText('WIND: FLAT SIDES', 384, 44);
    g.strokeRect(344, 120, 80, 80); g.fillStyle = '#e0533d';
    const ar = (x, y, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(-30, -7); g.lineTo(10, -7); g.lineTo(10, -16); g.lineTo(30, 0); g.lineTo(10, 16); g.lineTo(10, 7); g.lineTo(-30, 7); g.fill(); g.restore(); };
    ar(310, 160, 0); ar(458, 160, Math.PI); ar(384, 90, Math.PI / 2); ar(384, 230, -Math.PI / 2);
    for (let i = 0; i < 6; i++) { g.fillStyle = '#bcae92'; g.fillRect(30, 130 + i * 26, 190, 8); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  })();
  const book = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.0), [toon('#7a3b33'), toon('#7a3b33'), toon('#ffffff', bookTex), toon('#7a3b33'), toon('#7a3b33'), toon('#7a3b33')]);
  ink(book, 0.01, true); book.position.set(O - 3.4, 1.18, 0.7); book.rotation.y = 0.15; W.add(book);
  // model tower on the desk
  const MX = O - 1.6, MY = 1.14, MZ = 0.4;
  const model = tower(); model.scale.setScalar(0.008); model.position.set(MX, MY, MZ); W.add(model);
  const AY = MY + 0.55;
  const sideArrows = new THREE.Group();
  for (const [x, z] of [[-0.62, 0], [0.62, 0], [0, 0.62], [0, -0.62]]) {
    const a = arrow('#4f86b8', 0.4); a.position.set(MX + x, AY, MZ + z);
    a.lookAt(new THREE.Vector3(MX, AY, MZ)); a.rotateY(-Math.PI / 2);
    sideArrows.add(a);
  }
  W.add(sideArrows);
  const cornerArrow = arrow('#e0533d', 0.55); cornerArrow.position.set(MX + 0.62, AY, MZ + 0.62); cornerArrow.lookAt(new THREE.Vector3(MX, AY, MZ)); cornerArrow.rotateY(-Math.PI / 2); W.add(cornerArrow);
  // chalkboard with +40%
  const chalk = document.createElement('canvas'); chalk.width = 640; chalk.height = 360; const cg = chalk.getContext('2d');
  const chalkTex = new THREE.CanvasTexture(chalk); chalkTex.colorSpace = THREE.SRGBColorSpace;
  const drawChalk = (p) => {
    cg.fillStyle = '#2f4a3a'; cg.fillRect(0, 0, 640, 360); cg.strokeStyle = '#8a5a3b'; cg.lineWidth = 22; cg.strokeRect(0, 0, 640, 360);
    cg.fillStyle = '#f2ead6'; cg.font = 'bold 40px Arial, sans-serif'; cg.textAlign = 'center'; cg.fillText('CORNER WINDS', 320, 80);
    cg.save(); cg.globalAlpha = p; cg.font = 'bold 150px Arial, sans-serif'; cg.fillStyle = '#ffd66b'; cg.fillText('+40%', 320, 250); cg.restore();
    chalkTex.needsUpdate = true;
  };
  drawChalk(0);
  const board = box(4.4, 2.5, 0.12, '#ffffff', {thick: 0.02});
  board.material = [toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), toon('#5a3a26'), new THREE.MeshBasicMaterial({map: chalkTex}), toon('#5a3a26')];
  board.position.set(O + 3.2, 2.9, -5.35); W.add(board);
  dressOffice(W, O, chars);
  const student = character({palette: 'student', hat: 'cap', glasses: true, seed: 61}); student.position.set(O + 1.2, 0.05, -3.2); W.add(student); chars.push(student);
  // window + plant (foreground blur object)
  const win = sign('', 2.4, 2.0, {bg: '#bfe3f5', border: true}); win.position.set(O - 5, 3.1, -5.4); W.add(win);
  const plant = new THREE.Group(); plant.add(cyl(0.35, 0.28, 0.7, '#b35a3a', {y: 0.35})); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), toon('#4f8a4a')); l.position.set(Math.cos(i) * 0.3, 0.9 + (i % 3) * 0.25, Math.sin(i) * 0.3); ink(l, 0.02, false); plant.add(l); }
  plant.position.set(O - 5.6, 0.05, 3.2); W.add(plant);

  // ======== YARD (bolts instead of welds) ========
  const Y = LOC.yard;
  W.add(ground(60, 50, '#b39a72', {x: Y, z: -5, seed: 14, repeat: 8}));
  W.add(facade({w: 20, h: 9, color: '#a86f5c', cols: 4, rows: 2, door: true, seed: 71}).translateX(Y).translateZ(-8));
  W.add(box(20, 9, 10, '#8f6c5e', {x: Y, y: 4.5, z: -13.2, thick: 0.04}));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2 + (i % 2); j++) W.add(crate('BOLTS', {x: Y + 1.4 + i * 1.3, y: 0.6 + j * 1.2, z: -2.2 + (i % 2) * 0.2, ry: (i - 1) * 0.08}));
  W.add(crate('WELDS', {x: Y - 2.6, y: 0.6, z: -1.6, ry: 0.25, color: '#9a8a7a', stamp: 'SWAPPED'}));
  const costSign = sign('BOLTS COST LESS', 3.8, 1.0, {bg: '#e6d39a', w: 760, h: 200, font: 'bold 78px Arial, sans-serif'}); costSign.position.set(Y + 2.7, 4.6, -2.0); W.add(costSign);
  W.add(cyl(0.07, 0.07, 4.1, '#3a3a3a', {x: Y + 1.0, y: 2.05, z: -2.05}), cyl(0.07, 0.07, 4.1, '#3a3a3a', {x: Y + 4.4, y: 2.05, z: -2.05}));
  dressYard(W, Y, chars);
  const engineer = character({palette: 'engineer', hat: 'bowler', glasses: true, seed: 71}); engineer.position.set(Y + 0.0, 0.05, 0.6); W.add(engineer); chars.push(engineer);
  const clip = box(0.35, 0.45, 0.03, '#d8c9a8', {thick: 0.01}); clip.position.set(0.18, -0.4, 0.06); engineer.userData.armR.add(clip);

  // ======== JOINT close-up ========
  const J = LOC.joint;
  W.add(room(J, {w: 22, h: 8, d: 12, wall: '#8a8fa3', floor: '#6a6570', seed: 19}));
  const joint = (x, welded) => {
    const g = new THREE.Group();
    g.add(box(0.9, 7, 0.9, '#8d9199', {y: 3.5, thick: 0.03}));            // column
    const b1 = box(0.7, 4.6, 0.7, '#9aa0a8', {thick: 0.03}); b1.position.set(-1.35, 2.2, 0); b1.rotation.z = -0.62; g.add(b1);
    const b2 = box(0.7, 4.6, 0.7, '#9aa0a8', {thick: 0.03}); b2.position.set(1.35, 2.2, 0); b2.rotation.z = 0.62; g.add(b2);
    g.add(box(2.6, 1.8, 0.14, '#b3b8bf', {y: 4.2, z: 0.5, thick: 0.02}));  // gusset plate
    const bolts = [];
    if (welded) {
      const beadMat = new THREE.MeshBasicMaterial({color: '#e8902e'});
      const bead = new THREE.Group();
      for (const [bw, bh, bx, by] of [[2.7, 0.1, 0, 0.92], [2.7, 0.1, 0, -0.92], [0.1, 1.9, 1.32, 0], [0.1, 1.9, -1.32, 0], [0.1, 1.2, -0.45, -0.3], [0.1, 1.2, 0.45, -0.3]]) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.08), beadMat); m.position.set(bx, by, 0); bead.add(m);
      }
      bead.position.set(0, 4.2, 0.6); g.add(bead); bead.material = beadMat; g.userData.bead = bead;
    } else {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const b = cyl(0.11, 0.11, 0.14, '#4b4e55', {x: -0.9 + i * 0.6, y: 3.6 + j * 0.55, z: 0.62, seg: 6, thick: 0.012}); b.rotation.x = Math.PI / 2; g.add(b); bolts.push(b); }
    }
    g.userData.bolts = bolts;
    g.position.set(x, 0, -3); return g;
  };
  dressJoint(W, J, chars);
  const jW = joint(J - 3.2, true), jB = joint(J + 3.2, false); W.add(jW, jB);
  const sW = sign('WELDED', 2.6, 0.8, {bg: '#e6d39a', w: 600, h: 180, font: 'bold 96px Arial, sans-serif'}); sW.position.set(J - 3.2, 6.6, -2.4); W.add(sW);
  const sB = sign('BOLTED', 2.6, 0.8, {bg: '#e6d39a', w: 600, h: 180, font: 'bold 96px Arial, sans-serif'}); sB.position.set(J + 3.2, 6.6, -2.4); W.add(sB);
  const lampJ = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); lampJ.position.set(J, 7.0, -1); W.add(lampJ); W.add(cyl(0.03, 0.03, 1.2, '#2a2a2a', {x: J, y: 7.6, z: -1}));

  // ======== WEATHER ROOM ========
  const R = LOC.weather;
  W.add(room(R, {w: 16, h: 5.5, d: 11, wall: '#c9dbef', floor: '#8a6a4e', seed: 27}));
  const mapC = document.createElement('canvas'); mapC.width = 800; mapC.height = 520; const mg = mapC.getContext('2d');
  const mapTex = new THREE.CanvasTexture(mapC); mapTex.colorSpace = THREE.SRGBColorSpace; mapTex.anisotropy = 8;
  const drawMap = (pIn, pTurn, t) => {
    mg.fillStyle = '#7fb3cf'; mg.fillRect(0, 0, 800, 520);
    mg.fillStyle = '#e8dcb8'; mg.strokeStyle = INK; mg.lineWidth = 5;
    mg.beginPath(); mg.moveTo(0, 0); mg.lineTo(420, 0); mg.lineTo(400, 70); mg.lineTo(360, 130); mg.lineTo(330, 160); mg.lineTo(300, 230); mg.lineTo(250, 300); mg.lineTo(230, 380); mg.lineTo(170, 470); mg.lineTo(120, 520); mg.lineTo(0, 520); mg.closePath(); mg.fill(); mg.stroke();
    mg.fillStyle = '#c43d32'; mg.beginPath(); mg.arc(335, 150, 12, 0, 7); mg.fill(); mg.stroke();
    mg.fillStyle = INK; mg.font = 'bold 30px Arial, sans-serif'; mg.textAlign = 'right'; mg.fillText('NEW YORK', 318, 150);
    mg.textAlign = 'center'; mg.font = 'bold 40px Arial, sans-serif'; mg.fillText('FORECAST', 620, 52);
    // storm path: from south-east toward New York, then bending east (away)
    const start = [600, 480], mid = [430, 230], away = [720, 90];
    const sx = start[0] + (mid[0] - start[0]) * pIn + (away[0] - mid[0]) * pTurn;
    const sy = start[1] + (mid[1] - start[1]) * pIn + (away[1] - mid[1]) * pTurn;
    mg.strokeStyle = '#c43d32'; mg.lineWidth = 6; mg.setLineDash([16, 12]); mg.beginPath(); mg.moveTo(start[0], start[1]); mg.lineTo(start[0] + (mid[0] - start[0]) * pIn, start[1] + (mid[1] - start[1]) * pIn);
    if (pTurn > 0) mg.lineTo(sx, sy); mg.stroke(); mg.setLineDash([]);
    mg.save(); mg.translate(sx, sy); mg.rotate(-t * 3);
    mg.fillStyle = '#ffffff'; mg.strokeStyle = INK; mg.lineWidth = 4;
    for (let k = 0; k < 3; k++) { mg.rotate(2.09); mg.beginPath(); mg.arc(14, 0, 26, Math.PI * 0.9, Math.PI * 1.9); mg.lineWidth = 12; mg.strokeStyle = '#ffffff'; mg.stroke(); }
    mg.beginPath(); mg.arc(0, 0, 12, 0, 7); mg.fillStyle = '#ffffff'; mg.fill(); mg.lineWidth = 4; mg.strokeStyle = INK; mg.stroke(); mg.restore();
    mg.fillStyle = INK; mg.font = 'bold 26px Arial, sans-serif'; mg.textAlign = 'left'; mg.fillText('HURRICANE ELLA', sx + 34, sy + 10);
    mapTex.needsUpdate = true;
  };
  drawMap(0, 0, 0);
  const mapBoard = box(6.2, 4.0, 0.12, '#ffffff', {thick: 0.03});
  mapBoard.material = [toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), toon('#4a3a2e'), new THREE.MeshBasicMaterial({map: mapTex}), toon('#4a3a2e')];
  mapBoard.position.set(R - 1.0, 2.9, -5.35); W.add(mapBoard);
  const evac = sign('EVACUATION', 2.0, 1.4, {bg: '#f4ead4', w: 480, h: 336, font: 'bold 62px Arial, sans-serif', sub: 'PLAN'});
  evac.position.set(R + 4.6, 1.75, -2.4); evac.rotation.y = -0.35; W.add(evac);
  // easel legs
  const legs = new THREE.Group(); legs.add(cyl(0.05, 0.05, 1.1, '#6b4430', {x: R + 4.15, y: 0.55, z: -2.55}), cyl(0.05, 0.05, 1.1, '#6b4430', {x: R + 5.05, y: 0.55, z: -2.85})); W.add(legs);
  dressWeather(W, R, chars);
  const off1 = character({palette: 'official', hat: 'top', seed: 81}); off1.position.set(R - 2.4, 0.05, 0.0); W.add(off1); chars.push(off1);
  const eng2 = character({palette: 'engineer', hat: 'bowler', glasses: true, seed: 72}); eng2.position.set(R + 1.2, 0.05, 0.4); W.add(eng2); chars.push(eng2);
  const plant2 = plant.clone(); plant2.position.set(R + 6.2, 0.05, 3.4); W.add(plant2);

  // ======== per-frame update ========
  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    trafficN(t, cam); trafficD(t, cam);
    // hook: sparks on tower; night shot: sparks after "welders"
    const sparkOn = shot === 'hook' ? 1 : shot === 'night' ? ease(t, wordT('night', 6), wordT('night', 6) + 0.5) : 0;
    spN.visible = sparkOn > 0.01; spN.userData.update(t, sparkOrigins, sparkOn);
    // office windows go dark after "offices emptied"
    towerN.userData.sideMat.emissiveIntensity = shot === 'night' ? 0.55 - 0.45 * ease(t, wordT('night', 5), wordT('night', 5) + 0.8) : 0.55;
    // rules: only side arrows; but: corner arrow + +40%
    cornerArrow.visible = t > wordT('but', 5);
    cornerArrow.scale.setScalar(Math.max(0.001, ease(t, wordT('but', 5), wordT('but', 5) + 0.5)));
    drawChalkIf(t);
    // storm
    const storm = shot === 'storm';
    rain.visible = storm; stormClouds.visible = storm;
    if (storm) {
      for (let i = 0; i < RN; i++) {
        const [a, b, c] = rs[i];
        const x = cam.position.x + (a - 0.5) * 40, z = cam.position.z - 2 - b * 30;
        const y = ((c * 40 - t * 22) % 40 + 40) % 40;
        rp[i * 6] = x; rp[i * 6 + 1] = y; rp[i * 6 + 2] = z; rp[i * 6 + 3] = x - 0.15; rp[i * 6 + 4] = y + 0.9; rp[i * 6 + 5] = z;
      }
      rainGeo.attributes.position.needsUpdate = true;
      towerD.rotation.z = Math.sin(t * 2.3) * 0.004;
    } else towerD.rotation.z = 0;
    // joint: weld glow pulses; bolts tremble on "only as strong as the bolts"
    jW.userData.bead.material.color.setHSL(0.075, 0.85, 0.5 + Math.sin(t * 6) * 0.05);
    const shake = ease(t, wordT('yousee', 11), wordT('yousee', 11) + 0.4) * (1 - ease(t, wordT('yousee', 19) - 0.4, wordT('yousee', 19)));
    jB.userData.bolts.forEach((b, i) => { b.position.z = 0.62 + Math.sin(t * 40 + i) * 0.03 * shake; });
    // weather map
    if (shot === 'ella' || shot === 'so') drawMap(ease(t, wordT('ella', 3), wordT('ella', 8)), ease(t, wordT('so', 6), wordT('so', 10)), t);
    evac.visible = t > wordT('ella', 10); legs.visible = evac.visible; evac.scale.setScalar(Math.max(0.001, ease(t, wordT('ella', 10), wordT('ella', 10) + 0.5)));
    // host waves during CTA
    host.userData.armR.rotation.z = shot === 'cta' ? 2.4 + Math.sin(t * 8) * 0.35 : 0;
    student.userData.armR.rotation.z = (shot === 'but') ? 1.9 : 0;
  };
  let lastChalk = -1;
  function drawChalkIf(t) { const p = ease(t, wordT('but', 12), wordT('but', 12) + 0.5); if (Math.abs(p - lastChalk) > 0.02) { drawChalk(p); lastChalk = p; } }

  return {group: W, update};
}
