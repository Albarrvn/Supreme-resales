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
  hook: {light: 'night', anchor: [0, 0, -30], keys: [{p: [16, 66, 6], l: [0, 60, -29]}, {p: [12, 56, 9], l: [0, 54, -29]}, {p: [8, 44, 11], l: [0, 48, -29]}]},
  cta: {light: 'day', anchor: [265, 0, 5], keys: [{p: [266.4, 2.8, 15.5], l: [265.4, 3.0, 5]}, {p: [265.8, 1.9, 11.5], l: [265.2, 2.0, 5.8]}, {p: [265.3, 1.45, 8.9], l: [265.0, 1.4, 6.4]}]},
  tower: {light: 'day', anchor: [300, 0, -30], keys: [{p: [306, 3, 5], l: [300, 9, -40]}, {p: [304, 12, 4], l: [300, 35, -40]}, {p: [302, 24, 3], l: [300, 70, -40]}]},
  rules: {light: 'office', anchor: [600, 0, 0], keys: [{p: [596.0, 2.4, 3.1], l: [596.8, 1.2, 0.6]}, {p: [596.9, 2.2, 2.7], l: [597.6, 1.35, 0.5]}, {p: [597.7, 2.05, 2.35], l: [598.4, 1.5, 0.4]}]},
  but: {light: 'office', anchor: [600, 0, 0], keys: [{p: [597.7, 2.05, 2.35], l: [598.4, 1.5, 0.4]}, {p: [599.6, 2.0, 1.2], l: [600.8, 1.7, -2.4]}, {p: [601.5, 1.8, -0.5], l: [601.9, 1.9, -4.4]}], beats: 'words:but:0,6,15'},
  then: {light: 'yard', anchor: [700, 0, 0], keys: [{p: [696.2, 1.6, 3.4], l: [697.6, 1.0, -1.2]}, {p: [699.8, 1.45, 2.9], l: [700.0, 1.3, 0.6]}, {p: [701.6, 2.1, 4.6], l: [701.9, 2.3, -1.5]}], beats: 'words:then:0,3,15'},
  storm: {light: 'storm', anchor: [300, 0, -30], keys: [{p: [310.5, 2.5, 15.5], l: [300, 38, -40]}, {p: [309, 4, 14.5], l: [300, 46, -40]}, {p: [307.5, 6, 13.5], l: [300, 55, -40]}]},
  yousee: {light: 'joint', anchor: [800, 0, 0], keys: [{p: [796.4, 4.3, 5.4], l: [796.8, 4.4, -2.6]}, {p: [800, 4.9, 8.2], l: [800, 4.5, -2.6]}, {p: [803.6, 4.3, 5.4], l: [803.2, 4.4, -2.6]}], beats: 'words:yousee:0,8,18'},
  night: {light: 'night', anchor: [0, 0, -30], keys: [{p: [-9, 3, 20], l: [0, 45, -40]}, {p: [-6.5, 5.5, 14], l: [0, 50, -36]}, {p: [-4, 8, 8], l: [0, 55, -29]}]},
  ella: {light: 'weather', anchor: [900, 0, 0], keys: [{p: [896.4, 2.0, 3.6], l: [898.4, 2.4, -5]}, {p: [899.8, 2.1, 3.9], l: [899.8, 2.3, -3]}, {p: [902.9, 1.85, 2.6], l: [904.3, 1.65, -2.4]}], beats: 'words:ella:0,6,13'},
  so: {light: 'weather', anchor: [900, 0, 0], keys: [{p: [902.9, 1.85, 2.6], l: [904.3, 1.65, -2.4]}, {p: [901.2, 2.1, 3.6], l: [901.0, 2.1, -3.5]}, {p: [899.6, 2.4, 4.4], l: [899.2, 2.6, -5]}]},
  close: {light: 'morning', anchor: [320, 0, 0], keys: [{p: [319.6, 2.3, 11.6], l: [319.6, 1.0, 6.6]}, {p: [321.0, 2.3, 12.8], l: [317, 9, -12]}, {p: [321.6, 2.8, 15.4], l: [312, 22, -40]}], beats: 'words:close:0,6,13'},
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
const CONT = new Set(['but', 'so']); // these shots continue the previous camera move
export function dipAt(t) {
  let o = 0;
  keys.forEach((k, i) => {
    if (i === 0 || CONT.has(k)) return;
    const c = CUTS[i]; const d = Math.abs(t - c);
    if (d < 0.2) o = Math.max(o, 1 - d / 0.2);
  });
  return o;
}
