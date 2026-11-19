import * as THREE from 'three';
import timing from './timing.json';

// monotone cubic time warp: beat times per path key -> path position 0..1 (ease in/out)
export function warpU(T, t) {
  const n = T.length; if (t <= T[0]) return 0; if (t >= T[n - 1]) return 1;
  const sec = []; for (let i = 0; i < n - 1; i++) sec.push((1 / (n - 1)) / (T[i + 1] - T[i]));
  const m = [0]; for (let i = 1; i < n - 1; i++) m.push(2 * sec[i - 1] * sec[i] / (sec[i - 1] + sec[i])); m.push(0);
  let i = 0; while (t > T[i + 1]) i++;
  const h = T[i + 1] - T[i], x = (t - T[i]) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * (i / (n - 1)) + (x3 - 2 * x2 + x) * h * m[i] + (-2 * x3 + 3 * x2) * ((i + 1) / (n - 1)) + (x3 - x2) * h * m[i + 1];
}

const S = Object.fromEntries(timing.shots.map((s) => [s.key, s]));
const keys = timing.shots.map((s) => s.key);
// cut = midway between the end of one sentence and the start of the next
export const CUTS = keys.map((k, i) => (i === 0 ? 0 : (timing.shots[i - 1].end + timing.shots[i].start) / 2));
export const END = timing.duration;
// word time: proportional position of word index (0-based) inside a sentence
export const wordT = (key, idx) => S[key].start + (S[key].end - S[key].start) * idx / S[key].words;

// light presets
export const LIGHTS = {
  night: {sun: '#a9b8ff', si: 1.0, sky: '#4a50a0', gnd: '#2a2030', hi: 1.0, fog: '#232856', near: 120, far: 420, sunOff: [-40, 90, 50], shadow: 70, top: '#0b1030', hor: '#3e3f86', pt: null},
  day: {sun: '#fff0cf', si: 2.6, sky: '#a9d8ff', gnd: '#d9a878', hi: 1.15, fog: '#cfe7f7', near: 160, far: 650, sunOff: [-50, 90, 60], shadow: 80, top: '#3d8fe0', hor: '#cde9f8', pt: null},
  storm: {sun: '#cdd3de', si: 1.1, sky: '#8a95a6', gnd: '#4a4f58', hi: 1.0, fog: '#66738a', near: 45, far: 260, sunOff: [-40, 80, 40], shadow: 80, top: '#3c4454', hor: '#7d889a', pt: null},
  office: {sun: '#fff4e4', si: 1.6, sky: '#f4fbff', gnd: '#b48a62', hi: 1.05, fog: '#efe2cb', near: 30, far: 90, sunOff: [-6, 9, 7], shadow: 10, top: '#7fb7e6', hor: '#d6ecf6', pt: {c: '#ffc77a', i: 7, p: [-2.5, 3.6, 0.5], d: 14}},
  yard: {sun: '#ffe7bd', si: 2.5, sky: '#b5dcff', gnd: '#d1ad7c', hi: 1.15, fog: '#e2e3d4', near: 70, far: 260, sunOff: [-14, 22, 14], shadow: 20, top: '#3d8fe0', hor: '#d9ecf5', pt: null},
  joint: {sun: '#ffe0b0', si: 2.3, sky: '#c4c8dc', gnd: '#5a5662', hi: 1.3, fog: '#4a4a58', near: 30, far: 80, sunOff: [-7, 12, 9], shadow: 12, top: '#222', hor: '#333', pt: {c: '#ffb066', i: 16, p: [-3.2, 4.6, -1.5], d: 12}},
  weather: {sun: '#eef2ff', si: 1.4, sky: '#eef3f6', gnd: '#8f7b66', hi: 1.1, fog: '#e3e7e1', near: 30, far: 90, sunOff: [-6, 9, 7], shadow: 10, top: '#56606e', hor: '#9aa4b0', pt: {c: '#ffd58a', i: 5, p: [0, 3.8, 0], d: 14}},
  morning: {sun: '#ffbf7a', si: 2.5, sky: '#ffe0bd', gnd: '#c08a5a', hi: 1.0, fog: '#f6d9b8', near: 160, far: 650, sunOff: [-60, 40, 50], shadow: 80, top: '#6fa6dd', hor: '#ffd3a1', pt: null},
};

