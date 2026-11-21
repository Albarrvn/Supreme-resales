// ¿Qué hay dentro de un electrodo? · despiece style (reels/_lemo/ESTILO_DESPIECE.md). Electrode cut lengthwise: core (alma) + coating (forro).
// Pose A: upright in the air (anatomy). Pose B: welding on the plate (gas, cup, slag, moisture). Model in mm.
import { THREE, clamp, lerp, seg, eio, eo, back, hash, T, W, shotAt, mat, scene, box, mesh, withS, proj, shake,
  ov, INK, CY, OR, RED, tag, pill, arcGlow, comments, writeOn, start } from './engine.js';

const PATH = { value: 0 };
const M = { plate: mat(0x163c45), core: mat(0x38e1ff, 3, 0x2a4f58, PATH), coat: mat(0x23434b, 4), hot: mat(0xff8c2a, 4), bead: mat(0x38e1ff, 4),
  slag: mat(0x7fa6af, 4), crack: mat(0xff4d4d, 4), oven: mat(0x1b4752), win: mat(0x0f2a31) };
scene.add(mesh(box(220, 10, 90, -40, 0, 0), M.plate));
// electrode: tip at origin, axis +y. Core recessed 1.8 mm inside the coating = the cup at the tip
const ROD = new THREE.Group(); scene.add(ROD);
ROD.add(new THREE.Mesh(withS(new THREE.CylinderGeometry(1.6, 1.6, 298, 20).translate(0, 1.8 + 149, 0), (x, y) => 1 - y / 300), M.core));
ROD.add(mesh(new THREE.LatheGeometry([[1.6, 0], [2.9, 0], [2.9, 280], [1.6, 280]].map(p => new THREE.Vector2(...p)), 32), M.coat));
const PUD = mesh(new THREE.SphereGeometry(5.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .45, 1), M.hot); PUD.position.y = 10; scene.add(PUD);
const capsX = (r, len) => new THREE.CapsuleGeometry(r, len, 8, 20).rotateZ(Math.PI / 2);
const BEAD = mesh(capsX(4.5, 110).scale(1, .45, 1), M.bead); BEAD.position.set(-62, 10, 0); scene.add(BEAD);
const SLAG = mesh(capsX(5.2, 110).scale(1, .55, 1), M.slag); SLAG.position.set(-62, 10.4, 0); scene.add(SLAG);
const CRK = new THREE.Group(); CRK.position.set(-45, 10, 0); scene.add(CRK);
[-14, 0, 14].forEach((x, i) => { const c = mesh(box(.8, 4, 6, 0, 0, 0), M.crack); c.position.x = x; c.rotation.z = (i - 1) * .35; CRK.add(c); });
const OVEN = new THREE.Group(); OVEN.position.set(75, 10, -70); scene.add(OVEN);
OVEN.add(mesh(box(90, 70, 60, 0, 0, 0), M.oven)); OVEN.add(mesh(box(60, 40, 1, -5, 15, 30.5), M.win)); OVEN.add(mesh(new THREE.CylinderGeometry(4, 4, 3, 16).rotateX(Math.PI / 2).translate(33, 35, 31), M.slag));

const UP = () => { ROD.position.set(0, 40, 0); ROD.rotation.set(0, 0, 0); };
const WELD = (gap = 3, x = 0) => { ROD.position.set(x, 10 + gap, 0); ROD.rotation.set(0, 0, 20 * Math.PI / 180); };
const tip = () => ROD.localToWorld(new THREE.Vector3(0, 0, 0));

