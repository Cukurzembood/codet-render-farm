import * as THREE from './lib/three.module.js';

// ===== 3D villagers + chickens (production supporting cast) =====
// createVillager('busiti'|'pakrt'|'wargaA'|'wargaB') -> { group, setFace, update }
//   setFace({expr, blink, lip}) expr: neutral|worry|talk|nervous|laugh|shock ; lip 0..2 (talk)
// createChicken('putih'|'coklat') -> { group, update(t, {step, flap, peck, run}) }

const gradSoft = (() => { const n = 32, d = new Uint8Array(n * 4); for (let i = 0; i < n; i++) { const v = Math.round(118 + (255 - 118) * Math.pow(i / (n - 1), 1.35)); d.set([v, v, v, 255], i * 4); } const t = new THREE.DataTexture(d, n, 1); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t; })();
const soft = (o) => new THREE.MeshToonMaterial({ gradientMap: gradSoft, ...o });
const flat = (color) => soft({ color });
const INK = '#241726';
const mouthM = flat(INK);

const VARIANTS = {
  busiti: { skin: '#f5c9a0', cloth: '#7a2e35', clothD: '#5f232a', head: 'hijab', headCol: '#93343e', prop: 'bucket', h: 1.0 },
  pakrt:  { skin: '#e8b98d', cloth: '#7a6a4f', clothD: '#5f5340', head: 'cap', headCol: '#4a3b2a', prop: 'none', h: 1.04, moustache: true },
  wargaA: { skin: '#eec39b', cloth: '#4f7fb8', clothD: '#3d6494', head: 'hair', headCol: '#2b211c', prop: 'none', h: 1.0 },
  wargaB: { skin: '#c99067', cloth: '#c96f2e', clothD: '#a85a24', head: 'hair', headCol: '#1e1714', prop: 'none', h: 0.97, stout: true },
};

