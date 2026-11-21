// Reel 2 · ¿Se te pega el electrodo? Machine dial, rod, puddle, stuck blob; tap vs scratch start; twist-and-pull. Model in mm.
import { THREE, clamp, lerp, seg, eio, eo, hash, T, W, shotAt, mat, scene, box, mesh, proj, shake,
  ov, INK, CY, OR, RED, title, tag, pill, dim, arcGlow, writeOn, start } from './engine.js';

const LEN = 120;
const M = { plate: mat(0x163c45), rod: mat(0x2a4f58), flux: mat(0x23434b), hold: mat(0x1b4752), hot: mat(0xff8c2a, 4), weld: mat(0x38e1ff, 4), box: mat(0x1b4752), dial: mat(0x163c45), red: mat(0xff4d4d, 4) };
scene.add(mesh(box(160, 10, LEN, 0, 0, 0), M.plate));
// welding machine with a big amperage dial (front face at z = -20)
const MACH = new THREE.Group(); MACH.position.set(-125, 0, -50); scene.add(MACH);
MACH.add(mesh(box(80, 70, 50, 0, 0, 0), M.box));
const DIAL = new THREE.Group(); DIAL.position.set(0, 42, 25.5); MACH.add(DIAL);
DIAL.add(mesh(new THREE.CylinderGeometry(17, 17, 3, 40).rotateX(Math.PI / 2), M.dial));
const NEEDLE = new THREE.Group(); NEEDLE.position.z = 2; DIAL.add(NEEDLE); NEEDLE.add(mesh(box(2.4, 15, 2, 0, 0, 0), M.red));
// electrode: tip at origin, axis +y; core Ø3.2, flux Ø5.2, holder
const ROD = new THREE.Group(); scene.add(ROD);
ROD.add(mesh(new THREE.CylinderGeometry(1.6, 1.6, 4, 16).translate(0, 2, 0), M.rod));
ROD.add(mesh(new THREE.CylinderGeometry(2.6, 2.6, 150, 20).translate(0, 79, 0), M.flux));
ROD.add(mesh(new THREE.CylinderGeometry(6, 6, 14, 20).translate(0, 158, 0), M.hold));
ROD.add(mesh(new THREE.CylinderGeometry(9, 9, 70, 20).translate(0, 200, 0), M.hold));
const PUD = mesh(new THREE.SphereGeometry(5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, .45, 1), M.hot); PUD.position.y = 10; scene.add(PUD);
const BLOB = mesh(new THREE.SphereGeometry(3.2, 20, 14), M.hot); scene.add(BLOB);
const BEAD = mesh(new THREE.CylinderGeometry(4, 4, 1, 20).rotateZ(Math.PI / 2).scale(1, .55, 1), M.weld); BEAD.position.y = 10; scene.add(BEAD);
function aim(x, gap, lean = 20, spin = 0, bend = 0) { ROD.position.set(x, 10 + gap, 0); ROD.rotation.set(0, spin, -(lean + bend) * Math.PI / 180, 'ZYX'); }
const tip = () => ROD.localToWorld(new THREE.Vector3(0, 0, 0));

const L_ = Math.log;
const camKeys = [
  [0, [28, 16, L_(800), -45, 40, -15]], [T.p1 - 0.3, [24, 14, L_(780), -45, 40, -15]],
  [T.p1 + 0.3, [0, 4, L_(400), -125, 40, -25]], [W('p1', 8) - 0.2, [0, 4, L_(390), -125, 40, -25]],
  [W('p1', 9) + 0.4, [22, 10, L_(360), 0, 22, 0]], [T.p2 - 0.2, [22, 10, L_(350), 0, 22, 0]],
  [T.p2 + 0.6, [0, 3, L_(300), 0, 18, 0]], [T.p3 - 0.2, [0, 3, L_(300), 0, 18, 0]],
  [T.p3 + 0.6, [0, 3, L_(400), -8, 22, 0]], [T.p4 - 0.2, [0, 3, L_(400), -8, 22, 0]],
  [T.p4 + 0.6, [0, 2, L_(160), 0, 14, 0]], [T.cierre - 0.2, [0, 2, L_(165), 0, 14, 0]],
  [T.cierre + 0.7, [26, 12, L_(650), 10, 40, 0]], [T.end, [32, 14, L_(680), 10, 40, 0]],
];

