import * as THREE from './lib/three.module.js';
import * as P from './paint.js';

// ===== Detailed semi-real kampung world (production) =====
// Anchors match the Ep.1 layout: Codet [0.9,0,-4.6], warung/Bu Siti [-1.9,0,-6.8],
// sumur [4.4,0,-5.4], wargaB [-8.2,0,-4.0], volcano far back-left.
// API: createWorld(scene) -> { setLight(name), update(t, fx), group }
//   fx: { smoke: 0..1 darkness/coverage, burst: 0..1 eruption swell }
export function createWorld(scene) {
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0, ...o });
  const texM = (c, rx = 1, ry = 1, color = '#ffffff') => std({ map: P.tex(c, rx, ry), color });
  const flatS = (color) => std({ color });
  let seed = 987654; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const g = new THREE.Group(); scene.add(g);
  const put = (mesh, parent = g) => { mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };

  // lights
  const hemi = new THREE.HemisphereLight('#ffe9c4', '#5d7a44', 0.95); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffd9a0', 2.6);
  sun.position.set(14, 24, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -16; sun.shadow.camera.right = 16; sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -10;
  sun.shadow.camera.far = 80; sun.shadow.bias = -0.0004;
  scene.add(sun); scene.add(sun.target);

  // sky gradients per preset
  const skyTex = (stops) => {
    const c = document.createElement('canvas'); c.width = 2; c.height = 512;
    const x = c.getContext('2d'); const grd = x.createLinearGradient(0, 0, 0, 512);
    for (const [o, col] of stops) grd.addColorStop(o, col);
    x.fillStyle = grd; x.fillRect(0, 0, 2, 512);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const SKIES = {
    day: skyTex([[0, '#5f9fd8'], [0.55, '#a8cbe4'], [0.82, '#f2ddae'], [1, '#f7cf9a']]),
    pagiAbu: skyTex([[0, '#75879c'], [0.55, '#a8a795'], [0.82, '#cfc0a0'], [1, '#d9bf95']]),
    gloom1: skyTex([[0, '#66788f'], [0.55, '#97a0a4'], [0.82, '#c9bda6'], [1, '#d8c096']]),
    gloom2: skyTex([[0, '#4c5a70'], [0.55, '#7e8894'], [0.82, '#a49a86'], [1, '#b3a184']]),
  };
  const PRESETS = {
    day:    { sun: '#ffd9a0', sunI: 2.6, hemiI: 0.95, fog: '#eedcae', fogN: 30, fogF: 190, ground: '#dcf2ac', smoke: 0.15 },
    pagiAbu: { sun: '#ffe9c4', sunI: 1.9, hemiI: 0.82, fog: '#c4bda6', fogN: 24, fogF: 165, ground: '#c2cf96', smoke: 0.30 },
    gunung: { sun: '#ffd9a0', sunI: 2.6, hemiI: 0.95, fog: '#e4d9bc', fogN: 60, fogF: 320, ground: '#dcf2ac', smoke: 0.4 },
    gloom1: { sun: '#ffc490', sunI: 1.8, hemiI: 0.8, fog: '#b3a894', fogN: 26, fogF: 170, ground: '#b9c48e', smoke: 0.32 },
    gloom2: { sun: '#f0b98a', sunI: 1.35, hemiI: 0.62, fog: '#97907e', fogN: 22, fogF: 150, ground: '#a3ad84', smoke: 0.38 },
  };
  let curSmoke = 0.15;

  // ground + path
  const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 40), texM(P.grass(6), 60, 60));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 26), texM(P.dirt(7), 1, 12));
  path.rotation.x = -Math.PI / 2; path.rotation.z = 0.1; path.position.set(0.4, 0.005, 2.0); path.receiveShadow = true; g.add(path);

  // ---- warung Bu Siti (detailed) at [-1.9, 0, -6.8], facing the yard (+z, slight turn)
  {
    const w = new THREE.Group(); w.position.set(-1.9, 0, -6.8); w.rotation.y = 0.22; g.add(w);
    const A = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; w.add(m); return m; };
    const post = texM(P.beam(2), 1, 2), plank = texM(P.planks(1), 1, 4), roofM = texM(P.roof(9), 2, 2), wall = texM(P.plaster(8), 1, 1);
    for (const [x, z] of [[-1.05, -0.55], [1.05, -0.55], [-1.05, 0.55], [1.05, 0.55]])
      A(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 1.75, 10), post), x, 0.875, z);
    A(new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.55, 0.85), plank), 0, 0.68, 0.5);
    A(new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.06, 0.95), texM(P.beam(3), 1, 1)), 0, 0.99, 0.5);
    A(new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.3, 0.09), wall), 0, 1.1, -0.58);
    A(new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.15, 0.09), plank), 0, 0.58, -0.58);
    const r1 = A(new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.06, 1.15), roofM), 0, 2.06, -0.28); r1.rotation.x = 0.5;
    const r2 = A(new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.06, 1.15), roofM), 0, 2.06, 0.33); r2.rotation.x = -0.5;
    for (let i = 0; i < 4; i++) A(new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), flatS(['#c96f2e', '#a34a2e', '#7a9b4e', '#c9a44a'][i])), -0.75 + i * 0.48, 1.13, 0.5);
    // ---- warung detail burst: shelf jars, hanging snack packs, crates, sacks, sign ----
    A(new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.3), texM(P.beam(3), 1, 1)), 0, 1.42, -0.40);
    for (let i = 0; i < 6; i++) {
      const jar = A(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.17, 10),
        new THREE.MeshStandardMaterial({ color: ['#d94f30', '#e8a13a', '#7ab648', '#e8e2d4', '#b83a5e', '#3a7ab8'][i], roughness: 0.35 })), -0.78 + i * 0.31, 1.53, -0.40);
      A(new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.03, 10), flatS('#5a4632')), -0.78 + i * 0.31, 1.63, -0.40);
    }
    for (let i = 0; i < 8; i++) {
      const pack = A(new THREE.Mesh(new THREE.PlaneGeometry(0.115, 0.16),
        new THREE.MeshStandardMaterial({ color: ['#d94f30', '#e8c84a', '#3a7ab8', '#7ab648', '#e8762c', '#b83a5e', '#e8e2d4', '#d94f30'][i], side: THREE.DoubleSide, roughness: 0.7 })), -0.92 + i * 0.26, 1.70, 0.64);
      pack.rotation.y = (i % 2 ? 0.16 : -0.12);
    }
    A(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.42, 0.44), texM(P.planks(1), 1, 1)), -1.48, 0.21, 0.38);
    A(new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.38, 0.40), texM(P.planks(1), 1, 1)), -1.46, 0.61, 0.36);
    for (let i = 0; i < 3; i++) A(new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), flatS('#e8762c')), -1.58 + i * 0.17, 0.86, 0.36);
    for (const [sx, sc] of [[1.52, '#c9b18a'], [1.86, '#b39d72']]) {
      const sack = A(new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), flatS(sc)), sx, 0.20, 0.34); sack.scale.y = 0.78;
    }
    A(new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.36, 0.045), flatS('#b83a2e')), 0, 1.95, 0.68);
    A(new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.07, 0.05), flatS('#e8c84a')), 0, 1.80, 0.68);
    // hanging lamp (Ep.2 will switch it on; built now)
    const lampWire = A(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 6), flatS('#3a3630')), 0.5, 1.85, 0.3);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8),
      new THREE.MeshStandardMaterial({ color: '#6b5a3a', emissive: '#ffb36b', emissiveIntensity: 0 }));
    bulb.position.set(0.5, 1.62, 0.3); w.add(bulb);
    const lampLight = new THREE.PointLight('#ffb36b', 0, 7); lampLight.position.set(0.5, 1.6, 0.3); w.add(lampLight);
    g.userData.lamp = { bulb, lampLight };
  }

  // ---- houses (background depth) — bold kampung colors, no two alike
  const DOORS = ['#2e6da4', '#b83a2e', '#2e7d52', '#e8762c', '#7a4a8e', '#c9a227', '#2a9d8f', '#c94f7c', '#5a4632'];
  const CURTAINS = ['#e84a6f', '#e8c84a', '#3ab8a4', '#e8762c', '#7ab648', '#d94f30', '#4a7ad9', '#e8e2d4', '#b83a5e'];
  let houseIdx = 0;
  const house = (x, z, ry, tint) => {
    const myIdx = houseIdx++;
    const h = new THREE.Group(); h.position.set(x, 0, z); h.rotation.y = ry; g.add(h);
    const A = (m, px, py, pz) => { m.position.set(px, py, pz); m.castShadow = true; m.receiveShadow = true; h.add(m); return m; };
    A(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 2.1), texM(P.stone(4), 2, 1, '#b9b2a4')), 0, 0.1, 0);
    A(new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.3, 1.85), texM(P.plaster(8), 1, 1, tint)), 0, 0.85, 0);
    A(new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.42, 1.88), texM(P.planks(1), 2, 1)), 0, 0.42, 0);
    const r1 = A(new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.07, 1.35), texM(P.roof(9), 3, 2, '#e0a184')), 0, 1.78, -0.55); r1.rotation.x = 0.52;
    const r2 = A(new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.07, 1.35), texM(P.roof(9), 3, 2, '#e0a184')), 0, 1.78, 0.55); r2.rotation.x = -0.52;
    const ridge = A(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.9, 8), texM(P.beam(3), 2, 1)), 0, 2.1, 0); ridge.rotation.z = Math.PI / 2;
    A(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.95, 0.06), flatS(DOORS[myIdx % DOORS.length])), 0.5, 0.68, 0.94);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05),
      new THREE.MeshStandardMaterial({ color: '#4a3418', emissive: '#ffb36b', emissiveIntensity: 0.25, roughness: 0.4 }));
    A(win, -0.6, 1.0, 0.94);
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.30),
      new THREE.MeshStandardMaterial({ color: CURTAINS[myIdx % CURTAINS.length], side: THREE.DoubleSide, roughness: 1 }));
    curtain.position.set(-0.6, 1.12, 0.975); h.add(curtain);
    // dirt yard in front + flower pots by the door (lived-in, not a graveyard)
    const yard = new THREE.Mesh(new THREE.CircleGeometry(1.9, 18), texM(P.dirt(7), 2, 2, '#e8c9a0'));
    yard.rotation.x = -Math.PI / 2; yard.position.set(0.2, 0.006, 1.9); yard.receiveShadow = true; h.add(yard);
    for (const [px, pc] of [[-0.95, '#c96f2e'], [-0.72, '#a34a2e'], [1.05, '#7a9b4e']]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.13, 10), flatS('#9a5a38'));
      pot.position.set(px, 0.065, 1.02); pot.castShadow = true; h.add(pot);
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), flatS(pc));
      bush.position.set(px, 0.17, 1.02); bush.castShadow = true; h.add(bush);
    }
    return h;
  };
  house(7.2, -10.5, -0.4, '#cfe0b8');
  house(-8.6, -11.5, 0.5, '#f2c9a8');
  house(-4.5, -16, 0.15, '#bcd6e8');
  house(-11.8, -6.2, 0.95, '#f2e0a8');
  house(11.2, -7.8, -0.75, '#eec9d4');
  house(4.6, -16.5, 0.2, '#bfe0d8');
  house(-13.5, -13.5, 0.45, '#e4d2f0');
  house(13.8, -14, -0.35, '#f5d7b0');
  house(0.5, -21.5, 0.05, '#cfe0b8');

  // ---- sumur (well) at [4.4, 0, -5.4]
  {
    const w = new THREE.Group(); w.position.set(4.4, 0, -5.4); g.add(w);
    const A = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; w.add(m); return m; };
    const ring = A(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.62, 14, 1, true), texM(P.stone(4), 3, 1, '#c4beb0')), 0, 0.31, 0);
    ring.material.side = THREE.DoubleSide;
    A(new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.045, 8, 20), texM(P.stone(4), 2, 1, '#b5b0a2')), 0, 0.63, 0).rotation.x = Math.PI / 2;
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), new THREE.MeshStandardMaterial({ color: '#7a5c38', roughness: 0.25, metalness: 0.1 }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, 0.42, 0); w.add(water); g.userData.wellWater = water;
    for (const s of [-1, 1]) A(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.5, 8), texM(P.beam(2), 1, 2)), s * 0.62, 0.75, 0);
    const beam = A(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.35, 8), texM(P.beam(2), 1, 1)), 0, 1.48, 0); beam.rotation.z = Math.PI / 2;
    const roofW = A(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 1.1), texM(P.roof(9), 2, 1, '#e0a184')), 0, 1.78, 0); roofW.rotation.x = 0.16;
    const rope = A(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.75, 6), flatS('#8a7a5c')), 0, 1.1, 0);
    A(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.26, 10), flatS('#7d8a96')), 0, 0.68, 0);
  }

  // ---- fences, banana trees, trees, bushes, tufts, rocks
  const cylBetween = (p1, p2, r, m) => {
    const a = new THREE.Vector3(...p1), b = new THREE.Vector3(...p2);
    const len = a.distanceTo(b); const q = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), m);
    q.position.copy(a).lerp(b, 0.5); q.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
    return put(q);
  };
  {
    const m = texM(P.beam(2), 1, 1, '#cbb27e');
    for (let i = 0; i <= 6; i++) { const t = i / 6; const p = put(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.72, 8), m)); p.position.set(-6.4 + t * 4.6, 0.36, -2.2 + t * 0.9); }
    cylBetween([-6.4, 0.56, -2.2], [-1.8, 0.56, -1.3], 0.024, m);
    cylBetween([-6.4, 0.32, -2.2], [-1.8, 0.32, -1.3], 0.024, m);
  }
  const banana = (x, z, s = 1) => {
    const b = new THREE.Group(); b.position.set(x, 0, z); b.scale.setScalar(s); g.add(b);
    const trunkM = texM(P.beam(2), 1, 2, '#9db36a');
    let ty = 0, tx = 0;
    for (let i = 0; i < 3; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.06 - i * 0.008, 0.068 - i * 0.008, 0.6, 9), trunkM); tx += 0.05; seg.position.set(tx, ty + 0.3, 0); seg.rotation.z = -0.09; seg.castShadow = true; b.add(seg); ty += 0.55; }
    const lc = document.createElement('canvas'); lc.width = 128; lc.height = 256;
    const lx = lc.getContext('2d'); const lg = lx.createLinearGradient(0, 256, 0, 0);
    lg.addColorStop(0, '#4c8a34'); lg.addColorStop(1, '#6fae46'); lx.fillStyle = lg;
    lx.beginPath(); lx.moveTo(64, 256); lx.quadraticCurveTo(8, 150, 30, 18); lx.quadraticCurveTo(64, -8, 98, 18); lx.quadraticCurveTo(120, 150, 64, 256); lx.fill();
    lx.strokeStyle = 'rgba(38,84,26,0.55)'; lx.lineWidth = 3; lx.beginPath(); lx.moveTo(64, 256); lx.lineTo(64, 6); lx.stroke();
    const leafTex = new THREE.CanvasTexture(lc); leafTex.colorSpace = THREE.SRGBColorSpace;
    const leafM = new THREE.MeshStandardMaterial({ map: leafTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 1 });
    for (let i = 0; i < 7; i++) {
      const geo = new THREE.PlaneGeometry(0.65, 1.55); geo.translate(0, 0.775, 0);
      const leaf = new THREE.Mesh(geo, leafM);
      leaf.position.set(tx + 0.06, ty + 0.07, 0); leaf.rotation.y = i * (Math.PI * 2 / 7) + x; leaf.rotation.x = -(0.35 + (i % 4) * 0.24);
      leaf.scale.setScalar(0.85 + (i % 3) * 0.16);
      leaf.castShadow = true; b.add(leaf);
    }
  };
  banana(-3.9, -3.4, 1.05); banana(8.8, -5.2, 0.85); banana(-6.8, -7.5, 1.15);
  banana(12.5, -10.5, 0.95); banana(-10.6, -3.6, 0.9); banana(8.6, 7.8, 1.2);
  const tree = (x, z, s = 1) => {
    const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(s); g.add(t);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.35, 10), flatS('#6a4a32')); trunk.position.y = 0.67; trunk.castShadow = true; t.add(trunk);
    for (const [lx, ly, lz, r, cc] of [[0, 1.78, 0, 0.72, '#4f8140'], [-0.52, 1.42, 0.12, 0.5, '#5d9047'], [0.54, 1.48, -0.1, 0.52, '#4a7a38'], [0.1, 1.5, 0.42, 0.46, '#649a4e'], [-0.15, 1.45, -0.4, 0.44, '#55853c']]) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), flatS(cc)); sp.position.set(lx, ly, lz); sp.scale.y = 0.88; sp.castShadow = true; t.add(sp);
    }
  };
  tree(7.6, -12.6, 1.2); tree(-5.6, -13, 1.4); tree(10.8, -12.8, 1.1); tree(-12.8, -9.5, 1.25);
  { // tufts + rocks + path stones
    const tc = document.createElement('canvas'); tc.width = tc.height = 128;
    const tx2 = tc.getContext('2d'); tx2.lineCap = 'round';
    for (let i = 0; i < 16; i++) { tx2.strokeStyle = ['#5da244', '#4c8a34', '#74b657'][i % 3]; tx2.lineWidth = 5 + (i % 3); const bx0 = 18 + rnd() * 92; tx2.beginPath(); tx2.moveTo(bx0, 128); tx2.quadraticCurveTo(bx0 + (rnd() - 0.5) * 26, 66, bx0 + (rnd() - 0.5) * 52, 8 + rnd() * 42); tx2.stroke(); }
    for (let i = 0; i < 10; i++) { tx2.strokeStyle = '#97d873'; tx2.lineWidth = 4; const bx0 = 24 + rnd() * 80; tx2.beginPath(); tx2.moveTo(bx0, 54 + rnd() * 18); tx2.quadraticCurveTo(bx0 + (rnd() - 0.5) * 18, 30, bx0 + (rnd() - 0.5) * 34, 4 + rnd() * 22); tx2.stroke(); }
    const tuftTex = new THREE.CanvasTexture(tc); tuftTex.colorSpace = THREE.SRGBColorSpace;
    const tuftM = new THREE.MeshStandardMaterial({ map: tuftTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 });
    const CLEAN = [[0.9, -4.6], [0.2, -4.3], [-1.2, -4.5], [-0.55, -5.55], [-1.75, -6.35], [-5.0, -8.0], [-5.6, -8.6], [3.15, -4.55], [5.65, -4.6], [4.35, -3.9], [2.7, -4.1], [5.0, -3.0], [-3.4, -1.6], [-8.2, -4.0], [4.4, -5.4], [-1.9, -6.8], [-0.75, -3.9], [2.7, -4.3], [3.75, -4.8], [4.0, -3.75], [5.25, -4.4], [3.55, -4.55], [-0.35, -5.95]];
    for (let i = 0; i < 230; i++) {
      const a = rnd() * Math.PI * 2, r = 1.6 + rnd() * 13;
      const px = Math.cos(a) * r, pz = -3 + Math.sin(a) * r * 0.7;
      if (Math.abs(px - 0.4) < 1.15 && pz > -1) continue;
      if (CLEAN.some(([cx, cz]) => (px - cx) * (px - cx) + (pz - cz) * (pz - cz) < 0.36)) continue; // V3: no tufts on standing spots
      for (let k = 0; k < 2; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.36 + rnd() * 0.3, 0.32 + rnd() * 0.3), tuftM); p.position.set(px, 0.17, pz); p.rotation.y = rnd() * Math.PI; g.add(p); }
    }
    for (let i = 0; i < 10; i++) {
      const rock = put(new THREE.Mesh(new THREE.DodecahedronGeometry(0.09 + rnd() * 0.16), texM(P.stone(4), 1, 1, '#c0bbae')));
      const a = rnd() * Math.PI * 2, r = 2 + rnd() * 9;
      rock.position.set(Math.cos(a) * r, 0.06, -2 + Math.sin(a) * r * 0.6); rock.scale.y = 0.65; rock.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    }
  }

  // ---- kampung density: laundry lines, cart, firewood, plot fences, bushes ----
  {
    const poleM = texM(P.beam(2), 1, 2, '#b89a6a');
    const laundry = (x, z, ry) => {
      const L = new THREE.Group(); L.position.set(x, 0, z); L.rotation.y = ry; g.add(L);
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 1.6, 8), poleM); p.position.set(s * 1.1, 0.8, 0); p.castShadow = true; L.add(p); }
      const line = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.014, 0.014), flatS('#5a5248')); line.position.y = 1.52; L.add(line);
      const cols = ['#c94f42', '#e8e2d4', '#4f7fb8', '#e8c84a'];
      for (let i = 0; i < 4; i++) {
        const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.55), new THREE.MeshStandardMaterial({ color: cols[i], side: THREE.DoubleSide, roughness: 1 }));
        cloth.position.set(-0.82 + i * 0.55, 1.24, 0); cloth.rotation.y = (i % 2 ? 0.14 : -0.1); cloth.castShadow = true; L.add(cloth);
      }
    };
    laundry(-5.6, -8.6, 0.5);
    laundry(7.0, -5.9, -0.4);
    // gerobak (wooden push cart) near the warung
    const cart = new THREE.Group(); cart.position.set(2.1, 0, -7.9); cart.rotation.y = -0.5; g.add(cart);
    const CA = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; cart.add(m); return m; };
    CA(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.09, 0.7), texM(P.planks(1), 1, 1)), 0, 0.62, 0);
    CA(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.3, 0.05), texM(P.planks(1), 1, 1)), 0, 0.8, -0.33);
    CA(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.3, 0.05), texM(P.planks(1), 1, 1)), 0, 0.8, 0.33);
    for (const s of [-1, 1]) {
      const wheel = CA(new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.045, 8, 18), texM(P.beam(2), 1, 1, '#8a6a44')), 0, 0.32, s * 0.40);
      const hub = CA(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10), flatS('#5a4632')), 0, 0.32, s * 0.40); hub.rotation.x = Math.PI / 2;
      const handle = CA(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8), texM(P.beam(2), 1, 1, '#8a6a44')), 0.95, 0.42, s * 0.24); handle.rotation.z = 1.05;
    }
    for (let i = 0; i < 5; i++) CA(new THREE.Mesh(new THREE.SphereGeometry(0.11 + (i % 2) * 0.03, 10, 8), flatS(['#c96f2e', '#7a9b4e', '#c9a44a'][i % 3])), -0.4 + i * 0.21, 0.76, (i % 2 ? 0.12 : -0.1));
    // firewood stack by the right house
    const woodM = texM(P.beam(2), 1, 1, '#9a764e');
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - (r === 2 ? 1 : 0); i++) {
      const log = put(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.8, 8), woodM));
      log.rotation.z = Math.PI / 2; log.rotation.y = 0.12;
      log.position.set(8.7 + (r % 2) * 0.06, 0.06 + r * 0.105, -9.0 + i * 0.125);
    }
    // plot fences (right + far left)
    const fenceRun = (x0, z0, x1, z1) => {
      const lp = (a, b, t) => a + (b - a) * t;
      const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.85));
      for (let i = 0; i <= n; i++) { const t = i / n; const p = put(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.7, 8), poleM)); p.position.set(lp(x0, x1, t), 0.35, lp(z0, z1, t)); }
      cylBetween([x0, 0.55, z0], [x1, 0.55, z1], 0.022, poleM);
      cylBetween([x0, 0.30, z0], [x1, 0.30, z1], 0.022, poleM);
    };
    fenceRun(6.2, -5.5, 12.4, -6.4);
    fenceRun(-12.6, -3.2, -7.4, -2.4);
    // bushes at house corners
    for (const [bx, bz, bs] of [[-7.2, -9.8, 0.5], [5.6, -9.2, 0.62], [-3.2, -14.2, 0.55], [9.8, -6.2, 0.45], [-10.4, -5.0, 0.5], [3.4, -14.8, 0.6]]) {
      const b = put(new THREE.Mesh(new THREE.SphereGeometry(bs, 12, 10), flatS('#527d36')));
      b.position.set(bx, bs * 0.55, bz); b.scale.y = 0.75;
    }
  }

  // ---- volcano + smoke (far back-left) — tropical cone: dark rock, crater, NO snow
  const volc = new THREE.Group(); volc.position.set(-46, 0, -148); volc.rotation.y = 2.4; g.add(volc);
  {
    // seamless noisy rock texture (paint.js stone tiles read as roof shingles at this scale)
    const rc = document.createElement('canvas'); rc.width = rc.height = 256;
    const rx = rc.getContext('2d'); rx.fillStyle = '#aeb9c2'; rx.fillRect(0, 0, 256, 256);
    let rs = 13579; const rrnd = () => ((rs = (rs * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 900; i++) {
      const bx = rrnd() * 256, by = rrnd() * 256, br = 3 + rrnd() * 15;
      rx.fillStyle = ['rgba(120,134,148,0.25)', 'rgba(140,154,168,0.22)', 'rgba(100,114,128,0.20)'][i % 3];
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { rx.beginPath(); rx.arc(bx + ox, by + oy, br, 0, 7); rx.fill(); }
    }
    for (let i = 0; i < 380; i++) { // green vegetation mottling, biased to the lower slopes
      const bx = rrnd() * 256, by = 105 + rrnd() * 151, br = 4 + rrnd() * 16;
      rx.fillStyle = ['rgba(84,122,58,0.30)', 'rgba(104,146,70,0.26)', 'rgba(66,102,46,0.28)'][i % 3];
      for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) { rx.beginPath(); rx.arc(bx + ox, by + oy, br, 0, 7); rx.fill(); }
    }
    for (let i = 0; i < 160; i++) { // sparse green flecks higher up, like the reference mountain
      const bx = rrnd() * 256, by = rrnd() * 105, br = 2 + rrnd() * 7;
      rx.fillStyle = 'rgba(96,138,66,0.20)';
      for (const ox of [-256, 0, 256]) { rx.beginPath(); rx.arc(bx + ox, by, br, 0, 7); rx.fill(); }
    }
    rx.strokeStyle = 'rgba(90,104,118,0.16)';
    for (let i = 0; i < 46; i++) { const sx = rrnd() * 256; rx.lineWidth = 1 + rrnd() * 2.5; rx.beginPath(); rx.moveTo(sx, rrnd() * 256); rx.lineTo(sx + (rrnd() - 0.5) * 22, rrnd() * 256 + 60); rx.stroke(); }
    const rockTex = new THREE.CanvasTexture(rc);
    rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping; rockTex.repeat.set(7, 3); rockTex.colorSpace = THREE.SRGBColorSpace;
    const vMat = new THREE.MeshStandardMaterial({ map: rockTex, color: '#7e93a6', roughness: 1 });
    vMat.fog = false; // backdrop trick: volcano is hand-tinted per light preset, not fogged out
    const craterM = flatS('#5d6d7a'); craterM.fog = false;
    const craterInM = flatS('#39434d'); craterInM.fog = false;
    g.userData.volcMats = { rock: vMat, crater: craterM, inner: craterInM };
    const vGeo = new THREE.CylinderGeometry(4.2, 31, 40, 28, 8); // truncated cone: the crater is the flat top
    const vp = vGeo.attributes.position;
    for (let i = 0; i < vp.count; i++) {
      const y = vp.getY(i);
      if (y > -19 && y < 19) { const j = 1 + (rnd() - 0.5) * 0.05; vp.setX(i, vp.getX(i) * j); vp.setZ(i, vp.getZ(i) * j); }
    }
    vGeo.computeVertexNormals();
    const m = new THREE.Mesh(vGeo, vMat); m.position.y = 20; volc.add(m);
    const flank = new THREE.Mesh(new THREE.ConeGeometry(13, 17, 18), vMat);
    flank.position.set(15, 8.5, 7); volc.add(flank);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.55, 8, 22), craterM);
    rim.rotation.x = Math.PI / 2; rim.position.y = 40.1; volc.add(rim);
    const craterIn = new THREE.Mesh(new THREE.CircleGeometry(4.1, 18), craterInM);
    craterIn.rotation.x = -Math.PI / 2; craterIn.position.y = 40.06; volc.add(craterIn);
  }
  const smokeM = new THREE.MeshStandardMaterial({ color: '#a8adb2', transparent: true, opacity: 0.55, roughness: 1 });
  smokeM.fog = false;
  const puffs = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(2.2 + i * 0.55, 12, 10), smokeM);
    s.position.set(-46 + (rnd() - 0.5) * 5, 43 + i * 2.6, -148 + (rnd() - 0.5) * 5);
    g.add(s); puffs.push(s);
  }

  // ---- puffy clouds (tinted per light preset) + green foothills + distant tree line ----
  const cloudM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.96 });
  cloudM.fog = false;
  const clouds = [];
  const cloud = (x, y, z, s) => {
    const c = new THREE.Group(); c.position.set(x, y, z); c.scale.setScalar(s); c.userData.bx = x; g.add(c);
    for (const [cx, cy, cz, r] of [[0, 0, 0, 2.2], [-1.9, -0.3, 0.2, 1.6], [1.9, -0.25, -0.2, 1.7], [0.8, 0.55, 0.3, 1.5], [-0.9, 0.5, -0.3, 1.35]]) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudM); m.position.set(cx, cy, cz); m.scale.y = 0.62; c.add(m);
    }
    clouds.push(c); return c;
  };
  cloud(-18, 27, -95, 1.6); cloud(14, 31, -110, 2.1); cloud(38, 25, -80, 1.3); cloud(-42, 30, -105, 1.9); cloud(2, 34, -125, 2.4); cloud(55, 29, -115, 1.7);
  g.userData.cloudM = cloudM;
  for (const [hx, hz, hr, hc] of [[-28, -54, 26, '#679a45'], [20, -60, 32, '#5c8f3e'], [58, -50, 22, '#679a45'], [-64, -48, 20, '#6f9e4a']]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(hr, 18, 12), texM(P.grass(6), 12, 12, hc));
    hill.position.set(hx, 7 - hr * 0.55, hz); hill.scale.y = 0.55; g.add(hill);
  }
  for (let i = 0; i < 14; i++) {
    const tx3 = -56 + i * 8.5 + (rnd() - 0.5) * 3, tz3 = -36 - rnd() * 8, ts = 1.5 + rnd() * 0.9;
    const t = new THREE.Group(); t.position.set(tx3, 0, tz3); t.scale.setScalar(ts); g.add(t);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 1.2, 8), flatS('#6a4a32')); trunk.position.y = 0.6; t.add(trunk);
    for (const [lx, ly, lz, r] of [[0, 1.85, 0, 0.85], [-0.6, 1.5, 0.1, 0.6], [0.62, 1.55, -0.1, 0.62]]) {
      const sp = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), flatS(i % 2 ? '#55853c' : '#4a7a38')); sp.position.set(lx, ly, lz); t.add(sp);
    }
  }

  function setLight(name) {
    const pr = PRESETS[name] || PRESETS.day;
    scene.background = SKIES[name] || SKIES.day;
    scene.fog = new THREE.Fog(pr.fog, pr.fogN, pr.fogF);
    sun.color.set(pr.sun); sun.intensity = pr.sunI;
    hemi.intensity = pr.hemiI;
    ground.material.color.set(pr.ground);
    curSmoke = pr.smoke;
    const vm = g.userData.volcMats;
    if (vm) {
      const tint = { day: '#8fa5b8', gunung: '#8fa5b8', gloom1: '#76878f', gloom2: '#59636e' }[name] || '#8fa5b8';
      vm.rock.color.set(tint);
    }
    if (g.userData.cloudM) g.userData.cloudM.color.set({ day: '#ffffff', gunung: '#f2f5f7', gloom1: '#a3adb6', gloom2: '#6f7984' }[name] || '#ffffff');
    sun.target.position.set(0, 0, -6);
  }
  function update(t, fx = {}) {
    const smokeAmt = fx.smoke !== undefined ? fx.smoke : curSmoke;
    const burst = fx.burst || 0;
    smokeM.opacity = 0.30 + smokeAmt * 0.45;
    smokeM.color.setHSL(0.08, 0.04, 0.72 - smokeAmt * 0.3);
    puffs.forEach((s, i) => {
      const ph = (t * 0.05 * (1 + burst * 1.6) + i / puffs.length) % 1;
      s.position.y = 42.5 + ph * 9;
      s.position.x = -46 + Math.sin(i * 2.4 + t * 0.22) * (1.5 + ph * 4) + ph * 5;
      const sc = (0.7 + ph * 1.1) * (1 + burst * 0.5);
      s.scale.set(sc, sc * 0.85, sc);
    });
    clouds.forEach((c, i) => { c.position.x = c.userData.bx + Math.sin(t * 0.03 + i * 1.7) * 1.6; });
    const lamp = g.userData.lamp;
    if (lamp) { const on = fx.lampOn ? 1 : 0; lamp.bulb.material.emissiveIntensity = on * 2.2; lamp.lampLight.intensity = on * 9; }
    if (g.userData.wellWater && fx.wellWarm) g.userData.wellWater.material.color.set('#8a6a3c');
  }
  setLight('day');
  return { setLight, update, group: g };
}

