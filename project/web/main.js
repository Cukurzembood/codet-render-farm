import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

const canvas = document.getElementById('c');
const W = canvas.width, H = canvas.height;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);

// ---------- world: Codet's kampung (ground y=0, street along X, volcano at -Z) ----------
const DECK = 0, HALF = 26, BW = 2.3; // DECK kept as the ground level for the card/blob machinery
const world = new THREE.Group(); scene.add(world);
// sign textures painted on canvas
const signTex = (title, sub, bg = '#7a4a26', fg = '#ffe9b8') => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 256); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(14, 14, 484, 228);
  g.fillStyle = fg; g.textAlign = 'center'; g.font = '900 64px Arial'; g.fillText(title, 256, sub ? 118 : 148);
  if (sub) { g.font = '700 40px Arial'; g.fillText(sub, 256, 190); }
  return P.tex(c);
};
M.volcano = toon({ color: '#6886a0' });
M.street = texM(P.dirt(21), 6, 30, '#a08b6d');
M.signWarung = toon({ map: signTex('WARUNG', 'BU SITI', '#7a4a26', '#ffe9b8') });
M.signWarung2 = toon({ map: signTex('BU SITI', 'NASI • KOPI', '#7a4a26', '#ffe9b8') });
M.signKelontong = toon({ map: signTex('TOKO', 'KELONTONG', '#2e5a50', '#e8f4d8') });
M.flag = new THREE.MeshToonMaterial({ gradientMap: grad, map: (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#d23b2e'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#f4f1ea'; g.fillRect(0, 128, 128, 128); return P.tex(c); })(), side: THREE.DoubleSide });
// ground: grass field + dirt street + yards
const waterU = { t: { value: 0 }, deep: { value: new THREE.Color('#2f6f8f') }, shal: { value: new THREE.Color('#5fa8bf') }, glint: { value: new THREE.Color('#e9f6ff') } };
const ground = add(new THREE.PlaneGeometry(700, 700), M.grass, 0, -0.02, -60, world, { cast: false }); ground.rotation.x = -Math.PI / 2;
const street = add(new THREE.PlaneGeometry(240, 7), M.street, 0, 0.0, 0, world, { cast: false }); street.rotation.x = -Math.PI / 2;
const yard = add(new THREE.PlaneGeometry(60, 16), M.dirt, -2, 0.005, -11, world, { cast: false }); yard.rotation.x = -Math.PI / 2;
// --- warung Bu Siti at origin, facing the street (+Z) ---
const warung = new THREE.Group(); warung.position.set(0, 0, -7.5); world.add(warung);
for (const [px, pz] of [[-3.2, 1.6], [3.2, 1.6], [-3.2, -1.8], [3.2, -1.8]]) add(new THREE.CylinderGeometry(0.09, 0.11, 3.1, 8), M.wood, px, 1.55, pz, warung);
const wroof = add(tbox(8.2, 0.14, 5.6, 2), M.roof, 0, 3.35, -0.1, warung); wroof.rotation.x = 0.10;
add(tbox(7.6, 0.9, 1.1, 2), M.wood, 0, 0.45 + 0.45, 1.15, warung); // counter
add(tbox(7.0, 0.08, 0.9, 2), M.plank, 0, 1.36, 1.15, warung);      // counter top
add(tbox(6.8, 1.5, 0.5, 2), M.plank, 0, 0.75, -1.7, warung);       // back shelf
for (let i = 0; i < 5; i++) add(box(0.5, 0.34, 0.3), i % 2 ? M.red : M.bronze, -2.4 + i * 1.2, 1.15, -1.7, warung, { cast: false }); // jars on shelf
add(new THREE.PlaneGeometry(3.2, 1.45), M.signWarung, 0, 2.78, 2.25, warung, { cast: false });
add(new THREE.CylinderGeometry(0.016, 0.016, 0.55, 6), M.wood, 0.9, 3.02, 1.9, warung, { cast: false }); // lamp cord
const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0x554a38 });
add(new THREE.SphereGeometry(0.085, 10, 8), lampBulbMat, 0.9, 2.72, 1.9, warung, { cast: false });      // lamp bulb
const lampLight = new THREE.PointLight(0xffb36b, 0, 11, 1.8); lampLight.position.set(0.9, 2.66, 1.9); warung.add(lampLight);
add(tbox(5.6, 0.09, 0.5, 2), M.plank, 0, 0.52, 2.6, warung);        // bench seat
for (const bx of [-2.4, 2.4]) add(tbox(0.18, 0.5, 0.4, 1), M.wood, bx, 0.25, 2.6, warung);
add(box(0.55, 0.7, 0.55), M.wood, -1.6, 0.35, 2.5, warung);         // small stool
add(tbox(13, 0.07, 1.1, 2), M.plank, -0.5, 0.035, -3.5, world, { cast: false }); // plank walkway to the warung
// --- the well (sumur) right of the warung ---
const well = new THREE.Group(); well.position.set(5.6, 0, -6.4); world.add(well);
const wellRing = add(new THREE.CylinderGeometry(0.85, 0.95, 0.8, 14, 1, true), M.stone, 0, 0.4, 0, well);
add(new THREE.TorusGeometry(0.88, 0.09, 8, 20), M.stone, 0, 0.82, 0, well).rotation.x = Math.PI / 2;
for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.07, 0.09, 1.9, 8), M.wood, s * 0.95, 0.95, 0, well);
const wroof2 = add(tbox(2.6, 0.1, 1.6, 2), M.roof, 0, 2.0, 0, well); wroof2.rotation.z = 0.06;
add(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 8), M.wood, 0, 1.55, 0, well).rotation.z = Math.PI / 2;
// --- toko kelontong left of the warung ---
const toko = new THREE.Group(); toko.position.set(-10.5, 0, -8.5); toko.rotation.y = 0.12; world.add(toko);
add(tbox(6.5, 3.4, 5, 2), M.plaster2, 0, 1.7, 0, toko);
const troof = add(new THREE.ConeGeometry(5.4, 2.0, 4), M.roof, 0, 4.4, 0, toko); troof.rotation.y = Math.PI / 4; troof.scale.set(1.15, 1, 0.9);
add(new THREE.PlaneGeometry(3.2, 1.6), M.signKelontong, 0, 2.7, 2.53, toko, { cast: false });
add(box(1.6, 2.2, 0.12), M.window, -1.2, 1.1, 2.53, toko, { cast: false });
add(box(1.1, 2.0, 0.12), M.door, 1.6, 1.0, 2.53, toko, { cast: false });
for (let i = 0; i < 3; i++) add(box(0.7, 0.5, 0.7), M.wood, -2.2 + i * 0.9, 0.25, 3.1, toko); // crates
// --- village houses ---
const houses = [];
const house = (x, z, w, d, h, rot, mat = M.plaster) => {
  const g = new THREE.Group(); g.position.set(x, DECK, z); g.rotation.y = rot; world.add(g);
  add(tbox(w, h, d, 2), mat, 0, h / 2, 0, g);
  const rf = add(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.5, 1.8, 4), M.roof, 0, h + 0.9, 0, g); rf.rotation.y = Math.PI / 4; rf.scale.set(w / Math.hypot(w, d) * 1.414, 1, d / Math.hypot(w, d) * 1.414);
  add(box(0.9, 1.8, 0.1), M.door, 0, 0.9, d / 2 + 0.03, g, { cast: false });
  for (const s of [-1, 1]) add(box(0.6, 0.7, 0.1), M.window, s * w * 0.3, h * 0.62, d / 2 + 0.03, g, { cast: false });
  houses.push(g); return g;
};
const rh = P.rng(12);
[[-20, -16], [-30, -10], [14, -17], [24, -12], [34, -19], [-38, -20], [44, -14]].forEach(([x, z], i) =>
  house(x, z, 4.5 + rh() * 2.5, 4 + rh() * 2, 3.0 + rh() * 1.6, rh() * 0.5 - 0.25, i % 2 ? M.plaster : M.plaster2));
