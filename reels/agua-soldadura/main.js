// Reel 1 · ¿Agua a una soldadura caliente? Plate + bead cut in section (hot core, cold skin), bucket, cracks. Model in mm.
import { THREE, clamp, lerp, seg, eio, eo, hash, T, W, shotAt, mat, scene, box, prism, mesh, proj, shake,
  ov, INK, CY, OR, RED, title, tag, pill, writeOn, start } from './engine.js';

const LEN = 120, Z0 = -LEN / 2, Z1 = LEN / 2;
const HOT = new THREE.Color(OR), COLD = new THREE.Color(CY);
const M = { plate: mat(0x163c45), skin: mat(0xff8c2a, 4), core: mat(0xff8c2a, 4), crack: mat(0xff4d4d, 4), bucket: mat(0x1b4752), water: mat(0x2a6a78) };
const half = (w, h, n = 24) => Array.from({ length: n + 1 }, (_, i) => [Math.cos(Math.PI * i / n) * w, Math.sin(Math.PI * i / n) * h]);

scene.add(mesh(box(160, 10, LEN, 0, 0, 0), M.plate));
const BEAD = new THREE.Group(); BEAD.position.set(0, 10, 0); scene.add(BEAD);
BEAD.add(mesh(prism(half(9, 6.5), Z0, Z1), M.skin));
const CORE = mesh(prism(half(5, 3.6), Z0 + 1, Z1 - 1), M.core); CORE.position.y = 0.2; BEAD.add(CORE);
// cracks: thin red slabs that grow from the skin into the bead, then one through the plate
const CR = [[-4, 2.5, 35], [3.5, 3, -30], [0.5, 4, 5]].map(([x, h, deg]) => { const g = new THREE.Group(); g.position.set(x, h, 0); g.rotation.z = deg * Math.PI / 180;
  g.add(mesh(box(0.7, 4, LEN - 4, 0, -4, 0), M.crack)); BEAD.add(g); return g; });
const PCR = new THREE.Group(); PCR.position.set(1, 10, 0); scene.add(PCR);
PCR.add(mesh(box(0.9, 5.2, LEN - 6, 0, -5.2, 0), M.crack)); const PCR2 = mesh(box(0.9, 5.2, LEN - 6, 0, -5.2, 0), M.crack); PCR2.position.set(0.8, -4.8, 0); PCR2.rotation.z = -.35; PCR.add(PCR2);
// bucket (lathe, open top) + handle; water stream as a tube
const BK = new THREE.Group(); scene.add(BK);
BK.add(mesh(new THREE.LatheGeometry([[0.1, 0], [26, 0], [32, 58], [30, 58], [24.5, 2], [0.1, 2]].map(p => new THREE.Vector2(...p)), 40), M.bucket));
BK.add(mesh(new THREE.TorusGeometry(31, 1.4, 8, 32, Math.PI).rotateX(0).translate(0, 58, 0), M.bucket));
const STREAM = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[40, 66, 0], [30, 62, 0], [16, 44, 0], [5, 26, 0], [1, 16, 0]].map(p => new THREE.Vector3(...p))), 40, 3, 10), M.water);
scene.add(STREAM);
function bucketPose(tilt) { BK.scale.setScalar(.62); BK.position.set(60, 24 + 22 * tilt, 0); BK.rotation.set(0, 0, tilt * 1.15); }

const L_ = Math.log;
const camKeys = [
  [0, [32, 22, L_(560), 18, 62, 0]], [T.a1 - 0.3, [26, 18, L_(520), 18, 62, 0]],
  [T.a1, [28, 20, L_(400), 0, 34, 0]], [T.a2 - 0.3, [8, 8, L_(300), 0, 30, 0]],
  [T.a2 + 0.8, [0, 2, L_(150), 0, 21, 0]], [T.a3 - 0.2, [0, 2, L_(142), 0, 21, 0]],
  [T.a3 + 0.6, [0, 2, L_(132), 0, 20, 0]], [T.a4 - 0.2, [0, 2, L_(136), 0, 21, 0]],
  [T.a4 + 0.6, [0, 2, L_(185), 0, 24, 0]], [T.cierre - 0.2, [0, 2, L_(200), 0, 24, 0]],
  [T.cierre + 0.8, [30, 20, L_(560), 18, 62, 0]], [T.end, [36, 22, L_(600), 18, 62, 0]],
];

let ST;
function setScene(t) {
  const k = shotAt(t); ST = { k, clipZ: null };
  // temperatures: hot everywhere until the water hits the skin (a2); the close cools both slowly
  let skin = 0, core = 0;
  if (k === 'a2') skin = eo(seg(t, W('a2', 4), W('a2', 7)));
  if (k === 'a3' || k === 'a4') skin = 1;
  if (k === 'cierre') { skin = core = eio(seg(t, T.cierre + 0.6, T.cierre + 2.2)); }
  M.skin.uniforms.uColor.value.lerpColors(HOT, COLD, skin); M.core.uniforms.uColor.value.lerpColors(HOT, COLD, core);
  const cr = k === 'a4' ? eo(seg(t, W('a4', 1), W('a4', 4))) : 0;
  CR.forEach((g, i) => { g.visible = cr > 0; g.scale.set(1, Math.max(1e-3, eo(seg(cr, i * .15, .6 + i * .15))), 1); });
  const pc = k === 'a4' ? eo(seg(t, W('a4', 8), W('a4', 10))) : 0; PCR.visible = pc > 0; PCR.scale.set(1, Math.max(1e-3, pc), 1);
  // bucket: tilts and pours in the hook, stands upright in the close
  BK.visible = k === 'hook' || k === 'cierre'; bucketPose(k === 'hook' ? eio(seg(t, 0.4, W('hook', 3))) : 0);
  if (k === 'cierre') BK.position.set(50, 0, -45);
  STREAM.visible = k === 'hook' && t > W('hook', 3);
  if (k === 'a1') ST.clipZ = lerp(Z1 + 1, 0, eio(seg(t, T.a1 + 0.6, T.a2 - 0.2)));
  else if (k !== 'hook' && k !== 'cierre') ST.clipZ = 0;
  return ST;
}

