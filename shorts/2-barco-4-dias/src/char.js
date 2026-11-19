import * as THREE from 'three';
import {INK, rng} from './kit.js';

const inkMat = new THREE.MeshBasicMaterial({color: INK, side: THREE.DoubleSide});
const fillCache = new Map();
function fillMat(c) {
  if (!fillCache.has(c)) fillCache.set(c, new THREE.MeshBasicMaterial({color: c, side: THREE.DoubleSide}));
  return fillCache.get(c);
}

// polygon points -> flat fill + wobbly ink band behind it
function flat(pts, color, z, band = 0.022, seed = 1) {
  const g = new THREE.Group();
  const r = rng(seed);
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), fillMat(color));
  fill.position.z = z;
  // ink band: offset along vertex normals with slight wobble
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
    const w = band * (0.8 + r() * 0.45);
    out.push(new THREE.Vector2(p[0] + ty * w, p[1] - tx * w));
  }
  // make sure ink is outside: test orientation
  const area = pts.reduce((s, p, i) => s + p[0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * p[1], 0);
  let inkPts = out;
  if (area < 0) {
    inkPts = pts.map((p, i) => { const o = out[i]; return new THREE.Vector2(2 * p[0] - o.x, 2 * p[1] - o.y); });
  }
  const inkM = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(inkPts)), inkMat);
  inkM.position.z = z - 0.004;
  g.add(inkM, fill);
  return g;
}
function circlePts(cx, cy, rx, ry = rx, n = 28, a0 = 0, a1 = Math.PI * 2) {
  const p = []; for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / (n - (a1 - a0 >= 6.28 ? 0 : 1)); p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return p;
}
function stick(x0, y0, x1, y1, w0, w1) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  const s = new THREE.Shape([
    new THREE.Vector2(x0 + nx * w0, y0 + ny * w0), new THREE.Vector2(x1 + nx * w1, y1 + ny * w1),
    new THREE.Vector2(x1 - nx * w1, y1 - ny * w1), new THREE.Vector2(x0 - nx * w0, y0 - ny * w0)]);
  return new THREE.Mesh(new THREE.ShapeGeometry(s), inkMat);
}

export const PALETTES = {
  engineer: {jacket: '#3e5a7a', jacket2: '#334c68', tie: '#b3392f', hair: '#4a3328'},
  student: {jacket: '#c4793d', jacket2: '#a9652f', tie: '#2f5d62', hair: '#2b1d17'},
  welder: {jacket: '#5f7d4f', jacket2: '#4f6a41', tie: '#d9a441', hair: '#5a3a26'},
  clerk: {jacket: '#7a4f73', jacket2: '#67425f', tie: '#e0b04a', hair: '#3b2a22'},
  official: {jacket: '#5a5f66', jacket2: '#4b4f55', tie: '#2f6db3', hair: '#8b8178'},
  red: {jacket: '#c8463a', jacket2: '#a93a30', tie: '#f2d36b', hair: '#3b2a22'},
  teal: {jacket: '#2f8f8a', jacket2: '#277873', tie: '#f07a2b', hair: '#2b1d17'},
  mustard: {jacket: '#d9a441', jacket2: '#bf8f36', tie: '#3e5a7a', hair: '#5a3a26'},
  pink: {jacket: '#d77a9c', jacket2: '#bf6687', tie: '#2f5d62', hair: '#6b4430'},
  navy: {jacket: '#2e3f6b', jacket2: '#26355a', tie: '#e0533d', hair: '#1f1a18'},
};

