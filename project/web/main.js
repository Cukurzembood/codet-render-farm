import * as THREE from './lib/three.module.js';
import { createWorld, createBeach } from './world3d.js';
import { createCodet } from './codet3d.js';
import { createVillager } from './warga3d.js';
import { LIP3 } from './lipdata.js';

// Ep.3 "Laut Ikut Marah" — tsunami episode. Built per ep3/BLOCKING.md (13 shots,
// one phrase = one shot) on the production 3D kit. Timing comes from the MEASURED
// Ep.3 VO phrases (phrases-ep3.json), never from script reading order. World
// geography (same as Ep.2): kampung z ~ -5, shore z ~ 22, mud/boats z 24-34,
// sea +z. Weather/light: gloom2 the whole episode (the sheet's rule).
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.domElement.id = 'c';
renderer.setPixelRatio(1); renderer.setSize(720, 1280, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.06;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 720 / 1280, 0.08, 600);
scene.add(camera);

const world = createWorld(scene);
const beach = createBeach();
beach.group.position.set(0, 0, 30);
beach.group.rotation.y = Math.PI; // sea extends to +z, mud band faces the kampung
beach.setSea(0.85); // still receded from Ep.2's ending — the water is out, for now
scene.add(beach.group);
const B0 = {};
for (const b of ['boatA', 'boatB']) if (beach[b]) B0[b] = { p: beach[b].position.clone(), ry: beach[b].rotation.y, rz: beach[b].rotation.z, rx: beach[b].rotation.x };

const codet = createCodet(); scene.add(codet.group);
const busiti = createVillager('busiti'); scene.add(busiti.group);
const pakrt = createVillager('pakrt'); scene.add(pakrt.group);
const wargaA = createVillager('wargaA'); scene.add(wargaA.group);
const wargaB = createVillager('wargaB'); scene.add(wargaB.group);
const wargaC = createVillager('wargaA'); scene.add(wargaC.group);
const wargaD = createVillager('wargaB'); scene.add(wargaD.group);
const wargaE = createVillager('wargaA'); scene.add(wargaE.group);
const ALLW = [wargaA, wargaB, wargaC, wargaD, wargaE];

// ---------- Ep.3 props (built here: the sheet's missing pieces) ----------
// foam line on the horizon (S1: the thin white line that keeps growing)
const foamLine = new THREE.Mesh(new THREE.BoxGeometry(190, 1, 1.6),
  new THREE.MeshStandardMaterial({ color: 0xf4f7f2, roughness: 0.9 }));
foamLine.position.set(0, 0.25, 150); scene.add(foamLine);
// the water wall: sea-green body + foam crest + foam blobs, advances +z -> shore
const wall = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.BoxGeometry(190, 9.5, 3.2),
    new THREE.MeshStandardMaterial({ color: 0x39685e, roughness: 0.55 }));
  body.position.y = 4.75; wall.add(body);
  const crest = new THREE.Mesh(new THREE.BoxGeometry(190, 1.7, 4.0),
    new THREE.MeshStandardMaterial({ color: 0xeef3ec, roughness: 0.95 }));
  crest.position.y = 9.9; wall.add(crest);
  const blobG = new THREE.SphereGeometry(0.85, 8, 6);
  const blobM = new THREE.MeshStandardMaterial({ color: 0xeef3ec, roughness: 0.95 });
  for (let i = 0; i < 22; i++) {
    const b = new THREE.Mesh(blobG, blobM);
    b.position.set(-92 + i * 8.6 + (i % 3), 10.6 + (i % 4) * 0.28, (i % 2) * 0.8 - 0.4);
    b.scale.setScalar(0.7 + (i % 5) * 0.22); wall.add(b);
  }
}
wall.position.set(0, 0, 150); scene.add(wall);
// flopping fish on the mud
const fishes = [];
{
  const fm = new THREE.MeshStandardMaterial({ color: 0x9fb6bd, roughness: 0.35, metalness: 0.35 });
  const spots = [[-3.4, 28.6], [-0.8, 29.8], [1.9, 28.2], [4.6, 30.1], [6.8, 28.9], [-5.9, 30.4]];
  for (const [fx, fz] of spots) {
    const g = new THREE.Group();
    const bd = new THREE.Mesh(new THREE.SphereGeometry(0.30, 10, 8), fm);
    bd.scale.set(1.15, 0.32, 0.42); g.add(bd);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 6), fm);
    tail.rotation.z = Math.PI / 2; tail.position.x = -0.42; g.add(tail);
    g.position.set(fx, 0.10, fz); g.rotation.y = fx * 1.3;
    scene.add(g); fishes.push(g);
  }
}
// brown flood water over the kampung (rises S11, falls S12)
const flood = new THREE.Mesh(new THREE.PlaneGeometry(38, 30),
  new THREE.MeshStandardMaterial({ color: 0x6e4b26, roughness: 0.25, transparent: true, opacity: 0.94 }));
