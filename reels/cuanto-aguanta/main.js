// Reel 3 · ¿Cuánto aguanta un cordón? 6 mm × 5 cm fillet on a vertical lap joint holding a car; throat; lack of fusion + hammer. mm.
// The car is drawn small (diagram scale), not to scale with the joint.
import { THREE, clamp, lerp, seg, eio, eo, hash, T, W, shotAt, mat, scene, box, prism, mesh, proj, shake,
  ov, INK, CY, OR, RED, title, tag, pill, dim, start } from './engine.js';

const M = { plate: mat(0x163c45), plate2: mat(0x1b4752), weld: mat(0x38e1ff, 4), red: mat(0xff4d4d, 4), beam: mat(0x163c45), car: mat(0x1b4752), dark: mat(0x0f2a31), steel: mat(0x2a4f58) };
// fixed: beam + plate A (x -25..25, y 0..120, z -4..4)
scene.add(mesh(box(420, 30, 60, 0, 120, 0), M.beam)); scene.add(mesh(box(50, 120, 8, 0, 0, 0), M.plate));
// everything that can fall hangs in DROP: plate B in front of A, the fillet on B's top edge, cable, car
const DROP = new THREE.Group(); scene.add(DROP);
DROP.add(mesh(box(50, 120, 8, 0, -60, 8), M.plate2));
const FIL = mesh(prism([[0, 0], [6, 0], [0, 6]], -25, 25).rotateY(-Math.PI / 2).translate(0, 60, 4), M.weld); DROP.add(FIL);
const GAP = mesh(box(50, 6, 0.9, 0, 60, 4.45), M.red); scene.add(GAP);
DROP.add(mesh(new THREE.CylinderGeometry(2.5, 2.5, 150, 10).translate(0, -135, 8), M.steel));
const CAR = new THREE.Group(); CAR.position.set(0, -210, 8); CAR.scale.setScalar(.6); DROP.add(CAR);
CAR.add(mesh(box(420, 90, 180, 0, -260, 0), M.car)); CAR.add(mesh(box(230, 85, 160, -20, -170, 0), M.car));
for (const [x, z] of [[-130, 90], [130, 90], [-130, -90], [130, -90]]) CAR.add(mesh(new THREE.CylinderGeometry(40, 40, 26, 24).rotateX(Math.PI / 2).translate(x, -262, z), M.dark));
CAR.add(mesh(box(10, 90, 10, 0, -90, 0), M.steel));
// hammer: pivot above the joint, head swings in from the front
const HAM = new THREE.Group(); HAM.position.set(0, 213, 8); scene.add(HAM);
HAM.add(mesh(box(46, 24, 24, 0, -162, 22), M.steel)); HAM.add(mesh(new THREE.CylinderGeometry(4, 4, 150, 12).translate(0, -75, 22), M.plate2));

const L_ = Math.log;
const camKeys = [
  [0, [30, 10, L_(460), 0, 66, 6]], [W('hook', 8) - 0.1, [34, 10, L_(480), 0, 66, 6]],
  [T.c1 - 0.3, [30, 8, L_(3200), 0, -70, 0]],
  [T.c1 + 0.2, [35, 16, L_(300), 10, 66, 6]], [T.c2 - 0.2, [40, 16, L_(290), 10, 66, 6]],
  [T.c2 + 0.7, [90, 0, L_(130), 0, 66, 6]], [T.c3 - 0.2, [90, 0, L_(125), 0, 66, 6]],
  [T.c3 + 0.6, [35, 15, L_(620), 0, 60, 6]], [T.c4 - 0.2, [40, 15, L_(620), 0, 60, 6]],
  [T.c4 + 0.6, [28, 12, L_(780), 0, 50, 10]], [T.cierre - 0.2, [28, 12, L_(780), 0, 50, 10]],
  [T.cierre + 0.8, [30, 8, L_(3200), 0, -70, 0]], [T.end, [36, 9, L_(3300), 0, -70, 0]],
];

let ST;
function setScene(t) {
  const k = shotAt(t); ST = { k, clipZ: null };
  const bad = k === 'c4'; GAP.visible = bad && t > W('c4', 2.5) && t < W('c4', 11.6); FIL.position.z = bad && t > W('c4', 2.5) ? .9 : 0;
  M.weld.uniforms.uColor.value.set(bad ? '#7FA6AF' : CY);
  const hit = W('c4', 11.6), sw = bad ? eio(seg(t, W('c4', 9), hit)) : 0;
  HAM.visible = bad && t > W('c4', 8.5); HAM.rotation.x = bad ? (t < hit ? lerp(-1.1, 0, sw * sw) : -.12 * Math.sin(seg(t, hit, hit + .4) * Math.PI)) : 0;
  const f = bad ? Math.max(0, t - hit - .05) : 0; DROP.position.set(0, -900 * f * f, 0); DROP.rotation.z = -.25 * f;
  CAR.rotation.z = .03 * Math.sin(t * 1.6); CAR.rotation.x = .02 * Math.sin(t * 1.1);
  return ST;
}

const P = (x, y, z = 0) => new THREE.Vector3(x, y, z);
function overlay(t, st) {
  const k = st.k;
  if (k === 'hook') { title(t, -1, '', '¿AGUANTA', 'UN CARRO?');
    if (t < W('hook', 8)) tag(t, W('hook', 1), P(0, 63, 7), 180, -160, 'CORDÓN', CY);
    else tag(t, W('hook', 12), P(-120, -330, 8), -40, -150, '1.5 TON', OR); }
  else if (k === 'c1') { title(t, T.c1, '', 'FILETE');
    dim(t, W('c1', 4), P(25, 66, 4), P(25, 60, 4), 70, '6 mm'); dim(t, W('c1', 7), P(-25, 60, 10), P(25, 60, 10), -70, '5 cm'); }
  else if (k === 'c2') { title(t, T.c2, '', 'LA', 'GARGANTA');
    dim(t, W('c2', 4), P(25, 60, 4), P(25, 63, 7), 40, 'GARGANTA'); if (t > W('c2', 7)) pill(t, W('c2', 7), 540, 1220, 'LA PARTE MÁS DELGADA', OR); }
  else if (k === 'c3') { title(t, T.c3, '', 'BUENA', 'FUSIÓN');
    tag(t, W('c3', 1), P(0, 63, 7), 190, -170, '✓ FUNDIDO', CY); if (t > W('c3', 6)) pill(t, W('c3', 6), 540, 1220, '+5 TONELADAS', OR); }
  else if (k === 'c4') { title(t, T.c4, '', 'SIN', 'FUSIÓN');
    if (t < W('c4', 11.6)) tag(t, W('c4', 3), P(-12, 63, 4.5), -190, -170, 'NO FUNDIÓ', RED); if (t > W('c4', 9)) pill(t, W('c4', 9), 540, 1220, 'SE DESPEGA', RED); }
  else { title(t, T.cierre, '', 'NO ES EL TAMAÑO', 'ES LA FUSIÓN'); if (t > W('cierre', 14)) pill(t, W('cierre', 14), 540, 1220, 'COMENTA: ¿SÍ O NO?', OR); }
}

start({ camKeys, setScene, overlay, shake: t => shake(t, W('c4', 11.6)) });
