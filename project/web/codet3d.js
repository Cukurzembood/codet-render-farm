import * as THREE from './lib/three.module.js';

// ===== Codet V2 production character (3D chibi stickman, cartoon semi-real) =====
// Design locked 27 Nov 2026: wild mohawk fan + shaved stubble sides, long jagged
// cheek scar, gold hoop + stud, navy puffer (orange lining) over skull-print tee,
// olive cargo, orange-white sneakers. Present-day host framing.
// API: createCodet() -> { group, setFace, setPose, setWalk, setFacing, update }
//   setFace({expr, lip, blink, look, headTilt, headPitch})
//                                      expr: sly|neutral|happy|shocked|scared|angry|think
//                                      lip: 0 (expr mouth) 1..3 (talk openings), blink 0..1, look -1..1
//   setPose({armL, armR})              down|wave|point|up|hip|hold — transitions are EASED
//                                      (two-segment arms with elbows, smoothed joints)
//   setWalk(phase)                     phase radians, or null to stand (thigh + knee flex)
//   setFacing(ry)                      stepped turn toward ry (capped speed, lean + step bob)
//   update(t)                          idle breath, wave oscillation, mohawk spring

const gradSoft = (() => { const n = 32, d = new Uint8Array(n * 4); for (let i = 0; i < n; i++) { const v = Math.round(118 + (255 - 118) * Math.pow(i / (n - 1), 1.35)); d.set([v, v, v, 255], i * 4); } const t = new THREE.DataTexture(d, n, 1); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
const soft = (o) => new THREE.MeshToonMaterial({ gradientMap: gradSoft, ...o });
const surfTex = (kind) => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const x = cv.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 256);
  let s = 7; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  if (kind === 'cloth') { x.strokeStyle = 'rgba(90,90,90,0.10)'; for (let i = 0; i < 256; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); } }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
};
const CLOTH_TEX = surfTex('cloth');
const INK = '#241726', SKIN = '#ffe2c2', NAVY = '#2b3444', NAVY_D = '#212a38', ORANGE = '#e8762c',
  CARGO = '#7a7c5e', CARGO_D = '#6b6d50', GOLD = '#d9a441', HAIR = '#2a1f24', SCAR = '#bd7a5e', SHOE = '#ece7db';
const goldM = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.9, roughness: 0.3 });
const eyeBallM = new THREE.MeshStandardMaterial({ color: '#f6f2ea', roughness: 0.25 });
const pupilM = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.15 });
const mouthM = soft({ color: INK });
const flat = (color) => (color === NAVY || color === CARGO) ? soft({ color, map: CLOTH_TEX }) : soft({ color });

