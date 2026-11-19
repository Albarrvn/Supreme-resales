import * as THREE from 'three';
import {wordT} from './camera.js';
import {ease, sparks, room, board, harbor, shipyard, ship, water, block, addChar, P, sign, box, cyl, crate, cloud, glowMat} from './weld.js';

export const LOC = {rows: 0, yard: 400, ocean: 800, shop: 1300, office: 1400};

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];

  // ======== SHIPYARD ========
  const Y = LOC.yard;
  W.add(shipyard(Y, {seed: 5}));
  const peary = ship({len: 42, color: '#6b7885', deckColor: '#8a5a3b', cargo: true, name: 'ROBERT E. PEARY'}); peary.position.set(Y, 1.9, -6); peary.userData.baseY = 1.9; W.add(peary);
  const banner = sign('4 DÍAS 15 HORAS', 9, 2.0, {bg: '#c43d32', fg: '#fff4dc', w: 1100, h: 240, font: 'bold 150px Arial'}); banner.position.set(Y, 10.5, 1.0); W.add(banner);
  W.add(cyl(0.12, 0.14, 10.5, '#3a3a3a', {x: Y - 4.6, y: 5.25, z: 1.0}), cyl(0.12, 0.14, 10.5, '#3a3a3a', {x: Y + 4.6, y: 5.25, z: 1.0}));
  const place = sign('RICHMOND, CALIFORNIA', 5.6, 1.4, {bg: '#e6d39a', w: 1000, h: 250, font: 'bold 100px Arial', sub: '1942'}); place.position.set(Y - 10, 2.6, 7.5); W.add(place);
  W.add(cyl(0.08, 0.08, 2.0, '#3a3a3f', {x: Y - 12.4, y: 1.0, z: 7.5}), cyl(0.08, 0.08, 2.0, '#3a3a3f', {x: Y - 7.6, y: 1.0, z: 7.5}));
  const dates = [sign('8 NOV · QUILLA', 3.8, 1.0, {bg: '#f4ead4', w: 760, h: 200, font: 'bold 96px Arial'}), sign('12 NOV · AL AGUA', 3.8, 1.0, {bg: '#bfe6d0', w: 760, h: 200, font: 'bold 92px Arial'})];
  dates.forEach((s, i) => { s.position.set(Y + 7 + i * 4.4, 3.0, 6.6); W.add(s); });
  const blk = block('#7d8a95'); W.add(blk);
  const yw = [];
  for (const [x, y, z, pal, s] of [[Y - 8, 3.0, -0.6, 'welder', 21], [Y - 3, 3.0, -0.6, 'navy', 22], [Y + 3, 6.0, -0.6, 'welder', 23], [Y + 7, 3.0, -0.6, 'teal', 24], [Y - 12, 6.0, -0.6, 'mustard', 25], [Y + 11, 6.0, -0.6, 'red', 29]]) yw.push(addChar(W, chars, {palette: pal, hat: 'cap', seed: s}, x, y, z, Math.PI));
  for (const [x, z, pal, s] of [[Y + 6, 3.6, 'red', 26], [Y - 6, 5.2, 'official', 27], [Y + 1, 8.5, 'clerk', 28], [Y - 2, 4.4, 'pink', 30], [Y + 12, 9, 'mustard', 31]]) addChar(W, chars, {palette: pal, hat: 'cap', seed: s}, x, 0.05, z);
  const ysp = sparks(7, 240, 0.3); W.add(ysp);
  const yOrig = yw.map((c) => [c.position.x, c.position.y + 1.0, c.position.z - 0.7]);
  const flood = new THREE.PointLight('#ffd9a0', 0, 60, 1.0); flood.position.set(Y, 14, 8); W.add(flood);

  // ======== OCEAN ========
  const O = LOC.ocean;
  W.add(water(O, 500, 400, {z: -60, color: '#3f86b3'}));
  const cargo = ship({len: 38, color: '#5f6b4f', deckColor: '#8a5a3b', cargo: true}); cargo.position.set(O, 0, -14); W.add(cargo);
  const cargo2 = ship({len: 34, color: '#6b5f4f', deckColor: '#8a5a3b', cargo: true}); cargo2.position.set(O - 40, 0, -40); W.add(cargo2);
  const peri = new THREE.Group(); peri.add(cyl(0.18, 0.2, 2.6, '#3a3f45', {y: 1.0})); peri.add(box(0.7, 0.3, 0.3, '#3a3f45', {x: 0.25, y: 2.3})); const wake = box(4, 0.03, 0.5, '#e6f2f7', {x: -2.4, y: 0.02, edges: false, thick: 0.001}); peri.add(wake); W.add(peri);
  for (let i = 0; i < 7; i++) W.add(cloud(O - 80 + i * 28, 60 + (i % 3) * 8, -150, 7));
  const stormC = new THREE.Group(); for (let i = 0; i < 9; i++) stormC.add(cloud(O - 60 + i * 16, 40 + (i % 3) * 8, -70, 8, '#59606e')); W.add(stormC);
  const frag = sign('ACERO FRÁGIL', 4.0, 1.0, {bg: '#cfe8f5', w: 800, h: 200, font: 'bold 100px Arial'}); frag.position.set(O + 6, 9.5, -10); W.add(frag);

  // ======== ROWS OF LIBERTY SHIPS (harbor, day) ========
  W.add(harbor(LOC.rows, {lit: false, seed: 4}));
  const fleet = [];
  for (let i = 0; i < 9; i++) { const s = ship({len: 34, color: ['#6b7885', '#5f6b4f', '#6b5f4f'][i % 3], deckColor: '#8a5a3b', cargo: true}); s.position.set(LOC.rows - 60 + (i % 5) * 30, 0, -2 - Math.floor(i / 5) * 22); s.visible = false; W.add(s); fleet.push(s); }
  const total = sign('+2.700 BARCOS', 6.0, 1.5, {bg: '#f2c12e', w: 1000, h: 250, font: 'bold 140px Arial'}); total.position.set(LOC.rows, 4.6, 8.5); W.add(total);

  // ======== SHOP: welded vs riveted ========
  const S = LOC.shop;
  W.add(room(S, {w: 22, h: 8, d: 12, wall: '#8a8fa3', floor: '#6a6570', seed: 19}));
  W.add(P.at(P.toolRack(1), S - 8, 0, -5.9), P.at(P.toolRack(2), S + 8, 0, -5.9), P.at(P.barrel('#c43d32'), S + 9.4, 0.05, -3.6), P.at(P.beamStack(4, 5), S - 8.0, 0.05, -2.2, 0.15), P.at(P.ladder(3.2), S - 10, 0.05, -5.2));
  const mkPlate = (x, welded) => {
    const g = new THREE.Group();
    g.add(box(1.5, 2.6, 0.12, '#9aa0a8', {x: -0.78, y: 1.6, thick: 0.01}), box(1.5, 2.6, 0.12, '#9aa0a8', {x: 0.78, y: 1.6, thick: 0.01}));
    const items = [];
    if (welded) { const bead = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.1), glowMat('#e8902e')); bead.position.set(0, 1.6, 0.08); g.add(bead); items.push(bead); }
    else { g.add(box(0.7, 2.6, 0.06, '#8d9199', {y: 1.6, z: 0.09, thick: 0.006})); for (let i = 0; i < 10; i++) for (const dx of [-0.18, 0.18]) { const r = cyl(0.07, 0.07, 0.06, '#5a5f66', {x: dx, y: 0.5 + i * 0.24, z: 0.14, seg: 10, thick: 0.004}); r.rotation.x = Math.PI / 2; g.add(r); items.push(r); } }
    g.add(box(3.4, 0.4, 0.8, '#5a5f66', {y: 0.2, thick: 0.01}));
    g.position.set(x, 0, -3); W.add(g); g.userData.items = items; return g;
  };
  const pW = mkPlate(S - 2.6, true), pR = mkPlate(S + 2.6, false);
  const sW = sign('SOLDADO', 2.6, 0.8, {bg: '#bfe6d0', w: 600, h: 180, font: 'bold 96px Arial'}); sW.position.set(S - 2.6, 3.6, -2.9); W.add(sW);
  const sR = sign('REMACHES', 2.6, 0.8, {bg: '#e6d39a', w: 600, h: 180, font: 'bold 96px Arial'}); sR.position.set(S + 2.6, 3.6, -2.9); W.add(sR);
  const fast = sign('MÁS RÁPIDO', 2.6, 0.7, {bg: '#f2c12e', w: 600, h: 160, font: 'bold 90px Arial'}); fast.position.set(S - 2.6, 4.5, -2.85); W.add(fast);
  addChar(W, chars, {palette: 'welder', hat: 'cap', seed: 81}, S - 5.0, 0.05, -1.5);
  addChar(W, chars, {palette: 'navy', hat: 'cap', seed: 82}, S + 5.2, 0.05, -1.8);
  const ssp = sparks(9, 90, 0.12); W.add(ssp);

  // ======== OFFICE: calendar + the challenge ========
  const F = LOC.office;
  W.add(room(F, {w: 16, h: 5.5, d: 11, wall: '#c9dbef', floor: '#8a6a4e', seed: 27}));
  const cal = board(4.6, 3.0, (g, w, h, days, reto) => {
    g.fillStyle = '#f7f0de'; g.fillRect(0, 0, w, h); g.fillStyle = '#c43d32'; g.fillRect(0, 0, w, 70);
    g.fillStyle = '#fff'; g.font = 'bold 44px Arial'; g.textAlign = 'center'; g.fillText(reto > 0.5 ? 'RETO' : 'CALENDARIO', w / 2, 50);
    g.fillStyle = '#351f22';
    if (reto > 0.5) { g.font = 'bold 150px Arial'; g.fillText('4 DÍAS', w / 2, 250); g.globalAlpha = Math.min(1, (reto - 0.5) * 2); g.font = 'bold 40px Arial'; g.fillStyle = '#c43d32'; g.fillText('¿IMPOSIBLE?', w / 2, 330); g.globalAlpha = 1; }
    else { g.strokeStyle = '#bcae92'; g.lineWidth = 2; for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) g.strokeRect(30 + i * 83, 90 + j * 62, 80, 58); g.font = 'bold 130px Arial'; g.fillStyle = 'rgba(53,31,34,0.9)'; g.fillText(Math.round(days) + '+ DÍAS', w / 2, 270); }
  }, {frame: '#4a3a2e', cw: 640, ch: 360});
  cal.position.set(F + 1.0, 2.9, -5.35); W.add(cal);
  const d1 = P.desk(3.0); d1.position.set(F - 2.2, 0.05, 0.4); W.add(d1);
  W.add(P.at(P.phone(), F - 3.2, 1.0, 0.4), P.at(P.papers(7, 3), F - 2.0, 1.0, 0.3), P.at(P.mug(), F - 1.0, 1.0, 0.8), P.at(P.deskLamp(), F - 3.4, 1.0, 0.0));
  W.add(P.at(P.filingCabinet(), F - 7.2, 0.05, -4.9), P.at(P.filingCabinet('#8f7d6a'), F - 6.4, 0.05, -4.9), P.at(P.bookshelf(4), F + 5.6, 0.05, -5.15), P.at(P.wallClock(), F - 3.6, 4.4, -5.4));
  const pst = P.poster('NAVY', 1.0, 1.4, '#cfe3f0'); P.at(pst, F - 5.0, 3.1, -5.45); W.add(pst);
  W.add(P.at(P.rug(6, 3.6, '#3e5a7a', '#d9a441'), F - 1.0, 0, 0.6));
  const boss = addChar(W, chars, {palette: 'official', hat: 'bowler', glasses: true, seed: 91}, F - 2.2, 0.05, -0.7);
  addChar(W, chars, {palette: 'clerk', hat: 'none', seed: 92}, F + 4.2, 0.05, -2.0);
  const shipModel = ship({len: 40, color: '#6b7885', cargo: true}); shipModel.scale.setScalar(0.035); shipModel.position.set(F - 1.4, 1.12, 0.6); W.add(shipModel);

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    // yard welding sparks + night shift
    const on = (shot === 'hook' || shot === 'cuando' || shot === 'bloques' || shot === 'ritmo') ? 1 : 0;
    ysp.userData.update(t, yOrig, on);
    flood.intensity = shot === 'ritmo' ? 40 : 0;
    // block lowered by the crane on "bloques"
    const bl = ease(t, wordT('bloques', 4), wordT('bloques', 13));
    blk.visible = shot === 'bloques'; blk.position.set(Y + 6, 14 - 6.6 * bl, -6);
    // launch on "flotaba"
    const la = shot === 'dia' ? ease(t, wordT('dia', 14), wordT('dia', 17)) : 0;
    peary.position.set(Y, 1.9 - 1.9 * la, -6 - 40 * la);
    dates[0].visible = shot === 'dia'; dates[1].visible = shot === 'dia' && t > wordT('dia', 8);
    dates[1].scale.setScalar(Math.max(0.001, ease(t, wordT('dia', 8), wordT('dia', 8) + 0.3)));
    banner.visible = shot === 'hook' || shot === 'cuando';
    // ocean: periscope cruises, cargo ship lists on "hundían"
    peri.position.set(O + 18 - (t % 30) * 0.8, 0, 2);
    const sink = shot === 'mira' ? ease(t, wordT('mira', 7), wordT('mira', 12)) : 0;
    cargo.rotation.z = 0.12 * sink; cargo.rotation.x = 0.05 * sink; cargo.position.y = -1.5 * sink;
    const storm = shot === 'pero' || shot === 'cierre'; stormC.visible = storm; frag.visible = storm && t > wordT('pero', 6);
    frag.scale.setScalar(Math.max(0.001, ease(t, wordT('pero', 6), wordT('pero', 6) + 0.3)));
    // the closing tease: a crack starts on the cargo ship
    const cr = shot === 'cierre' ? ease(t, wordT('cierre', 5), wordT('cierre', 8)) : 0;
    cargo.userData.setBreak(cr * 0.4, cr);
    if (shot === 'cierre') { cargo.rotation.z = 0; cargo.rotation.x = 0; }
    cargo.userData.crackMat.color.setHSL(0.08, 1, 0.55 + Math.sin(t * 9) * 0.08);
    // fleet appears ship by ship on the number
    fleet.forEach((s, i) => { const a = wordT('total', 2) + i * 0.18; s.visible = shot === 'total' && t > a; s.scale.setScalar(Math.max(0.001, ease(t, a, a + 0.3))); });
    total.visible = shot === 'total' && t > wordT('total', 7); total.scale.setScalar(Math.max(0.001, ease(t, wordT('total', 7), wordT('total', 7) + 0.3)));
    // office calendar
    if (shot === 'meses' || shot === 'reto') cal.userData.redraw(shot === 'meses' ? 200 * ease(t, wordT('meses', 6), wordT('meses', 10)) : 200, shot === 'reto' ? 0.75 * ease(t, wordT('reto', 9.5), wordT('reto', 10)) + 0.25 * ease(t, wordT('reto', 12.5), wordT('reto', 13)) : 0);
    boss.userData.armR.rotation.z = shot === 'reto' ? 2.0 + Math.sin(t * 4) * 0.2 : 0;
    // shop: weld glows, rivets pop in one by one
    pW.userData.items[0].material.color.setHSL(0.075, 0.85, 0.5 + Math.sin(t * 6) * 0.06);
    pR.userData.items.forEach((r, i) => { const a = wordT('secreto', 12) + i * 0.06; r.visible = shot !== 'secreto' || t > a; });
    fast.visible = shot === 'secreto' && t > wordT('secreto', 8); fast.scale.setScalar(Math.max(0.001, ease(t, wordT('secreto', 8), wordT('secreto', 8) + 0.3)));
    ssp.userData.update(t, [[S - 2.6, 1.6, -2.8]], shot === 'secreto' ? 0.8 : 0, 0.5);
  };
  return {group: W, update};
}
