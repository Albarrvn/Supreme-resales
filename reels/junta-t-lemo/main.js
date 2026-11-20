// Junta en T y junta de solape · Line-Art Cutaway, creator variant (dark teal paper, light ink, cyan weld path, orange arc).
// Tracing engine adapted from the library style (normal/depth edge detection, 3 line tiers, jittered accumulation).
// Model in millimetres. Vertical 1080x1920.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, seg, eio, eo, back, track, hash } from '/core/lib.js';
THREE.ColorManagement.enabled = false;

const TM = await (await fetch('timing.json')).json();
const AMP = await (await fetch('amp.json')).json();
const PX = 1080, PY = 1920, SS = 2, JIT = +(new URLSearchParams(location.search).get('jit') || 3);
const BG = '#0B1C22', INK = '#E6F1F3', CY = '#38E1FF', OR = '#FF8C2A', DIM = '#7FA6AF';
const S = Object.fromEntries(TM.shots.map(s => [s.key, s]));
const KEYS = TM.shots.map(s => s.key);
const cut = k => { const i = KEYS.indexOf(k); return i === 0 ? 0 : (TM.shots[i - 1].end + TM.shots[i].start) / 2; };
const T = Object.fromEntries(KEYS.map(k => [k, cut(k)])); T.end = TM.duration;
const W = (k, i) => S[k].start + (S[k].end - S[k].start) * i / S[k].words;
const shotAt = t => { let k = KEYS[0]; for (const x of KEYS) if (t >= T[x]) k = x; return k; };

// ---------- renderer + one material (tone / normal-depth) ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
renderer.debug.onShaderError = (gl, prog, vs, fs) => { window.SHADER_ERR = (window.SHADER_ERR||'') + '\nVS:' + gl.getShaderInfoLog(vs) + '\nFS:' + gl.getShaderInfoLog(fs) + '\nPROG:' + gl.getProgramInfoLog(prog); };
renderer.setPixelRatio(1); renderer.setSize(PX, PY, false); renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.autoClear = false;
const U = { uMode: { value: 0 } };
const VS = `#include <clipping_planes_pars_vertex>
attribute float aS; varying vec3 vN; varying vec3 vWN; varying float vVZ; varying float vS;
void main(){ vec4 mvPosition = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vWN = normalize(mat3(modelMatrix)*normal); vVZ = -mvPosition.z; vS = aS; gl_Position = projectionMatrix*mvPosition;
#include <clipping_planes_vertex>
}`;
const FS = `#include <clipping_planes_pars_fragment>
uniform float uMode; uniform vec3 uColor; uniform vec3 uColor0; uniform float uKind; uniform float uPath;
varying vec3 vN; varying vec3 vWN; varying float vVZ; varying float vS;
float hatch(float p){ float h = mod(gl_FragCoord.x + gl_FragCoord.y, p); return smoothstep(.6,1.6,h)*(1.-smoothstep(2.6,3.6,h)); }
void main(){
#include <clipping_planes_fragment>
  if(uMode>.5){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = vec3(0.,0.,1.); gl_FragColor = vec4(n, vVZ); return; }
  vec3 col = uColor; bool lit = false;
  if(uKind>2.5 && uKind<3.5){ lit = vS < uPath; col = lit ? uColor : uColor0; }
  if(uKind>3.5){ lit = true; }
  if(!gl_FrontFacing){ vec3 c = lit ? col : mix(vec3(.075,.17,.20), vec3(.42,.62,.67), hatch(11.)); gl_FragColor = vec4(c,1.); return; }
  vec3 n = normalize(vWN); float d = max(dot(n, normalize(vec3(-.35,1.,.55))),0.);
  float tone = lit ? 1. : .80 + .25*d;
  gl_FragColor = vec4(col*tone, 1.);
}`;
const mat = (hex, kind = 0, hex0 = null, path = null) => new THREE.ShaderMaterial({
  uniforms: { uMode: U.uMode, uColor: { value: new THREE.Color(hex) }, uColor0: { value: new THREE.Color(hex0 ?? hex) }, uKind: { value: kind }, uPath: path || { value: 1 } },
  vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide, clipping: true });
const PATH_T = { value: 0 }, PATH_L = { value: 0 };
const M = { plate: mat(0x163c45), plate2: mat(0x1b4752), weldT: mat(0x38e1ff, 3, 0x22525c, PATH_T), weldL: mat(0x38e1ff, 3, 0x22525c, PATH_L),
  rod: mat(0x2a4f58), flux: mat(0x23434b), notch: mat(0x0b1c22), edge: mat(0xff8c2a, 4) };