// Beach set for Ep.2+ (sea receding cliffhanger): sand strip, grey sea, stranded boats.
// Own scene group; caller positions it. setSea(level) slides the sea plane back/forward.
export function createBeach() {
  const b = new THREE.Group();
  const A = (m, x, y, z) => { m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; b.add(m); return m; };
  // sand + wet mud band
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(90, 26), new THREE.MeshStandardMaterial({ color: '#d9bd8a', roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.01, 8); sand.receiveShadow = true; b.add(sand);
  const mud = new THREE.Mesh(new THREE.PlaneGeometry(90, 34), new THREE.MeshStandardMaterial({ color: '#a08154', roughness: 0.55 }));
  mud.rotation.x = -Math.PI / 2; mud.position.set(0, 0.015, -14); mud.receiveShadow = true; b.add(mud);
  // sea (slides on z via setSea: 0 = normal shoreline, 1 = fully receded)
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(220, 120), new THREE.MeshStandardMaterial({ color: '#7d99a4', roughness: 0.35, metalness: 0.05 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.06, -70); b.add(sea);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(220, 1.6), new THREE.MeshStandardMaterial({ color: '#e9f0ee', roughness: 0.8 }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(0, 0.07, -11.2); b.add(foam);
  // stranded fishing boat: hull, ribs, mast — tilted on the mud
  const boat = (x, z, ry, tilt) => {
    const bt = new THREE.Group(); bt.position.set(x, 0, z); bt.rotation.y = ry; bt.rotation.z = tilt; b.add(bt);
    const B = (m, px, py, pz) => { m.position.set(px, py, pz); m.castShadow = true; m.receiveShadow = true; bt.add(m); return m; };
    const hullM = new THREE.MeshStandardMaterial({ color: '#7a4a2c', roughness: 0.95 });
    const plankM = new THREE.MeshStandardMaterial({ color: '#96683f', roughness: 1 });
    B(new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.44, 0.94), hullM), 0, 0.30, 0); // hull body
    const bow = B(new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.40, 0.80), hullM), 1.85, 0.48, 0); bow.rotation.z = 0.45; // raised bow
    const stern = B(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.38, 0.84), hullM), -1.78, 0.44, 0); stern.rotation.z = -0.38; // raised stern
    B(new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.07, 1.04), plankM), 0, 0.55, 0); // gunwale rim
    B(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.8), plankM), -0.5, 0.60, 0); // bench
    B(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.8), plankM), 0.7, 0.60, 0); // bench
    B(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.9, 8), hullM), 0.2, 1.45, 0); // mast
    const net = B(new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), new THREE.MeshStandardMaterial({ color: '#5f7052', roughness: 1 })), -1.0, 0.68, 0.1);
    net.scale.y = 0.45;
    return bt;
  };
  const boats = [boat(-3.4, -4.2, 0.5, 0.13), boat(2.8, -6.4, -0.9, -0.18), boat(7.6, -3.4, 1.9, 0.08)];
  // puddle glints on the mud + scattered shells/rocks
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.5 + (i % 3) * 0.3, 12), new THREE.MeshStandardMaterial({ color: '#8fa5a8', roughness: 0.15 }));
    p.rotation.x = -Math.PI / 2; p.position.set(-14 + i * 4.3, 0.02, -1.5 - (i % 2) * 2.2); b.add(p);
  }
  function setSea(recede) { // 0..1
    sea.position.z = -70 - recede * 26;
    foam.position.z = -11.2 - recede * 26;
    sea.material.color.set(recede > 0.4 ? '#74888f' : '#7d99a4');
  }
  return { group: b, setSea, boatA: boats[0], boatB: boats[1], boatC: boats[2] };
}