[[18, 13], [-24, 14], [30, 16]].forEach(([x, z], i) => house(x, z, 4 + rh() * 2, 4 + rh() * 2, 3 + rh(), Math.PI + rh() * 0.4 - 0.2, i % 2 ? M.plaster2 : M.plaster));
// --- mosque silhouette far left ---
const mosque = new THREE.Group(); mosque.position.set(-58, 0, -34); world.add(mosque);
add(tbox(10, 5, 8, 2), M.plaster, 0, 2.5, 0, mosque);
add(new THREE.SphereGeometry(3.4, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.cypress, 0, 5, 0, mosque);
add(new THREE.CylinderGeometry(0.16, 0.2, 2.6, 8), M.iron, 0, 9.4, 0, mosque);
add(tbox(1.6, 11, 1.6, 2), M.plaster, 7.5, 5.5, 0, mosque);
// --- flag pole with the red-white flag ---
const flagG = new THREE.Group(); flagG.position.set(8.6, 0, -3.4); world.add(flagG);
add(new THREE.CylinderGeometry(0.06, 0.09, 7.2, 8), M.wood, 0, 3.6, 0, flagG);
const flagCloth = add(new THREE.PlaneGeometry(1.9, 1.25, 8, 4), M.flag, 0.98, 6.4, 0, flagG);
flagCloth.userData.cloth = flagCloth.geometry.attributes.position.array.slice();
// --- trees: palms + leafy ---
const palm = (x, z, h = 6) => { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); const t = add(new THREE.CylinderGeometry(0.14, 0.24, h, 7), M.trunk, 0, h / 2, 0, g); t.rotation.z = 0.05; for (let i = 0; i < 6; i++) { const lf = add(new THREE.ConeGeometry(0.5, 3.4, 4), M.pine, 0, h + 0.4, 0, g); lf.rotation.z = 1.15; lf.rotation.y = i / 6 * Math.PI * 2; lf.position.set(Math.cos(i / 6 * Math.PI * 2) * 1.1, h + 0.55, Math.sin(i / 6 * Math.PI * 2) * 1.1); lf.scale.set(1, 1, 0.28); } return g; };
const leafy = (x, z, h = 5) => { const g = new THREE.Group(); g.position.set(x, 0, z); world.add(g); add(new THREE.CylinderGeometry(0.18, 0.3, h * 0.55, 7), M.trunk, 0, h * 0.27, 0, g); const c = add(new THREE.SphereGeometry(1, 12, 10), M.pine, 0, h * 0.55 + 1.2, 0, g); c.scale.set(2.6, 1.9, 2.6); const c2 = add(new THREE.SphereGeometry(1, 10, 8), M.bush, 1.4, h * 0.55 + 0.6, 0.5, g); c2.scale.set(1.6, 1.2, 1.6); return g; };
const rt = P.rng(44);
palm(-6.5, -13); palm(12.5, -12); palm(-16, -4); palm(20, -6); leafy(-13.5, -14); leafy(8, -16); leafy(26, -9); leafy(-28, -6); leafy(38, -12);
for (let i = 0; i < 10; i++) { const x = -60 + rt() * 120, z = -26 - rt() * 30; if (Math.abs(x) < 14 && z > -30) continue; (i % 2 ? palm : leafy)(x, z, 5 + rt() * 2); }
for (let i = 0; i < 14; i++) add(new THREE.SphereGeometry(0.7 + rt() * 0.7, 10, 8), M.bush, -50 + rt() * 100, 0.25, -14 + rt() * 22, world).scale.y = 0.7;
// --- the volcano (Krakatau) far behind the village + foothills ---
const volcano = new THREE.Group(); volcano.position.set(-44, 0, -300); world.add(volcano);
add(new THREE.ConeGeometry(72, 62, 24), M.volcano, 0, 31, 0, volcano, { cast: false });
add(new THREE.ConeGeometry(16, 10, 16), toon({ color: '#6d5a4a' }), 0, 59, 0, volcano, { cast: false });
const VOLCANO_PEAK = [-44, 66, -300];
for (let i = 0; i < 10; i++) { const a = rt() * Math.PI * 2, d = 170 + rt() * 130; if (Math.hypot(Math.cos(a) * d - -26, Math.sin(a) * d - -150) < 95) continue; const h = add(new THREE.SphereGeometry(36 + rt() * 34, 18, 10), i % 2 ? M.hill : M.hillFar, Math.cos(a) * d, -10, Math.sin(a) * d - 40, world, { cast: false }); h.scale.y = 0.5 + rt() * 0.25; }
for (let i = 0; i < 12; i++) { const a = rt() * Math.PI * 2, d = 480 + rt() * 220, hh = 110 + rt() * 110, r_ = 100 + rt() * 60; const g = new THREE.Group(); g.position.set(Math.cos(a) * d, -5, Math.sin(a) * d); world.add(g); add(new THREE.ConeGeometry(r_, hh, 7), M.mount, 0, hh / 2, 0, g, { cast: false }); add(new THREE.ConeGeometry(r_ * 0.3, hh * 0.3, 7), M.snow, 0, hh * 0.86, 0, g, { cast: false }); }

