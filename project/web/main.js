import * as THREE from './lib/three.module.js';
import { createWorld, createBeach } from './world3d.js';
import { createCodet } from './codet3d.js';
import { createVillager, createChicken } from './warga3d.js';

// Ep.2 "Langit Gelap" V2 RE-SKIN — full 28-shot build on the production 3D kit.
// Same script/VO/timing as the approved Ep.2 audio (voice.wav 123.41s, 3794 frames
// @30fps incl. the 3s teaser tail); visuals only, rebuilt from the old 2D story.js
// shot map (one phrase = one shot), with the 27 Nov blocking rules: one camera move
// per shot, stepped turns, eased starts/stops, background actors stay alive.
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.domElement.id = 'c';
renderer.setPixelRatio(1); renderer.setSize(720, 1280, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.06;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 720 / 1280, 0.08, 600);

const world = createWorld(scene);
const beach = createBeach();
beach.group.position.set(0, 0, 30);
beach.group.rotation.y = Math.PI; // sea extends to +z, mud band faces the kampung
beach.setSea(0.85); // receded the whole episode: boats stranded, foam line far away
beach.group.visible = false;
scene.add(beach.group);

const codet = createCodet(); scene.add(codet.group);
const busiti = createVillager('busiti'); scene.add(busiti.group);
const pakrt = createVillager('pakrt'); scene.add(pakrt.group);
const wargaA = createVillager('wargaA'); scene.add(wargaA.group);
const wargaB = createVillager('wargaB'); scene.add(wargaB.group);
const chickens = [];
for (const v of ['putih', 'coklat', 'putih', 'coklat']) {
  const ch = createChicken(v); ch.group.scale.setScalar(0.85); scene.add(ch.group); chickens.push(ch);
}

// falling ash: one Points cloud, re-centred per shot, density from the shot table
const ASH_N = 420;
const ashPos = new Float32Array(ASH_N * 3);
const ashSeed = [];
for (let i = 0; i < ASH_N; i++) {
  ashSeed.push([Math.random(), Math.random(), Math.random(), 0.5 + Math.random()]);
  ashPos[i * 3] = (ashSeed[i][0] - 0.5) * 17;
  ashPos[i * 3 + 1] = ashSeed[i][1] * 8;
  ashPos[i * 3 + 2] = (ashSeed[i][2] - 0.5) * 17;
}
const ashGeo = new THREE.BufferGeometry();
ashGeo.setAttribute('position', new THREE.BufferAttribute(ashPos, 3));
const ashMat = new THREE.PointsMaterial({ color: 0xd8d2c4, size: 0.06, transparent: true, opacity: 0, depthWrite: false });
const ashPts = new THREE.Points(ashGeo, ashMat);
ashPts.visible = false; ashPts.frustumCulled = false;
scene.add(ashPts);

// p12 glasses on the warung table (V3.4 re-direct: the sheet's macro shot — V3
// shipped chickens here instead, the glasses beat never existed)
const glassMat = new THREE.MeshStandardMaterial({ color: 0xcfe4ea, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.6 });
const glasses = [];
for (const [gx, gz] of [[-1.62, -5.78], [-1.28, -5.92], [-0.94, -5.74]]) {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.13, 10, 1, true), glassMat);
  g.position.set(gx, 1.10, gz);
  g.visible = false;
  scene.add(g); glasses.push(g);
}