export function character({palette = 'engineer', hat = 'none', glasses = false, seed = 1, scale = 1} = {}) {
  const P = PALETTES[palette];
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  // legs (thin tapered sticks) + feet
  body.add(stick(-0.09, 0.72, -0.1, 0.05, 0.03, 0.022), stick(0.09, 0.72, 0.1, 0.05, 0.03, 0.022));
  body.add(flat(circlePts(-0.13, 0.04, 0.09, 0.045), INK, 0.0, 0.004, seed + 1), flat(circlePts(0.13, 0.04, 0.09, 0.045), INK, 0.0, 0.004, seed + 2));
  // pear torso, two-tone
  const torso = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; const a = Math.PI * 2 * t; const y = 0.98 + Math.sin(a) * 0.29; const wid = 0.2 + 0.07 * (1 - (y - 0.69) / 0.58); torso.push([Math.cos(a) * wid, y]); }
  body.add(flat(torso, P.jacket, 0.01, 0.022, seed + 3));
  const lower = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + Math.PI * i / 12; lower.push([Math.cos(a) * 0.255, 0.86 + Math.sin(a) * 0.17]); }
  body.add(flat(lower, P.jacket2, 0.015, 0.0, seed + 4));
  // pocket patch
  body.add(flat([[0.07, 0.98], [0.17, 0.98], [0.16, 0.9], [0.08, 0.9]], P.jacket2, 0.02, 0.008, seed + 5));
  // white collar + tie
  body.add(flat([[-0.11, 1.25], [0, 1.15], [0.11, 1.25], [0.0, 1.28]], '#fbf7ee', 0.025, 0.01, seed + 6));
  body.add(flat([[-0.025, 1.17], [0.025, 1.17], [0.04, 0.98], [0, 0.93], [-0.04, 0.98]], P.tie, 0.03, 0.008, seed + 7));
  // arms
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-0.2, 1.17, 0.012); armR.position.set(0.2, 1.17, 0.012);
  armL.add(stick(0, 0, -0.08, -0.42, 0.026, 0.02)); armR.add(stick(0, 0, 0.08, -0.42, 0.026, 0.02));
  armL.add(flat(circlePts(-0.085, -0.45, 0.05), INK, 0.002, 0.0, seed + 8)); armR.add(flat(circlePts(0.085, -0.45, 0.05), INK, 0.002, 0.0, seed + 9));
  body.add(armL, armR);
  // head
  const head = new THREE.Group(); head.position.set(0, 1.56, 0.04); body.add(head);
  head.add(flat(circlePts(0, 0, 0.33, 0.31, 36), '#f4ecdc', 0, 0.024, seed + 10));
  // hair fringe
  const fringe = circlePts(0, 0, 0.335, 0.315, 18, 0.15, Math.PI - 0.15);
  fringe.push([-0.24, 0.17], [-0.1, 0.21], [0.04, 0.17], [0.18, 0.22], [0.3, 0.12]);
  head.add(flat(fringe.reverse(), P.hair, 0.01, 0.012, seed + 11));
  // calm half-lidded eyes
  for (const ex of [-0.11, 0.11]) {
    head.add(flat(circlePts(ex, -0.01, 0.055, 0.05, 14, Math.PI, Math.PI * 2), INK, 0.02, 0.0, seed + 12));
    const lid = stick(ex - 0.07, 0.01, ex + 0.07, 0.01, 0.009, 0.009); lid.position.z = 0.025; head.add(lid);
  }
  // tiny smile
  const sm = circlePts(0, -0.11, 0.06, 0.035, 10, Math.PI * 1.15, Math.PI * 1.85);
  for (let i = 0; i < sm.length - 1; i++) { const s = stick(sm[i][0], sm[i][1], sm[i + 1][0], sm[i + 1][1], 0.008, 0.008); s.position.z = 0.025; head.add(s); }
  if (glasses) {
    for (const ex of [-0.11, 0.11]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.095, 24), inkMat); ring.position.set(ex, -0.0, 0.03); head.add(ring);
    }
    const br = stick(-0.035, 0.0, 0.035, 0.0, 0.01, 0.01); br.position.z = 0.03; head.add(br);
  }
  if (hat === 'cap') {
    head.add(flat(circlePts(0, 0.17, 0.3, 0.13, 20, 0, Math.PI), P.jacket2, 0.035, 0.02, seed + 13));
    head.add(flat([[-0.05, 0.18], [0.42, 0.16], [0.42, 0.12], [-0.05, 0.13]], P.jacket2, 0.036, 0.02, seed + 14));
  } else if (hat === 'bowler') {
    head.add(flat(circlePts(0, 0.2, 0.24, 0.2, 20, 0, Math.PI), '#2e2a2b', 0.035, 0.02, seed + 15));
    head.add(flat([[-0.38, 0.2], [0.38, 0.2], [0.38, 0.15], [-0.38, 0.15]], '#2e2a2b', 0.036, 0.02, seed + 16));
  } else if (hat === 'top') {
    head.add(flat([[-0.2, 0.2], [0.2, 0.2], [0.18, 0.62], [-0.18, 0.62]], '#2e2a2b', 0.035, 0.02, seed + 17));
    head.add(flat([[-0.36, 0.22], [0.36, 0.22], [0.36, 0.16], [-0.36, 0.16]], '#2e2a2b', 0.036, 0.02, seed + 18));
  }
  // soft contact shadow blob
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({color: '#000', transparent: true, opacity: 0.22, depthWrite: false}));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.01; blob.scale.y = 0.55;
  root.add(blob);
  root.scale.setScalar(scale);
  const phase = rng(seed)() * 6;
  root.userData.update = (t, camPos, baseYaw = 0) => {
    body.position.y = Math.abs(Math.sin(t * 2.2 + phase)) * 0.015;
    head.rotation.z = Math.sin(t * 1.3 + phase) * 0.05;
    head.position.y = 1.56 + Math.sin(t * 1.9 + phase) * 0.008;
    armL.rotation.z = Math.sin(t * 1.6 + phase) * 0.08;
    armR.rotation.z = -Math.sin(t * 1.4 + phase + 1) * 0.08;
    // turn toward camera, clamped yaw
    const wp = new THREE.Vector3(); root.getWorldPosition(wp);
    let yaw = Math.atan2(camPos.x - wp.x, camPos.z - wp.z) - baseYaw;
    yaw = Math.max(-0.7, Math.min(0.7, yaw));
    body.rotation.y = yaw + baseYaw - root.rotation.y;
  };
  root.userData.armR = armR; root.userData.armL = armL;
  return root;
}