// --- the beach (pantai) east of the village: sand, receded-sea mud, stranded boats (Ep.2+) ---
const MUD = toon({ color: '#8a7355' }), SAND = toon({ color: '#d9c08a' }), SEAM = toon({ color: '#3d7ea6' }), PUDDLE = toon({ color: '#7fa8b8' });
add(new THREE.BoxGeometry(42, 0.06, 66), SAND, 67, 0.01, -6, world, { cast: false });           // sand strip x 46..88
add(new THREE.BoxGeometry(30, 0.06, 66), MUD, 102, 0.02, -6, world, { cast: false });           // wet mud x 87..117 (the sea pulled back)
const seaDisc = add(new THREE.CircleGeometry(480, 40), toon({ color: '#4a90b8' }), 520, -0.01, -6, world, { cast: false }); seaDisc.rotation.x = -Math.PI / 2; // the sea: a disc east of the village, running to the horizon
for (let i = 0; i < 6; i++) add(new THREE.CircleGeometry(1.6 + rt() * 2.2, 14), PUDDLE, 92 + rt() * 20, 0.055, -26 + rt() * 44, world, { cast: false }).rotation.x = -Math.PI / 2;
const boat = (x, z, ry, tilt) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; world.add(g);
  const hull = add(new THREE.BoxGeometry(3.6, 0.8, 1.3), toon({ color: '#a03d2d' }), 0, 0.42, 0, g); hull.rotation.z = tilt;
  const rim = add(new THREE.BoxGeometry(3.9, 0.18, 1.5), M.wood, 0, 0.86, 0, g); rim.rotation.z = tilt;
  const cab = add(new THREE.BoxGeometry(1.1, 0.7, 0.9), toon({ color: '#e8e2d4' }), -0.7, 1.2, 0, g); cab.rotation.z = tilt;
  const mast = add(new THREE.CylinderGeometry(0.05, 0.07, 3.2, 6), M.wood, 0.9, 2.2, 0, g); mast.rotation.z = tilt + 0.1; return g; };