// ---------- timing (identical to the approved Ep.2 audio build) ----------
const FPS = 30;
const RAW = [8.67, 5.85, 9.74, 4.18, 5.37, 6.82, 5.65, 13.01, 5.29, 8.71, 7.27, 3.45, 11.60, 13.52]; // c1 c2 c3 c4 c5 c6 c7 c11 c12 c8 c13 c14 c9 c10
const GAP = 0.15, ATEMPO = 0.90;
const F30 = (s) => Math.round(s * FPS);
const cStart = [], cEnd = [];
{ let acc = 0; for (let k = 0; k < RAW.length; k++) { const st = (acc + GAP * k) / ATEMPO; cStart.push(F30(st)); cEnd.push(F30(st + RAW[k] / ATEMPO)); acc += RAW[k]; } }
const VO_END = cEnd[RAW.length - 1];
const ph = (ci, f0, f1) => [Math.round(cStart[ci] + f0 * (cEnd[ci] - cStart[ci])), Math.round(cStart[ci] + f1 * (cEnd[ci] - cStart[ci])) - 1];
const W = {
  p1: ph(0, 0, 6 / 19), p2: ph(0, 6 / 19, 1),
  p3: ph(1, 0, 1),
  p4: ph(2, 0, 10 / 19), p5: ph(2, 10 / 19, 1),
  p6: ph(3, 0, 1),
  p7: ph(4, 0, 1),
  p8: ph(5, 0, 8 / 15), p9: ph(5, 8 / 15, 1),
  p10: ph(6, 0, 1),
  q1: ph(7, 0, 5 / 19), q2: ph(7, 5 / 19, 12 / 19), q3: ph(7, 12 / 19, 1),
  q4: ph(8, 0, 1),
  p11: ph(9, 0, 4 / 15), p12: ph(9, 4 / 15, 7 / 15), p13: ph(9, 7 / 15, 1),
  q5: ph(10, 0, 5 / 15), q6: ph(10, 5 / 15, 10 / 15), q7: ph(10, 10 / 15, 1),
  q8: ph(11, 0, 0.55), q9: ph(11, 0.55, 1),
  p14: ph(12, 0, 9 / 16), p15: ph(12, 9 / 16, 1),
  p16: ph(13, 0, 4 / 31), p17: ph(13, 4 / 31, 23 / 31), p18: ph(13, 23 / 31, 1),
  teaser: [VO_END + 1, VO_END + 90],
};
window.TOTAL = VO_END + 91;
const LAMP_ON = Math.round(W.p8[0] + 0.68 * (W.p8[1] - W.p8[0]));
const ORDER = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'q1', 'q2', 'q3', 'q4', 'p11', 'p12', 'p13', 'q5', 'q6', 'q7', 'q8', 'q9', 'p14', 'p15', 'p16', 'p17', 'p18', 'teaser'];
// V3.6 PRO-EDIT FIX: chunk windows leave ~5-frame gaps (the VO inter-chunk pauses).
// shotAt() used to fall back to 'teaser' inside those gaps — a 5-frame FLASH of the
// beach teaser camera + cast between every pair of chunks. That is the subliminal
// flicker that made the cuts feel rough ("potongan kasar"). Professional rule: a
// shot HOLDS until the next shot starts. Extend every shot's end to the next start-1.
for (let i = 0; i < ORDER.length - 1; i++) W[ORDER[i]][1] = W[ORDER[i + 1]][0] - 1;
const LIGHT = { p1: 'pagiAbu', p2: 'pagiAbu', p3: 'pagiAbu', p4: 'gloom1', p5: 'gloom1', p6: 'gloom1', p7: 'gloom2', p8: 'gloom2', p9: 'gloom2', p10: 'gloom2', q1: 'gloom2', q2: 'gloom2', q3: 'gloom2', q4: 'gloom2', p11: 'gloom2', p12: 'gloom2', p13: 'gloom2', q5: 'gloom2', q6: 'gloom2', q7: 'gloom2', q8: 'gloom2', q9: 'gloom2', p14: 'gloom2', p15: 'gloom2', p16: 'gloom2', p17: 'gloom2', p18: 'gloom2', teaser: 'gloom2' };
const shotAt = (f) => ORDER.find((id) => f >= W[id][0] && f <= W[id][1]) || 'teaser';

