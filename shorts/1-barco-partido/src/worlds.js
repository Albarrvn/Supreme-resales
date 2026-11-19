import * as THREE from 'three';
import {wordT} from './camera.js';
import {ease, sparks, room, board, harbor, shipyard, ship, cookie, charpy, addChar, P, sign, box, cyl, crate, cloud, INK, glowMat} from './weld.js';

export const LOC = {harbor: 0, yard: 400, lab: 1200, shop: 1300};

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];
  const ups = [];

  // ======== HARBOR (night) ========
  const H = LOC.harbor;
  const hb = harbor(H, {lit: true, seed: 3}); W.add(hb);
  const tanker = ship({len: 40, color: '#7d90a6', deckColor: '#a0714a', lit: true, name: 'SCHENECTADY'}); tanker.position.set(H, 0, -1); W.add(tanker);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({color: '#f6ecc8', fog: false})); moon.position.set(H - 50, 70, -160); W.add(moon);
  for (let i = 0; i < 6; i++) W.add(cloud(H - 70 + i * 30, 60 + (i % 2) * 10, -140, 6, '#3d3f6b'));
  const port = sign('PORTLAND · 1943', 5.2, 1.3, {bg: '#e6d39a', w: 900, h: 220, font: 'bold 110px Arial'}); port.position.set(H - 7, 3.4, 8.2); W.add(port);
  W.add(cyl(0.08, 0.08, 2.6, '#3a3a3f', {x: H - 9.3, y: 2.4, z: 8.2}), cyl(0.08, 0.08, 2.6, '#3a3a3f', {x: H - 4.7, y: 2.4, z: 8.2}));
  const frost = sign('-  HIELO  -', 2.6, 0.7, {bg: '#cfe8f5', w: 600, h: 160, font: 'bold 90px Arial'}); frost.position.set(H + 8, 2.4, 6.4); W.add(frost);
  const wk = [];
  for (const [x, z, pal, s] of [[H - 2.5, 7.0, 'welder', 11], [H + 1.5, 7.4, 'navy', 12], [H + 4.0, 8.4, 'mustard', 13], [H - 5.2, 9.5, 'official', 14], [H + 6.5, 11, 'red', 15]]) wk.push(addChar(W, chars, {palette: pal, hat: 'cap', seed: s}, x, 1.25, z));
  const shipLight = new THREE.PointLight('#ffd9a0', 60, 45, 1.0); shipLight.position.set(H + 2, 12, 8); W.add(shipLight);
  const flash = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), new THREE.MeshBasicMaterial({color: '#ffe2a6', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false})); flash.position.set(H, 4.5, -1); W.add(flash);
  const snow = sparks(41, 260, 0.12); snow.material.color.set('#e8f2ff'); snow.material.blending = THREE.NormalBlending; W.add(snow);

  // ======== SHIPYARD (day) ========
  const Y = LOC.yard;
  W.add(shipyard(Y, {seed: 5}));
  const hull = ship({len: 42, color: '#6b7885', deckColor: '#7d8a8f'}); hull.position.set(Y, 1.9, -6); W.add(hull);
  const ban = sign('SOLDAR', 4.4, 1.2, {bg: '#f2c12e', w: 700, h: 190, font: 'bold 130px Arial'}); ban.position.set(Y - 4, 7.6, -0.5); W.add(ban);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) W.add(crate('REMACHES', {x: Y + 9 + i * 1.3, y: 0.6 + j * 1.2, z: 4.2, ry: (i - 1) * 0.1, color: '#9a8a7a', stamp: j === 1 && i === 1 ? 'NO' : null}));
  const weeks = sign('SEMANAS', 3.6, 1.2, {bg: '#f4ead4', w: 700, h: 230, font: 'bold 120px Arial', sub: 'NO MESES'}); weeks.position.set(Y + 4, 2.4, 6.6); W.add(weeks);
  W.add(cyl(0.07, 0.07, 1.8, '#3a3a3f', {x: Y + 2.6, y: 0.9, z: 6.6}), cyl(0.07, 0.07, 1.8, '#3a3a3f', {x: Y + 5.4, y: 0.9, z: 6.6}));
  const yw = [];
  for (const [x, y, z, pal, s] of [[Y - 8, 3.0, -0.6, 'welder', 21], [Y - 3, 3.0, -0.6, 'navy', 22], [Y + 3, 6.0, -0.6, 'welder', 23], [Y + 7, 3.0, -0.6, 'teal', 24], [Y - 12, 6.0, -0.6, 'mustard', 25]]) yw.push(addChar(W, chars, {palette: pal, hat: 'cap', seed: s}, x, y, z, Math.PI));
  for (const [x, z, pal, s] of [[Y + 6, 3.6, 'red', 26], [Y - 6, 5.2, 'official', 27], [Y + 1, 8.5, 'clerk', 28]]) addChar(W, chars, {palette: pal, hat: 'cap', seed: s}, x, 0.05, z);
  const ysp = sparks(7, 200, 0.3); W.add(ysp);
  const yOrig = yw.map((c) => [c.position.x, c.position.y + 1.0, c.position.z - 0.7]);
  const better = [sign('ACERO NUEVO', 3.4, 0.9, {bg: '#bfe6d0', w: 700, h: 180, font: 'bold 100px Arial'}), sign('NUEVO DISEÑO', 3.4, 0.9, {bg: '#cfe3f0', w: 700, h: 180, font: 'bold 100px Arial'}), sign('MEJOR SOLDADURA', 3.4, 0.9, {bg: '#f2e6a6', w: 700, h: 180, font: 'bold 90px Arial'})];
  better.forEach((s, i) => { s.position.set(Y - 4.5 + i * 4.5, 4.2, 4.0); W.add(s); });

  // ======== LAB (Cambridge) ========
  const L = LOC.lab;
  W.add(room(L, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', seed: 8}));
  const desk = P.desk(3.2); desk.position.set(L - 1.2, 0.05, 0.4); W.add(desk);
  const chalk = board(4.4, 2.5, (g, w, h, p1, p2) => {
    g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a5a3b'; g.lineWidth = 22; g.strokeRect(0, 0, w, h);
    g.fillStyle = '#f2ead6'; g.textAlign = 'center'; g.font = 'bold 44px Arial'; g.fillText('CAMBRIDGE', w / 2, 70);
    g.globalAlpha = p1; g.font = 'bold 40px Arial'; g.fillText('ACERO + FRÍO', w / 2, 150); g.font = 'bold 120px Arial'; g.fillStyle = '#9fd8ff'; g.fillText('= FRÁGIL', w / 2, 280); g.globalAlpha = 1;
  });
  chalk.position.set(L + 1.6, 2.9, -5.35); W.add(chalk);
  const bar = new THREE.Group(); const bA = box(0.6, 0.12, 0.12, '#9aa0a8', {x: -0.31, thick: 0.004}), bB = box(0.6, 0.12, 0.12, '#9aa0a8', {x: 0.31, thick: 0.004}); bar.add(bA, bB); bar.position.set(L - 0.6, 1.13, 0.55); W.add(bar);
  const ice = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.5), new THREE.MeshBasicMaterial({color: '#bfe6f5', transparent: true, opacity: 0.7})); ice.position.set(L - 0.6, 1.06, 0.55); W.add(ice);
  const ck = cookie(); ck.position.set(L - 2.1, 1.1, 0.75); W.add(ck);
  const thermo = sign('FRÍO', 0.5, 1.0, {bg: '#cfe8f5', w: 160, h: 320, font: 'bold 70px Arial'}); thermo.position.set(L + 0.2, 1.6, 0.2); W.add(thermo);
  W.add(P.at(P.deskLamp(), L - 2.6, 1.0, 0.1), P.at(P.papers(6, 3), L - 1.4, 1.0, 0.2), P.at(P.mug(), L + 0.2, 1.0, 0.9));
  W.add(P.at(P.bookshelf(4), L - 6.0, 0.05, -5.15), P.at(P.bookshelf(5), L - 3.4, 0.05, -5.15), P.at(P.filingCabinet(), L + 6.4, 0.05, -5.0));
  W.add(P.at(P.wallClock(), L + 5.0, 4.4, -5.4)); const pp = P.poster('ACERO', 1.1, 1.5, '#e6d39a'); P.at(pp, L + 5.2, 2.6, -5.45); W.add(pp);
  W.add(P.at(P.rug(6, 3.6), L - 1.2, 0, 0.6));
  const tipper = addChar(W, chars, {palette: 'pink', hat: 'none', glasses: true, seed: 61}, L - 1.2, 0.05, -0.6);
  addChar(W, chars, {palette: 'teal', hat: 'none', seed: 62}, L + 4.6, 0.05, -2.4);
  const plant = new THREE.Group(); plant.add(cyl(0.35, 0.28, 0.7, '#b35a3a', {y: 0.35})); for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), P.toonMat ? P.toonMat('#4f8a4a') : new THREE.MeshToonMaterial({color: '#4f8a4a'})); l.position.set(Math.cos(i) * 0.3, 0.9 + (i % 3) * 0.25, Math.sin(i) * 0.3); plant.add(l); } plant.position.set(L - 5.6, 0.05, 3.0); W.add(plant);

  // ======== SHOP (weld close-up + cold test) ========
  const S = LOC.shop;
  W.add(room(S, {w: 22, h: 8, d: 12, wall: '#8a8fa3', floor: '#6a6570', seed: 19}));
  W.add(P.at(P.toolRack(1), S - 8, 0, -5.9), P.at(P.toolRack(2), S + 8, 0, -5.9), P.at(P.barrel('#c43d32'), S + 9.4, 0.05, -3.6), P.at(P.barrel('#2f6db3'), S + 8.5, 0.05, -4.3), P.at(P.beamStack(4, 5), S - 8.0, 0.05, -2.2, 0.15));
  const warn = sign('PELIGRO: SOLDANDO', 3.8, 0.9, {bg: '#f2c12e', w: 800, h: 190, font: 'bold 76px Arial'}); warn.position.set(S, 3.8, -5.92); W.add(warn);
  const bench = P.desk(3.4, '#5a5f66'); bench.position.set(S - 2.4, 0.05, -1.4); W.add(bench);
  const plate = new THREE.Group();
  plate.add(box(1.6, 0.08, 1.0, '#9aa0a8', {x: -0.82, thick: 0.006}), box(1.6, 0.08, 1.0, '#9aa0a8', {x: 0.82, thick: 0.006}));
  for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshToonMaterial({color: '#c9ced4'})); r.scale.set(1, 0.6, 1.4); r.position.set(0, 0.05, -0.45 + i * 0.07); plate.add(r); }
  const pit = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({color: '#1a1414'})); pit.position.set(0, 0.09, 0.05); plate.add(pit);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.12, 20), glowMat('#e0533d')); ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.1, 0.05); plate.add(ring);
  const crackL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.025), glowMat('#e0533d')); crackL.position.set(0.7, 0.09, 0.05); crackL.scale.x = 0.001; plate.add(crackL);
  plate.position.set(S - 2.4, 1.05, -1.3); W.add(plate);
  const lbl = sign('DEFECTO', 1.4, 0.45, {bg: '#f4ead4', w: 420, h: 130, font: 'bold 84px Arial'}); lbl.position.set(S - 2.4, 1.75, -1.9); W.add(lbl);
  const cp = charpy(); cp.position.set(S + 3.0, 0.05, -1.8); W.add(cp);
  const cold = sign('PRUEBA EN FRÍO', 3.0, 0.8, {bg: '#cfe8f5', w: 700, h: 180, font: 'bold 92px Arial'}); cold.position.set(S + 3.0, 3.4, -2.0); W.add(cold);
  addChar(W, chars, {palette: 'welder', hat: 'cap', seed: 81}, S + 5.2, 0.05, -1.2);
  addChar(W, chars, {palette: 'navy', hat: 'cap', seed: 82}, S - 5.4, 0.05, -1.8);
  const ssp = sparks(9, 80, 0.12); W.add(ssp);

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    // ship break: hook = broken; noche: crack starts on "cañonazo"; grieta: spreads; later night shots = broken
    let br = 0, cr = 0;
    if (shot === 'hook') { br = 1; cr = 1; }
    else if (shot === 'noche') { const a = wordT('noche', 12); cr = ease(t, a, a + 0.6) * 0.35; br = ease(t, a, a + 0.8) * 0.15; }
    else if (shot === 'grieta') { cr = 0.35 + 0.65 * ease(t, wordT('grieta', 1), wordT('grieta', 8)); br = 0.15 + 0.85 * ease(t, wordT('grieta', 9), wordT('grieta', 16)); }
    else if (shot === 'duda') { br = 1; cr = 1; }
    tanker.userData.setBreak(br, cr);
    tanker.userData.crackMat.color.setHSL(0.08, 1, 0.55 + Math.sin(t * 9) * 0.08);
    const fa = shot === 'noche' ? Math.max(0, 1 - Math.abs(t - wordT('noche', 12) - 0.15) / 0.35) : 0;
    flash.material.opacity = fa * 0.8; flash.scale.setScalar(1 + fa * 2);
    snow.visible = false; if (false) snow.userData.update(t * 0.3, [[cam.position.x - 6, cam.position.y + 6, cam.position.z - 8], [cam.position.x + 6, cam.position.y + 5, cam.position.z - 10]], shot === 'hook' || shot === 'cuando' || shot === 'noche' || shot === 'grieta' || shot === 'duda' ? 0.9 : 0, 5);
    // workers point at the ship on "culparon"
    wk.forEach((c, i) => { c.userData.armR.rotation.z = (shot === 'duda' && i < 3) ? 1.9 * ease(t, wordT('duda', 8), wordT('duda', 8) + 0.4) : (shot === 'grieta' && i === 1 ? 2.2 : 0); });
    // shipyard welding sparks
    const ysOn = (shot === 'prisa' || shot === 'rapido' || shot === 'asi') ? 1 : 0;
    ysp.userData.update(t, yOrig, ysOn);
    weeks.visible = t > wordT('rapido', 10) - 0.1; weeks.scale.setScalar(Math.max(0.001, ease(t, wordT('rapido', 10) - 0.1, wordT('rapido', 10) + 0.3)));
    const bw = [4, 6, 11];
    better.forEach((s, i) => { const a = wordT('asi', bw[i]); s.visible = shot === 'asi' && t > a - 0.05; s.scale.setScalar(Math.max(0.001, ease(t, a - 0.05, a + 0.3))); });
    // lab
    chalk.userData.redraw(ease(t, wordT('frio', 7), wordT('frio', 8)));
    const snap = ease(t, wordT('frio', 8), wordT('frio', 8) + 0.25);
    bA.rotation.z = 0.25 * snap; bB.rotation.z = -0.25 * snap; bA.position.x = -0.31 - 0.05 * snap; bB.position.x = 0.31 + 0.05 * snap;
    const cs = ease(t, wordT('frio', 11), wordT('frio', 10) + 0.25);
    ck.userData.halves[0].position.x = -0.06 * cs; ck.userData.halves[1].position.x = 0.06 * cs; ck.userData.halves[0].rotation.z = 0.2 * cs; ck.userData.halves[1].rotation.z = -0.2 * cs;
    tipper.userData.armR.rotation.z = shot === 'tipper' ? 1.2 + Math.sin(t * 3) * 0.2 : (shot === 'frio' ? 1.6 : 0);
    // shop: crack grows from the defect on "grieta"
    const g = ease(t, wordT('inicio', 12), wordT('inicio', 14) + 0.3);
    crackL.scale.x = Math.max(0.001, g); crackL.position.x = 0.7 * g;
    ring.material.color.setHSL(0.02, 0.8, 0.5 + Math.sin(t * 8) * 0.1);
    ssp.userData.update(t, [[S + 5.0, 1.2, -0.6]], shot === 'cierre' ? 0.8 : 0, 0.4);
    // charpy swing on "prueba"
    const sw = ease(t, wordT('cierre', 8), wordT('cierre', 8) + 0.5);
    cp.userData.arm.rotation.z = shot === 'cierre' ? -1.5 + 1.9 * sw : -1.5;
  };
  return {group: W, update};
}
