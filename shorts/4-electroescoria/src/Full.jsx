import React, {useMemo, useRef, useEffect} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree, useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {BokehPass} from 'three/examples/jsm/postprocessing/BokehPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import timing from './timing.json';
import {buildWorld} from './worlds.js';
import {cameraAt, dipAt, LIGHTS, CUTS} from './camera.js';

const Vignette = {
  uniforms: {tDiffuse: {value: null}, amount: {value: 0.32}},
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; uniform float amount; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - 0.5; float v = 1.0 - amount * smoothstep(0.25, 0.75, length(d * vec2(1.0, 0.8))); gl_FragColor = vec4(c.rgb * v, c.a); }',
};

const Grade = {
  uniforms: {tDiffuse: {value: null}, sat: {value: 1.2}, con: {value: 1.08}, warm: {value: 0.035}},
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float sat; uniform float con; uniform float warm; varying vec2 vUv;
  void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb; float l = dot(col, vec3(0.299,0.587,0.114));
  col = mix(vec3(l), col, sat); col = (col - 0.5) * con + 0.5;
  col += vec3(warm, warm*0.4, -warm) * smoothstep(0.35, 1.0, l); col += vec3(-0.01, 0.0, 0.03) * (1.0 - smoothstep(0.0, 0.45, l));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a); }`,
};

function makeSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {top: {value: new THREE.Color('#3d8fe0')}, hor: {value: new THREE.Color('#cde9f8')}, sunDir: {value: new THREE.Vector3(-0.5, 0.6, 0.6).normalize()}, sunCol: {value: new THREE.Color('#fff2c8')}, sunOn: {value: 1}},
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize((modelMatrix * vec4(position,1.0)).xyz - cameraPosition); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunOn; varying vec3 vDir;
    void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 c = mix(hor, top, pow(h, 0.55)); float s = max(dot(normalize(vDir), sunDir), 0.0);
    c += sunCol * (pow(s, 600.0) * 1.2 + pow(s, 12.0) * 0.25) * sunOn; gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), mat); m.renderOrder = -1; m.frustumCulled = false;
  return m;
}

const Scene = ({frame, fps}) => {
  const {gl, scene, camera, size} = useThree();
  const t = frame / fps;
  const world = useMemo(() => buildWorld(), []);
  const lights = useMemo(() => {
    const sun = new THREE.DirectionalLight('#ffffff', 1.5);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
    const hemi = new THREE.HemisphereLight('#ffffff', '#888888', 0.8);
    const pt = new THREE.PointLight('#ffc77a', 0, 14, 1.6);
    const sky = makeSky();
    scene.add(sun, sun.target, hemi, pt, sky);
    scene.add(world.group);
    scene.fog = new THREE.Fog('#cfe4f2', 70, 330);
    gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    return {sun, hemi, pt, sky};
  }, []);
  const comp = useMemo(() => {
    const c = new EffectComposer(gl);
    c.setSize(size.width, size.height);
    c.addPass(new RenderPass(scene, camera));
    const bokeh = new BokehPass(scene, camera, {focus: 5, aperture: 0.0025, maxblur: 0.006});
    if (!process.env.REMOTION_NOBOKEH) c.addPass(bokeh);
    c.addPass(new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 0.2, 0.4, 0.92));
    c.addPass(new ShaderPass(Grade));
    c.addPass(new ShaderPass(Vignette));
    c.addPass(new OutputPass());
    return {c, bokeh};
  }, [gl, scene, camera, size.width, size.height]);

  const tRef = useRef(t); tRef.current = t;
  useFrame(() => {
    const tt = tRef.current;
    const cam = cameraAt(tt);
    camera.fov = 80; camera.near = 0.1; camera.far = 900; camera.updateProjectionMatrix();
    camera.position.copy(cam.pos); camera.lookAt(cam.look);
    const L = LIGHTS[cam.plan.light];
    const A = cam.plan.anchor;
    lights.sun.color.set(L.sun); lights.sun.intensity = L.si;
    lights.sun.position.set(A[0] + L.sunOff[0], A[1] + L.sunOff[1], A[2] + L.sunOff[2]);
    lights.sun.target.position.set(A[0], A[1], A[2]); lights.sun.target.updateMatrixWorld();
    const sc = lights.sun.shadow.camera; sc.left = -L.shadow; sc.right = L.shadow; sc.top = L.shadow; sc.bottom = -L.shadow; sc.near = 1; sc.far = 400; sc.updateProjectionMatrix();
    lights.hemi.color.set(L.sky); lights.hemi.groundColor.set(L.gnd); lights.hemi.intensity = L.hi;
    scene.fog.color.set(L.fog); scene.fog.near = L.near; scene.fog.far = L.far;
    scene.background = null;
    lights.sky.position.copy(cam.pos);
    const su = lights.sky.material.uniforms; su.top.value.set(L.top); su.hor.value.set(L.hor);
    su.sunDir.value.set(L.sunOff[0], L.sunOff[1], L.sunOff[2]).normalize(); su.sunOn.value = (cam.plan.light === 'day' || cam.plan.light === 'morning' || cam.plan.light === 'yard') ? 1 : 0;
    if (L.pt) { lights.pt.color.set(L.pt.c); lights.pt.intensity = L.pt.i; lights.pt.distance = L.pt.d; lights.pt.position.set(A[0] + L.pt.p[0], A[1] + L.pt.p[1], A[2] + L.pt.p[2]); } else lights.pt.intensity = 0;
    world.update(tt, camera, cam.key);
    comp.bokeh.uniforms.focus.value = cam.pos.distanceTo(cam.look);
  }, 0);
  useFrame(() => { comp.c.render(); }, 1);
  return null;
};

// word-by-word captions (Rick style): word times weighted by word length inside each sentence
const WORDS = [];
for (const s of timing.shots) {
  const ws = s.text.split(/\s+/); const wt = ws.map((w) => w.replace(/[^A-Za-z0-9']/g, '').length + 2); const tot = wt.reduce((a, b) => a + b, 0);
  let acc = 0; ws.forEach((w, i) => { const a = s.start + (s.end - s.start) * acc / tot; acc += wt[i]; WORDS.push({w, a, b: s.start + (s.end - s.start) * acc / tot}); });
}
const Caption = ({t}) => {
  let cur = null; for (const x of WORDS) { if (t >= x.a - 0.03 && t < x.b + 0.12) cur = x; }
  if (!cur) return null;
  const k = Math.min(1, (t - cur.a + 0.03) / 0.08); const sc = 0.82 + 0.18 * k;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: cameraAt(t).key === 'close' ? '82%' : '67%', textAlign: 'center', transform: `scale(${sc})`}}>
      <span style={{fontFamily: '"Arial Black", "Arial Bold", Arial, sans-serif', fontWeight: 900, fontSize: 54, color: '#ffffff', letterSpacing: 0.5,
        WebkitTextStroke: '9px #1a1414', paintOrder: 'stroke fill', textShadow: '0 4px 0 rgba(0,0,0,0.35)'}}>{cur.w}</span>
    </div>
  );
};

export const Full = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const dip = dipAt(frame / fps);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <ThreeCanvas width={width} height={height} linear={false} flat shadows
        gl={{antialias: true, preserveDrawingBuffer: true}} camera={{fov: 80, near: 0.1, far: 900, position: [0, 5, 20]}}>
        <Scene frame={frame} fps={fps} />
      </ThreeCanvas>
      <AbsoluteFill style={{backgroundColor: '#f6ecd6', opacity: dip}} />
      {!process.env.REMOTION_NOCAPTION && <Caption t={frame / fps} />}
    </AbsoluteFill>
  );
};