// ---------- lipsync envelopes (measured from the trimmed dialogue chunks, ATEMPO 0.90) ----------
const LIP = {
  p3: [[20, 0], [2, 1], [2, 3], [5, 2], [32, 0], [4, 3], [4, 2], [2, 2], [4, 1], [4, 0], [2, 2], [5, 1], [4, 1], [3, 0], [2, 2], [2, 0], [2, 1], [2, 2], [2, 1], [28, 0], [2, 3], [2, 1], [3, 0], [5, 1], [3, 3], [3, 0], [5, 2], [2, 0], [14, 1], [4, 2], [5, 0], [5, 2], [6, 1], [4, 1]],
  p7: [[20, 0], [8, 3], [12, 0], [4, 3], [4, 3], [3, 0], [3, 3], [2, 1], [3, 0], [5, 3], [4, 0], [4, 2], [2, 3], [2, 2], [4, 3], [5, 3], [3, 2], [7, 3], [11, 0], [6, 2], [3, 0], [2, 3], [4, 2], [2, 3], [3, 2], [6, 3], [3, 3], [2, 2], [12, 3], [5, 2], [3, 3], [3, 2], [2, 3], [4, 2], [7, 3], [3, 1], [3, 0]],
  p10: [[15, 0], [4, 0], [5, 1], [4, 3], [24, 0], [4, 2], [2, 1], [9, 0], [4, 3], [5, 2], [3, 1], [5, 2], [3, 2], [9, 0], [2, 1], [3, 2], [3, 0], [4, 0], [3, 1], [3, 2], [7, 0], [10, 0], [4, 1], [5, 3], [9, 0], [8, 1], [3, 3], [2, 1], [4, 2], [3, 2], [5, 1], [6, 3], [2, 1], [6, 0]],
  q4: [[2, 2], [1, 3], [1, 2], [1, 1], [11, 0], [1, 1], [6, 3], [1, 2], [1, 1], [16, 0], [1, 2], [2, 3], [1, 2], [4, 3], [3, 2], [5, 3], [1, 2], [1, 1], [1, 2], [2, 3], [1, 1], [1, 0], [1, 1], [1, 2], [2, 3], [3, 2], [3, 3], [1, 1], [1, 0], [1, 1], [13, 0], [1, 2], [11, 3], [1, 0], [1, 2], [9, 3], [1, 2], [2, 1], [3, 2], [2, 1], [1, 2], [1, 1], [3, 2], [2, 1], [2, 3], [1, 2], [2, 3], [1, 2], [1, 1], [2, 2], [2, 3], [1, 2], [6, 3], [1, 2], [1, 1], [7, 3], [1, 2], [3, 3], [1, 1], [2, 3], [1, 2], [3, 3], [1, 2], [4, 3], [1, 2], [1, 1], [3, 0]],
  q5: [[10, 0], [1, 1], [2, 2], [1, 3], [1, 2], [2, 3], [1, 2], [2, 1], [17, 0], [3, 2], [2, 3], [1, 2], [2, 3], [2, 2], [2, 1], [1, 2], [3, 3], [1, 2], [2, 3], [3, 2], [2, 0], [1, 1], [2, 3], [1, 2], [1, 3], [1, 2], [2, 1], [1, 2], [1, 3], [2, 2], [1, 3], [1, 2], [1, 1], [28, 0], [1, 2], [2, 3], [2, 1], [1, 2], [2, 3], [1, 2], [1, 1], [3, 2], [4, 3], [2, 2], [1, 1], [24, 0], [1, 1], [1, 2], [2, 3], [1, 0], [1, 1], [2, 3], [1, 2], [1, 1], [1, 2], [1, 3], [1, 2], [2, 3], [3, 1], [1, 2], [3, 3], [1, 2], [1, 1], [1, 2], [1, 3], [1, 2], [2, 1], [21, 0], [2, 3], [1, 2], [1, 3], [1, 2], [4, 3], [1, 2], [2, 0], [1, 2], [5, 3], [1, 2], [1, 0], [1, 1], [6, 3], [1, 2], [1, 3], [1, 2], [2, 1], [3, 2], [1, 3], [1, 2], [2, 1], [1, 2], [2, 1], [2, 0]],
};
const lipAt = (id, f, base) => {
  let off = f - (base ?? W[id][0]);
  for (const [n, lv] of LIP[id]) { if (off < n) return lv; off -= n; }
  return 0;
};
const lipV = (id, f, base) => Math.min(2, lipAt(id, f, base)); // villager mouths take 0..2

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (A, B, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)];
const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const ramp = (f, a, b) => clamp((f - a) / (b - a));
const blinkAt = (f, seed) => { const p = (f + seed * 17) % 101; return p < 3 ? Math.sin(p / 3 * Math.PI) : 0; };
function setCam(pos, look, fov) {
  camera.position.set(pos[0], pos[1], pos[2]);
  camera.lookAt(look[0], look[1], look[2]);
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
}
function place(obj, x, z, ry) { obj.group.position.x = x; obj.group.position.z = z; obj.group.rotation.y = ry; }
// camera keyframe pair over a shot window: linear drift (one move per shot)
const K2 = (id, p0, l0, f0, p1, l1, f1) => ({ a: W[id][0], b: W[id][1], p0, l0, f0, p1: p1 || p0, l1: l1 || l0, f1: f1 === undefined ? f0 : f1 });
function camK(km, f) {
  // V3.6: ease the drift in/out (smoothstep) — a professional move starts and
  // settles gently; the old linear drift lurched at every cut.
  const k = smooth(km.b > km.a ? (f - km.a) / (km.b - km.a) : 0);
  setCam(lerp3(km.p0, km.p1, k), lerp3(km.l0, km.l1, k), lerp(km.f0, km.f1, k));
}
const SMOKE = { p1: 0.30, p2: 0.34, p3: 0.30, p4: 0.62, p5: 0.45, p6: 0.45, p7: 0.48, p8: 0.48, p9: 0.50, p10: 0.50, q1: 0.50, q2: 0.50, q3: 0.50, q4: 0.50, p11: 0.50, p12: 0.50, p13: 0.50, q5: 0.50, q6: 0.50, q7: 0.50, q8: 0.50, q9: 0.50, p14: 0.55, p15: 0.55, p16: 0.35, p17: 0.35, p18: 0.38, teaser: 0.40 };
const ASH = { p5: [0.50, 0.4, -3.0], p6: [0.70, 0.4, -3.0], p7: [0.85, -0.6, -4.2], p8: [0.50, 0.2, -4.6], p9: [0.40, 0.4, -3.0], q1: [0.20, 4.6, -4.6], q2: [0.22, 4.6, -4.6], q3: [0.30, 4.6, -4.6], q4: [0.20, 4.6, -4.6], p10: [0.45, 0.2, -4.2], p11: [0.22, 0.4, -3.0], p13: [0.18, 4.6, -4.6], p18: [0.15, 0.6, 24.0] };
const CODET = [0.9, -4.6], BUSITI = [-1.9, -6.8], SUMUR = [4.4, -5.4], PAKRT = [2.7, -4.1];