flood.rotation.x = -Math.PI / 2; flood.position.set(0, -0.05, -2); flood.visible = false;
scene.add(flood);
// drift debris for the flood (log + crate)
const drift = [];
{
  const logM = new THREE.MeshStandardMaterial({ color: 0x7a5a34, roughness: 0.9 });
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.6, 8), logM);
  log.rotation.z = Math.PI / 2; scene.add(log); drift.push(log);
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.62),
    new THREE.MeshStandardMaterial({ color: 0x9a7a44, roughness: 0.9 }));
  scene.add(crate); drift.push(crate);
}
// climb palm near the warung [3.4, -8.8] (the sheet's pohon kelapa)
const PALM = [3.4, -8.8];
{
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x8a6b42, roughness: 0.95 });
  let px = PALM[0], pz = PALM[1];
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.13 - i * 0.008, 0.145 - i * 0.008, 0.85, 8), trunkM);
    px += 0.045; seg.position.set(px, 0.42 + i * 0.8, pz); seg.rotation.z = -0.055;
    seg.castShadow = true; scene.add(seg);
  }
  const frondM = new THREE.MeshStandardMaterial({ color: 0x4d7d3a, roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const fr = new THREE.Mesh(new THREE.ConeGeometry(0.30, 2.6, 5), frondM);
    const a = (i / 8) * Math.PI * 2;
    fr.position.set(px + Math.cos(a) * 0.9, 5.35, pz + Math.sin(a) * 0.9);
    fr.rotation.set(Math.sin(a) * 1.15, 0, -Math.cos(a) * 1.15);
    fr.castShadow = true; scene.add(fr);
  }
}
// fade-to-black plane riding the camera (S13 ending)
const fadeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false });
const fadePlane = new THREE.Mesh(new THREE.PlaneGeometry(4, 7), fadeMat);
fadePlane.position.z = -0.4; camera.add(fadePlane);
// light ash still drifting down over the kampung
const ASH_N = 260;
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

// ---------- timing (measured Ep.3 VO phrases; c6 chunk lands after the TTS
// quota reset — C6_END_F is the one number to fix when it is measured) ----------
const FPS = 30;
const C6_END_F = 3582; // headroom estimate until c6 is measured (render long, cut at encode)
const W = {
  S1a: [0, 105], S1: [106, 356], S2: [357, 432], S3: [433, 539],
  S4: [540, 1018], S5: [1019, 1146], S6: [1147, 1493], S7: [1494, 1714],
  S8: [1715, 2014], S9: [2015, 2207], S10: [2208, 2322], S11: [2323, 2831],
  S12: [2832, 2906], S13: [2907, C6_END_F], teaser: [C6_END_F + 1, C6_END_F + 90],
};
window.TOTAL = C6_END_F + 91;
const ORDER = ['S1a', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'teaser'];
// pro-edit rule (from Ep.2): a shot HOLDS across the VO gap until the next starts
for (let i = 0; i < ORDER.length - 1; i++) W[ORDER[i]][1] = W[ORDER[i + 1]][0] - 1;
const shotAt = (f) => ORDER.find((id) => f >= W[id][0] && f <= W[id][1]) || 'teaser';

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
const K2 = (id, p0, l0, f0, p1, l1, f1) => ({ a: W[id][0], b: W[id][1], p0, l0, f0, p1: p1 || p0, l1: l1 || l0, f1: f1 === undefined ? f0 : f1 });
function camK(km, f) {
  const k = smooth(km.b > km.a ? (f - km.a) / (km.b - km.a) : 0);
  setCam(lerp3(km.p0, km.p1, k), lerp3(km.l0, km.l1, k), lerp(km.f0, km.f1, k));
}
// lipsync from the measured dialogue envelopes (villager mouth 0..2)
const lipV3 = (name, f) => {
  const L = LIP3[name]; if (!L) return 0;
  const i = f - L.startF;
  if (i < 0 || i >= L.env.length) return 0;
  return Math.min(2, Math.round(L.env[i] * 6));
};