boat(95, -7, 0.5, 0.16); boat(103, 5, -0.9, -0.13);
for (let i = 0; i < 3; i++) add(new THREE.CylinderGeometry(0.09, 0.11, 1.6, 7), M.wood, 87.5, 0.8, -18 + i * 12, world);
palm(49, -17, 6.5); palm(52, 9, 5.5);

// clouds: painted billboards far away (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 0, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      if (n.y < .9) e = max(e, smoothstep(.006, .02, (ds - d)/d));             // depth jump, near side only; flat ground/sea exempt (grazing angles self-ink otherwise)
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  waterU.deep.value.set(L.waterDeep); waterU.shal.value.set(L.waterShal); waterU.glint.value.set(L.glint);
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(S, f) {
  const amp = S.flagAmp ?? 0.05;
  const pa = flagCloth.geometry.attributes.position, base = flagCloth.userData.cloth;
  for (let i = 0; i < pa.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; pa.setZ(i, Math.sin(f * 0.22 + x * 2.6 + y * 1.2) * amp * (x + 0.95)); }
  pa.needsUpdate = true;
  waterU.t.value = f / 30;
  const lampOn = !!S.lampOn;
  lampLight.intensity = lampOn ? 8 : 0;
  lampBulbMat.color.set(lampOn ? 0xffd9a0 : 0x554a38);
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const helmetState = () => {};

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  helmetState(W_.helmet);
  sky.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