const L_ = Math.log;
const camKeys = [
  [0, [22, 10, L_(900), 0, 175, 0]], [T.pide - 0.3, [10, 6, L_(860), 0, 175, 0]],
  [T.pide, [10, 6, L_(860), 0, 175, 0]], [T.alma - 0.3, [8, 6, L_(820), 0, 175, 0]],
  [T.alma + 0.8, [28, 16, L_(300), 0, 62, 0]], [T.forro - 0.2, [24, 16, L_(290), 0, 62, 0]],
  [T.forro + 0.6, [32, 18, L_(230), 0, 58, 0]], [T.gas - 0.2, [28, 18, L_(225), 0, 58, 0]],
  [T.gas + 0.6, [26, 14, L_(300), -5, 30, 0]], [T.copa - 0.2, [30, 14, L_(290), -5, 30, 0]],
  [T.copa + 0.7, [20, 10, L_(130), -2, 14, 0]], [T.escoria - 0.2, [16, 10, L_(126), -2, 14, 0]],
  [T.escoria + 0.7, [32, 20, L_(260), -50, 18, 0]], [T.humedad - 0.2, [36, 20, L_(250), -50, 18, 0]],
  [T.humedad + 0.7, [26, 16, L_(440), 0, 45, 0]], [T.sintesis - 0.2, [30, 16, L_(450), 0, 45, 0]],
  [T.sintesis + 0.7, [28, 16, L_(300), 0, 62, 0]], [T.cierre - 0.2, [24, 16, L_(310), 0, 62, 0]],
  [T.cierre + 0.8, [20, 8, L_(880), 0, 175, 0]], [T.end, [30, 10, L_(900), 0, 175, 0]],
];

const COAT0 = new THREE.Color(0x23434b), COATH = new THREE.Color(OR);
let ST;
function setScene(t) {
  const k = shotAt(t); ST = { k, clipZ: null, arc: null };
  const weld = ['gas', 'copa', 'escoria', 'humedad'].includes(k);
  weld ? WELD(k === 'copa' ? 2.5 : 3) : UP();
  PUD.visible = weld; BEAD.visible = SLAG.visible = k === 'escoria' || k === 'humedad'; OVEN.visible = k === 'humedad' && t > W('humedad', 22);
  SLAG.scale.y = k === 'escoria' ? Math.max(1e-3, eo(seg(t, W('escoria', 5), W('escoria', 12)))) : 1;
  CRK.visible = k === 'humedad' && t > W('humedad', 16); CRK.scale.set(1, Math.max(1e-3, eo(seg(t, W('humedad', 16), W('humedad', 18)))), 1);
  OVEN.scale.setScalar(OVEN.visible ? Math.max(1e-3, back(seg(t, W('humedad', 22), W('humedad', 23.5)))) : 1);
  // core lights up as the current flows (alma), stays lit as "the metal"; coating glows orange while it is the subject
  PATH.value = k === 'alma' ? eio(seg(t, W('alma', 9), W('alma', 11.5))) : (k === 'sintesis' || k === 'copa') ? 1.01 : 0;
  const hi = k === 'forro' ? eo(seg(t, W('forro', 4), W('forro', 6))) : k === 'sintesis' ? eo(seg(t, W('sintesis', 5), W('sintesis', 7))) : 0;
  M.coat.uniforms.uColor.value.lerpColors(COAT0, COATH, hi * .85);
  if (k === 'alma') ST.clipZ = lerp(3, 0, eio(seg(t, T.alma + .3, T.alma + 1.5)));
  else if (['forro', 'copa', 'sintesis'].includes(k)) ST.clipZ = 0;
  scene.updateMatrixWorld(true); if (weld) ST.arc = tip();
  return ST;
}

const P = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const pop = (t, t0) => t < t0 ? 0 : back(seg(t, t0, t0 + .35));
function icon(t, t0, x, y, draw) { const p = pop(t, t0); if (p <= 0) return; ov.save(); ov.translate(x, y); ov.scale(p * 1.6, p * 1.6); ov.lineWidth = 6; ov.lineCap = ov.lineJoin = 'round'; draw(); ov.restore(); }
const umbrella = () => { ov.strokeStyle = CY; ov.beginPath(); ov.arc(0, 0, 90, Math.PI, 0); for (let i = 3; i >= -3; i -= 2) ov.quadraticCurveTo(i * 30 + 15, -18, i * 30 - 15 + (i === -3 ? -30 : 0) + 30, 0); ov.stroke();
  ov.beginPath(); ov.moveTo(0, -90); ov.lineTo(0, 90); ov.arc(-18, 90, 18, 0, Math.PI); ov.stroke(); };