// ---------- cameras (per ep3/BLOCKING.md, translated to the Z-world) ----------
const CAMS = {
  S1a: K2('S1a', [8.6, 2.4, 15.5], [0.5, 1.1, 26.5], 43, [8.2, 2.3, 14.8], [0.5, 1.1, 26.5], 42),
  S1: K2('S1', [1.05, 1.68, 21.0], [1.55, 0.85, 60], 32),
  S2: K2('S2', [5.6, 0.6, 24.2], [-1.5, 0.2, 29.5], 42, [4.6, 0.55, 25.2], [-1.5, 0.2, 29.5], 42),
  S3: K2('S3', [-9.5, 3.8, 16.5], [4, 0.7, 28.5], 42, [-9.1, 3.8, 16.5], [7.5, 0.7, 28.5], 42),
  S4: K2('S4', [1.95, 1.55, 25.9], [3.2, 1.28, 23.6], 36, [2.35, 1.5, 25.3], [3.2, 1.28, 23.6], 35),
  S5: K2('S5', [4.9, 1.5, 27.6], [3.2, 1.22, 23.6], 38),
  S6: K2('S6', [-5.5, 1.15, 19.5], [3, 2.4, 90], 40),
  S8: K2('S8', [10.5, 2.1, 19], [-1, 0.8, 31], 42),
  S9: K2('S9', [5.7, 0.8, -5.7], [3.45, 1.2, -8.8], 40, [5.7, 0.85, -5.7], [3.55, 4.35, -8.75], 40),
  S10: K2('S10', [1.7, 1.45, -7.9], [-0.9, 1.2, -4.95], 38),
  S11: K2('S11', [5.4, 5.8, -6.4], [-6, 0.8, -11], 46, [5.4, 5.8, -6.4], [5, 0.8, -11.5], 46),
  S12: K2('S12', [5.4, 5.8, -6.4], [0, 0.8, -11], 46),
  S13: K2('S13', [6.1, 4.7, -5.7], [3.1, 4.55, -9.0], 36, [5.7, 4.6, -6.2], [3.1, 4.55, -9.0], 35),
  teaser: K2('teaser', [5.4, 5.8, -6.4], [0, 1.4, 45], 44),
};

