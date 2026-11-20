import * as THREE from 'three';
import {wordT} from './camera.js';
import {ease, sparks, room, board, addChar, P, sign, box, cyl, cloud, ground, facade, lampPost, glowMat} from './weld.js';

export const LOC = {hall: 0, street: 300, lab: 1200};

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];

  // ======== HALL: the electroslag rig ========
  const H = LOC.hall;
  W.add(room(H, {w: 26, h: 10, d: 16, wall: '#5f8fa3', floor: '#6a6570', seed: 19}));
  W.add(P.at(P.toolRack(1), H - 9, 0, -7.9), P.at(P.toolRack(2), H + 9, 0, -7.9), P.at(P.barrel('#c43d32'), H + 10.5, 0.05, -5.6), P.at(P.barrel('#2f6db3'), H + 9.6, 0.05, -6.4), P.at(P.beamStack(4, 5), H - 9.5, 0.05, -4.2, 0.15), P.at(P.ladder(3.4), H - 12, 0.05, -7.2), P.at(P.toolbox(), H + 6, 0.05, -2.2));
  W.add(P.at(P.wallClock(), H - 4, 6.5, -7.9));
  const pst = P.poster('PELIGRO', 1.2, 1.6, '#f2c12e'); P.at(pst, H + 5, 3.4, -7.95); W.add(pst);
  // rig
  const RZ = -2.5, PH = 3.6;
  const plateL = box(1.4, PH, 0.32, '#6f8193', {x: H - 0.77, y: 0.3 + PH / 2, z: RZ, thick: 0.02});
  const plateR = box(1.4, PH, 0.32, '#6f8193', {x: H + 0.77, y: 0.3 + PH / 2, z: RZ, thick: 0.02});
  W.add(box(3.6, 0.3, 1.4, '#3a3f45', {x: H, y: 0.15, z: RZ}), plateL, plateR);
  const thick = sign('30 cm', 1.1, 0.45, {bg: '#f2c12e', w: 320, h: 130, font: 'bold 90px Arial'}); thick.position.set(H + 1.95, 2.0, RZ + 0.18); thick.rotation.y = -0.5; W.add(thick);
  const seamCool = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1, 0.34), new THREE.MeshToonMaterial({color: '#3d4650'})); W.add(seamCool);
  const pool = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.34), glowMat('#ff9a2e')); W.add(pool);
  const slag = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.34), glowMat('#ffe066')); W.add(slag);
  const shoes = new THREE.Group();
  for (const z of [0.24, -0.24]) { shoes.add(box(0.8, 0.5, 0.14, '#c87533', {z, thick: 0.01})); const hose = cyl(0.04, 0.04, 1.6, '#2f6db3', {x: 0.5, y: 0.6, z, seg: 8, thick: 0.004}); hose.rotation.z = -0.5; shoes.add(hose); }
  W.add(shoes);
  const frame = new THREE.Group(); frame.add(box(0.12, 5.2, 0.12, '#3a3f45', {x: -1.8, y: 2.6}), box(0.12, 5.2, 0.12, '#3a3f45', {x: 1.8, y: 2.6}), box(3.7, 0.15, 0.15, '#3a3f45', {y: 5.2}), box(0.7, 0.5, 0.5, '#c43d32', {y: 4.9}));
  frame.position.set(H, 0, RZ); W.add(frame);
  const wire = cyl(0.015, 0.015, 1, '#d9a441', {seg: 6, thick: 0.001}); W.add(wire);
  const hotL = new THREE.PointLight('#ffb347', 0, 8, 1.5); W.add(hotL);
  const arcFlash = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({color: '#e8fbff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false})); W.add(arcFlash);
  const powder = sparks(17, 120, 0.06); powder.material.color.set('#c9b48a'); powder.material.blending = THREE.NormalBlending; W.add(powder);
  const signs = {
    cobre: sign('COBRE + AGUA', 2.4, 0.6, {bg: '#e6b48a', w: 640, h: 160, font: 'bold 92px Arial'}),
    escoria: sign('ESCORIA', 1.8, 0.55, {bg: '#ffe066', w: 520, h: 160, font: 'bold 100px Arial'}),
    sinarco: sign('SIN ARCO', 2.0, 0.6, {bg: '#e0533d', fg: '#fff4dc', w: 560, h: 170, font: 'bold 110px Arial'}),
    gotas: sign('0 GOTAS', 2.0, 0.6, {bg: '#bfe6d0', w: 560, h: 170, font: 'bold 110px Arial'}),
    unpase: sign('1 SOLO PASE', 2.6, 0.7, {bg: '#f2c12e', w: 700, h: 190, font: 'bold 110px Arial'}),
  };
  signs.cobre.position.set(H - 2.3, 2.2, RZ + 0.4); signs.escoria.position.set(H - 2.3, 3.0, RZ + 0.4); signs.sinarco.position.set(H + 2.4, 3.4, RZ + 0.4);
  signs.gotas.position.set(H + 2.4, 4.4, RZ + 0.4); signs.unpase.position.set(H, 5.9, RZ + 0.3);
  Object.values(signs).forEach((s) => W.add(s));
  const op1 = addChar(W, chars, {palette: 'welder', hat: 'cap', seed: 11}, H - 2.6, 0.05, RZ + 1.4);
  addChar(W, chars, {palette: 'navy', hat: 'cap', seed: 12}, H + 3.2, 0.05, RZ + 1.0);
  addChar(W, chars, {palette: 'mustard', hat: 'cap', seed: 13}, H + 5.6, 0.05, RZ + 2.4);
  addChar(W, chars, {palette: 'official', hat: 'none', glasses: true, seed: 14}, H - 5.2, 0.05, RZ + 2.0);
  // classic vertical weld station (left side of the hall)
  const VX = H - 8, VZ = 1.5;
  W.add(box(1.6, 2.6, 0.2, '#8d97a1', {x: VX, y: 1.4, z: VZ}), box(2.0, 0.2, 1.0, '#3a3f45', {x: VX, y: 0.1, z: VZ + 0.3}));
  const vb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1, 0.1), new THREE.MeshToonMaterial({color: '#c9ced4'})); W.add(vb);
  const drips = []; for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), glowMat('#ff9a2e')); W.add(d); drips.push(d); }
  const welderV = addChar(W, chars, {palette: 'red', hat: 'cap', seed: 15}, VX - 1.1, 0.05, VZ + 0.9);
  const vsp = sparks(21, 90, 0.12); W.add(vsp);
  const passes = board(3.2, 2.0, (g, w, h, n) => {
    g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a5a3b'; g.lineWidth = 22; g.strokeRect(0, 0, w, h);
    g.fillStyle = '#9aa0a8'; g.beginPath(); g.moveTo(120, 320); g.lineTo(290, 320); g.lineTo(310, 60); g.lineTo(120, 60); g.fill(); g.beginPath(); g.moveTo(520, 320); g.lineTo(350, 320); g.lineTo(330, 60); g.lineTo(520, 60); g.fill();
    const k = Math.round(n); for (let i = 0; i < k; i++) { const r = Math.floor(i / 3), c = i % 3; g.fillStyle = i === k - 1 ? '#ffb347' : '#d8dde2'; g.beginPath(); g.ellipse(298 + (c - 1) * 14 + (r % 2) * 6, 310 - r * 22, 14 + r * 0.8, 10, 0, 0, 7); g.fill(); }
    g.fillStyle = '#f2ead6'; g.font = 'bold 54px Arial'; g.textAlign = 'center'; g.fillText('PASES: ' + k, w / 2, 48);
  });
  passes.position.set(VX + 3.6, 2.6, VZ - 1.2); passes.rotation.y = -0.35; W.add(passes);

  // ======== STREET: Kiev, 1949 ========
  const S = LOC.street;
  W.add(ground(220, 140, '#a39a8a', {x: S, z: -20, seed: 31, repeat: 14}));
  W.add(box(220, 0.06, 8, '#6e6670', {x: S, y: 0.03, z: 8, thick: 0.001, edges: false}));
  const cols = ['#d1a47a', '#c98f6b', '#b8775e', '#c4a27c', '#a86f5c'];
  for (let i = -5; i <= 5; i++) { const w = 11 + (i % 2) * 2, h = 10 + (i % 3) * 3; const f = facade({w, h, color: cols[(i + 10) % 5], cols: 3, rows: Math.floor(h / 3.6), seed: 40 + i}); f.position.set(S + i * 13, 0, -6); W.add(f); W.add(box(w, h, 8, '#8f6c5e', {x: S + i * 13, y: h / 2, z: -10.4, thick: 0.04})); }
  const inst = sign('INSTITUTO DE SOLDADURA', 6.8, 1.0, {bg: '#f4ead4', w: 1300, h: 190, font: 'bold 110px Arial'}); inst.position.set(S, 5.6, -5.6); W.add(inst);
  const year = sign('KIEV · 1949', 4.0, 1.1, {bg: '#c43d32', fg: '#fff4dc', w: 800, h: 220, font: 'bold 140px Arial'}); year.position.set(S, 3.3, 2.0); W.add(year);
  W.add(cyl(0.08, 0.08, 3.0, '#3a3f45', {x: S - 1.9, y: 1.5, z: 2.0}), cyl(0.08, 0.08, 3.0, '#3a3f45', {x: S + 1.9, y: 1.5, z: 2.0}));
  for (let i = -5; i <= 5; i++) W.add(lampPost(S + i * 9 + 3, 4.0, 5));
  for (let i = 0; i < 6; i++) W.add(P.at(P.tree(1.2, 300 + i), S - 30 + i * 12, 0.05, 3.2));
  for (let i = 0; i < 7; i++) W.add(cloud(S - 80 + i * 28, 55 + (i % 3) * 8, -120, 7));
  const car1 = P.car('#3a3a3f'); car1.position.set(S - 8, 0, 9); car1.rotation.y = Math.PI / 2; W.add(car1);
  const car2 = P.car('#4f8a4a'); car2.position.set(S + 12, 0, 7); car2.rotation.y = -Math.PI / 2; W.add(car2);
  for (const [x, z, pal, s, gl] of [[S - 2.5, 3.6, 'engineer', 31, true], [S + 2.6, 3.4, 'official', 32, true], [S + 5.5, 4.4, 'clerk', 33, false], [S - 6.0, 4.0, 'teal', 34, false], [S + 9, 3.2, 'pink', 35, false]]) addChar(W, chars, {palette: pal, hat: 'bowler', glasses: gl, seed: s}, x, 0.05, z);

  // ======== LAB: the stove analogy ========
  const L = LOC.lab;
  W.add(room(L, {w: 16, h: 5.5, d: 11, wall: '#bfe0db', seed: 8}));
  const desk = P.desk(3.2); desk.position.set(L - 1.0, 0.05, 0.4); W.add(desk);
  const stove = new THREE.Group(); stove.add(box(0.9, 0.12, 0.7, '#e8e0cf', {thick: 0.01}));
  const coilMat = new THREE.MeshBasicMaterial({color: '#4a4a4a'});
  const coil = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 40), coilMat); coil.rotation.x = Math.PI / 2; coil.position.y = 0.08; stove.add(coil);
  const coil2 = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 30), coilMat); coil2.rotation.x = Math.PI / 2; coil2.position.y = 0.08; stove.add(coil2);
  stove.position.set(L - 1.6, 1.08, 0.5); W.add(stove);
  const chalk = board(4.4, 2.5, (g, w, h, p, q) => {
    g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a5a3b'; g.lineWidth = 22; g.strokeRect(0, 0, w, h);
    g.textAlign = 'center'; g.fillStyle = '#f2ead6'; g.font = 'bold 40px Arial'; g.fillText('CORRIENTE  →  ESCORIA  →  CALOR', w / 2, 60);
    g.fillStyle = '#9aa0a8'; g.fillRect(150, 110, 120, 200); g.fillRect(370, 110, 120, 200);
    g.fillStyle = `rgb(255,${150 + 80 * p},60)`; g.fillRect(270, 110, 100, 90);
    g.fillStyle = '#ff9a2e'; g.fillRect(270, 200, 100, 110);
    g.strokeStyle = '#ffe066'; g.lineWidth = 6; for (let i = 0; i < 3; i++) { const y = 120 + ((q * 60 + i * 30) % 90); g.beginPath(); g.moveTo(320, y); g.lineTo(312, y + 14); g.lineTo(328, y + 18); g.lineTo(320, y + 32); g.stroke(); }
    g.fillStyle = '#f2ead6'; g.font = 'bold 30px Arial'; g.fillText('ESCORIA', 320, 100); g.fillText('METAL', 320, 340);
  });
  chalk.position.set(L + 1.4, 2.9, -5.35); W.add(chalk);
  W.add(P.at(P.bookshelf(4), L - 6.0, 0.05, -5.15), P.at(P.filingCabinet(), L + 6.4, 0.05, -5.0), P.at(P.wallClock(), L - 3.4, 4.4, -5.4), P.at(P.rug(6, 3.6), L - 1.0, 0, 0.6), P.at(P.papers(6, 3), L - 0.2, 1.0, 0.3), P.at(P.mug(), L + 0.3, 1.0, 0.9));
  const prof = addChar(W, chars, {palette: 'engineer', hat: 'none', glasses: true, seed: 61}, L - 0.2, 0.05, -0.8);
  addChar(W, chars, {palette: 'teal', hat: 'none', seed: 62}, L + 4.6, 0.05, -2.4);

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    // weld height on the rig
    let h = 0, lit = 0, arc = 0, shoesOn = 1, fill = 1;
    if (shot === 'hook') { h = ease(t, wordT('hook', 0), wordT('hook', 17)); lit = 1; }
    else if (shot === 'placas') { shoesOn = 0; fill = 0; }
    else if (shot === 'zapatas') { shoesOn = ease(t, wordT('zapatas', 3), wordT('zapatas', 6)); fill = 0; }
    else if (shot === 'polvo') { lit = ease(t, wordT('polvo', 6), wordT('polvo', 8)); fill = 0.02; }
    else if (shot === 'pero') { lit = 1; arc = 1 - ease(t, wordT('pero', 7), wordT('pero', 8)); h = 0.05; }
    else if (shot === 'sube') { lit = 1; h = 0.05 + 0.85 * ease(t, wordT('sube', 0), wordT('sube', 14)); }
    else if (shot === 'cierre') { h = 1; lit = 1 - ease(t, wordT('cierre', 6), wordT('cierre', 10)); }
    const y0 = 0.3, top = y0 + Math.max(0.05, h) * PH;
    seamCool.visible = fill > 0 && h > 0.04; seamCool.scale.y = Math.max(0.01, top - y0 - 0.12); seamCool.position.set(H, y0 + (top - y0 - 0.12) / 2, RZ);
    pool.visible = slag.visible = fill > 0 && lit > 0.05; pool.position.set(H, top - 0.06, RZ); slag.position.set(H, top + 0.05, RZ);
    pool.material.color.setHSL(0.07, 1, 0.5 + 0.08 * Math.sin(t * 9)); slag.material.color.setHSL(0.13, 1, 0.55 + 0.1 * Math.sin(t * 6 + 1));
    shoes.visible = shoesOn > 0.01; shoes.position.set(H + (1 - shoesOn) * 3, top - 0.02, RZ); shoes.scale.setScalar(Math.max(0.01, shoesOn));
    wire.scale.y = Math.max(0.01, 4.9 - top); wire.position.set(H, top + (4.9 - top) / 2, RZ);
    hotL.position.set(H, top + 0.3, RZ + 0.8); hotL.intensity = lit * (8 + 2 * Math.sin(t * 13));
    arcFlash.position.set(H, top + 0.08, RZ + 0.18); arcFlash.material.opacity = arc * (0.6 + 0.4 * Math.sin(t * 70)); arcFlash.scale.setScalar(1 + arc * Math.sin(t * 50) * 0.3);
    powder.userData.update(t, [[H, 4.6, RZ]], shot === 'polvo' ? 1 : 0, 0.15);
    const pop = (s, on, a) => { s.visible = on; s.scale.setScalar(on ? Math.max(0.001, ease(t, a, a + 0.3)) : 0.001); };
    pop(signs.cobre, shot === 'zapatas', wordT('zapatas', 6));
    pop(signs.escoria, shot === 'polvo', wordT('polvo', 12));
    pop(signs.sinarco, shot === 'pero', wordT('pero', 8));
    pop(signs.gotas, shot === 'cierre', wordT('cierre', 13));
    pop(signs.unpase, shot === 'hook' || shot === 'cierre', shot === 'hook' ? wordT('hook', 11) : wordT('cierre', 0));
    op1.userData.armR.rotation.z = shot === 'zapatas' ? 1.6 : (shot === 'cierre' ? 2.4 + Math.sin(t * 6) * 0.3 : 0);
    // classic vertical station: bead climbs, drips fall
    const vOn = shot === 'mira' || shot === 'pases';
    const vh = vOn ? 0.4 + ((t * 0.12) % 1.6) : 0.4;
    vb.visible = vOn; vb.scale.y = vh; vb.position.set(VX, 0.4 + vh / 2, VZ + 0.12);
    drips.forEach((d, i) => { const k = (t * 0.9 + i / drips.length) % 1; d.visible = shot === 'mira'; d.position.set(VX + (i - 2.5) * 0.04, 0.4 + vh - k * (0.4 + vh) * 0.9, VZ + 0.22 + k * 0.15); });
    vsp.userData.update(t, [[VX, 0.4 + vh, VZ + 0.2]], vOn ? 0.9 : 0, 0.5);
    welderV.userData.armR.rotation.z = vOn ? 1.3 + Math.sin(t * 5) * 0.1 : 0;
    if (shot === 'pases') passes.userData.redraw(1 + 38 * ease(t, wordT('pases', 7), wordT('pases', 12)));
    else passes.userData.redraw(1);
    // lab
    const heat = shot === 'mira2' ? ease(t, wordT('mira2', 12), wordT('mira2', 16)) : 0;
    coilMat.color.setRGB(0.29 + 0.7 * heat, 0.29 + 0.2 * heat, 0.29 - 0.1 * heat);
    chalk.userData.redraw(shot === 'mira2' ? ease(t, wordT('mira2', 1), wordT('mira2', 6)) : 0, shot === 'mira2' ? t : 0);
    prof.userData.armR.rotation.z = shot === 'mira2' ? 1.5 + Math.sin(t * 3) * 0.2 : 0;
  };
  return {group: W, update};
}
