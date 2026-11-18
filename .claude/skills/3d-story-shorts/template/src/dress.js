import * as THREE from 'three';
import {rng, box, cyl, sign, toon, ink, lampPost} from './kit.js';
import {character} from './char.js';
import * as P from './props.js';

const SHOPS = ['DINER', 'PHARMACY', 'BAKERY', 'HOTEL', 'BOOKS', 'DELI', 'SHOES', 'RADIO', 'CAFE', 'HARDWARE', 'FLOWERS', 'BARBER', 'GROCERY', 'TAILOR'];
const SHOPCOL = ['#c98f6b', '#b8775e', '#d1a47a', '#a86f5c', '#c4a27c', '#9e7b66'];
const CARCOL = ['#c43d32', '#2f6db3', '#4f8a4a', '#e6d9b8', '#7a4f73', '#3a3a3f', '#d9a441', '#9fc0d4'];

// ---------- street dressing (shared by night + day city) ----------
export function dressStreet(W, ox, {lit = false, seed = 1, chars, avoid = []} = {}) {
  const r = rng(seed);
  const near = (x) => avoid.some((a) => Math.abs(x - a) < 4.5);
  // shop fronts on the ground floor of the street facades
  let si = seed;
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
    const x = ox + side * (18 + i * 12.5);
    const s = P.shopFront(SHOPS[si++ % SHOPS.length], SHOPCOL[(i + 3) % 6], si); s.position.set(x, 0, 3.75); W.add(s);
  }
  for (let i = -6; i < 7; i++) { const s = P.shopFront(SHOPS[si++ % SHOPS.length], SHOPCOL[(i + 9) % 6], si); s.position.set(ox + i * 13, 0, 21.2); s.rotation.y = Math.PI; W.add(s); }
  // trees, hydrants, bins, mailboxes, news boxes, benches along both sidewalks
  for (let i = -5; i <= 5; i++) {
    const x = ox + i * 11 + 9.5;
    if (!near(x)) W.add(P.at(P.tree(1.1, seed + i), x, 0.25, 7.0));
    W.add(P.at(P.tree(1.0, seed + 40 + i), ox + i * 11 + 2, 0.25, 17.2));
    const k = i % 4, sx = ox + i * 11 + 6.6;
    if (near(sx)) continue;
    const item = [P.hydrant(), P.trashCan(), P.mailbox(), P.newsBox(['#c43d32', '#2f6db3', '#4f8a4a'][Math.abs(i) % 3])][(k + 4) % 4];
    W.add(P.at(item, sx, 0.25, 7.1));
    if (i % 3 === 0) W.add(P.at(P.bench(), ox + i * 11 + 0.5, 0.25, 4.3, 0));
  }
  W.add(P.at(P.trafficLight(), ox - 13.5, 0.25, 7.3), P.at(P.trafficLight(), ox + 13.5, 0.25, 7.3));
  // parked cars by the near curb
  for (let i = -5; i <= 5; i++) { if (i % 2) continue; const x = ox + i * 10 + 3; if (near(x)) continue; W.add(P.at(P.car(CARCOL[Math.floor(r() * 8)], {seed: i, lights: lit}), x, 0, 8.6)); }
  // pedestrians on both sidewalks
  const crowdN = lit ? 8 : 22;
  for (const a of avoid.slice(0, 1)) for (const [dx, pal, hat] of [[-2.6, 'red', 'none'], [2.8, 'teal', 'cap']]) { const c = character({palette: pal, hat, seed: seed * 7 + dx * 10}); c.position.set(a + dx, 0.25, 4.6); W.add(c); chars.push(c); }
  const cg = new THREE.Group(); W.add(cg);
  for (let i = 0; i < crowdN; i++) {
    const x = ox - 70 + r() * 140; if (near(x)) continue;
    const c = character({palette: ['engineer', 'student', 'clerk', 'official', 'red', 'teal', 'mustard', 'pink', 'navy'][Math.floor(r() * 9)], hat: ['none', 'cap', 'bowler', 'top', 'none'][Math.floor(r() * 5)], glasses: r() > 0.7, seed: seed * 50 + i});
    c.position.set(x, 0.25, r() > 0.5 ? 4.6 + r() * 1.2 : 18.0 + r() * 1.4); cg.add(c); chars.push(c);
  }
  // moving traffic in two lanes
  const traffic = [];
  for (let lane = 0; lane < 2; lane++) for (let i = 0; i < 7; i++) {
    const taxi = r() > 0.5;
    const c = i === 3 && lane === 1 ? P.bus() : P.car(CARCOL[Math.floor(r() * 8)], {taxi, lights: lit, seed: i});
    c.rotation.y = lane ? Math.PI : 0;
    const x0 = -120 + i * 34 + r() * 10, sp = (lane ? -1 : 1) * (6 + r() * 3);
    traffic.push({c, x0, sp, z: lane ? 13.8 : 10.3});
    W.add(c);
  }
  return (t, cam) => {
    for (const q of traffic) {
      let x = ((q.x0 + q.sp * t + 120) % 240 + 240) % 240 - 120;
      q.c.position.set(ox + x, 0, q.z);
      // keep cars from driving through the camera when it sits on the road
      const inRoad = cam.position.z > 7.6 && cam.position.z < 16.6 && Math.abs(cam.position.x - (ox + x)) < 140;
      q.c.visible = !(inRoad && Math.abs(cam.position.x - (ox + x)) < 7 && Math.abs(cam.position.z - q.z) < 6);
    }
  };
}