// ---------- cameras (V3 RE-DIRECT per prod/ep2/BLOCKING.md — the V2 build copied the
// old 2D story.js framings and the user rejected it: Bu Siti hidden behind the counter /
// standing in the well, speakers shot from behind, near-identical cameras on p8/p10.
// V3 rules: dialogue cameras sit within ±35° of the speaker's facing with the face
// >= 1/4 frame height; nobody stands inside a prop footprint (well apron spots
// S1 [3.15,-4.55], S2 [5.65,-4.6], S3 [4.35,-3.9]); consecutive shots differ by
// >= 30° or >= 2x distance. Beach geography: shore z≈22, mud/boats z≈33, sea +z) ----------
const CAMS = {
  p1: K2('p1', [10.5, 3.2, 16.5], [-7.5, 2.2, -15], 43, [9.4, 3.0, 13.5], [-5.5, 2.0, -13.5], 41),
  p2: K2('p2', [0, 6, -20], [-46, 34, -148], 36, [-2, 6.5, -22], [-47, 36, -148], 35),
  p3: K2('p3', [4.85, 1.6, -1.35], [2.6, 1.2, -4.15], 38, [4.75, 1.62, -1.5], [2.6, 1.22, -4.15], 37),
  p4: K2('p4', [-2, 7, -30], [-46, 38, -148], 30, [-5, 8.5, -40], [-46, 42, -148], 29),
  p5: K2('p5', [2.2, 0.7, 1.8], [0.2, 1.6, -5.2], 42, [2.0, 0.75, 1.4], [0.2, 1.6, -5.2], 41),
  p6: K2('p6', [7.5, 3.4, 6.5], [-3, 2.2, -8], 40, [4.5, 2.2, 4.5], [0.6, 1.3, -5.2], 38),
  p7: K2('p7', [-3.1, 1.7, -5.6], [-4.9, 1.15, -8.0], 38, [-3.25, 1.68, -5.75], [-4.9, 1.15, -8.0], 37),
  p8: K2('p8', [1.9, 1.6, -2.7], [-0.5, 1.25, -6.1], 38, [1.85, 1.6, -2.85], [-0.5, 1.25, -6.1], 37),
  p9: K2('p9', [11.5, 3.6, 17.5], [-7.5, 2.0, -14], 44, [11.3, 3.55, 17.2], [-7.5, 2.0, -14], 44),
  p10: K2('p10', [1.8, 1.6, -1.2], [-1.05, 1.2, -5.0], 40, [1.9, 1.6, -1.35], [-1.05, 1.2, -5.0], 39),
  q1: K2('q1', [8.6, 2.2, 1.2], [4.2, 1.0, -5.0], 40, [8.4, 2.15, 1.0], [4.2, 1.0, -5.0], 39),
  q2: K2('q2', [5.9, 1.35, -2.2], [4.4, 0.75, -5.35], 40, [5.8, 1.35, -2.35], [4.4, 0.75, -5.35], 39),
  q3: K2('q3', [5.7, 1.55, -2.1], [3.8, 1.05, -4.85], 40, [5.6, 1.53, -2.25], [3.8, 1.05, -4.85], 39),
  q4: K2('q4', [1.3, 1.6, -1.6], [3.75, 1.15, -4.2], 42, [1.4, 1.6, -1.75], [3.75, 1.15, -4.2], 41),
  p11: K2('p11', [-12, 3.0, 10], [0, 1.5, -6], 42, [-11.6, 3.0, 9.6], [0, 1.5, -6], 42),
  p12: K2('p12', [5.4, 0.8, 0.6], [3.4, 0.35, -2.6], 40, [5.2, 0.8, 0.3], [3.4, 0.35, -2.6], 40),
  p13: K2('p13', [8.6, 2.0, 0.6], [4.3, 1.0, -4.9], 40, [8.4, 1.95, 0.4], [4.3, 1.0, -4.9], 39),
  q5: K2('q5', [2.6, 1.85, -0.1], [4.0, 1.2, -4.2], 44, [2.7, 1.83, -0.25], [4.0, 1.2, -4.2], 43),
  q6: K2('q6', [5.3, 1.8, -2.2], [3.4, 1.1, -4.6], 40, [5.2, 1.78, -2.35], [3.4, 1.1, -4.6], 39),
  q7: K2('q7', [9.6, 3.0, 6.0], [2.0, 1.2, -5.0], 42, [9.4, 2.9, 5.7], [2.0, 1.2, -5.0], 42),
  q8: K2('q8', [5.6, 1.35, -1.9], [4.3, 0.95, -3.9], 40, [5.5, 1.33, -2.0], [4.3, 0.95, -3.9], 39),
  q9: K2('q9', [3.6, 1.6, -0.9], [4.95, 1.25, -3.0], 38, [3.7, 1.6, -1.05], [4.95, 1.25, -3.0], 37),
  p14: K2('p14', [6, 1.2, 8], [-14, 7, -60], 44, [5.7, 1.25, 7.6], [-14, 7, -60], 43),
  p15: K2('p15', [2.3, 1.7, 0.9], [0.9, 1.4, -4.6], 34),
  p17: K2('p17', [1.9, 1.7, 19.2], [-0.6, 0.5, 34], 44, [1.85, 1.68, 19.5], [-0.6, 0.5, 34], 43),
  p18: K2('p18', [2.1, 1.65, 28.4], [0.55, 1.3, 24.35], 36, [2.0, 1.63, 28.2], [0.55, 1.3, 24.35], 35),
  teaser: K2('teaser', [1.9, 1.7, 19.2], [-0.6, 0.5, 34], 43),
};
const CH_HOME = [[2.4, -2.4], [3.6, -3.2], [1.8, -1.8], [4.8, -2.0]];
function chickensIdle(f) {
  chickens.forEach((ch, i) => {
    ch.group.position.set(CH_HOME[i][0], 0, CH_HOME[i][1]);
    ch.group.rotation.y = i * 1.7;
    ch.update(f / FPS, { step: (f % (46 + i * 6)) / (46 + i * 6), flap: 0, run: 0, peck: Math.max(0, Math.sin(f * (0.09 + i * 0.02) + i * 2)) });
  });
}