let ST;
function setScene(t) {
  const k = shotAt(t); ST = { k, clipZ: null, arc: null, stuck: false };
  PUD.visible = false; BLOB.visible = false; BEAD.visible = false; NEEDLE.rotation.z = -.4;
  if (k === 'hook') { const w = Math.sin(t * 14) * 4 * seg(t, .3, .6); aim(0, 0, 20 + w); ST.stuck = true; }
  if (k === 'p1') { NEEDLE.rotation.z = lerp(-1.2, 1.2, eio(seg(t, W('p1', 2), W('p1', 4))));
    const d = seg(t, W('p1', 9), W('p1', 13)); aim(0, lerp(8, 0, eio(d)), 20); ST.arc = d > 0 && d < 1 ? true : null; ST.stuck = t > W('p1', 13); }
  if (k === 'p2') { const s = eio(seg(t, W('p2', 6), W('p2', 11))); aim(0, lerp(3.2, 0, s), 20); ST.arc = s < 1; ST.stuck = s >= 1; PUD.visible = true; }
  if (k === 'p3') { const bad = t < W('p3', 5);
    if (bad) { const q = (t * 3) % 1; aim(-10, q < .5 ? lerp(14, 0, q * 2) : lerp(0, 14, (q - .5) * 2), 20); ST.stuck = q > .45 && q < .55; }
    else { const s = seg(t, W('p3', 6), W('p3', 10)), up = eo(seg(t, W('p3', 11), W('p3', 13)));
      aim(lerp(-30, 10, eio(s)), s < 1 ? 0.3 + Math.sin(s * Math.PI) * 1.5 : lerp(0.3, 3.2, up), 20); ST.arc = s > .5; ST.scratch = s; } }
  if (k === 'p4') { aim(0, 3.2, 0); ST.arc = true; PUD.visible = true; }
  if (k === 'cierre') { const tw = eio(seg(t, W('cierre', 5), W('cierre', 7))), pull = eo(seg(t, W('cierre', 7), W('cierre', 8.5))), bend = eio(seg(t, W('cierre', 8), W('cierre', 10)));
    if (t < W('cierre', 8)) { aim(0, lerp(0, 40, pull), 20, tw * Math.PI * 1.5); ST.stuck = pull < .05; }
    else { aim(40, 0, 20, 0, -28 * bend); ST.stuck = true; ST.bent = true; } }
  BLOB.visible = ST.stuck; if (ST.stuck) { scene.updateMatrixWorld(true); BLOB.position.copy(tip()).setY(10.8); }
  if (k === 'p3' && ST.scratch > 0) { BEAD.visible = true; const x0 = -30, x1 = lerp(-30, 10, eio(ST.scratch)); BEAD.scale.set(Math.max(1e-3, x1 - x0), 1, 1); BEAD.position.x = (x0 + x1) / 2; M.weld.uniforms.uColor.value.set(OR); }
  scene.updateMatrixWorld(true); if (ST.arc) ST.arc = tip();
  return ST;
}

const P = (x, y, z = 0) => new THREE.Vector3(x, y, z);
function bigX(t, t0, x, y, r) { if (t < t0) return; const p = eo(seg(t, t0, t0 + .3)); ov.save(); ov.strokeStyle = RED; ov.lineWidth = 16; ov.lineCap = 'round';
  ov.beginPath(); ov.moveTo(x - r * p, y - r * p); ov.lineTo(x + r * p, y + r * p); ov.moveTo(x + r * p, y - r * p); ov.lineTo(x - r * p, y + r * p); ov.stroke(); ov.restore(); }
function spinArrow(t, t0, x, y, r) { if (t < t0) return; const p = eo(seg(t, t0, t0 + .5)), a0 = t * 4; ov.save(); ov.strokeStyle = CY; ov.fillStyle = CY; ov.lineWidth = 7;
  ov.beginPath(); ov.ellipse(x, y, r, r * .35, 0, a0, a0 + 4.6 * p); ov.stroke(); const ex = x + Math.cos(a0 + 4.6 * p) * r, ey = y + Math.sin(a0 + 4.6 * p) * r * .35;
  ov.beginPath(); ov.arc(ex, ey, 11, 0, 7); ov.fill(); ov.restore(); }