export function createCodet() {
  const group = new THREE.Group();
  const bodyG = new THREE.Group(); group.add(bodyG);
  const add = (mesh, parent = bodyG) => { mesh.castShadow = true; parent.add(mesh); return mesh; };

  // ---------- legs (hip pivot -> thigh -> knee pivot -> shin + boot) ----------
  const legPivots = {}, kneePivots = {};
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.095, 0.41, 0); bodyG.add(pivot);
    legPivots[s] = pivot;
    const A = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; pivot.add(mesh); return mesh; };
    A(new THREE.Mesh(new THREE.CylinderGeometry(0.080, 0.072, 0.18, 12), flat(CARGO)), 0, -0.09, 0);
    A(new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.115, 0.095), flat(CARGO)), s * 0.083, -0.10, 0.01);
    A(new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.05, 0.10), flat(CARGO_D)), s * 0.085, -0.048, 0.01);
    const btn = A(new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.008, 8), flat('#4c4e3c')), s * 0.105, -0.055, 0.01); btn.rotation.z = Math.PI / 2;
    const knee = new THREE.Group(); knee.position.y = -0.18; pivot.add(knee); kneePivots[s] = knee;
    const B = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; knee.add(mesh); return mesh; };
    B(new THREE.Mesh(new THREE.CylinderGeometry(0.070, 0.064, 0.15, 12), flat(CARGO)), 0, -0.075, 0);
    B(new THREE.Mesh(new THREE.CylinderGeometry(0.073, 0.076, 0.05, 12), flat(CARGO_D)), 0, -0.148, 0);
    B(new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.036, 0.215), flat('#d8d2c4')), 0, -0.212, 0.022);
    B(new THREE.Mesh(new THREE.BoxGeometry(0.106, 0.056, 0.19), flat(SHOE)), 0, -0.168, 0.016);
    B(new THREE.Mesh(new THREE.BoxGeometry(0.108, 0.030, 0.062), flat(ORANGE)), 0, -0.152, 0.088);
    B(new THREE.Mesh(new THREE.BoxGeometry(0.108, 0.042, 0.042), flat(ORANGE)), 0, -0.168, -0.072);
    for (let li = 0; li < 3; li++) { const lace = B(new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.011, 0.016), flat('#c9c2b2')), 0, -0.136 - li * 0.006, 0.048 + li * 0.020); lace.rotation.x = -0.5; }
  }

  // ---------- torso: puffer jacket ----------
  const neck = add(new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.07, 0.09, 10), flat(SKIN))); neck.position.set(0, 0.795, 0);
  const torso = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.205, 0.15, 6, 16), flat(NAVY)));
  torso.position.set(0, 0.575, 0); torso.scale.set(1.18, 1, 0.98);
  const tee = add(new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.25, 0.016), flat('#efe9dc'))); tee.position.set(0, 0.60, 0.203); tee.rotation.x = -0.05;
  { // skull print
    const sc2 = document.createElement('canvas'); sc2.width = sc2.height = 128;
    const sx = sc2.getContext('2d'); sx.fillStyle = '#33333a';
    sx.beginPath(); sx.arc(64, 54, 30, 0, 7); sx.fill(); sx.fillRect(44, 66, 40, 24);
    sx.fillStyle = '#efe9dc';
    sx.beginPath(); sx.ellipse(52, 54, 8, 10, 0, 0, 7); sx.fill(); sx.beginPath(); sx.ellipse(76, 54, 8, 10, 0, 0, 7); sx.fill();
    sx.beginPath(); sx.moveTo(64, 62); sx.lineTo(58, 72); sx.lineTo(70, 72); sx.fill();
    sx.strokeStyle = '#efe9dc'; sx.lineWidth = 2; for (let i = 0; i < 3; i++) { sx.beginPath(); sx.moveTo(52 + i * 10, 76); sx.lineTo(52 + i * 10, 88); sx.stroke(); }
    sx.fillStyle = ORANGE; sx.beginPath();
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * (Math.PI * 4 / 5); const a2 = a + Math.PI / 5; sx.lineTo(64 + Math.cos(a) * 10, 34 + Math.sin(a) * 10); sx.lineTo(64 + Math.cos(a2) * 4.5, 34 + Math.sin(a2) * 4.5); }
    sx.fill();
    const skullTex = new THREE.CanvasTexture(sc2); skullTex.colorSpace = THREE.SRGBColorSpace;
    const print = new THREE.Mesh(new THREE.PlaneGeometry(0.105, 0.105), new THREE.MeshBasicMaterial({ map: skullTex, transparent: true }));
    print.position.set(0, 0.605, 0.2125); print.rotation.x = -0.05; bodyG.add(print);
  }
  for (const s of [-1, 1]) {
    const strip = add(new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.27, 0.012), flat(ORANGE)));
    strip.position.set(s * 0.108, 0.60, 0.213); strip.rotation.z = -s * 0.16;
    const jp = add(new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.105, 0.02), flat(NAVY_D)));
    jp.position.set(s * 0.145, 0.465, 0.168); jp.rotation.set(-0.12, s * 0.35, 0);
  }
  const hem = add(new THREE.Mesh(new THREE.CylinderGeometry(0.238, 0.228, 0.07, 18), flat(NAVY_D)));
  hem.position.set(0, 0.448, 0); hem.scale.set(1.15, 1, 0.95);
  const collar = add(new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.052, 10, 22), flat(ORANGE)));
  collar.position.set(0, 0.762, 0.01); collar.rotation.x = 1.15;
  const hood = add(new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 10), flat(NAVY)));
  hood.position.set(0, 0.775, -0.115); hood.scale.set(1.25, 0.72, 0.85);
  const hoodIn = add(new THREE.Mesh(new THREE.SphereGeometry(0.115, 12, 8), flat(ORANGE)));
  hoodIn.position.set(0, 0.80, -0.105); hoodIn.scale.set(1.2, 0.6, 0.8);

  // ---------- arms: shoulder pivot -> upper arm -> elbow pivot -> forearm + hand ----------
  const armPivots = {}, elbowPivots = {};
  const poseState = { armL: 'down', armR: 'down' };
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.245, 0.685, 0); bodyG.add(pivot);
    armPivots[s] = pivot;
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.057, 0.19, 12), flat(NAVY)); up.position.y = -0.095; up.castShadow = true; pivot.add(up);
    const elbow = new THREE.Group(); elbow.position.y = -0.19; pivot.add(elbow); elbowPivots[s] = elbow;
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.047, 0.17, 12), flat(NAVY)); fore.position.y = -0.085; fore.castShadow = true; elbow.add(fore);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.050, 0.050, 0.045, 12), flat(NAVY_D)); cuff.position.y = -0.163; elbow.add(cuff);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.046, 12, 10), flat(SKIN)); hand.position.y = -0.208; hand.castShadow = true; elbow.add(hand);
    if (s > 0) { // sleeve patch: star + lightning (on the upper arm)
      const pc = document.createElement('canvas'); pc.width = pc.height = 64;
      const px = pc.getContext('2d'); px.fillStyle = '#232c3a'; px.fillRect(0, 0, 64, 64);
      px.fillStyle = ORANGE; px.beginPath();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * (Math.PI * 4 / 5); const a2 = a + Math.PI / 5; px.lineTo(24 + Math.cos(a) * 13, 26 + Math.sin(a) * 13); px.lineTo(24 + Math.cos(a2) * 6, 26 + Math.sin(a2) * 6); }
      px.fill();
      px.fillStyle = '#e8c84a'; px.beginPath(); px.moveTo(44, 30); px.lineTo(34, 48); px.lineTo(42, 48); px.lineTo(38, 60); px.lineTo(52, 40); px.lineTo(44, 40); px.fill();
      const pTex = new THREE.CanvasTexture(pc); pTex.colorSpace = THREE.SRGBColorSpace;
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.078, 0.078), new THREE.MeshBasicMaterial({ map: pTex }));
      patch.position.set(0.068, -0.095, 0); patch.rotation.y = Math.PI / 2; pivot.add(patch);
    }
  }

  // ---------- head ----------
  const headG = new THREE.Group(); headG.position.set(0, 0.945, 0); bodyG.add(headG);
  const hc = document.createElement('canvas'); hc.width = 512; hc.height = 256;
  const hx = hc.getContext('2d'); hx.fillStyle = SKIN; hx.fillRect(0, 0, 512, 256);
  let hs = 4242; const hrnd = () => ((hs = (hs * 1664525 + 1013904223) >>> 0) / 4294967296);
  const speckle = (u0, u1, v0, v1, n, col) => { for (let i = 0; i < n; i++) { hx.fillStyle = `rgba(${col},${0.10 + hrnd() * 0.16})`; hx.fillRect((u0 + hrnd() * (u1 - u0)) * 512, (v0 + hrnd() * (v1 - v0)) * 256, 1.6, 1.6); } };
  speckle(0.42, 0.62, 0.16, 0.60, 2600, '96,74,58');
  speckle(0.88, 1.0, 0.16, 0.60, 1500, '96,74,58'); speckle(0.0, 0.10, 0.16, 0.60, 1500, '96,74,58');
  speckle(0.60, 0.90, 0.13, 0.48, 1600, '110,88,70');
  speckle(0.15, 0.38, 0.30, 0.80, 500, '226,178,140');
  const headTex = new THREE.CanvasTexture(hc); headTex.colorSpace = THREE.SRGBColorSpace;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.29, 28, 22), soft({ map: headTex }));
  skull.scale.set(1, 0.95, 0.96); skull.castShadow = true; headG.add(skull);
  const F = (mesh, x, y, z) => { mesh.position.set(x, y, z); headG.add(mesh); return mesh; };
  for (const s of [-1, 1]) { const ear = F(new THREE.Mesh(new THREE.SphereGeometry(0.056, 10, 8), flat(SKIN)), s * 0.283, -0.01, 0); ear.scale.set(0.5, 1, 0.85); }

  // eyes: group per side (white + pupil), blink/expr via scale + pupil offset
  const eyes = {};
  for (const s of [-1, 1]) {
    const eg = new THREE.Group(); eg.position.set(s * 0.104, 0.008, 0.248); headG.add(eg);
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.053, 14, 12), eyeBallM); w.scale.set(1, 0.62, 0.5); eg.add(w);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.0215, 10, 10), pupilM); pu.position.set(0.024, 0.006, 0.024); eg.add(pu);
    const lash = new THREE.Mesh(new THREE.BoxGeometry(0.106, 0.014, 0.012), mouthM); lash.position.set(0, 0.032, 0.012); lash.rotation.z = -s * 0.22; eg.add(lash);
    eyes[s] = { group: eg, pupil: pu };
  }
  const brows = {};
  for (const s of [-1, 1]) brows[s] = F(new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.025, 0.014), mouthM), s * 0.104, 0.108, 0.262);
  F(new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), flat(SKIN)), 0, -0.025, 0.283);

  // mouths: one visible at a time
  const mouths = {};
  const mkMouth = (name, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.visible = false; headG.add(mesh); mouths[name] = mesh; };
  const smirk = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.0115, 8, 22, Math.PI * 0.78), mouthM); smirk.rotation.z = Math.PI * 1.08; mkMouth('smirk', smirk, 0.020, -0.098, 0.252);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.011, 8, 22, Math.PI * 0.9), mouthM); smile.rotation.z = Math.PI * 1.05; mkMouth('smile', smile, 0, -0.092, 0.255);
  const openGeo = (r, sy) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), soft({ color: '#5a1e28' })); m.scale.set(1, sy, 1); return m; };
  mkMouth('o', openGeo(0.026, 1.15), 0, -0.105, 0.268);
  mkMouth('talk1', openGeo(0.024, 0.75), 0.004, -0.102, 0.266);
  mkMouth('talk2', openGeo(0.034, 1.0), 0.004, -0.106, 0.264);
  const grin = openGeo(0.042, 0.72); mkMouth('grin', grin, 0, -0.098, 0.262);
  const flatM = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.011, 0.008), mouthM); mkMouth('flat', flatM, 0.002, -0.104, 0.266);
  const frown = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.0105, 8, 22, Math.PI * 0.85), mouthM); frown.rotation.z = Math.PI * 0.075; mkMouth('frown', frown, 0, -0.128, 0.258);

  // jagged scar + micro scratches (+x cheek)
  const scarM = flat(SCAR);
  [[0.163, -0.128, 0.226], [0.143, -0.088, 0.244], [0.118, -0.046, 0.260], [0.096, -0.006, 0.270], [0.072, 0.028, 0.277]].forEach(([sx, sy, sz], i) => {
    const sc = F(new THREE.Mesh(new THREE.BoxGeometry(0.0105, 0.046, 0.005), scarM), sx, sy, sz);
    sc.rotation.set(0.08, 0.55 - i * 0.11, 0.52 + (i % 2 ? 0.13 : -0.07));
  });
  for (const [mx, my] of [[0.188, -0.055], [0.180, -0.028]]) {
    const ms = F(new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.028, 0.004), scarM), mx, my, 0.208);
    ms.rotation.set(0.05, 0.75, 0.3);
  }
  // gold hoop + stud, his right ear (-x)
  const hoop = F(new THREE.Mesh(new THREE.TorusGeometry(0.043, 0.0105, 8, 22), goldM), -0.295, -0.082, 0.01); hoop.rotation.y = Math.PI / 2;
  F(new THREE.Mesh(new THREE.SphereGeometry(0.0145, 8, 8), goldM), -0.292, -0.018, 0.022);
  // mohawk fan in its own group (spring lag)
  const mohawkG = new THREE.Group(); headG.add(mohawkG);
  for (let i = 0; i < 10; i++) {
    const z = -0.185 + i * (0.37 / 9);
    const h = 0.33 - Math.abs(z) * 0.42;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.040, h, 6), flat(HAIR));
    spike.position.set(0, Math.sqrt(Math.max(0.004, 0.29 * 0.29 - z * z)) * 0.93 + h * 0.30, z);
    spike.rotation.x = -z * 1.7; spike.rotation.z = (i % 2 ? 1 : -1) * 0.21; spike.castShadow = true; mohawkG.add(spike);
  }
  for (const s of [-1, 1]) for (const z of [-0.10, -0.165]) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.21, 6), flat(HAIR));
    spike.position.set(s * 0.075, 0.245, z); spike.rotation.z = s * 0.85; spike.rotation.x = -z * 1.6; spike.castShadow = true; mohawkG.add(spike);
  }

  // ---------- face / pose state ----------
  const EXPR = {
    sly:     { browAng: 0.40, browY: 0.108, browIn: 0.0, eyeSY: 0.88, mouth: 'smirk' },
    neutral: { browAng: 0.06, browY: 0.112, browIn: 0.0, eyeSY: 1.15, mouth: 'smile' },
    happy:   { browAng: -0.10, browY: 0.122, browIn: 0.0, eyeSY: 1.05, mouth: 'grin' },
    shocked: { browAng: -0.22, browY: 0.142, browIn: 0.012, eyeSY: 1.50, mouth: 'o' },
    scared:  { browAng: -0.48, browY: 0.130, browIn: 0.030, eyeSY: 1.32, mouth: 'flat' },
    angry:   { browAng: 0.58, browY: 0.096, browIn: 0.0, eyeSY: 0.80, mouth: 'flat' },
    think:   { browAng: 0.10, browY: 0.118, browIn: 0.0, eyeSY: 1.00, mouth: 'flat', asym: true },
  };
  let face = { expr: 'sly', lip: 0, blink: 0, look: 0.6 };
  let walkPhase = null;
  let armCur = null;              // smoothed arm joint state (eased pose transitions)
  let facingTarget = null;        // stepped turning target (setFacing)
  let lastT = null;

  function setFace(f = {}) { Object.assign(face, f); }
  function setPose(p = {}) { Object.assign(poseState, p); }
  function setWalk(phase) { walkPhase = phase; }
  function setFacing(ry) { facingTarget = ry; }

  const POSE = { // z/x: shoulder, e: elbow bend (negative = forearm swings forward)
    down: (s) => ({ z: s * 0.17, x: 0.05, e: -0.14 }),
    wave: (s) => ({ z: s * 2.2, x: 0.15, e: -0.30 }),
    point: (s) => ({ z: s * 0.12, x: -1.45, e: -0.06 }),
    up: (s) => ({ z: s * 2.65, x: 0, e: -0.12 }),
    hip: (s) => ({ z: s * 0.72, x: 0.18, e: -1.25 }),
    hold: (s) => ({ z: s * 0.28, x: -0.85, e: -0.80 }),
  };

  function update(t) {
    const dt = lastT === null ? 1 / 30 : Math.min(0.1, Math.max(0.001, t - lastT)); lastT = t;
    const kk = 1 - Math.exp(-dt * 14); // pose easing factor
    if (!armCur) armCur = { '-1': POSE.down(-1), '1': POSE.down(1) };
    const E = EXPR[face.expr] || EXPR.sly;
    // brows
    for (const s of [-1, 1]) {
      let ang = -s * E.browAng, y = E.browY;
      if (E.asym && s > 0) { ang = -s * -0.35; y = 0.132; }
      brows[s].rotation.z = ang;
      brows[s].position.y = y;
      brows[s].position.x = s * 0.104 - s * (E.browIn || 0);
    }
    // eyes: expr scale x blink, pupils follow look
    for (const s of [-1, 1]) {
      const eg = eyes[s].group;
      eg.scale.y = Math.max(0.06, E.eyeSY * (1 - face.blink * 0.92));
      eyes[s].pupil.position.x = 0.006 + face.look * 0.020;
      eyes[s].pupil.position.y = 0.006 + (E.eyeSY > 1 ? 0.002 : 0);
    }
    // mouth: lip level overrides expr mouth
    const want = face.lip >= 3 ? 'grin' : face.lip === 2 ? 'talk2' : face.lip === 1 ? 'talk1' : E.mouth;
    for (const k in mouths) mouths[k].visible = (k === want);
    // arms: eased pose transitions (smoothed joints) + additive walk swing / wave
    for (const s of [-1, 1]) {
      const poseName = s < 0 ? poseState.armL : poseState.armR;
      const T = (POSE[poseName] || POSE.down)(s);
      const C = armCur[s];
      C.z += (T.z - C.z) * kk; C.x += (T.x - C.x) * kk; C.e += (T.e - C.e) * kk;
      const piv = armPivots[s], elb = elbowPivots[s];
      piv.rotation.z = C.z;
      piv.rotation.x = C.x + ((walkPhase !== null && poseName === 'down') ? Math.sin(walkPhase + (s < 0 ? 0 : Math.PI)) * 0.38 : 0);
      elb.rotation.x = C.e;
      elb.rotation.z = poseName === 'wave' ? Math.sin(t * 9) * 0.35 : 0;
    }
    // stepped turning: rotate at capped speed, lean into it, tiny step bob
    let turning = false;
    if (facingTarget !== null) {
      let diff = facingTarget - group.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const maxStep = dt * 5.0;
      const step = Math.max(-maxStep, Math.min(maxStep, diff));
      group.rotation.y += step;
      bodyG.rotation.z = -step * 0.6;
      turning = Math.abs(diff) > 0.02;
      if (!turning) { group.rotation.y = facingTarget; facingTarget = null; bodyG.rotation.z = 0; }
    }
    // legs + body motion
    const tiltRad = (face.headTilt || 0) * Math.PI / 180, pitchRad = (face.headPitch || 0) * Math.PI / 180;
    if (walkPhase !== null) {
      legPivots[-1].rotation.x = Math.sin(walkPhase) * 0.50;
      legPivots[1].rotation.x = Math.sin(walkPhase + Math.PI) * 0.50;
      // knees flex while that leg swings forward -> foot path flattens, less sliding
      kneePivots[-1].rotation.x = 0.05 + Math.max(0, Math.sin(walkPhase - 2.0)) * 0.9;
      kneePivots[1].rotation.x = 0.05 + Math.max(0, Math.sin(walkPhase + Math.PI - 2.0)) * 0.9;
      bodyG.position.y = Math.abs(Math.cos(walkPhase)) * 0.035;
      bodyG.rotation.x = 0.055;
      headG.rotation.z = Math.sin(walkPhase) * 0.028 + tiltRad;
      headG.rotation.x = pitchRad;
      mohawkG.rotation.x = Math.sin(walkPhase - 0.7) * 0.075;
    } else {
      legPivots[-1].rotation.x = 0; legPivots[1].rotation.x = 0;
      kneePivots[-1].rotation.x = 0.04; kneePivots[1].rotation.x = 0.04;
      bodyG.position.y = Math.sin(t * 1.9) * 0.006;         // idle breath
      bodyG.rotation.x = 0;
      headG.rotation.z = Math.sin(t * 0.7) * 0.012 + tiltRad;
      headG.rotation.x = pitchRad;
      mohawkG.rotation.x = Math.sin(t * 1.9 - 0.5) * 0.015;
      torso.scale.y = 1 + Math.sin(t * 1.9) * 0.008;
    }
    if (turning) bodyG.position.y += Math.abs(Math.sin(t * 15)) * 0.010;
  }

  return { group, setFace, setPose, setWalk, setFacing, update };
}