// ---------- model ----------
const scene = new THREE.Scene();
const box = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z);
function prism(pts, z0, z1) { const s = new THREE.Shape(pts.map(p => new THREE.Vector2(...p))); const g = new THREE.ExtrudeGeometry(s, { depth: z1 - z0, bevelEnabled: false }); g.translate(0, 0, z0); return g; }
function withS(g, fn) { g = g.index ? g.toNonIndexed() : g; const p = g.attributes.position, a = new Float32Array(p.count); for (let i = 0; i < p.count; i++) a[i] = fn(p.getX(i), p.getY(i), p.getZ(i)); g.setAttribute('aS', new THREE.BufferAttribute(a, 1)); return g; }
const mesh = (g, m) => new THREE.Mesh(withS(g, () => 0), m);
const LEN = 180, Z0 = -LEN / 2, Z1 = LEN / 2;
// T joint
const TG = new THREE.Group(); scene.add(TG);
TG.add(mesh(box(140, 10, LEN, 0, 0, 0), M.plate));
const TU = new THREE.Group(); TU.add(mesh(box(10, 100, LEN, 0, 10, 0), M.plate2)); TG.add(TU);
const LG_T = 10; // leg length
const TF = new THREE.Group(); TF.position.set(5, 10, 0); TG.add(TF);
TF.add(new THREE.Mesh(withS(prism([[0, 0], [LG_T, 0], [0, LG_T]], Z0, Z1), (x, y, z) => (z - Z0) / LEN), M.weldT));
const notch = mesh(prism([[0, 0], [-1.6, 1.2], [0, 2.6]], Z0, Z1), M.notch); notch.position.set(5.02, 10 + LG_T + 0.6, 0); TU.add(notch);
// lap joint
const LGp = new THREE.Group(); scene.add(LGp);
LGp.add(mesh(box(150, 8, LEN, -20, 0, 0), M.plate));
const LTp = new THREE.Group(); LGp.add(LTp);
LTp.add(mesh(box(136, 8, LEN, 57, 8, 0), M.plate2));
const LEDGE = new THREE.Group(); LEDGE.position.set(-11, 12, 0); LTp.add(LEDGE); // the thin top edge that can burn
LEDGE.add(mesh(box(4, 4, LEN, 0, -2, 0), M.plate2));
const LG_L = 8;
const LF = new THREE.Group(); LF.position.set(-11, 8, 0); LGp.add(LF);
LF.add(new THREE.Mesh(withS(prism([[0, 0], [-LG_L, 0], [0, LG_L]], Z0, Z1), (x, y, z) => (z - Z0) / LEN), M.weldL));
// electrode (tip at origin, axis +y before rotation)
const ROD = new THREE.Group(); scene.add(ROD);
ROD.add(mesh(new THREE.CylinderGeometry(2, 2, 6, 16).translate(0, 3, 0), M.rod));
ROD.add(mesh(new THREE.CylinderGeometry(3.2, 3.2, 240, 20).translate(0, 126, 0), M.flux));
ROD.add(mesh(new THREE.CylinderGeometry(9, 9, 60, 20).translate(0, 270, 0), M.rod));
function aimRod(tip, inPlaneDeg, travelDeg) { // inPlaneDeg: angle from the base plate (+x side), travelDeg: lean toward +z
  ROD.position.copy(tip); ROD.rotation.set(0, 0, 0);
  ROD.rotateZ(-(90 - inPlaneDeg) * Math.PI / 180 * Math.sign(inPlaneDeg >= 0 ? 1 : 1));
  ROD.rotateX(travelDeg * Math.PI / 180);
}