const shield = () => { ov.strokeStyle = CY; ov.beginPath(); ov.moveTo(0, -60); ov.lineTo(50, -40); ov.quadraticCurveTo(50, 30, 0, 64); ov.quadraticCurveTo(-50, 30, -50, -40); ov.closePath(); ov.stroke(); };
const cloud = () => { ov.strokeStyle = CY; ov.setLineDash([12, 10]); ov.beginPath(); ov.arc(-30, 0, 30, Math.PI * .5, Math.PI * 1.5); ov.arc(5, -25, 36, Math.PI, 0); ov.arc(40, 0, 28, Math.PI * 1.5, Math.PI * .5); ov.closePath(); ov.stroke(); ov.setLineDash([]); };
const blanket = () => { ov.strokeStyle = OR; ov.beginPath(); ov.moveTo(-70, -30); for (let x = -70; x <= 70; x += 10) ov.lineTo(x, -30 + 8 * Math.sin(x / 9)); ov.lineTo(70, 30); for (let x = 70; x >= -70; x -= 10) ov.lineTo(x, 30 + 8 * Math.sin(x / 9)); ov.closePath(); ov.stroke();
  ov.lineWidth = 3; for (let x = -45; x <= 45; x += 30) { ov.beginPath(); ov.moveTo(x, -22); ov.lineTo(x, 22); ov.stroke(); } };
function gasDashes(t, x, y, k) { if (k <= 0) return; ov.save(); ov.strokeStyle = CY; ov.lineWidth = 4; ov.setLineDash([10, 12]); ov.lineDashOffset = -t * 60; ov.globalAlpha = k;
  for (let i = 0; i < 5; i++) { const r = 60 + i * 26 + 12 * Math.sin(t * 3 + i); ov.beginPath(); ov.ellipse(x, y, r * 1.3, r, 0, Math.PI * 1.05, Math.PI * 1.95); ov.stroke(); } ov.restore(); }
function drops(t, t0, t1, x, y) { if (t < t0 || t > t1 + .6) return; ov.save(); ov.fillStyle = CY;
  for (let i = 0; i < 7; i++) { const q = ((t - t0) * 1.2 + hash(i)) % 1, dx = (hash(i + 3) - .5) * 220; ov.globalAlpha = (1 - q) * .9;
    const yy = y - 300 + q * 290; ov.beginPath(); ov.moveTo(x + dx, yy - 34); ov.quadraticCurveTo(x + dx + 22, yy + 8, x + dx, yy + 20); ov.quadraticCurveTo(x + dx - 22, yy + 8, x + dx, yy - 34); ov.fill(); } ov.restore(); }
function hydrogen(t, t0, a, b) { if (t < t0) return; ov.save(); ov.font = '900 64px P'; ov.fillStyle = CY; ov.textAlign = 'center';
  for (let i = 0; i < 4; i++) { const q = ((t - t0) * .9 + i / 4) % 1; ov.globalAlpha = Math.sin(q * Math.PI); ov.fillText('H', lerp(a[0], b[0], q) + 40 * Math.sin(i * 2 + t * 3), lerp(a[1], b[1], q)); } ov.restore(); ov.textAlign = 'left'; }