export function createVillager(variant) {
  const V = VARIANTS[variant] || VARIANTS.wargaA;
  const group = new THREE.Group(); group.scale.setScalar(V.h * (V.stout ? 1 : 1));
  const add = (m, parent = group) => { m.castShadow = true; parent.add(m); return m; };
  // legs on hip pivots (walk cycle) + simple shoes
  const legPivots = {};
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.07, 0.34, 0); group.add(piv);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.046, 0.3, 10), flat(V.clothD));
    leg.position.y = -0.15; leg.castShadow = true; piv.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.045, 0.15), flat('#4a3a2c'));
    shoe.position.set(0, -0.315, 0.02); shoe.castShadow = true; piv.add(shoe);
    legPivots[s] = piv;
  }
  // torso: dress for busiti (cone), tunic capsule for others
  let torso;
  if (variant === 'busiti') {
    torso = add(new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.24, 0.52, 14), flat(V.cloth)));
    torso.position.set(0, 0.6, 0);
  } else {
    torso = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.165, 0.12, 6, 14), flat(V.cloth)));
    torso.position.set(0, 0.6, 0); torso.scale.set(V.stout ? 1.3 : 1.08, 1, 0.95);
  }
  // arms
  const arms = {};
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * (V.stout ? 0.21 : 0.185), 0.78, 0); group.add(piv);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.3, 10), flat(V.cloth));
    arm.position.y = -0.15; arm.castShadow = true; piv.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 8), flat(V.skin));
    hand.position.y = -0.32; piv.add(hand);
    piv.rotation.z = s * 0.14;
    arms[s] = piv;
  }
  if (V.prop === 'bucket') { // Bu Siti carries a bucket in her right hand (-x side faces camera-left in old layout; use +x)
    const b = new THREE.Group(); b.position.set(0, -0.36, 0.02); arms[1].add(b);
    const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.068, 0.14, 12), flat('#7d8a96')); bk.castShadow = true; b.add(bk);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.008, 6, 16), flat('#5f6a74')); rim.rotation.x = Math.PI / 2; rim.position.y = 0.07; b.add(rim);
    arms[1].rotation.z = 0.05;
  }
  // head
  const headG = new THREE.Group(); headG.position.set(0, 1.02, 0); group.add(headG);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.215, 24, 18), flat(V.skin));
  skull.scale.set(1, 0.95, 0.96); skull.castShadow = true; headG.add(skull);
  const faceParts = [];
  const F = (m, x, y, z) => { m.position.set(x, y, z); headG.add(m); faceParts.push(m); return m; };
  if (V.head === 'hijab') {
    const hj = new THREE.Mesh(new THREE.SphereGeometry(0.235, 20, 16), flat(V.headCol));
    hj.scale.set(1.02, 1.0, 1.0); hj.position.set(0, 0.035, -0.028); headG.add(hj);
    // face opening: skin-colored front patch re-drawn by slightly larger skin sphere segment is complex;
    // instead the hijab sphere sits back/up and a drape covers the neck:
    const drape = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.26, 0.3, 14, 1, true), flat(V.headCol));
    drape.position.set(0, -0.16, -0.02); headG.add(drape);
    skull.position.z = 0.045; // face proud of the hijab
  } else if (V.head === 'cap') {
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.215, 0.085, 16), flat(V.headCol));
    capTop.position.set(0, 0.165, 0); headG.add(capTop);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.018, 16, 1, false, -0.9, 1.8), flat(V.headCol));
    brim.position.set(0, 0.125, 0.055); brim.scale.set(1, 1, 1.25); headG.add(brim);
  } else { // hair cap
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.222, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), flat(V.headCol));
    hair.position.set(0, 0.018, -0.008); hair.scale.set(1, 0.95, 0.97); headG.add(hair);
  }
  if (V.moustache) F(new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.02, 0.012), flat('#3a2a1e')), 0, -0.048, 0.20);
  // eyes + brows + mouths
  const eyes = {};
  for (const s of [-1, 1]) {
    const e = F(new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), mouthM), s * 0.076, 0.012, 0.196);
    e.scale.set(1, 1.25, 0.5); eyes[s] = e;
  }
  const brows = {};
  for (const s of [-1, 1]) brows[s] = F(new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.016, 0.01), mouthM), s * 0.076, 0.088, 0.20);
  F(new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), flat(V.skin)), 0, -0.018, 0.208);
  const mouths = {};
  const mk = (name, mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.visible = false; headG.add(mesh); mouths[name] = mesh; faceParts.push(mesh); };
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.009, 8, 20, Math.PI * 0.9), mouthM); smile.rotation.z = Math.PI * 1.05; mk('smile', smile, 0, -0.072, 0.20);
  const flatM = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.009, 0.008), mouthM); mk('flat', flatM, 0, -0.078, 0.205);
  const oM = new THREE.Mesh(new THREE.CircleGeometry(0.018, 14), flat('#5a1e28')); oM.scale.set(1, 1.2, 1); mk('o', oM, 0, -0.082, 0.208);
  const t1 = new THREE.Mesh(new THREE.CircleGeometry(0.016, 14), flat('#5a1e28')); t1.scale.set(1, 0.7, 1); mk('talk1', t1, 0, -0.078, 0.208);
  const t2 = new THREE.Mesh(new THREE.CircleGeometry(0.024, 14), flat('#5a1e28')); mk('talk2', t2, 0, -0.082, 0.206);
  const grin = new THREE.Mesh(new THREE.CircleGeometry(0.030, 14), flat('#5a1e28')); grin.scale.set(1, 0.65, 1); mk('grin', grin, 0, -0.074, 0.204);
  // V3 FIX: the hijab skull is pushed +0.045 forward, which buried every face part
  // inside the skull (Bu Siti rendered faceless). Push her face parts out by the same offset.
  if (V.head === 'hijab') for (const m of faceParts) m.position.z += 0.048;

  const EXPR = {
    neutral: { brow: 0.05, browY: 0.088, mouth: 'smile' },
    worry:   { brow: -0.42, browY: 0.098, mouth: 'flat' },
    nervous: { brow: -0.35, browY: 0.096, mouth: 'flat' },
    talk:    { brow: 0.05, browY: 0.088, mouth: 'talk1' },
    laugh:   { brow: -0.12, browY: 0.096, mouth: 'grin' },
    shock:   { brow: -0.2, browY: 0.108, mouth: 'o' },
  };
  let face = { expr: 'neutral', blink: 0, lip: 0 };
  let walkPhase = null;
  function setFace(f = {}) { Object.assign(face, f); }
  function setWalk(phase) { walkPhase = phase; }
  function setArm(side, pose) { // 'down' | 'point' | 'up'
    const piv = arms[side];
    if (pose === 'point') { piv.rotation.x = -1.4; piv.rotation.z = side * 0.1; }
    else if (pose === 'up') { piv.rotation.x = 0; piv.rotation.z = side * 2.4; }
    else { piv.rotation.x = 0; piv.rotation.z = side * 0.14; }
  }
  function update(t) {
    const E = EXPR[face.expr] || EXPR.neutral;
    for (const s of [-1, 1]) {
      brows[s].rotation.z = -s * E.brow;
      brows[s].position.y = E.browY;
      eyes[s].scale.y = 1.25 * (1 - face.blink * 0.9);
    }
    const want = face.lip >= 2 ? 'talk2' : face.lip === 1 ? 'talk1' : E.mouth;
    for (const k in mouths) mouths[k].visible = (k === want);
    if (walkPhase !== null) {
      legPivots[-1].rotation.x = Math.sin(walkPhase) * 0.5;
      legPivots[1].rotation.x = Math.sin(walkPhase + Math.PI) * 0.5;
      group.position.y = Math.abs(Math.cos(walkPhase)) * 0.02;
    } else {
      legPivots[-1].rotation.x = 0; legPivots[1].rotation.x = 0;
      group.position.y = Math.sin(t * 1.8 + group.id) * 0.004;
    }
  }
  return { group, setFace, setArm, setWalk, update };
}