window.renderFrame = (f) => {
  const t = f / FPS;
  const S = shotAt(f);
  world.setLight(LIGHT[S]);
  beach.group.visible = f >= W.p16[0];
  let fx = { smoke: SMOKE[S] ?? 0.4, lampOn: f >= LAMP_ON };
  // defaults each frame
  codet.setWalk(null); codet.setPose({ armL: 'down', armR: 'down' });
  place(codet, CODET[0], CODET[1], 0.15); codet.group.position.y = 0;
  place(busiti, -1.75, -6.35, 0.22); // V3: behind the counter, close to it (was -3.15,-6.15: hidden)
  place(pakrt, PAKRT[0], PAKRT[1], -0.3);
  place(wargaA, -3.4, -1.6, Math.PI / 2); wargaA.setWalk(null);
  place(wargaB, -8.2, -4.0, 0.5); wargaB.setWalk(null);
  busiti.setFace({ expr: 'neutral', blink: blinkAt(f, 8), lip: 0 });
  pakrt.setFace({ expr: 'neutral', blink: blinkAt(f, 6), lip: 0 });
  wargaA.setFace({ expr: 'neutral', blink: blinkAt(f, 11), lip: 0 });
  wargaB.setFace({ expr: 'neutral', blink: blinkAt(f, 14), lip: 0 });
  // V3.2: reset ALL warga arms every frame — without this, p7's raised arm stayed
  // up through p8..q5 (state carryover: Bu Siti stood one arm raised for 40 s)
  busiti.setArm(1, 'down'); busiti.setArm(-1, 'down');
  pakrt.setArm(1, 'down'); pakrt.setArm(-1, 'down');
  wargaA.setArm(1, 'down'); wargaA.setArm(-1, 'down');
  wargaB.setArm(1, 'down'); wargaB.setArm(-1, 'down');
  codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.3, headTilt: 0, headPitch: 0 });
  chickensIdle(f);
  // ash cloud follows the shot table
  const ash = ASH[S];
  if (ash) {
    ashPts.visible = true;
    ashMat.opacity = ash[0] * 0.6;
    ashPts.position.set(ash[1], 0.4, ash[2]);
    const pos = ashGeo.attributes.position.array;
    for (let i = 0; i < ASH_N; i++) {
      let y = pos[i * 3 + 1] - 0.011 * ashSeed[i][3];
      if (y < 0) y += 8;
      pos[i * 3 + 1] = y;
      pos[i * 3] += Math.sin(t * 0.7 + i) * 0.0012;
    }
    ashGeo.attributes.position.needsUpdate = true;
  } else ashPts.visible = false;

  switch (S) {
    case 'p1': // payoff wide: the morning after — everyone up, but the light is wrong
      camK(CAMS.p1, f);
      codet.setPose({ armL: 'hold', armR: 'hold' });
      busiti.setFace({ expr: 'worry', blink: blinkAt(f, 8), lip: 0 });
      wargaB.setFace({ expr: 'worry', blink: blinkAt(f, 14), lip: 0 });
      break;
    case 'p2': // sky and the smoking peak only
      camK(CAMS.p2, f);
      break;
    case 'p3': // PAK RT dialogue, over his shoulder, looking up (lipsync c2)
      camK(CAMS.p3, f);
      place(pakrt, 2.7, -4.3, 0.5); // V3.3: feet ON the dirt band (V3.2 still landed on the grass strip south of it)
      pakrt.setFace({ expr: 'talk', blink: blinkAt(f, 6), lip: lipV('p3', f), look: -0.2, headTilt: -8 + 1.5 * Math.sin(f * 0.1) });
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.35, headTilt: -6, headPitch: -10 });
      break;
    case 'p4': // the mountain alone, smoking black
      camK(CAMS.p4, f);
      break;
    case 'p5': // low angle: ash begins to fall past the camera, Codet under it
      camK(CAMS.p5, f);
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.2, headTilt: -10, headPitch: -14 });
      busiti.setFace({ expr: 'worry', blink: blinkAt(f, 8), lip: 0 });
      break;
    case 'p6': // everything turns grey
      camK(CAMS.p6, f);
      codet.setPose({ armL: 'hold', armR: 'hold' });
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0, headTilt: 3 });
      busiti.setFace({ expr: 'worry', blink: blinkAt(f, 8), lip: 0 });
      break;
    case 'p7': { // BU SITI dialogue at the LAUNDRY LINE (lipsync c5): ash on the clothes is the proof; Codet hurries in to help
      camK(CAMS.p7, f);
      place(busiti, -5.0, -8.0, 0.65); // V3.3: RESTORED V3 (full face at the line) — V3.1/V3.2 experiments (back view / cropped) were worse
      busiti.setArm(-1, 'up'); // free hand holds the line/cloth; bucket arm stays down
      busiti.setFace({ expr: 'talk', blink: blinkAt(f, 8), lip: lipV('p7', f), headTilt: 3.5 * Math.sin(f * 0.16) });
      const wIn = ramp(f, W.p7[0] + 0.30 * (W.p7[1] - W.p7[0]), W.p7[1]);
      const wx = lerp(-1.6, -3.55, smooth(wIn)), wz = lerp(-6.0, -7.35, smooth(wIn));
      place(codet, wx, wz, -2.0);
      if (wIn > 0 && wIn < 1) codet.setWalk((f - W.p7[0]) * 0.30);
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: -0.3 });
      break;
    }
    case 'p8': // Bu Siti OUTSIDE at the warung corner post clicks the lamp on at 10 AM; Codet watches from the path
      camK(CAMS.p8, f);
      place(busiti, -0.35, -5.95, 0.9); // V3.1: right at the front post — her raised hand reaches the lamp switch
      busiti.setArm(1, f >= LAMP_ON ? 'down' : 'up');
      busiti.setFace({ expr: f >= LAMP_ON ? 'worry' : 'neutral', blink: blinkAt(f, 8), lip: 0, look: 0.1 });
      place(codet, -1.2, -4.5, 2.6);
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: -0.25 });
      break;
    case 'p9': // wide: midday dark as night, one warm lamp in the gloom
      camK(CAMS.p9, f);
      busiti.setFace({ expr: 'worry', blink: blinkAt(f, 8), lip: 0 });
      wargaB.setFace({ expr: 'nervous', blink: blinkAt(f, 14), lip: 0 });
      break;
    case 'p10': { // TRUE two-shot in front of the warung: Codet asks (lipsync c7); Bu Siti has no answer
      camK(CAMS.p10, f);
      place(codet, 0.2, -4.3, -0.35); // V3.2: body 3/4 to her + gaze on her (V3.1 still addressed the camera)
      place(busiti, -0.75, -3.9, 0.9);
      const late = ramp(f, W.p10[0] + 0.75 * (W.p10[1] - W.p10[0]), W.p10[1]);
      codet.setFace({ expr: late > 0.5 ? 'scared' : 'think', lip: lipAt('p10', f), blink: blinkAt(f, 3), look: -0.4 });
      busiti.setFace({ expr: late > 0.5 ? 'shock' : 'worry', blink: blinkAt(f, 8), lip: 0 });
      break;
    }
    case 'q1': // the well crowd ON THE APRON (V2 put Bu Siti inside the well barrel): everyone frozen, chickens silent
      camK(CAMS.q1, f);
      place(busiti, 3.15, -4.55, 0.8);
      busiti.setFace({ expr: 'worry', blink: blinkAt(f, 8), lip: 0 });
      place(wargaA, 5.65, -4.6, -0.6); wargaA.setArm(1, 'up'); // holding the draw rope, motionless
      wargaA.setFace({ expr: 'nervous', blink: blinkAt(f, 11), lip: 0 });
      place(codet, 4.35, -3.9, 0.2);
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.3 });
      break;
    case 'q2': // the draw: the bucket comes up, the villager holds the dipper a long time
      camK(CAMS.q2, f);
      place(wargaA, 5.65, -4.6, -0.4);
      wargaA.setArm(1, 'up');
      wargaA.setFace({ expr: 'nervous', blink: blinkAt(f, 11), lip: 0, look: 0.2, headTilt: -6 + 1.5 * Math.sin(f * 0.08) });
      place(busiti, 3.15, -4.55, 0.8);
      busiti.setFace({ expr: 'worry', blink: blinkAt(f, 8), lip: 0 });
      codet.group.visible = false;
      break;
    case 'q3': // the water is warm — Codet touches the well water, steam rises
      camK(CAMS.q3, f);
      place(codet, 3.75, -4.8, 1.5); // V3.2: turned INTO the well (V3.1 faced the audience, not the water)
      codet.setPose({ armR: 'hold' }); // V3.1: forearm up, just dipped in the water
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.3, headTilt: -4, headPitch: 14 }); // V3.1: leans IN over the rim
      place(busiti, 3.15, -4.55, 0.8);
      busiti.setFace({ expr: 'worry', blink: blinkAt(f, 8), lip: 0 });
      fx.wellWarm = true;
      break;
    case 'q4': // BU SITI dialogue BESIDE the well (lipsync c12); Pak RT listens
      camK(CAMS.q4, f);
      place(busiti, 3.15, -4.55, 0.35); // V3.1: angled toward Pak RT, gaze on him — not addressing the camera
      busiti.setFace({ expr: 'talk', blink: blinkAt(f, 8), lip: lipV('q4', f), look: 0.3, headTilt: 3 * Math.sin(f * 0.14) });
      place(pakrt, 4.0, -3.75, -1.9); // V3.3: V3.1's in-frame spot + face cheated 23 deg toward camera (V3.2 moved him OUT of frame)
      pakrt.setFace({ expr: 'worry', blink: blinkAt(f, 6), lip: 0, look: 0.25, headTilt: -6 });
      codet.group.visible = false;
      break;
    case 'p11': // V3.5: "Tidak ada yang jawab" — WEST wide (new angle, not p1's), the whole kampung frozen mid-breath. NO shake: the tremor has not come yet
      camK(CAMS.p11, f);
      codet.setPose({ armL: 'hold', armR: 'hold' });
      codet.setFace({ expr: 'think', lip: 0, blink: 0, look: 0.2, headTilt: -6 });
      busiti.setFace({ expr: 'worry', blink: 0, lip: 0 });
      wargaB.setFace({ expr: 'nervous', blink: 0, lip: 0, look: 0.4 });
      wargaA.setWalk(0.35 * Math.PI * 2); // frozen mid-stride
      wargaA.setFace({ expr: 'nervous', blink: 0, lip: 0, look: 0.4 });
      break;
    case 'p12': // V3.5: "Ayam-ayam diam total" — the chickens, silent and alert for the first time ever
      camK(CAMS.p12, f);
      chickens.forEach((ch, i) => {
        ch.group.position.set(CH_HOME[i][0], 0, CH_HOME[i][1]);
        ch.group.rotation.y = i * 1.7;
        ch.update(t, { step: [0.2, 0.55, 0.8, 0.35][i], flap: 0, run: 0, peck: 0 });
      });
      break;
    case 'p13': // V3.5: "Sumur yang kemarin keruh, sekarang airnya hangat" — the well again, wider; warm water between them
      camK(CAMS.p13, f);
      place(busiti, 3.15, -4.55, 0.8);
      busiti.setFace({ expr: 'worry', blink: blinkAt(f, 8), lip: 0 });
      place(codet, 4.35, -3.9, 0.3);
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.3 });
      fx.wellWarm = true;
      break;
    case 'q5': // PAK RT dialogue: calming the crowd at the well apron (lipsync c13, part 1)
      camK(CAMS.q5, f);
      place(pakrt, 4.35, -3.9, -0.3);
      place(busiti, 3.55, -4.55, 0.8); // V3.1: crowd pulled IN around Pak RT so the frame holds all three
      place(wargaA, 5.25, -4.4, -0.5); // V3.3: clear of Pak RT's shoulder (V3.2 hid him behind Pak RT)
      pakrt.setArm(-1, 'up'); pakrt.setArm(1, 'up');
      pakrt.setFace({ expr: 'talk', blink: blinkAt(f, 6), lip: lipV('q5', f), look: 0, headTilt: -4 });
      busiti.setFace({ expr: 'worry', blink: blinkAt(f, 8), lip: 0 });
      wargaA.setFace({ expr: 'nervous', blink: blinkAt(f, 11), lip: 0, look: 0.4 });
      break;
    case 'q6': // "mungkin cuma cuaca" — the villagers look at each other (lipsync c13, part 2)
      camK(CAMS.q6, f);
      place(pakrt, 4.35, -3.9, -0.3);
      place(wargaA, 5.65, -4.6, -0.6);
      place(wargaB, 6.3, -4.9, -0.9);
      pakrt.setFace({ expr: 'talk', blink: blinkAt(f, 6), lip: lipV('q5', f, W.q5[0]), look: 0, headTilt: -4 });
      wargaA.setFace({ expr: 'nervous', blink: blinkAt(f, 11), lip: 0, look: 0.4 });
      wargaB.setFace({ expr: 'nervous', blink: blinkAt(f, 14), lip: 0, look: -0.3 });
      codet.group.visible = false;
      break;
    case 'q7': // "Semua pulang ke rumah masing-masing" — nobody moves
      camK(CAMS.q7, f);
      place(pakrt, 4.35, -3.9, -0.3);
      place(busiti, 3.15, -4.55, 0.8);
      place(wargaA, 5.65, -4.6, -0.6);
      place(wargaB, 6.3, -4.9, -0.9);
      pakrt.setFace({ expr: 'worry', blink: 0, lip: 0, look: 0.3, headTilt: -4 });
      busiti.setFace({ expr: 'worry', blink: 0, lip: 0 });
      wargaA.setFace({ expr: 'nervous', blink: 0, lip: 0, look: 0.4 });
      wargaB.setFace({ expr: 'nervous', blink: 0, lip: 0, look: -0.3 });
      codet.group.visible = false;
      break;
    case 'q8': // V3.5: "Tapi Codet lihat tangan Pak RT gemetar" — close-up: Pak RT's hands tremble as he speaks
      camK(CAMS.q8, f);
      place(pakrt, 4.35, -3.9, -0.3);
      pakrt.group.position.x = 4.35 + 0.012 * Math.sin(f * 0.9);
      pakrt.group.position.y = 0.008 * Math.sin(f * 1.13);
      pakrt.setFace({ expr: 'shock', blink: blinkAt(f, 6), lip: 0, look: 0.2, headTilt: -6 });
      break;
    case 'q9': // V3.5: cut to Codet: he notices the trembling hands
      camK(CAMS.q9, f);
      place(codet, 5.0, -3.0, -0.9);
      codet.setFace({ expr: 'shocked', lip: 0, blink: blinkAt(f, 3), look: 0.45, headTilt: -3 });
      break;
    case 'p14': { // V3.5: "Terus suara itu datang lagi — lebih besar, lebih dekat" — west wide, everyone looks up; the tremor heralds the booms at the tail
      camK(CAMS.p14, f);
      codet.setFace({ expr: 'scared', lip: 0, blink: blinkAt(f, 3), look: 0, headTilt: -8, headPitch: -12 });
      busiti.setFace({ expr: 'shock', blink: blinkAt(f, 8), lip: 0 });
      wargaB.setFace({ expr: 'shock', blink: blinkAt(f, 14), lip: 0 });
      if (f > W.p14[1] - 0.2 * (W.p14[1] - W.p14[0])) {
        camera.position.x += 0.018 * Math.sin(f * 2.1);
        camera.position.y += 0.011 * Math.sin(f * 2.9);
      }
      break;
    }
    case 'p15': { // V3.5: "Gelas berdenting, tanah bergetar, dada ikut bergetar" — 1.4 s glasses INSERT, then Codet CU in the shudder
      if (f < W.p15[0] + 42) {
        setCam([-0.7, 1.22, -4.95], [-1.3, 1.06, -5.85], 36);
        glasses.forEach((g, i) => {
          g.visible = true;
          g.rotation.z = 0.055 * Math.sin(f * 7 + i * 1.7);
          g.position.x += 0.0035 * Math.sin(f * 9 + i * 2.3);
        });
        place(busiti, -2.1, -6.3, 0.3);
        busiti.setArm(1, 'up');
        busiti.setFace({ expr: 'shock', blink: blinkAt(f, 8), lip: 0 });
        codet.group.visible = false;
        break;
      }
      camK(CAMS.p15, f);
      if (f >= W.p15[0] + 50) {
        const d = f - W.p15[0] - 50, amp = 0.085 * Math.exp(-d / 30);
        camera.position.x += amp * Math.sin(f * 1.9);
        camera.position.y += amp * 0.7 * Math.sin(f * 2.6 + 1);
      }
      codet.group.position.y = 0.012 * Math.sin(f * 0.55); // fast shallow breathing — his chest shakes with the ground
      codet.setFace({ expr: 'scared', lip: 0, blink: blinkAt(f, 3), look: 0.1, headTilt: -3 });
      busiti.setFace({ expr: 'shock', blink: blinkAt(f, 8), lip: 0 });
      fx.burst = ramp(f, W.p15[0], W.p15[0] + 0.4 * (W.p15[1] - W.p15[0]));
      break;
    }
    case 'p16': { // Codet runs for the beach — tracking shot, camera alongside at a fixed gap
      const k = smooth(ramp(f, W.p16[0], W.p16[1]));
      const cx = lerp(2.4, 0.9, k), cz = lerp(8.5, 20.8, k);
      place(codet, cx, cz, -0.12);
      codet.setFacing(-0.12);
      codet.setWalk((f - W.p16[0]) * 0.85);
      codet.setFace({ expr: 'scared', lip: 0, blink: blinkAt(f, 3), look: 0.3, headTilt: 3 });
      setCam([cx + 4.4, 1.9, cz + 4.6], [cx, 1.05, cz], 40); // V3: front-side tracking — his face reads while he runs (V2 filmed his side/back)
      busiti.group.visible = false; pakrt.group.visible = false;
      break;
    }
    case 'p17': { // the reveal: Codet arrives at the shore and stops dead
      camK(CAMS.p17, f);
      const a = W.p17[0], mv = ramp(f, a, a + 0.3 * (W.p17[1] - a));
      const cz = lerp(20.8, 24.3, smooth(mv));
      place(codet, lerp(0.9, 0.6, smooth(mv)), cz, -0.05);
      if (mv < 1) codet.setWalk((f - a) * 0.8);
      codet.setFace({ expr: 'scared', lip: 0, blink: blinkAt(f, 3), look: 0.4, headTilt: -4 });
      busiti.group.visible = false; pakrt.group.visible = false;
      break;
    }
    case 'p18': // close on Codet: the sea has run away and nobody told it to
      camK(CAMS.p18, f);
      place(codet, 0.6, 24.3, -0.05);
      codet.setFace({ expr: f < W.p18[0] + 0.3 * (W.p18[1] - W.p18[0]) ? 'shocked' : 'scared', lip: 0, blink: blinkAt(f, 3), look: 0.5, headTilt: -4 });
      busiti.group.visible = false; pakrt.group.visible = false;
      break;
    case 'teaser': // held wide over the dark sea; the card text is laid in during post
      camK(CAMS.teaser, f);
      place(codet, 0.6, 24.3, -0.05);
      codet.setFace({ expr: 'scared', lip: 0, blink: blinkAt(f, 3), look: 0.4, headTilt: -4 });
      busiti.group.visible = false; pakrt.group.visible = false;
      break;
  }
  // cast per shot (from the approved story.js actor map) — applied every frame
  const CAST = { p1: ['codet', 'busiti', 'wargaB'], p2: [], p3: ['pakrt'], p4: [], p5: ['codet', 'busiti'], p6: ['codet', 'busiti'], p7: ['busiti', 'codet'], p8: ['busiti', 'codet'], p9: ['codet', 'busiti', 'wargaB'], p10: ['codet', 'busiti'], q1: ['busiti', 'wargaA', 'codet'], q2: ['wargaA', 'busiti'], q3: ['codet'], q4: ['busiti', 'pakrt'], p11: ['codet', 'busiti', 'wargaB', 'wargaA'], p12: [], p13: ['busiti', 'codet'], q5: ['pakrt', 'busiti', 'wargaA'], q6: ['pakrt', 'wargaA', 'wargaB'], q7: ['pakrt', 'busiti', 'wargaA', 'wargaB'], q8: ['pakrt'], q9: ['codet'], p14: ['codet', 'busiti', 'wargaB'], p15: ['codet', 'busiti'], p16: ['codet'], p17: ['codet'], p18: ['codet'], teaser: ['codet'] };
  const cast = CAST[S] || [];
  codet.group.visible = cast.includes('codet');
  busiti.group.visible = cast.includes('busiti');
  pakrt.group.visible = cast.includes('pakrt');
  wargaA.group.visible = cast.includes('wargaA');
  wargaB.group.visible = cast.includes('wargaB');

  codet.update(t); busiti.update(t); pakrt.update(t); wargaA.update(t); wargaB.update(t);
  world.update(t, fx);
  renderer.render(scene, camera);
};
window.renderFrame(50);
window.ready = true;