function overlay(t, st) {
  const k = st.k, tp = tip();
  if (st.arc) arcGlow(t, st.arc);
  if (k === 'hook') { const [x, y] = proj(P(0, 120));
    icon(t, W('hook', 17), x + 230, y - 140, cloud); icon(t, W('hook', 20), x - 230, y + 20, shield); icon(t, W('hook', 24), x + 230, y + 180, blanket);
    writeOn('GAS', x + 230, y - 40, 40, CY, seg(t, W('hook', 17) + .2, W('hook', 17) + .6), 'center'); writeOn('ESCUDO', x - 230, y + 120, 40, CY, seg(t, W('hook', 20) + .2, W('hook', 20) + .6), 'center');
    writeOn('MANTA', x + 230, y + 260, 40, OR, seg(t, W('hook', 24) + .2, W('hook', 24) + .6), 'center'); }
  else if (k === 'pide') comments(t, T.pide + .2, ['¿Qué tiene el electrodo por dentro?', '¿Para qué sirve el forro?', '¿Por qué se guardan en horno?'], 1000);
  else if (k === 'alma') { tag(t, W('alma', 8), P(0, 80, 0), 200, -120, 'ALMA', CY); if (t > W('alma', 10)) pill(t, W('alma', 10), 540, 1180, 'CONDUCE LA CORRIENTE', CY); }
  else if (k === 'forro') { tag(t, W('forro', 5), P(-2.3, 75, 0), -190, -150, 'FORRO', OR); if (t > W('forro', 8)) pill(t, W('forro', 8), 540, 1180, 'POLVO DE MINERALES', OR); }
  else if (k === 'gas') { const [x, y] = proj(tp); gasDashes(t, x, y, seg(t, W('gas', 2), W('gas', 4)));
    icon(t, W('gas', 13), x + 220, y - 300, umbrella); if (t > W('gas', 8)) pill(t, W('gas', 8), 540, 1180, 'EMPUJA EL AIRE', CY); }
  else if (k === 'copa') { tag(t, W('copa', 13), ROD.localToWorld(P(2.9, 0.5, 0)), 190, -170, 'COPITA', OR); if (t > W('copa', 18)) pill(t, W('copa', 18), 540, 1180, 'APUNTA EL ARCO', OR); }
  else if (k === 'escoria') { tag(t, W('escoria', 15), P(-30, 15), -160, -220, 'ESCORIA', OR); const [x, y] = proj(P(-62, 16)); icon(t, W('escoria', 19), x + 240, y - 280, blanket);
    if (t > W('escoria', 22)) pill(t, W('escoria', 22), 540, 1180, 'PROTEGE AL ENFRIAR', OR); }
  else if (k === 'humedad') { const [x, y] = proj(ROD.localToWorld(P(0, 70, 0))); drops(t, W('humedad', 3), W('humedad', 8), x, y);
    const [bx, by] = proj(P(-45, 12)); hydrogen(t, W('humedad', 11), [x, y], [bx, by]);
    if (t > W('humedad', 16)) tag(t, W('humedad', 17), P(-45, 13), 90, -240, 'GRIETA', RED); if (t > W('humedad', 22)) tag(t, W('humedad', 23), P(75, 80, -70), -40, -160, 'HORNO', CY); }
  else if (k === 'sintesis') { tag(t, W('sintesis', 1), P(0, 80, 0), 190, -150, 'ALMA = METAL', CY); tag(t, W('sintesis', 6), P(2.3, 55, 0), 80, 160, 'FORRO = LO DEMÁS', OR); }
  else { comments(t, W('cierre', 2), ['La careta automática', 'La máquina inversora'], 1020); if (t > W('cierre', 7)) pill(t, W('cierre', 7), 540, 1230, 'COMENTA TU IDEA', OR); }
}

start({ subStyle: 'top', keys: ['electrodo', 'gas', 'escudo', 'manta', 'comentarios', 'alma', 'corriente', 'cordón', 'forro', 'minerales', 'paraguas', 'copita', 'boquilla', 'escoria', 'humedad', 'hidrógeno', 'agrieta', 'horno', 'metal', 'demás', 'desmontemos'],
  camKeys, setScene, overlay, shake: t => shake(t, W('humedad', 17)) });