const P = (x, y, z = 0) => new THREE.Vector3(x, y, z);
function steam(t, x, y, n, k) { if (k <= 0) return; ov.save(); ov.strokeStyle = INK; ov.lineWidth = 4; ov.lineCap = 'round';
  for (let i = 0; i < n; i++) { const q = (t * .9 + hash(i)) % 1, x0 = x + (hash(i + 5) - .5) * 160;
    ov.globalAlpha = k * (1 - q) * .8; ov.beginPath(); for (let s = 0; s <= 10; s++) { const yy = y - q * 260 - s * 9; ov.lineTo(x0 + Math.sin(s * .8 + t * 6 + i) * 10, yy); } ov.stroke(); } ov.restore(); }
function arrows(t, t0, c, r) { if (t < t0) return; const [cx, cy] = proj(c), p = eo(seg(t, t0, t0 + .5)), pulse = .5 + .5 * Math.sin(t * 8);
  ov.save(); ov.strokeStyle = INK; ov.fillStyle = INK; ov.lineWidth = 6; ov.globalAlpha = p;
  for (let i = 0; i < 6; i++) { const a = Math.PI * (i + .5) / 6, x1 = cx + Math.cos(a) * r * 1.6, y1 = cy - Math.sin(a) * r * 1.2, x2 = cx + Math.cos(a) * r * (1.05 - .1 * pulse), y2 = cy - Math.sin(a) * r * (.8 - .08 * pulse);
    ov.beginPath(); ov.moveTo(x1, y1); ov.lineTo(x2, y2); ov.stroke(); const ang = Math.atan2(y2 - y1, x2 - x1);
    ov.beginPath(); ov.moveTo(x2, y2); ov.lineTo(x2 - 18 * Math.cos(ang - .5), y2 - 18 * Math.sin(ang - .5)); ov.lineTo(x2 - 18 * Math.cos(ang + .5), y2 - 18 * Math.sin(ang + .5)); ov.fill(); }
  ov.restore(); }
function bigX(t, t0, x, y, r) { if (t < t0) return; const p = eo(seg(t, t0, t0 + .3)); ov.save(); ov.strokeStyle = RED; ov.lineWidth = 16; ov.lineCap = 'round';
  ov.beginPath(); ov.moveTo(x - r * p, y - r * p); ov.lineTo(x + r * p, y + r * p); ov.moveTo(x + r * p, y - r * p); ov.lineTo(x - r * p, y + r * p); ov.stroke(); ov.restore(); }

function overlay(t, st) {
  const k = st.k;
  if (k === 'hook') { title(t, -0.6, '', '¿LE ECHAS', 'AGUA?');
    const [sx, sy] = proj(P(2, 18)); steam(t, sx, sy, 10, seg(t, W('hook', 4), W('hook', 5)));
    if (t > W('hook', 8)) pill(t, W('hook', 8), 540, 1200, '⚠ PUEDE ROMPERLA', OR); }
  else if (k === 'a1') { title(t, T.a1, '', 'RECIÉN', 'SOLDADO');
    tag(t, W('a1', 5), P(-3, 16, 30), -170, -170, 'CORDÓN', OR); if (t > W('a1', 8)) pill(t, W('a1', 8), 540, 1200, '+1000 °C', OR); }
  else if (k === 'a2') { title(t, T.a2, '', 'POR DENTRO');
    tag(t, W('a2', 5), P(-7, 15), 120, -260, 'SUPERFICIE FRÍA', CY); tag(t, W('a2', 11), P(1, 12), 60, 330, 'CENTRO CALIENTE', OR);
    const [sx, sy] = proj(P(0, 17)); steam(t, sx, sy, 8, seg(t, W('a2', 3), W('a2', 4)) * (1 - seg(t, W('a2', 9), T.a3))); }
  else if (k === 'a3') { title(t, T.a3, '', 'LO JALA');
    arrows(t, W('a3', 2), P(0, 12), 230);
    if (t > W('a3', 9)) pill(t, W('a3', 9), 540, 1130, '+ CARBONO', OR); if (t > W('a3', 14)) pill(t, W('a3', 14), 540, 1240, 'DURO Y QUEBRADIZO', RED); }
  else if (k === 'a4') { title(t, T.a4, '', 'GRIETAS', 'QUE NO SE VEN');
    tag(t, W('a4', 2), P(-3, 13), -60, -260, 'GRIETAS', RED); if (t > W('a4', 9)) pill(t, W('a4', 9), 540, 1220, 'LA PIEZA FALLA', RED); }
  else { title(t, T.cierre, '', 'DÉJALO', 'ENFRIAR AL AIRE');
    const [bx, by] = proj(P(50, 20, -45)); bigX(t, T.cierre + 0.9, bx, by, 70);
    if (t > W('cierre', 4)) pill(t, W('cierre', 4), 540, 1120, '✓ AL AIRE', CY); if (t > W('cierre', 9)) pill(t, W('cierre', 9), 540, 1240, 'COMENTA: ¿SÍ O NO?', OR); }
}

start({ camKeys, setScene, overlay, shake: t => shake(t, W('a4', 9)) + shake(t, W('hook', 3)) });