// ---------- deterministic prop states (functions of frame only: cuts stay consistent) ----------
function wallState(f) {
  // returns [z, heightScale, visible]
  if (f < W.S6[0]) return [150, 0.32, false];
  if (f <= W.S6[1]) { const k = ramp(f, W.S6[0], W.S6[1]); return [lerp(150, 78, k), lerp(0.32, 1, smooth(k)), true]; }
  if (f <= W.S7[1]) { const k = ramp(f, W.S7[0], W.S7[1]); return [lerp(78, 55, k), 1, true]; }
  if (f <= W.S8[1]) { const k = ramp(f, W.S8[0], W.S8[1]); return [lerp(55, 36, smooth(k)), 1, true]; }
  return [34.5, 1, false];
}
function floodY(f) {
  if (f < W.S10[0] + 60) return 0;
  if (f <= W.S10[1]) return lerp(0, 0.06, ramp(f, W.S10[0] + 60, W.S10[1]));
  if (f <= W.S11[1]) {
    const up = ramp(f, W.S11[0], W.S11[0] + 200);
    return lerp(0.06, 0.62, smooth(up));
  }
  if (f <= W.S12[1]) return lerp(0.62, 0.04, smooth(ramp(f, W.S12[0], W.S12[1])));
  return 0.04;
}
// crowd picking spots on the mud (S2-S6 life)
const PICK = [
  [wargaA, -2.6, 28.9, 0.4], [wargaB, 3.1, 30.3, 2.2], [wargaC, 5.9, 28.4, 1.1],
  [wargaD, -5.2, 30.6, 2.8], [wargaE, 0.6, 31.2, 1.7],
];
function pickPose(w, f, seed) {
  // bend-pick loop: bob down/up with an arm swing; happy faces while the fish are free
  const ph = (f * 0.045 + seed * 1.7) % 1;
  const bend = Math.sin(ph * Math.PI);
  w.group.position.y = -0.16 * bend;
  w.setArm(1, bend > 0.55 ? 'up' : 'down');
  w.setFace({ expr: 'laugh', blink: blinkAt(f, seed * 3 + 5), lip: bend > 0.7 ? 1 : 0 });
}

