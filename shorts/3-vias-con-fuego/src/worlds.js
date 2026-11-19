import * as THREE from 'three';
import {wordT} from './camera.js';
import {ease, sparks, room, board, railLine, train, thermitRig, jar, addChar, P, sign, box, cyl, cloud, glowMat} from './weld.js';

export const LOC = {old: 0, rail: 600, lab: 1200};

export function buildWorld() {
  const W = new THREE.Group();
  const chars = [];

  // ======== OLD JOINTED TRACK ========
  const OX = LOC.old;
  const oldL = railLine(OX, {seed: 7, jointed: true}); W.add(oldL);
  for (let i = 0; i < 7; i++) W.add(cloud(OX - 80 + i * 28, 55 + (i % 3) * 8, -130, 7));
  const oldTrain = train({color: '#2f5d9e', cars: 4}); W.add(oldTrain);
  const traca = sign('¡TRACA, TRACA!', 3.6, 1.0, {bg: '#f2c12e', w: 760, h: 200, font: 'bold 100px Arial'}); traca.position.set(OX + 2, 3.2, 3.2); W.add(traca);
  const fix = sign('REPARAR', 2.4, 0.8, {bg: '#e6d39a', w: 560, h: 180, font: 'bold 100px Arial'}); fix.position.set(OX - 2.2, 2.4, 3.4); W.add(fix);
  const worker = addChar(W, chars, {palette: 'mustard', hat: 'cap', seed: 31}, OX + 1.7, 0.05, 1.5);
  const wrench = box(0.08, 0.5, 0.05, '#8d9199', {thick: 0.004}); wrench.position.set(0.15, -0.45, 0.06); worker.userData.armR.add(wrench);
  addChar(W, chars, {palette: 'navy', hat: 'cap', seed: 32}, OX - 4.5, 0.05, 2.6);
  addChar(W, chars, {palette: 'red', hat: 'cap', seed: 33}, OX + 5.5, 0.05, 3.4);
  const jMain = oldL.userData.joints.find((j) => Math.abs(j.position.x - OX) < 1 && j.position.z > 0);

  // ======== NEW TRACK + THERMIT WELD ========
  const RX = LOC.rail;
  W.add(railLine(RX, {seed: 9, jointed: false}));
  for (let i = 0; i < 7; i++) W.add(cloud(RX - 80 + i * 28, 55 + (i % 3) * 8, -130, 7));
  const rig = thermitRig(); rig.position.set(RX, 0, 0.75); W.add(rig);
  const gap = box(0.18, 0.18, 0.16, '#2b2b2e', {thick: 0.001, edges: false}); gap.position.set(RX, 0.55, 0.75); W.add(gap);
  const rsp = sparks(5, 220, 0.18); W.add(rsp);
  const hot = new THREE.PointLight('#ffb347', 0, 12, 1.4); hot.position.set(RX, 2.4, 1.6); W.add(hot);
  const temp = sign('+2.000 °C', 2.6, 0.9, {bg: '#e0533d', fg: '#fff4dc', w: 600, h: 200, font: 'bold 120px Arial'}); temp.position.set(RX + 2.6, 3.4, 0.2); W.add(temp);
  const one = sign('UNA SOLA PIEZA', 3.2, 0.8, {bg: '#bfe6d0', w: 720, h: 180, font: 'bold 92px Arial'}); one.position.set(RX, 2.2, 2.2); W.add(one);
  const nojoint = sign('KILÓMETROS SIN JUNTAS', 6.4, 1.3, {bg: '#f2c12e', w: 1200, h: 240, font: 'bold 110px Arial'}); nojoint.position.set(RX + 6, 4.5, -6); W.add(nojoint);
  W.add(cyl(0.1, 0.1, 4.0, '#3a3a3f', {x: RX + 3.0, y: 2.0, z: -6}), cyl(0.1, 0.1, 4.0, '#3a3a3f', {x: RX + 9.0, y: 2.0, z: -6}));
  const wA = addChar(W, chars, {palette: 'welder', hat: 'cap', seed: 41}, RX - 1.6, 0.05, 2.4);
  const wB = addChar(W, chars, {palette: 'teal', hat: 'cap', seed: 42}, RX + 2.8, 0.05, 1.5);
  addChar(W, chars, {palette: 'red', hat: 'cap', seed: 43}, RX + 6.5, 0.05, 3.6);
  addChar(W, chars, {palette: 'official', hat: 'cap', seed: 44}, RX - 6.0, 0.05, 3.2);
  W.add(P.at(P.toolbox(), RX - 3.0, 0.05, 2.0), P.at(P.cone(), RX - 4.2, 0.05, 1.6), P.at(P.cone(), RX + 4.2, 0.05, 1.6), P.at(P.barrel('#c43d32'), RX + 3.6, 0.05, 3.0));
  const newTrain = train({color: '#c43d32', cars: 3, modern: true}); W.add(newTrain);

  // ======== LAB (1895) ========
  const L = LOC.lab;
  W.add(room(L, {w: 16, h: 5.5, d: 11, wall: '#d7c8e6', seed: 33}));
  const bench = P.desk(3.6, '#7a4f33'); bench.position.set(L - 1.0, 0.05, 0.4); W.add(bench);
  const jAl = jar('ALUMINIO', '#9aa0a8', '#d8dde2'); jAl.position.set(L - 2.2, 1.0, 0.5); W.add(jAl);
  const jFe = jar('ÓXIDO', '#a0522d', '#9a4e2b'); jFe.position.set(L + 0.2, 1.0, 0.5); W.add(jFe);
  const bowl = cyl(0.35, 0.22, 0.2, '#6a6570', {x: L - 1.0, y: 1.1, z: 0.7}); W.add(bowl);
  const pile = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.25, 14), new THREE.MeshToonMaterial({color: '#8a5a4a'})); pile.position.set(L - 1.0, 1.25, 0.7); W.add(pile);
  const rust = sign('= HERRUMBRE', 1.8, 0.5, {bg: '#e6b48a', w: 560, h: 150, font: 'bold 84px Arial'}); rust.position.set(L + 0.2, 1.95, 0.6); W.add(rust);
  const patent = sign('PATENTE 1895', 2.8, 0.9, {bg: '#f4ead4', w: 700, h: 220, font: 'bold 110px Arial', sub: 'H. GOLDSCHMIDT'}); patent.position.set(L - 4.4, 3.0, -5.42); W.add(patent);
  const chalk = board(4.4, 2.5, (g, w, h, p) => {
    g.fillStyle = '#2f4a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a5a3b'; g.lineWidth = 22; g.strokeRect(0, 0, w, h);
    g.textAlign = 'center'; g.fillStyle = '#f2ead6'; g.font = 'bold 40px Arial'; g.fillText('ALUMINIO  +  ÓXIDO', w / 2, 60);
    // aluminium (left) steals the O from the oxide (right)
    g.fillStyle = '#d8dde2'; g.beginPath(); g.arc(150, 200, 60, 0, 7); g.fill(); g.fillStyle = '#351f22'; g.font = 'bold 54px Arial'; g.fillText('Al', 150, 218);
    g.fillStyle = '#c0663a'; g.beginPath(); g.arc(470, 200, 60, 0, 7); g.fill(); g.fillStyle = '#351f22'; g.fillText('Fe', 470, 218);
    const ox = 470 + (210 - 470) * p, oy = 130 + 10 * Math.sin(p * 3.14);
    g.fillStyle = '#ff6b5b'; g.beginPath(); g.arc(ox + 40, oy, 30, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 40px Arial'; g.fillText('O', ox + 40, oy + 14);
    if (p > 0.9) { g.fillStyle = '#ffd66b'; g.font = 'bold 54px Arial'; g.fillText('¡CALOR!', w / 2, 330); }
  });
  chalk.position.set(L + 2.4, 2.9, -5.35); W.add(chalk);
  W.add(P.at(P.bookshelf(4), L - 6.6, 0.05, -5.15), P.at(P.filingCabinet(), L + 6.4, 0.05, -5.0), P.at(P.wallClock(), L - 1.2, 4.5, -5.4), P.at(P.rug(6, 3.6), L - 1.0, 0, 0.6));
  W.add(P.at(P.deskLamp(), L - 3.0, 1.0, 0.1), P.at(P.papers(6, 5), L + 1.0, 1.0, 0.9));
  const gold = addChar(W, chars, {palette: 'engineer', hat: 'bowler', glasses: true, seed: 61}, L - 1.0, 0.05, -0.7);
  addChar(W, chars, {palette: 'clerk', hat: 'none', seed: 62}, L + 4.8, 0.05, -2.4);
  const lsp = sparks(13, 60, 0.08); W.add(lsp);

  const update = (t, cam, shot) => {
    for (const c of chars) c.userData.update(t, cam.position);
    // old train rolls over the joints during "antes"
    oldTrain.visible = shot === 'antes'; oldTrain.position.set(OX - 25 + (t - wordT('antes', 0)) * 10, 0, 0);
    if (shot === 'antes') oldTrain.position.y = Math.abs(Math.sin(t * 9)) * 0.06;
    traca.visible = shot === 'antes' && t > wordT('antes', 13); traca.scale.setScalar(Math.max(0.001, ease(t, wordT('antes', 13), wordT('antes', 13) + 0.25)));
    fix.visible = shot === 'problema' && t > wordT('problema', 10); fix.scale.setScalar(Math.max(0.001, ease(t, wordT('problema', 10), wordT('problema', 10) + 0.3)));
    const loose = shot === 'problema' ? 1 : 0;
    if (jMain) jMain.userData.bolts.forEach((b, i) => { b.position.z = Math.sin(t * 30 + i) * 0.03 * loose; });
    worker.userData.armR.rotation.z = shot === 'problema' ? 1.2 + Math.sin(t * 7) * 0.4 : 0;
    // thermit sequence on the new track
    let heat = 0, pour = 0, cool = 0;
    if (shot === 'hook') { heat = 1; pour = 1; }
    else if (shot === 'calor') heat = ease(t, wordT('calor', 0), wordT('calor', 4));
    else if (shot === 'molde') heat = ease(t, wordT('molde', 10), wordT('molde', 12));
    else if (shot === 'lava') { heat = 1; pour = 1; }
    else if (shot === 'pieza') cool = ease(t, wordT('pieza', 0), wordT('pieza', 9));
    else if (shot === 'vias' || shot === 'cierre') cool = 1;
    rig.userData.glow.material.opacity = heat * (0.3 + 0.1 * Math.sin(t * 20));
    rig.userData.glow.scale.setScalar(1 + heat * 0.6);
    rig.userData.crucible.material.color.set(heat > 0.5 ? '#ff9f43' : '#5a5f66');
    rig.userData.stream.visible = pour > 0.5; rig.userData.stream.scale.x = 1 + Math.sin(t * 30) * 0.15;
    const moldOn = shot === 'hook' || shot === 'lava' || (shot === 'molde' && t > wordT('molde', 4)) || shot === 'calor';
    rig.userData.mold.visible = moldOn; rig.userData.mold.scale.setScalar(shot === 'molde' ? Math.max(0.001, ease(t, wordT('molde', 4), wordT('molde', 4) + 0.4)) : 1);
    const tripodOn = !(shot === 'pieza' || shot === 'vias' || shot === 'cierre');
    rig.children.forEach((c) => { if (c !== rig.userData.mold && c !== rig.userData.seam) c.visible = tripodOn && (c !== rig.userData.stream || pour > 0.5); });
    rig.userData.seam.visible = shot === 'pieza' || shot === 'vias' || shot === 'cierre';
    rig.userData.seam.material.color.setRGB(1 - 0.45 * cool, 0.75 - 0.2 * cool, 0.35 + 0.2 * cool);
    gap.visible = !(rig.userData.seam.visible || pour > 0.5);
    hot.intensity = (heat + pour) * 8;
    rsp.userData.update(t, [[RX, 2.3, 0.75], [RX, 0.9, 0.75]], (shot === 'hook' || shot === 'lava' || (shot === 'molde' && t > wordT('molde', 10)) || shot === 'calor' && heat > 0.5) ? 1 : 0, 0.8);
    temp.visible = shot === 'calor' && t > wordT('calor', 3); temp.scale.setScalar(Math.max(0.001, ease(t, wordT('calor', 3), wordT('calor', 3) + 0.3)));
    one.visible = shot === 'pieza' && t > wordT('pieza', 7); one.scale.setScalar(Math.max(0.001, ease(t, wordT('pieza', 7), wordT('pieza', 7) + 0.3)));
    nojoint.visible = shot === 'vias' || shot === 'cierre';
    newTrain.visible = shot === 'cierre'; newTrain.position.set(RX - 60 + (t - wordT('cierre', 0)) * 22, 0, 0);
    wA.userData.armR.rotation.z = shot === 'molde' ? 1.6 : 0; wB.userData.armR.rotation.z = shot === 'pieza' ? 2.2 : 0;
    // lab
    const mix = shot === 'mezcla' ? ease(t, wordT('mezcla', 1), wordT('mezcla', 7)) : (shot === 'quimico' ? 0 : 1);
    pile.scale.setScalar(Math.max(0.05, mix)); jAl.rotation.z = shot === 'mezcla' ? -0.6 * Math.sin(Math.min(1, mix) * 3.14) : 0; jFe.rotation.z = shot === 'mezcla' ? 0.6 * Math.sin(Math.min(1, mix) * 3.14) : 0;
    rust.visible = shot === 'mezcla' && t > wordT('mezcla', 11); rust.scale.setScalar(Math.max(0.001, ease(t, wordT('mezcla', 11), wordT('mezcla', 11) + 0.3)));
    chalk.userData.redraw(shot === 'mira' ? ease(t, wordT('mira', 4), wordT('mira', 8)) : (shot === 'quimico' || shot === 'mezcla' ? 0 : 1));
    lsp.userData.update(t, [[L - 1.0, 1.4, 0.7]], shot === 'mira' && t > wordT('mira', 16) ? 1 : 0, 0.4);
    gold.userData.armR.rotation.z = shot === 'quimico' ? 2.1 : (shot === 'mira' ? 1.4 : 0);
  };
  return {group: W, update};
}