export function dressPlaza(W, ox, chars) {
  for (const s of [-1, 1]) {
    W.add(P.at(P.tree(1.4, 70 + s), ox + s * 8.5, 0.05, -11));
    W.add(P.at(P.tree(1.3, 72 + s), ox + s * 12, 0.05, -20));
    W.add(P.at(P.bench(), ox + s * 6, 0.05, -14, s * 0.3));
    for (let i = 0; i < 3; i++) W.add(P.at(P.flag(['#c43d32', '#2f6db3', '#f2f0e6'][i]), ox + s * (6 + i * 1.6), 0.05, -9.2));
  }
  const r = rng(91);
  for (let i = 0; i < 9; i++) {
    const c = character({palette: ['red', 'teal', 'mustard', 'clerk', 'navy', 'pink', 'student'][i % 7], hat: ['none', 'bowler', 'cap', 'top'][i % 4], seed: 900 + i});
    c.position.set(ox - 10 + r() * 20, 0.05, -13 - r() * 12); W.add(c); chars.push(c);
  }
}

// ---------- office ----------
export function dressOffice(W, O, chars) {
  W.add(P.at(P.rug(6, 3.6), O - 2.5, 0, 0.4));
  W.add(P.at(P.chair(), O - 2.5, 0.05, -0.75, 0));
  W.add(P.at(P.deskLamp(), O - 4.2, 1.14, 0.1), P.at(P.mug(), O - 1.0, 1.14, 1.0), P.at(P.papers(7, 3), O - 2.9, 1.14, 0.0));
  const roll = cyl(0.06, 0.06, 0.9, '#cfe3f0', {seg: 10, thick: 0.006}); roll.rotation.z = Math.PI / 2; roll.position.set(O - 2.0, 1.2, 0.95); W.add(roll);
  W.add(P.at(P.bookshelf(4), O - 6.0, 0.05, -5.15), P.at(P.bookshelf(5), O - 0.4, 0.05, -5.15));
  W.add(P.at(P.filingCabinet(), O + 6.4, 0.05, -5.0), P.at(P.filingCabinet('#8f7d6a'), O + 7.2, 0.05, -5.0));
  W.add(P.at(P.bookshelf(6, 2.0, 2.4), O - 7.75, 0.05, -1.5, Math.PI / 2));
  const p1 = P.poster('WIND', 1.1, 1.5, '#e6d39a'); P.at(p1, O + 0.9, 3.4, -5.45); W.add(p1);
  const p2 = P.poster('STEEL', 1.1, 1.5, '#cfe3f0'); P.at(p2, O + 5.9, 3.3, -5.45); W.add(p2);
  W.add(P.at(P.wallClock(), O + 3.2, 4.75, -5.4));
  // second desk with a classmate
  const d2 = P.desk(2.0, '#7a4f33'); d2.position.set(O + 5.6, 0.05, -2.2); W.add(d2);
  W.add(P.at(P.papers(5, 9), O + 5.4, 1.08, -2.2), P.at(P.deskLamp(), O + 6.3, 1.08, -2.5), P.at(P.chair('#3e5a7a'), O + 5.6, 0.05, -1.1, Math.PI));
  const mate = character({palette: 'teal', hat: 'none', glasses: false, seed: 601}); mate.position.set(O + 4.4, 0.05, -1.4); W.add(mate); chars.push(mate);
  // hanging ceiling lamps
  for (const x of [O - 3, O + 3]) { W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: 5.1, z: -1})); const sh = cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y: 4.6, z: -1, seg: 14}); W.add(sh); const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(x, 4.45, -1); W.add(b); }
}