window.renderFrame = (f) => {
  const t = f / FPS;
  const S = shotAt(f);
  world.setLight('gloom2');
  let fx = { smoke: 0.52, lampOn: false };
  // ---- defaults: reset every actor every frame (no state carryover) ----
  codet.setWalk(null); codet.setPose({ armL: 'down', armR: 'down' });
  place(codet, 1.5, 24.5, 0); codet.group.position.y = 0;
  codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.3, headTilt: 0, headPitch: 0 });
  place(busiti, -0.9, -4.95, 2.3);
  busiti.setFace({ expr: 'neutral', blink: blinkAt(f, 8), lip: 0 });
  place(pakrt, 3.2, 23.6, 0);
  pakrt.setFace({ expr: 'neutral', blink: blinkAt(f, 6), lip: 0 });
  for (const w of ALLW) {
    w.setWalk(null); w.setArm(1, 'down'); w.setArm(-1, 'down');
    w.setFace({ expr: 'neutral', blink: blinkAt(f, 11), lip: 0 });
    w.group.position.y = 0;
  }
  for (const [w, px, pz] of PICK) place(w, px, pz, 0.6);
  // boats back to their stranded base, then S8 may toss them
  for (const b of ['boatA', 'boatB']) if (beach[b] && B0[b]) {
    beach[b].position.copy(B0[b].p); beach[b].rotation.set(B0[b].rx, B0[b].ry, B0[b].rz);
  }
  // ---- global props ----
  const [wz, wh, wvis] = wallState(f);
  wall.visible = wvis; wall.position.z = wz; wall.scale.y = wh;
  foamLine.visible = f < W.S6[0];
  foamLine.scale.y = f <= W.S1[1] ? lerp(0.35, 1.6, ramp(f, W.S1[0], W.S1[1])) : 2.3;
  foamLine.position.y = 0.22 * foamLine.scale.y;
  const fy = floodY(f);
  flood.visible = fy > 0.005; flood.position.y = fy;
  drift[0].visible = drift[1].visible = flood.visible;
  if (flood.visible) {
    const dk = S === 'S11' ? ramp(f, W.S11[0], W.S11[1]) : 1;
    drift[0].position.set(lerp(-6, -1.5, dk), fy + 0.10, lerp(-1, 1.5, dk));
    drift[0].rotation.y = dk * 1.2;
    drift[1].position.set(lerp(5, 1.8, dk), fy + 0.28, lerp(-7.5, -4.5, dk));
    drift[1].rotation.set(dk * 0.6, dk * 0.9, 0);
  }
  for (let i = 0; i < fishes.length; i++) {
    const g = fishes[i];
    g.visible = f < W.S11[0];
    if (f >= W.S2[0] && f < W.S6[0]) {
      const burst = Math.max(0, Math.sin(f * 0.11 + i * 2.4)) * Math.max(0, Math.sin(f * 0.023 + i));
      g.rotation.z = burst * 0.55 * Math.sin(f * 0.9 + i * 3);
      g.position.y = 0.10 + burst * 0.05;
    } else g.rotation.z = 0;
  }
  fadeMat.opacity = S === 'S13' ? ramp(f, W.S13[1] - 30, W.S13[1]) * 0.92 : 0;
  // ash drifts over the kampung shots
  const ashOn = ['S9', 'S10', 'S11', 'S12', 'S13'].includes(S);
  ashPts.visible = ashOn;
  if (ashOn) {
    ashMat.opacity = 0.16;
    ashPts.position.set(0.4, 0.4, -4.5);
    const pos = ashGeo.attributes.position.array;
    for (let i = 0; i < ASH_N; i++) {
      let y = pos[i * 3 + 1] - 0.011 * ashSeed[i][3];
      if (y < 0) y += 8;
      pos[i * 3 + 1] = y;
    }
    ashGeo.attributes.position.needsUpdate = true;
  }

  switch (S) {
    case 'S1a': // wide: the shore, the mud, Codet small against the empty sea
      camK(CAMS.S1a, f);
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.4, headTilt: -3 });
      break;
    case 'S1': // over his shoulder, tele: the white line grows
      camK(CAMS.S1, f);
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.4, headTilt: -3 });
      break;
    case 'S2': { // low on the mud: fish flop, the first warga arrive
      camK(CAMS.S2, f);
      const a = W.S2[0];
      const d = ramp(f, a, a + 55), e = ramp(f, a + 12, a + 67);
      place(wargaD, lerp(-6.5, -5.2, smooth(d)), lerp(26.5, 29.5, smooth(d)), 0.5);
      place(wargaE, lerp(5.5, 0.8, smooth(e)), lerp(27, 30, smooth(e)), 2.6);
      if (d < 1) wargaD.setWalk((f - a) * 0.5);
      if (e < 1) wargaE.setWalk((f - a) * 0.5);
      wargaD.setFace({ expr: 'happy', blink: blinkAt(f, 7), lip: 0 });
      wargaE.setFace({ expr: 'happy', blink: blinkAt(f, 9), lip: 0 });
      break;
    }
    case 'S3': // the whole beach laughs and picks — Codet and Pak RT do not
      camK(CAMS.S3, f);
      PICK.forEach(([w], i) => pickPose(w, f, i + 1));
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.35, headTilt: -4 });
      pakrt.setFace({ expr: 'scared', blink: blinkAt(f, 6), lip: 0 });
      break;
    case 'S4': // Pak RT close-up: sixty years by this sea, and he knows
      camK(CAMS.S4, f);
      pakrt.setFace({ expr: 'scared', blink: blinkAt(f, 6), lip: 0, look: 0.25, headTilt: 3 });
      codet.setFace({ expr: 'think', lip: 0, blink: blinkAt(f, 3), look: 0.3, headTilt: -3 });
      PICK.forEach(([w], i) => pickPose(w, f, i + 1)); // the laughter goes on behind him
      break;
    case 'S5': { // DIALOGUE Pak RT (lipsync): "LARI! SEMUA LARI KE TEMPAT TINGGI!"
      camK(CAMS.S5, f);
      pakrt.setFace({ expr: 'scared', blink: blinkAt(f, 6), lip: lipV3('dlg-pakrt', f), look: 0 });
      pakrt.setArm(1, 'up'); // pointing back at the high ground
      const a = W.S5[0];
      [wargaA, wargaB, wargaD, wargaE].forEach((w, i) => {
        if (f < a + 10 + i * 9) pickPose(w, f, i + 1);
        else w.setFace({ expr: 'shock', blink: 0, lip: 0 });
      });
      break;
    }
    case 'S6': // HERO: the wall, in silence — everyone frozen from behind
      camK(CAMS.S6, f);
      codet.setFace({ expr: 'scared', lip: 0, blink: blinkAt(f, 3), look: 0.4, headTilt: -6 });
      pakrt.setFace({ expr: 'scared', blink: blinkAt(f, 6), lip: 0 });
      place(wargaA, -1, 25.8, 0.1); place(wargaD, 4.6, 26.2, -0.15);
      wargaA.setFace({ expr: 'shock', blink: 0, lip: 0 });
      wargaD.setFace({ expr: 'shock', blink: 0, lip: 0 });
      break;
    case 'S7': { // Codet turns and RUNS — side tracking, face readable
      const a = W.S7[0], b = W.S7[1];
      const k = ramp(f, a, b);
      const cz = lerp(24, 3.4, smooth(k)), cx = lerp(1.5, 1.1, k);
      place(codet, cx, cz, Math.PI); // running toward the kampung (-z)
      codet.setFacing(Math.PI);
      codet.setWalk((f - a) * 0.85);
      codet.setFace({ expr: 'scared', lip: (f % 6 < 3 ? 2 : 1), blink: blinkAt(f, 3), look: 0.2, headTilt: 3 });
      setCam([cx + 4.3, 1.75, cz - 3.2], [cx, 1.05, cz], 40);
      const r1 = ramp(f, a, a + 130), r2 = ramp(f, a + 18, a + 148);
      place(wargaB, lerp(3.1, 4.2, r1), lerp(30.3, 7, smooth(r1)), Math.PI);
      place(wargaE, lerp(0.6, -0.5, r2), lerp(31.2, 9, smooth(r2)), Math.PI);
      if (r1 < 1) wargaB.setWalk((f - a) * 0.8);
      if (r2 > 0 && r2 < 1) wargaE.setWalk((f - a) * 0.8);
      wargaB.setFace({ expr: 'scared', blink: blinkAt(f, 5), lip: 0 });
      wargaE.setFace({ expr: 'scared', blink: blinkAt(f, 9), lip: 0 });
      break;
    }
    case 'S8': { // the roar arrives: boats tossed like toys
      camK(CAMS.S8, f);
      const a = W.S8[0];
      const sh = Math.sin(f * 2.1) * 0.05 * ramp(f, a + 90, a + 130) * (1 - ramp(f, a + 260, a + 299));
      camera.position.x += sh; camera.position.y += sh * 0.6;
      const toss = (boat, d0, h, dz, rz) => {
        if (!beach[boat] || !B0[boat]) return;
        const k = ramp(f, a + d0, a + d0 + 95);
        if (k <= 0) return;
        beach[boat].position.y = B0[boat].p.y + Math.sin(smooth(k) * Math.PI) * h;
        beach[boat].position.z = B0[boat].p.z - smooth(k) * dz;
        beach[boat].rotation.z = B0[boat].rz + smooth(k) * rz;
        beach[boat].rotation.x = B0[boat].rx + Math.sin(k * 9) * 0.08 * (1 - k);
      };
      toss('boatA', 105, 1.9, 7.5, 0.85);
      toss('boatB', 135, 1.4, 5.5, -0.6);
      const rc = ramp(f, a + 20, a + 190);
      place(wargaC, lerp(-8, -6, rc), lerp(29, 10, smooth(rc)), Math.PI);
      if (rc < 1) wargaC.setWalk((f - a) * 0.8);
      wargaC.setFace({ expr: 'scared', blink: blinkAt(f, 4), lip: 0 });
      break;
    }
    case 'S9': { // Codet climbs the palm by the warung
      camK(CAMS.S9, f);
      const a = W.S9[0];
      const walkIn = ramp(f, a, a + 18);
      const climb = ramp(f, a + 18, a + 175);
      if (walkIn < 1) {
        place(codet, lerp(2.2, 3.15, smooth(walkIn)), lerp(-6.6, -8.35, smooth(walkIn)), 2.6);
        codet.setWalk((f - a) * 0.6);
      } else if (climb < 1) {
        place(codet, 3.3, -8.55, 2.9);
        codet.group.position.y = lerp(0, 3.95, smooth(climb));
        codet.setPose({ armL: 'hold', armR: 'hold' });
        codet.setWalk((f - a) * 0.22); // slow alternating grip steps
      } else {
        place(codet, 3.6, -8.8, -2.2);
        codet.group.position.y = 3.95;
        codet.setPose({ armL: 'hold', armR: 'down' });
      }
      codet.setFace({ expr: 'scared', lip: 0, blink: blinkAt(f, 3), look: 0.2, headTilt: -4 });
      break;
    }
    case 'S10': // DIALOGUE Bu Siti (lipsync): "Codet! Pegangan yang kuat! Jangan lepas!"
      camK(CAMS.S10, f);
      busiti.setFace({ expr: 'scared', blink: blinkAt(f, 8), lip: lipV3('dlg-busiti', f) });
      busiti.setArm(-1, 'up'); // one hand gripping the warung post
      break;
    case 'S11': // POV from the branch: the kampung becomes the sea
      camK(CAMS.S11, f);
      break;
    case 'S12': { // same POV: and just as fast, it drains away
      camK(CAMS.S12, f);
      const a = W.S12[0];
      const wk = ramp(f, a + 38, a + 74);
      place(wargaA, lerp(-3.4, -2.4, smooth(wk)), lerp(5.5, 2.6, smooth(wk)), 2.9);
      place(wargaB, lerp(-4.4, -3.6, smooth(wk)), lerp(6.2, 3.4, smooth(wk)), 2.7);
      if (wk > 0 && wk < 1) { wargaA.setWalk((f - a) * 0.4); wargaB.setWalk((f - a) * 0.4); }
      wargaA.setFace({ expr: 'worry', blink: blinkAt(f, 11), lip: 0 });
      wargaB.setFace({ expr: 'worry', blink: blinkAt(f, 14), lip: 0 });
      break;
    }
    case 'S13': { // two faces on the branch: the whisper — "itu baru gelombang pertama"
      camK(CAMS.S13, f);
      place(codet, 3.6, -8.8, -2.23);
      codet.group.position.y = 3.95;
      codet.setPose({ armL: 'hold', armR: 'down' });
      place(pakrt, 2.7, -9.5, 0.91);
      pakrt.group.position.y = 3.8;
      const late = ramp(f, W.S13[0] + (W.S13[1] - W.S13[0]) * 0.55, W.S13[1] - 40);
      pakrt.setFace({ expr: 'scared', blink: blinkAt(f, 6), lip: (f % 8 < 4 ? 1 : 0), look: 0.2 });
      codet.setFace({ expr: late > 0.5 ? 'shocked' : 'scared', lip: 0, blink: blinkAt(f, 3), look: 0.45, headTilt: -3 });
      break;
    }
    case 'teaser': // held over the grey sea; the Ep.4 card is laid in during post
      camK(CAMS.teaser, f);
      break;
  }
  // cast per shot — applied every frame
  const CAST = {
    S1a: ['codet'], S1: ['codet'], S2: ['wargaD', 'wargaE'],
    S3: ['codet', 'pakrt', 'wargaA', 'wargaB', 'wargaC', 'wargaD', 'wargaE'],
    S4: ['pakrt', 'codet'], S5: ['pakrt', 'wargaA', 'wargaB', 'wargaD', 'wargaE'],
    S6: ['codet', 'pakrt', 'wargaA', 'wargaD'], S7: ['codet', 'wargaB', 'wargaE'],
    S8: ['wargaC'], S9: ['codet'], S10: ['busiti'], S11: [],
    S12: ['wargaA', 'wargaB'], S13: ['codet', 'pakrt'], teaser: [],
  };
  const cast = CAST[S] || [];
  codet.group.visible = cast.includes('codet');
  busiti.group.visible = cast.includes('busiti');
  pakrt.group.visible = cast.includes('pakrt');
  wargaA.group.visible = cast.includes('wargaA');
  wargaB.group.visible = cast.includes('wargaB');
  wargaC.group.visible = cast.includes('wargaC');
  wargaD.group.visible = cast.includes('wargaD');
  wargaE.group.visible = cast.includes('wargaE');

  codet.update(t);
  busiti.update(t); pakrt.update(t);
  for (const w of ALLW) w.update(t);
  world.update(t, fx);
  renderer.render(scene, camera);
};
window.renderFrame(50);
window.ready = true;