// ---------- tracing post (from the library engine, light ink on dark) ----------
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quadGeo = new THREE.PlaneGeometry(2, 2);
const VQ = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
const edgeMat = new THREE.ShaderMaterial({
  uniforms: { tC: { value: null }, tN: { value: null }, px: { value: new THREE.Vector2() }, rS: { value: 2.9 }, rO: { value: 1.8 }, rC: { value: 1.1 }, thD: { value: 0.0016 }, thO: { value: 0.012 }, thN: { value: 0.12 } },
  vertexShader: VQ, fragmentShader: `
  uniform sampler2D tC, tN; uniform vec2 px; uniform float rS, rO, rC, thD, thO, thN; varying vec2 vUv;
  float iz(vec4 s){ return s.a>0. ? 1./s.a : 0.; }
  void main(){
    vec4 c = texture2D(tC, vUv); vec4 n0 = texture2D(tN, vUv); float z0 = iz(n0); bool f0 = n0.a > 0.;
    float dS = 99.;
    for(int i=0;i<16;i++){ float a = float(i)*0.392699; vec2 d = vec2(cos(a), sin(a));
      for(int k=1;k<=4;k++){ float r = float(k)*rS*0.3; vec4 s = texture2D(tN, vUv + d*px*r); if((s.a>0.) != f0) dS = min(dS, r); } }
    float eS = 1. - smoothstep(rS*0.62, rS*1.12, dS), eO = 0., eC = 0.;
    vec2 dirs[4]; dirs[0]=vec2(1.,0.); dirs[1]=vec2(0.,1.); dirs[2]=vec2(.7071,.7071); dirs[3]=vec2(.7071,-.7071);
    for(int i=0;i<4;i++){
      vec4 a = texture2D(tN, vUv + dirs[i]*px*rO), b = texture2D(tN, vUv - dirs[i]*px*rO);
      if(f0 && a.a>0. && b.a>0.){ float za = iz(a), zb = iz(b), m = max(z0, max(za, zb)); eO = max(eO, smoothstep(thO, thO*1.8, abs(za + zb - 2.*z0) / m)); }
      vec4 a2 = texture2D(tN, vUv + dirs[i]*px*rC), b2 = texture2D(tN, vUv - dirs[i]*px*rC);
      if(f0 && a2.a>0. && b2.a>0.){ float za = iz(a2), zb = iz(b2), m = max(z0, max(za, zb));
        eC = max(eC, smoothstep(thD, thD*2.2, abs(za + zb - 2.*z0) / m)); eC = max(eC, smoothstep(thN, thN*1.8, 1.-dot(n0.xyz, a2.xyz))); eC = max(eC, smoothstep(thN, thN*1.8, 1.-dot(n0.xyz, b2.xyz))); }
    }
    vec3 inkS = vec3(.90,.945,.953), inkO = vec3(.74,.84,.87), inkC = vec3(.46,.60,.65);
    float wS = eS, wO = eO*.95, wC = eC*.78; float e = max(wS, max(wO, wC));
    vec3 ink = wS >= max(wO, wC) ? inkS : (wO >= wC ? inkO : inkC);
    vec3 col = mix(c.rgb, ink, e); float al = max(c.a > .01 ? 1. : 0., e);
    gl_FragColor = vec4(col*al, al);
  }`, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
const downMat = new THREE.ShaderMaterial({ uniforms: { tE: { value: null }, px: { value: new THREE.Vector2() }, w: { value: 1 } }, vertexShader: VQ,
  fragmentShader: `uniform sampler2D tE; uniform vec2 px; uniform float w; varying vec2 vUv;
  void main(){ vec4 s = texture2D(tE, vUv + px*vec2(.5,.5)) + texture2D(tE, vUv + px*vec2(-.5,.5)) + texture2D(tE, vUv + px*vec2(.5,-.5)) + texture2D(tE, vUv + px*vec2(-.5,-.5)); gl_FragColor = s*.25*w; }`,
  depthTest: false, depthWrite: false, transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
const copyMat = new THREE.ShaderMaterial({ uniforms: { tA: { value: null } }, vertexShader: VQ,
  fragmentShader: `uniform sampler2D tA; varying vec2 vUv; void main(){ vec4 s = texture2D(tA, vUv); gl_FragColor = vec4(min(s.rgb, vec3(s.a)), min(s.a,1.)); }`,
  depthTest: false, depthWrite: false, blending: THREE.NoBlending });
const quad = new THREE.Mesh(quadGeo, edgeMat), quadScene = new THREE.Scene(); quadScene.add(quad);
const lin = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
const RT = { c: new THREE.WebGLRenderTarget(PX * SS, PY * SS, { type: THREE.UnsignedByteType, ...lin }), n: new THREE.WebGLRenderTarget(PX * SS, PY * SS, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter }),
  e: new THREE.WebGLRenderTarget(PX * SS, PY * SS, { type: THREE.UnsignedByteType, ...lin }), a: new THREE.WebGLRenderTarget(PX, PY, { type: THREE.HalfFloatType, ...lin }) };
function pass(cam, clip, wgt) {
  renderer.clippingPlanes = clip; U.uMode.value = 1;
  renderer.setRenderTarget(RT.n); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
  U.uMode.value = 0; renderer.setRenderTarget(RT.c); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
  renderer.clippingPlanes = [];
  quad.material = edgeMat; edgeMat.uniforms.tC.value = RT.c.texture; edgeMat.uniforms.tN.value = RT.n.texture; edgeMat.uniforms.px.value.set(1 / RT.c.width, 1 / RT.c.height);
  renderer.setRenderTarget(RT.e); renderer.clear(); renderer.render(quadScene, quadCam);
  quad.material = downMat; downMat.uniforms.tE.value = RT.e.texture; downMat.uniforms.px.value.set(1 / RT.e.width, 1 / RT.e.height); downMat.uniforms.w.value = wgt;
  renderer.setRenderTarget(RT.a); renderer.render(quadScene, quadCam);
}
const JOFF = [[-0.125, -0.375], [0.375, -0.125], [0.125, 0.375], [-0.375, 0.125], [0, 0], [0.25, 0.25], [-0.25, 0.25], [0.25, -0.25]];

// ---------- camera ----------
const cam = new THREE.PerspectiveCamera(22, PX / PY, 1, 6000);
const L_ = Math.log;
// [t, [az, el, ln dist, tx, ty, tz]]
const CAMK = track([
  [0, [26, 18, L_(1250), 5, 45, 0]], [T.t1 - 0.3, [20, 15, L_(1150), 5, 45, 0]],
  [T.t1, [34, 20, L_(760), 0, 55, 0]], [T.t2 - 0.2, [26, 16, L_(700), 0, 55, 0]],
  [T.t2 + 1.2, [0, 6, L_(420), 12, 32, 0]], [T.t3 - 0.2, [0, 5, L_(380), 14, 30, 0]],
  [T.t3 + 0.6, [0, 4, L_(520), 45, 60, 0]], [W('t3', 12), [0, 4, L_(520), 45, 60, 0]], [T.t4 - 0.2, [40, 10, L_(560), 45, 60, 0]],
  [T.t4 + 0.6, [0, 3, L_(200), 12, 17, 0]], [T.t5 - 0.1, [4, 4, L_(190), 12, 18, 0]],
  [T.t5 + 0.6, [0, 4, L_(430), 25, 50, 0]], [T.s1 - 0.2, [0, 4, L_(260), 10, 30, 0]],
  [T.s1, [-30, 22, L_(820), 25, 15, 0]], [T.s2 - 0.2, [-22, 18, L_(760), 25, 15, 0]],
  [T.s2 + 1.0, [0, 5, L_(330), -5, 18, 0]], [T.s3 - 0.2, [0, 5, L_(300), -5, 18, 0]],
  [T.s3 + 0.8, [0, 5, L_(250), -10, 30, 0]], [T.s4 - 0.2, [0, 5, L_(260), -10, 30, 0]],
  [T.s4 + 0.8, [0, 5, L_(420), -25, 45, 0]], [T.cierre - 0.2, [6, 6, L_(400), -25, 40, 0]],
  [T.cierre + 0.8, [18, 10, L_(1350), 5, 45, 0]], [T.end, [26, 14, L_(1450), 5, 45, 0]],
]);
const tgt = new THREE.Vector3();
function camAt(t, jit = [0, 0]) {
  const [az, el, ld, tx, ty, tz] = CAMK(t); const d = Math.exp(ld), a = az * Math.PI / 180, e = el * Math.PI / 180;
  tgt.set(tx, ty, tz); cam.position.set(tx + Math.sin(a) * Math.cos(e) * d, ty + Math.sin(e) * d, tz + Math.cos(a) * Math.cos(e) * d);
  cam.up.set(0, 1, 0); cam.lookAt(tgt); cam.near = Math.max(1, d * 0.05); cam.far = d * 6; cam.updateMatrixWorld();
  cam.setViewOffset(PX, PY, jit[0], jit[1] + 170, PX, PY); return cam; // offset: subject sits above the presenter and subtitles
}
const proj = p => { const v = p.clone().project(cam); return [(v.x + 1) / 2 * PX, (1 - v.y) / 2 * PY]; };

// ---------- scene state per time ----------
const shake = (t, t0) => (t > t0 && t < t0 + 0.35) ? Math.sin(t * 90) * 6 * (1 - (t - t0) / 0.35) : 0;
let ST = {};
function setScene(t) {
  const k = shotAt(t); ST = { k, clipZ: null, arc: null, rodOn: false };
  const both = k === 'hook' || k === 'cierre';
  TG.visible = both || k[0] === 't'; LGp.visible = both || k[0] === 's';
  TG.position.set(both ? -95 : 0, 0, 0); LGp.position.set(both ? 105 : 0, 0, 0);
  // T joint
  TU.position.y = k === 't1' ? (1 - eio(seg(t, W('t1', 6), W('t1', 9)))) * 160 : 0;
  TU.visible = !(k === 't1' && t < W('t1', 6) - 0.05);
  let tf = 1; if (k === 't1') tf = 0; else if (k === 't2') tf = eo(seg(t, W('t2', 5), W('t2', 9)));
  TF.scale.set(Math.max(1e-3, tf), Math.max(1e-3, tf), 1); PATH_T.value = 1.01;
  notch.visible = k === 't5' && t > W('t5', 8); notch.scale.set(1, 1, 1);
  // lap joint
  const sl = k === 's1' ? eio(seg(t, W('s1', 6), W('s1', 10))) : 1;
  LTp.position.set((1 - sl) * 160, (1 - sl) * 60, 0); LTp.visible = !(k === 's1' && t < W('s1', 6) - 0.05);
  let lf = 1; if (k === 's1' || k === 's3') lf = 0; else if (k === 's2') lf = eo(seg(t, W('s2', 4), W('s2', 9))); else if (k === 's4') lf = eo(seg(t, W('s4', 13), W('s4', 19)));
  LF.scale.set(Math.max(1e-3, lf), Math.max(1e-3, lf), 1); PATH_L.value = 1.01;
  const burn = k === 's3' ? eo(seg(t, W('s3', 4), W('s3', 8))) : 0;
  LEDGE.scale.set(1, Math.max(1e-3, 1 - burn * 0.85), 1); LEDGE.position.x = -11 + burn * 1.2;
  // section: hook sweeps the cut in; detail shots stay cut at z = 0
  if (k === 'hook') ST.clipZ = lerp(Z1 + 1, 0, eio(seg(t, 0.3, 3.2)));
  else if (k === 't2') ST.clipZ = lerp(Z1 + 1, 0, eio(seg(t, T.t2, T.t2 + 1.2)));
  else if (['t3', 't4', 't5', 's2', 's3', 's4', 'cierre'].includes(k)) ST.clipZ = 0;
  // electrode
  ROD.visible = false;
  const tipT = new THREE.Vector3(5 + 3, 10 + 3, 0), tipL = new THREE.Vector3(-11 - 3, 8 + 2, 0);
  if (k === 't3') { ROD.visible = true; aimRod(tipT, 45, t > W('t3', 13) ? 15 * eo(seg(t, W('t3', 13), W('t3', 15))) : 0); ST.arc = tipT; }
  if (k === 't5') { ROD.visible = true; const a = 45 + 32 * eio(seg(t, W('t5', 2), W('t5', 6))); aimRod(new THREE.Vector3(5 + 2, 10 + 5, 0), a, 0); ST.arc = new THREE.Vector3(6, 16, 0); }
  if (k === 's3') { ROD.visible = true; aimRod(new THREE.Vector3(-10, 17, 0), 100, 0); ST.arc = new THREE.Vector3(-10, 16, 0); }
  if (k === 's4') { ROD.visible = true; aimRod(new THREE.Vector3(-16, 10, 0), 130, 0); ST.arc = new THREE.Vector3(-15, 9, 0); }
  if (ST.arc) ST.arc = ST.arc.clone().add(k[0] === 's' ? LGp.position : TG.position);
  scene.updateMatrixWorld(true);
}

// ---------- 2D overlay ----------
const bg = document.getElementById('bg').getContext('2d'), ov = document.getElementById('ov').getContext('2d');
function drawBG() { const g = bg.createRadialGradient(540, 860, 50, 540, 860, 1300); g.addColorStop(0, '#14505C'); g.addColorStop(.55, '#0B2A33'); g.addColorStop(1, '#06141A');
  bg.fillStyle = g; bg.fillRect(0, 0, PX, PY); bg.strokeStyle = 'rgba(230,241,243,0.045)'; bg.lineWidth = 1;
  for (let x = 0; x <= PX; x += 40) { bg.beginPath(); bg.moveTo(x + .5, 0); bg.lineTo(x + .5, PY); bg.stroke(); }
  for (let y = 0; y <= PY; y += 40) { bg.beginPath(); bg.moveTo(0, y + .5); bg.lineTo(PX, y + .5); bg.stroke(); }
  bg.strokeStyle = 'rgba(230,241,243,0.10)'; for (let x = 0; x <= PX; x += 200) for (let y = 0; y <= PY; y += 200) { bg.beginPath(); bg.moveTo(x - 6, y); bg.lineTo(x + 6, y); bg.moveTo(x, y - 6); bg.lineTo(x, y + 6); bg.stroke(); } }
const F = (px, w = 900) => `${w} ${px}px P`;
function writeOn(text, x, y, px, col, p, align = 'left') { // plotter-style: text writes on left to right
  ov.font = F(px); ov.textAlign = align === 'right2' ? 'left' : align; ov.textBaseline = 'alphabetic'; ov.fillStyle = col;
  const w = ov.measureText(text).width, x0 = align === 'center' ? x - w / 2 : align === 'right2' ? x - w : x;
  ov.save(); ov.beginPath(); ov.rect(x0 - 4, y - px * 1.2, (w + 8) * clamp(p), px * 1.6); ov.clip(); ov.textAlign = 'left'; ov.fillText(text, x0, y); ov.restore();
}
function tag(t, t0, anchor, dx, dy, name, col = INK) {
  if (t < t0) return; const [ax, ay] = proj(anchor), p = seg(t, t0, t0 + 0.45);
  const bx = ax + dx, by = ay + dy;
  ov.fillStyle = col; ov.beginPath(); ov.arc(ax, ay, 7 * eo(seg(t, t0, t0 + .15)), 0, 7); ov.fill();
  ov.strokeStyle = col; ov.lineWidth = 3; ov.beginPath(); ov.moveTo(ax, ay); ov.lineTo(lerp(ax, bx, p), lerp(ay, by, p)); ov.stroke();
  writeOn(name, bx + (dx >= 0 ? 12 : -12), by + 14, 40, col, seg(t, t0 + .2, t0 + .65), dx >= 0 ? 'left' : 'right2');
}
function dim(t, t0, a, b, off, label) { // dimension line grows from the middle, then arrowheads, then the number
  if (t < t0) return; const A = proj(a), B = proj(b), nx = -(B[1] - A[1]), ny = B[0] - A[0], L = Math.hypot(nx, ny) || 1, ox = nx / L * off, oy = ny / L * off;
  const m = [(A[0] + B[0]) / 2 + ox, (A[1] + B[1]) / 2 + oy], g = eo(seg(t, t0, t0 + .35));
  const a2 = [lerp(m[0], A[0] + ox, g), lerp(m[1], A[1] + oy, g)], b2 = [lerp(m[0], B[0] + ox, g), lerp(m[1], B[1] + oy, g)];
  ov.strokeStyle = OR; ov.lineWidth = 3.5; ov.beginPath(); ov.moveTo(...a2); ov.lineTo(...b2); ov.stroke();
  ov.lineWidth = 2; ov.setLineDash([6, 6]); ov.beginPath(); ov.moveTo(...A); ov.lineTo(A[0] + ox, A[1] + oy); ov.moveTo(...B); ov.lineTo(B[0] + ox, B[1] + oy); ov.stroke(); ov.setLineDash([]);
  if (label) writeOn(label, m[0] + ox * 0.9, m[1] + oy * 0.9 + 14, 40, OR, seg(t, t0 + .35, t0 + .7), 'center');
}
function angleArc(t, t0, c, a0, a1, r, label) { if (t < t0) return; const [cx, cy] = proj(c), p = eo(seg(t, t0, t0 + .4));
  ov.strokeStyle = OR; ov.lineWidth = 4; ov.beginPath(); ov.arc(cx, cy, r, -a0, -lerp(a0, a1, p), true); ov.stroke();
  const am = (a0 + a1) / 2; writeOn(label, cx + Math.cos(am) * (r + 70), cy - Math.sin(am) * (r + 70) + 20, 64, OR, seg(t, t0 + .3, t0 + .7), 'center'); }
function arcGlow(t, p) { if (!p) return; const [x, y] = proj(p), r = 34 + 6 * Math.sin(t * 40);
  const g = ov.createRadialGradient(x, y, 0, x, y, r * 2.4); g.addColorStop(0, 'rgba(255,240,210,0.95)'); g.addColorStop(.25, 'rgba(255,140,42,0.65)'); g.addColorStop(1, 'rgba(255,140,42,0)');
  ov.fillStyle = g; ov.beginPath(); ov.arc(x, y, r * 2.4, 0, 7); ov.fill(); ov.strokeStyle = OR; ov.lineWidth = 3;
  for (let i = 0; i < 9; i++) { const k = (t * 2.6 + hash(i)) % 1, b = hash(i + 9) * 6.28; ov.globalAlpha = 1 - k; ov.beginPath(); ov.moveTo(x + Math.cos(b) * (r + k * 70), y + Math.sin(b) * (r + k * 60)); ov.lineTo(x + Math.cos(b) * (r + 18 + k * 90), y + Math.sin(b) * (r + 18 + k * 80)); ov.stroke(); } ov.globalAlpha = 1; }
function title(t, t0, num, line1, accentWord) { const p = seg(t, t0, t0 + .5);
  if (num) { ov.strokeStyle = INK; ov.lineWidth = 5; ov.beginPath(); ov.arc(540, 200, 44 * eo(seg(t, t0, t0 + .2)), 0, 7); ov.stroke(); writeOn(num, 540, 222, 60, INK, seg(t, t0 + .1, t0 + .3), 'center'); }
  writeOn(line1, 540, num ? 340 : 300, 92, INK, p, 'center'); if (accentWord) writeOn(accentWord, 540, num ? 430 : 400, 92, CY, seg(t, t0 + .3, t0 + .8), 'center'); }
// presenter (creator's character), mouth from the voice level
const PRES = new Image(); PRES.src = 'presenter.png'; const AV = new Image(); AV.src = 'avatar.png';
const amp = t => AMP[Math.min(AMP.length - 1, Math.max(0, Math.round(t * 60)))] || 0;
function presenter(t) { const w = 300, h = 920 * w / 740, x = 28, y = 1300 + (-6 * amp(t) + 2 * Math.sin(t * 2)), s = w / 740, a = amp(t);
  ov.save(); ov.beginPath(); ov.roundRect(x, y, w, h, 28); ov.clip(); ov.drawImage(PRES, x, y, w, h);
  ov.translate(x, y); ov.scale(s, s); ov.fillStyle = '#2a1210'; ov.beginPath(); ov.ellipse(370, 532, 40 + 8 * a, 3 + 24 * a, 0, 0, 7); ov.fill();
  ov.fillStyle = '#c4505a'; ov.beginPath(); ov.ellipse(370, 540 + 10 * a, Math.max(.1, 18 * a), Math.max(.1, 8 * a), 0, 0, 7); ov.fill();
  if ((t % 3.7) < .12) { ov.fillStyle = '#a8734f'; for (const ex of [300, 420]) { ov.beginPath(); ov.ellipse(ex, 374, 30, 24, 0, 0, 7); ov.fill(); } ov.strokeStyle = '#2a1a14'; ov.lineWidth = 6; ov.beginPath(); ov.moveTo(272, 378); ov.lineTo(328, 378); ov.moveTo(392, 378); ov.lineTo(448, 378); ov.stroke(); }
  ov.restore(); ov.save(); ov.shadowColor = CY; ov.shadowBlur = 18; ov.strokeStyle = CY; ov.lineWidth = 6; ov.beginPath(); ov.roundRect(x, y, w, h, 28); ov.stroke(); ov.restore(); }
// karaoke subtitles (chunks of 3 words), right of the presenter
const WORDS = []; TM.shots.forEach(s => { const ws = s.text.split(' '); const tot = ws.reduce((q, w) => q + w.length + 2, 0); let c = s.start;
  for (let i = 0; i < ws.length; i += 3) WORDS.push(ws.slice(i, i + 3).map(w => { const d = (s.end - s.start) * (w.length + 2) / tot; const it = { w, a: c, b: c + d }; c += d; return it; })); });
function subs(t) { const ch = WORDS.find(c => t >= c[0].a - .05 && t < c[c.length - 1].b + .1); if (!ch) return;
  ov.font = F(52); ov.textBaseline = 'alphabetic'; const parts = ch.map((it, i) => it.w.toUpperCase() + (i < ch.length - 1 ? ' ' : ''));
  const tw = parts.reduce((q, p) => q + ov.measureText(p).width, 0); let x = 700 - tw / 2;
  ch.forEach((it, i) => { ov.fillStyle = t >= it.a && t < it.b + .05 ? OR : INK; ov.fillText(parts[i], x, 1500); x += ov.measureText(parts[i]).width; }); }
function brand() { ov.save(); ov.beginPath(); ov.arc(990, 90, 46, 0, 7); ov.clip(); ov.drawImage(AV, 944, 44, 92, 92); ov.restore();
  ov.strokeStyle = CY; ov.lineWidth = 4; ov.beginPath(); ov.arc(990, 90, 46, 0, 7); ov.stroke(); ov.font = F(30, 800); ov.fillStyle = INK; ov.textAlign = 'right'; ov.fillText('@luisgabb17', 925, 102); ov.textAlign = 'left'; }
function pill(t, t0, x, y, text, col) { if (t < t0) return; const p = back(seg(t, t0, t0 + .3)); ov.save(); ov.translate(x, y); ov.scale(p, p); ov.font = F(44); const w = ov.measureText(text).width + 60;
  ov.strokeStyle = col; ov.lineWidth = 4; ov.fillStyle = BG; ov.beginPath(); ov.roundRect(-w / 2, -40, w, 80, 40); ov.fill(); ov.stroke(); ov.fillStyle = col; ov.textAlign = 'center'; ov.fillText(text, 0, 15); ov.restore(); ov.textAlign = 'left'; }

function overlay(t) {
  ov.clearRect(0, 0, PX, PY); if (QS.get("clean")) return; const k = ST.k, tg = TG.position, lg = LGp.position, V = (x, y, z = 0, o = tg) => new THREE.Vector3(x, y, z).add(o);
  if (k === 'hook') { title(t, .1, '', 'JUNTA EN T', 'Y DE SOLAPE'); tag(t, 1.6, V(0, 60, 0), -150, -170, 'T', CY); tag(t, 2.6, V(60, 16, 0, lg), 120, -200, 'SOLAPE', CY);
    if (t > W('hook', 10)) pill(t, W('hook', 10), 540, 1180, '⚠ TRAMPA', OR); }
  else if (k[0] === 't') { title(t, T.t1, '1', 'JUNTA EN T');
    if (k === 't1' && t > W('t1', 12)) tag(t, W('t1', 12), V(0, 100, 0), 160, -120, 'FORMA DE T', CY);
    if (k === 't2' && t > W('t2', 5)) tag(t, W('t2', 5), V(8, 13, 0), 200, -150, 'ESQUINA', OR);
    if (k === 't2' && t > W('t2', 13)) pill(t, W('t2', 13), 540, 1180, 'FILETE', CY);
    if (k === 't3') { arcGlow(t, ST.arc); angleArc(t, W('t3', 4), V(8, 13, 0), 0, Math.PI / 4, 170, '45°'); if (t > W('t3', 13)) pill(t, W('t3', 13), 540, 1180, '+15° HACIA DONDE AVANZAS', OR); }
    if (k === 't4') { dim(t, W('t4', 4), V(5, 10), V(15, 10), 60, 'PATA'); dim(t, W('t4', 5), V(5, 10), V(5, 20), -60, 'PATA'); if (t > W('t4', 9)) pill(t, W('t4', 9), 540, 1180, 'PATAS IGUALES', CY); }
    if (k === 't5') { arcGlow(t, ST.arc); if (t > W('t5', 9)) tag(t, W('t5', 9), V(4, 22, 0), 190, -160, 'MORDEDURA', '#FF4D4D'); } }
  else if (k[0] === 's') { title(t, T.s1, '2', 'JUNTA DE SOLAPE');
    if (k === 's1' && t > W('s1', 10)) pill(t, W('s1', 10), 540, 1180, 'COMO TEJAS', CY);
    if (k === 's2' && t > W('s2', 8)) tag(t, W('s2', 8), V(-11, 16, 0, lg), -200, -170, 'BORDE', OR);
    if (k === 's3') { arcGlow(t, ST.arc); if (t > W('s3', 4)) tag(t, W('s3', 4), V(-10, 15, 0, lg), 200, -170, 'SE QUEMA', '#FF4D4D'); }
    if (k === 's4') { arcGlow(t, ST.arc); if (t > W('s4', 8)) pill(t, W('s4', 8), 540, 1180, 'APUNTA ABAJO', CY); } }
  else { title(t, T.cierre, '', 'RESUMEN'); tag(t, W('cierre', 1), V(10, 15, 0), 40, 200, 'PATAS IGUALES', CY); tag(t, W('cierre', 5), V(-11, 14, 0, lg), -40, 300, 'CUIDA EL BORDE', OR);
    if (t > W('cierre', 10)) pill(t, W('cierre', 10), 540, 1200, 'COMENTA: T o SOLAPE', OR); }
  brand(); presenter(t); subs(t);
}

// ---------- page contract ----------
// ?off=&len= renders a time window, so the film can be rendered in resumable chunks
const QS = new URLSearchParams(location.search), OFF = +(QS.get('off') || 0);
window.DUR = QS.get('len') ? Math.min(+QS.get('len'), T.end - OFF) : T.end;
window.EV = [];
window.render = (t) => { t += OFF;
  setScene(t);
  renderer.setRenderTarget(RT.a); renderer.setClearColor(0x000000, 0); renderer.clear();
  const sh = shake(t, W('t5', 9)) + shake(t, W('s3', 4));
  for (let j = 0; j < JIT; j++) { const o = JOFF[j % JOFF.length]; camAt(t, [o[0] + sh, o[1]]);
    const clip = ST.clipZ == null ? [] : [new THREE.Plane(new THREE.Vector3(0, 0, -1), ST.clipZ)]; pass(cam, clip, 1 / JIT); }
  quad.material = copyMat; copyMat.uniforms.tA.value = RT.a.texture; renderer.setRenderTarget(null); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(quadScene, quadCam);
  camAt(t, [sh, 0]); overlay(t);
};
await document.fonts.load('900 40px P'); await document.fonts.load('800 40px P');
await Promise.all([PRES, AV].map(i => i.decode()));
drawBG(); window.render(0); window.READY = true;