// ---------- yard ----------
export function dressYard(W, Y, chars) {
  for (let i = 0; i < 3; i++) { W.add(P.at(P.pallet(), Y - 7 + i * 1.4, 0.05, -3.4)); W.add(P.at(P.barrel(['#2f6db3', '#c43d32', '#4f8a4a'][i]), Y - 7 + i * 1.4, 0.2, -3.4)); }
  W.add(P.at(P.barrel('#d9a441'), Y - 5.8, 0.05, -1.8), P.at(P.barrel('#2f6db3'), Y + 7.4, 0.05, -1.2));
  W.add(P.at(P.beamStack(5, 7), Y + 9.5, 0.05, -3.5), P.at(P.beamStack(3, 5), Y - 9.5, 0.05, 0.2, 0.3));
  W.add(P.at(P.cone(), Y - 3.6, 0.05, 2.2), P.at(P.cone(), Y + 5.0, 0.05, 1.8), P.at(P.cone(), Y + 6.0, 0.05, 2.6));
  W.add(P.at(P.fence(16), Y - 14, 0.05, -2, Math.PI / 2), P.at(P.fence(16), Y + 14, 0.05, -2, Math.PI / 2));
  const truck = P.car('#3e5a7a'); truck.scale.set(1.5, 1.4, 1.3); truck.position.set(Y - 11, 0, 4); truck.rotation.y = 0.4; W.add(truck);
  const ts = sign('STEEL CO.', 2.6, 0.6, {bg: '#f2e6cc', w: 520, h: 120, font: 'bold 72px Arial'}); ts.position.set(Y - 10.4, 1.2, 5.35); ts.rotation.y = 0.4; W.add(ts);
  W.add(P.at(P.crane(46), Y + 24, 0, -42));
  const hh = P.hardhat(); hh.position.set(Y + 1.4, 1.84, -2.0); W.add(hh);
  for (const [x, z, pal, s] of [[Y + 6.2, -0.8, 'welder', 731], [Y - 4.6, -2.2, 'mustard', 732], [Y + 11, -1, 'red', 733]]) { const w = character({palette: pal, hat: 'cap', seed: s}); w.position.set(x, 0.05, z); W.add(w); chars.push(w); }
  for (let i = 0; i < 4; i++) W.add(P.at(P.tree(1.3, 740 + i), Y - 20 + i * 13, 0.05, -11));
}

// ---------- steel workshop ----------
export function dressJoint(W, J, chars) {
  W.add(P.at(P.toolRack(1), J - 8, 0, -5.9), P.at(P.toolRack(2), J + 8, 0, -5.9));
  W.add(P.at(P.ladder(3.4), J - 10, 0.05, -5.2), P.at(P.ladder(3.0), J + 10.2, 0.05, -5.2));
  W.add(P.at(P.barrel('#c43d32'), J + 9.4, 0.05, -3.6), P.at(P.barrel('#2f6db3'), J + 8.5, 0.05, -4.3), P.at(P.barrel('#d9a441'), J - 9.2, 0.05, -3.2));
  W.add(P.at(P.beamStack(4, 5), J - 8.0, 0.05, -2.2, 0.15));
  W.add(P.at(P.toolbox(), J, 0.05, -3.4), P.at(P.toolbox(), J + 5.4, 0.05, -1.4, 0.4));
  const warn = sign('DANGER: WELDING', 3.6, 0.9, {bg: '#f2c12e', w: 760, h: 190, font: 'bold 78px Arial'}); warn.position.set(J, 3.6, -5.92); W.add(warn);
  for (const x of [J - 3.2, J + 3.2]) { W.add(cyl(0.02, 0.02, 1.0, '#2b2b2e', {x, y: 7.5, z: -1})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), new THREE.MeshBasicMaterial({color: '#ffe2a6'})); b.position.set(x, 6.9, -1); W.add(b); }
  for (let i = 0; i < 6; i++) W.add(cyl(0.05, 0.05, 2.2, '#6f6f74', {x: J - 1 + i * 0.4, y: 6.8 - (i % 2) * 0.3, z: -4.5, seg: 6, thick: 0.005}));
  const w = character({palette: 'welder', hat: 'cap', seed: 811}); w.position.set(J - 5.2, 0.05, -1.6); W.add(w); chars.push(w);
  const w2 = character({palette: 'navy', hat: 'cap', seed: 812}); w2.position.set(J + 5.6, 0.05, -2.0); W.add(w2); chars.push(w2);
}