export function createChicken(variant) {
  const bodyCol = variant === 'coklat' ? '#a4713e' : '#f0ead8';
  const group = new THREE.Group();
  const add = (m) => { m.castShadow = true; group.add(m); return m; };
  const bodyG = new THREE.Group(); group.add(bodyG);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), flat(bodyCol));
  body.scale.set(1.15, 0.95, 1.35); body.position.y = 0.21; body.castShadow = true; bodyG.add(body);
  const headG = new THREE.Group(); headG.position.set(0, 0.33, 0.17); bodyG.add(headG);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 10), flat(bodyCol)); head.castShadow = true; headG.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.07, 8), flat('#e8762c'));
  beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.01, 0.1); headG.add(beak);
  const comb = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.045, 0.06), flat('#c93a2e'));
  comb.position.set(0, 0.085, 0.01); headG.add(comb);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), mouthM);
    eye.position.set(s * 0.055, 0.02, 0.055); headG.add(eye);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 6), flat('#e8762c'));
    leg.position.set(s * 0.05, 0.065, 0); group.add(leg);
  }
  const wings = {};
  for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(s * 0.15, 0.28, 0.0); bodyG.add(piv);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), flat(bodyCol));
    wing.scale.set(0.35, 0.8, 1.1); wing.position.y = -0.05; wing.castShadow = true; piv.add(wing);
    wings[s] = piv;
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 8), flat(bodyCol));
  tail.position.set(0, 0.32, -0.19); tail.rotation.x = -0.7; bodyG.add(tail);
  function update(t, o = {}) {
    const run = o.run || 0, step = o.step || 0;
    bodyG.position.y = Math.abs(Math.sin(step * Math.PI * 2)) * (0.012 + run * 0.03);
    bodyG.rotation.z = Math.sin(step * Math.PI * 2) * 0.05;
    headG.rotation.x = (o.peck || 0) * 0.85;
    headG.position.y = 0.33 - (o.peck || 0) * 0.09;
    const flapA = (o.flap || 0) * (0.7 + 0.5 * Math.sin(t * 26));
    wings[-1].rotation.z = -0.12 - flapA; wings[1].rotation.z = 0.12 + flapA;
  }
  return { group, update };
}