const v = (a) => new THREE.Vector3(...a);
// camera plan: per shot, location light, anchor (for the light), path keys {p, l}, optional beat times
export const PLAN = {
  hook: {light: 'yard', anchor: [400, 0, -6], keys: [{p: [412, 17, 24], l: [400, 9, -4]}, {p: [407, 11, 19], l: [400, 8, -4]}, {p: [403, 7, 15], l: [400, 7, -4]}]},
  cuando: {light: 'yard', anchor: [400, 0, -6], keys: [{p: [385, 3.0, 14], l: [390, 2.6, 7.5]}, {p: [389, 3.2, 14.5], l: [393, 2.8, 5]}, {p: [393, 3.6, 15], l: [397, 3.4, 0]}]},
  mira: {light: 'day', anchor: [800, 0, -14], keys: [{p: [814, 3, 16], l: [800, 3.5, -14]}, {p: [810, 4, 17], l: [800, 3.5, -14]}, {p: [806, 5, 18], l: [800, 3, -14]}]},
  meses: {light: 'office', anchor: [1400, 0, 0], keys: [{p: [1398.6, 2.4, 3.8], l: [1400.6, 2.8, -5]}, {p: [1399.6, 2.5, 3.0], l: [1401, 2.9, -5]}, {p: [1400.4, 2.6, 2.4], l: [1401, 2.9, -5]}]},
  reto: {light: 'office', anchor: [1400, 0, 0], keys: [{p: [1396.4, 2.2, 3.4], l: [1397.8, 1.7, -0.7]}, {p: [1398.5, 2.3, 3.0], l: [1399.5, 2.2, -3]}, {p: [1400.2, 2.6, 2.2], l: [1401, 2.9, -5]}], beats: 'words:reto:0,9,14'},
  secreto: {light: 'joint', anchor: [1300, 0, 0], keys: [{p: [1295.5, 2.6, 3.2], l: [1297.4, 2.2, -3]}, {p: [1300, 2.8, 4.4], l: [1300, 2.2, -3]}, {p: [1304.5, 2.6, 3.2], l: [1302.6, 2.2, -3]}], beats: 'words:secreto:0,8,15'},
  bloques: {light: 'yard', anchor: [400, 0, -6], keys: [{p: [415, 5, 15], l: [406, 9, -6]}, {p: [414, 7, 16], l: [406, 7, -6]}, {p: [413, 9, 17], l: [406, 5, -6]}]},
  ritmo: {light: 'night', anchor: [400, 0, -6], keys: [{p: [391, 4.5, 6], l: [395, 4.2, -1]}, {p: [397, 4.8, 6.5], l: [400, 4.5, -1]}, {p: [404, 5.2, 7], l: [406, 5, -1]}]},
  dia: {light: 'yard', anchor: [400, 0, -6], keys: [{p: [401, 5, 18], l: [400, 4, -6]}, {p: [406, 7, 20], l: [400, 3.5, -12]}, {p: [414, 10, 22], l: [400, 2, -40]}], beats: 'words:dia:0,13,18'},
  total: {light: 'day', anchor: [0, 0, -10], keys: [{p: [0, 4.5, 15], l: [0, 3.8, 4]}, {p: [0, 9, 15], l: [0, 3, -10]}, {p: [0, 15, 14], l: [0, 2, -20]}], beats: 'words:total:0,7,14'},
  pero: {light: 'storm', anchor: [800, 0, -14], keys: [{p: [812, 4, 13], l: [800, 4, -14]}, {p: [808, 4.5, 11], l: [800, 4.5, -14]}, {p: [805, 5, 8], l: [800, 5, -14]}]},
  cierre: {light: 'storm', anchor: [800, 0, -14], keys: [{p: [805, 5, 8], l: [800, 5, -14]}, {p: [802.5, 6, 5], l: [800, 4.4, -14]}, {p: [800.5, 7, 2], l: [800, 4.4, -14]}]},
};

// precompute curves + beat times
const CURVES = {};
keys.forEach((k, i) => {
  const P = PLAN[k];
  const a = CUTS[i], b = i + 1 < keys.length ? CUTS[i + 1] : END;
  let T;
  if (P.beats && P.beats.startsWith('words:')) {
    const [, key, idx] = P.beats.split(':');
    T = idx.split(',').map(Number).map((n) => wordT(key, n));
    T[0] = a; T[T.length - 1] = b;
  } else T = P.keys.map((_, j) => a + (b - a) * j / (P.keys.length - 1));
  CURVES[k] = {
    p: new THREE.CatmullRomCurve3(P.keys.map((q) => v(q.p)), false, 'centripetal'),
    l: new THREE.CatmullRomCurve3(P.keys.map((q) => v(q.l)), false, 'centripetal'),
    T, a, b,
  };
});

export function shotAt(t) {
  let i = 0; while (i + 1 < CUTS.length && t >= CUTS[i + 1]) i++;
  return keys[i];
}
export function cameraAt(t) {
  const k = shotAt(t); const C = CURVES[k];
  const u = warpU(C.T, t);
  return {key: k, pos: C.p.getPointAt(u), look: C.l.getPointAt(u), plan: PLAN[k], a: C.a, b: C.b};
}
// dip-to-cream opacity around location changes (0.4 s total)
const CONT = new Set(['reto', 'cierre']); // these shots continue the previous camera move
export function dipAt(t) {
  let o = 0;
  keys.forEach((k, i) => {
    if (i === 0 || CONT.has(k)) return;
    const c = CUTS[i]; const d = Math.abs(t - c);
    if (d < 0.2) o = Math.max(o, 1 - d / 0.2);
  });
  return o;
}