// ---------- weather room ----------
export function dressWeather(W, R, chars) {
  W.add(P.at(P.rug(7, 4, '#3e5a7a', '#d9a441'), R, 0, -0.5));
  const d1 = P.desk(2.4); d1.position.set(R - 5.4, 0.05, -3.6); W.add(d1);
  W.add(P.at(P.radio(), R - 5.9, 1.0, -3.7), P.at(P.phone(), R - 4.8, 1.0, -3.4), P.at(P.papers(6, 21), R - 5.2, 1.0, -3.3), P.at(P.mug('#2f6db3'), R - 4.4, 1.0, -3.8));
  const d2 = P.desk(2.4, '#7a4f33'); d2.position.set(R + 6.0, 0.05, -4.3); W.add(d2);
  W.add(P.at(P.tvMonitor('STORM'), R + 5.6, 1.0, -4.4), P.at(P.tvMonitor('WIND'), R + 6.6, 1.0, -4.5, -0.2), P.at(P.phone(), R + 7.0, 1.0, -3.9));
  W.add(P.at(P.filingCabinet(), R - 7.2, 0.05, -4.9), P.at(P.filingCabinet('#8f7d6a'), R - 6.4, 0.05, -4.9));
  W.add(P.at(P.wallClock(), R + 4.6, 4.5, -5.4));
  const p = P.poster('ALERT', 1.0, 1.3, '#f2c12e'); P.at(p, R - 5.6, 3.3, -5.45); W.add(p);
  for (const x of [R - 3, R + 3]) { W.add(cyl(0.02, 0.02, 0.8, '#2b2b2e', {x, y: 5.1, z: -1})); W.add(cyl(0.15, 0.45, 0.35, '#2f5d62', {x, y: 4.6, z: -1, seg: 14})); const b = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({color: '#fff1c0'})); b.position.set(x, 4.45, -1); W.add(b); }
  // foreground desk for depth + storm window + corkboard
  const fd = P.desk(2.2, '#6b4430'); fd.position.set(R - 3.6, 0.05, 2.4); fd.rotation.y = 0.2; W.add(fd);
  W.add(P.at(P.papers(6, 31), R - 3.8, 1.0, 2.4), P.at(P.phone(), R - 3.0, 1.0, 2.2), P.at(P.mug('#c43d32'), R - 4.4, 1.0, 2.6));
  const win = sign('', 2.6, 1.8, {bg: '#4a5568', border: true}); win.position.set(R - 7.95, 3.0, -1.5); win.rotation.y = Math.PI / 2; W.add(win);
  const cork = sign('NOTICES', 2.2, 1.4, {bg: '#c49a62', w: 440, h: 280, font: 'bold 50px Arial'}); cork.position.set(R + 2.9, 3.2, -5.45); W.add(cork);
  for (let i = 0; i < 5; i++) W.add(box(0.35, 0.45, 0.02, ['#f7f0de', '#fff1b8', '#cfe3f0'][i % 3], {x: R + 2.2 + (i % 3) * 0.6, y: 3.0 + Math.floor(i / 3) * 0.5, z: -5.38, thick: 0.004, edges: false}));
  const caller = character({palette: 'pink', hat: 'none', glasses: true, seed: 921}); caller.position.set(R - 5.0, 0.05, -2.4); W.add(caller); chars.push(caller);
  const m2 = character({palette: 'mustard', hat: 'bowler', seed: 922}); m2.position.set(R + 6.6, 0.05, -2.9); W.add(m2); chars.push(m2);
}