function overlay(t, st) {
  const k = st.k, tp = tip();
  if (st.arc) arcGlow(t, st.arc);
  if (k === 'hook') { title(t, 0, '', '¿SE TE PEGA', 'EL ELECTRODO?');
    if (st.stuck) tag(t, .8, P(tp.x, 11), -170, -150, 'PEGADO', RED);
    const [mx, my] = proj(P(-125, 40, -25)); bigX(t, W('hook', 7), mx, my, 80);
    if (t > W('hook', 11)) pill(t, W('hook', 11), 540, 1220, '3 CAUSAS', OR); }
  else if (k === 'p1') { title(t, T.p1, '1', 'AMPERAJE BAJO');
    const [dx, dy] = proj(P(-125, 42, -24)); if (t < W('p1', 9)) { writeOn('BAJO', dx - 150, dy + 120, 44, RED, seg(t, W('p1', 3), W('p1', 4)), 'center'); writeOn('ALTO', dx + 150, dy + 120, 44, CY, seg(t, W('p1', 3), W('p1', 4)), 'center'); }
    if (t > W('p1', 6) && t < W('p1', 9)) pill(t, W('p1', 6), 540, 1220, 'POCO CALOR', RED);
    if (t > W('p1', 13)) { tag(t, W('p1', 13), P(tp.x, 11), 170, -150, 'SE SUELDA', RED); } }
  else if (k === 'p2') { title(t, T.p2, '2', 'ARCO MUY CORTO');
    if (t > W('p2', 6)) pill(t, W('p2', 6), 540, 1130, 'HUNDES LA VARILLA', RED); if (st.stuck) tag(t, W('p2', 12), P(tp.x + 2, 11), 170, -150, 'SE PEGA', RED); }
  else if (k === 'p3') { title(t, T.p3, '3', t < W('p3', 5) ? 'COMO MARTILLO' : 'COMO FÓSFORO');
    if (t < W('p3', 5)) { const [x, y] = proj(P(-10, 30)); bigX(t, W('p3', 3), x + 160, y - 80, 70); pill(t, W('p3', 2), 540, 1220, '✗ GOLPEAR', RED); }
    else { pill(t, W('p3', 6), 540, 1130, '✓ RAYAR', CY); if (t > W('p3', 11)) pill(t, W('p3', 11), 540, 1240, 'Y LEVANTA UN POQUITO', OR); } }
  else if (k === 'p4') { title(t, T.p4, '', 'LA DISTANCIA', 'CORRECTA');
    dim(t, W('p4', 2), P(-1.6, 10, 0), P(-1.6, 13.2, 0), 120, 'ARCO');
    dim(t, W('p4', 8), P(-1.6, 22, 0), P(1.6, 22, 0), -110, 'Ø');
    if (t > W('p4', 9)) pill(t, W('p4', 9), 540, 1220, 'ARCO ≈ GROSOR DEL ELECTRODO', CY); }
  else { title(t, T.cierre, '', 'SI YA SE PEGÓ');
    if (t < W('cierre', 8)) { const [x, y] = proj(P(tp.x, 60)); spinArrow(t, W('cierre', 5), x, y, 80); if (t > W('cierre', 5)) pill(t, W('cierre', 5), 540, 1130, '✓ GÍRALO Y JÁLALO', CY); }
    else { const [x, y] = proj(P(60, 60)); bigX(t, W('cierre', 9), x, y, 60); pill(t, W('cierre', 8.5), 540, 1130, '✗ NO LO DOBLES', RED); }
    if (t > W('cierre', 16)) pill(t, W('cierre', 16), 540, 1240, 'COMENTA: ¿CUÁNTAS VECES?', OR); }
}

start({ camKeys, setScene, overlay, shake: t => shake(t, W('hook', 7)) + shake(t, W('p2', 12)) });
