// FULL Episode 1 "Tanda-Tanda" — Krakatau 1883 serial, Codet + kampung on the cartoon-short-kit engine.
// RULE (user, 26 Nov 2026): one phrase = one shot, and the shot SHOWS what the narration says.
// Phrase map @30fps (from work/phrases.json):
//  P1 0-92 kampung biasa | P2 108-231 gunung berasap | P3 251-342 warga cuek | P4 353-414 "lagi batuk"
//  P5 444-633 ngopi + Bu Siti ngeluh sumur | P6 648-737 sumur seumur-umur | P7 761-899 ayam berlarian
//  P8 917-1142 Pak RT gelas berdenting | P9 1171-1267 Codet tertawa | P10 1286-1489 langit berubah
//  P11 1509-1642 burung kabur | P12 1665-1712 + P13 1725-1768 kampung terdiam
//  P14 1800-1856 dentuman | P15 1876-1913 pelan tapi dalam | P16 1935-1995 kopi bergetar | P17 2023-2088 dentuman pertama
import { M, camFromKeys, idle, blinkAt, walk } from './motion.js';

export const FPS = 30, TOTAL = 2095, DECK = 0;
export const SHOTS = [
  { id: 'pagi', a: 0, b: 107, light: 'day' },
  { id: 'gunung', a: 108, b: 250, light: 'gunung' },
  { id: 'cuek', a: 251, b: 352, light: 'day' },
  { id: 'batuk', a: 353, b: 443, light: 'day' },
  { id: 'warung', a: 444, b: 647, light: 'day' },
  { id: 'sumur', a: 648, b: 760, light: 'day' },
  { id: 'ayam', a: 761, b: 916, light: 'day' },
  { id: 'pakrt', a: 917, b: 1170, light: 'day' },
  { id: 'tawa', a: 1171, b: 1285, light: 'day' },
  { id: 'langit', a: 1286, b: 1508, light: 'gloom1' },
  { id: 'burung', a: 1509, b: 1664, light: 'gloom1' },
  { id: 'diam', a: 1665, b: 1799, light: 'gloom2' },
  { id: 'dentuman', a: 1800, b: 2094, light: 'gloom2' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (f, a, b) => clamp((f - a) / (b - a));
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

// ---------- lights ----------
const DAY = { az: 140, el: 46, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.15, sun: '#fff1dc', sunI: 2.5, fog: '#cadcf0', fogNear: 70, fogFar: 400,
  skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.1, waterDeep: '#2c6c8c', waterShal: '#5aaec4', glint: '#effaff', vig: 0.2, shadowExt: 18 };
export const LIGHTS = {
  day: DAY,
  gunung: { ...DAY, fogNear: 120, fogFar: 820, skyTop: '#4a86cc' },
  gloom1: { ...DAY, sky: '#b9b4a4', skyTop: '#6d7b96', skyHor: '#c9bda6', fog: '#b3a894', fogNear: 60, fogFar: 520, sun: '#ffc490', sunI: 1.8, hemi: 0.95, sat: 0.92 },
  gloom2: { ...DAY, sky: '#9d9a90', skyTop: '#525e73', skyHor: '#a49a86', fog: '#97907e', fogNear: 55, fogFar: 460, sun: '#f0b98a', sunI: 1.35, hemi: 0.8, sat: 0.85, vig: 0.3 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- cameras: one entry per shot; a cut at every phrase ----------
const CAMS = {
  pagi: [
    { f: 0, pos: [10.5, 3.2, 16.5], look: [-7.5, 2.2, -15], fov: 43 },
    { f: 107, pos: [9.2, 3.0, 12.5], look: [-4.5, 2.0, -13], fov: 41 },
  ],
  gunung: [
    { f: 108, pos: [-2, 7, -30], look: [-44, 50, -300], fov: 30 },
    { f: 250, pos: [-5, 8.5, -40], look: [-44, 55, -300], fov: 29 },
  ],
  cuek: [
    { f: 251, pos: [8.5, 1.5, 5.5], look: [-9, 1.1, -3], fov: 40 },
    { f: 352, pos: [7.6, 1.5, 5.2], look: [-8, 1.1, -3.2], fov: 40 },
  ],
  batuk: [
    { f: 353, pos: [4.0, 1.95, 4.2], look: [0.1, 1.5, -5.4], fov: 35 },
    { f: 443, pos: [3.8, 1.9, 3.8], look: [0.1, 1.5, -5.4], fov: 35 },
  ],
  warung: [
    { f: 444, pos: [4.6, 2.0, 5.2], look: [-0.4, 1.4, -5.8], fov: 36 },
    { f: 647, pos: [4.1, 1.95, 4.4], look: [-0.4, 1.4, -5.8], fov: 36 },
  ],
  sumur: [
    { f: 648, pos: [9.8, 1.7, 0.8], look: [5.0, 0.9, -6.2], fov: 38 },
    { f: 760, pos: [9.2, 1.65, 0.2], look: [5.0, 0.9, -6.2], fov: 38 },
  ],
  ayam: [
    { f: 761, pos: [7.5, 1.1, 3.5], look: [3.6, 0.4, -2.5], fov: 40 },
    { f: 916, pos: [7.0, 1.05, 3.1], look: [3.6, 0.4, -2.5], fov: 40 },
  ],
  pakrt: [
    { f: 917, pos: [5.2, 1.9, 2.8], look: [1.6, 1.3, -4.4], fov: 36 },
    { f: 1170, pos: [4.7, 1.85, 2.2], look: [1.6, 1.3, -4.4], fov: 36 },
  ],
  tawa: [
    { f: 1171, pos: [2.3, 1.6, 0.7], look: [0.9, 1.45, -4.6], fov: 33 },
    { f: 1285, pos: [2.15, 1.6, 0.4], look: [0.9, 1.45, -4.6], fov: 33 },
  ],
  langit: [
    { f: 1286, pos: [13, 4.2, 15], look: [-24, 14, -90], fov: 40 },
    { f: 1508, pos: [12, 4.6, 13], look: [-26, 16, -95], fov: 39 },
  ],
  burung: [
    { f: 1509, pos: [0, 6, -20], look: [-40, 45, -300], fov: 38 },
    { f: 1664, pos: [-2, 6.5, -22], look: [-42, 47, -300], fov: 38 },
  ],
  diam: [
    { f: 1665, pos: [10.5, 3.2, 16.5], look: [-7.5, 2.2, -15], fov: 43 },
    { f: 1799, pos: [10.5, 3.2, 16.5], look: [-7.5, 2.2, -15], fov: 43 },
  ],
  dentuman: [
    { f: 1800, pos: [3.4, 1.8, 3.4], look: [0.9, 1.35, -4.6], fov: 34 },
    { f: 2094, pos: [2.55, 1.7, 1.6], look: [0.9, 1.4, -4.6], fov: 33 },
  ],
};
export const camAt = (f) => {
  const S = shotAt(f);
  const c = camFromKeys(CAMS[S.id], f, { creep: S.id === 'diam' ? 0 : 0.0012, kicks: [] });
  if (f >= 1800 && f < 1905) { // the boom: a deep shudder that dies away, not a jolt
    const d = f - 1800, amp = 0.055 * Math.exp(-d / 30);
    c.pos = [c.pos[0] + amp * Math.sin(f * 1.9), c.pos[1] + amp * 0.7 * Math.sin(f * 2.6 + 1), c.pos[2]];
    c.look = [c.look[0] + amp * 1.6 * Math.sin(f * 2.3 + 0.5), c.look[1] + amp * Math.sin(f * 1.7), c.look[2]];
  }
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const CODET = [0.9, 0, -4.6], BUSITI = [-1.9, 0, -6.8], SUMUR_B = [4.4, 0, -5.4];
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  const T = { pagi: [CODET, 5], gunung: [[-44, 55, -300], 2], cuek: [[-4, 1, -1.6], 5], batuk: [CODET, 6],
    warung: [CODET, 6], sumur: [SUMUR_B, 5], ayam: [[3.4, 0.3, -2.6], 4.5], pakrt: [[2.6, 1.2, -4.2], 6],
    tawa: [CODET, 7], langit: [[-30, 20, -120], 4], burung: [[-40, 60, -180], 3], diam: [CODET, 6], dentuman: [CODET, 7] }[S.id];
  return { focus: dist(C.pos, [T[0][0], T[0][1] + 1.2, T[0][2]]), cinf: T[1] };
};

// ---------- world state ----------
export const worldAt = (f) => ({ flagAmp: shotAt(f).id === 'diam' ? 0.004 : 0.05, helmet: null });

// ---------- actors ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.codetFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const CH = (T, variant, o, pos, s = 1.4) => ({ key: 'ch' + variant + JSON.stringify(o), draw: (p) => T.chickenDraw(p, variant, o), x: pos[0], y: pos[1], z: pos[2], s, blob: true, shadow: true });
const codetAt = (f, o = {}) => {
  const id = idle(Math.round(f / 2) * 2, 3);
  return R(T0, 'codet', { seed: 3, expr: 'songong', L: 'cup', R: 'cup', blink: blinkAt(f, 3), look: 0,
    bob: q(id.bob, 3), tilt: q(id.tilt, 1), headTilt: q(id.headTilt, 1), ...o }, CODET, {});
};
let T0 = null; // set inside actorsAt (the helper above needs the toon namespace)

export const actorsAt = (f, T) => {
  T0 = T;
  const S = shotAt(f).id, out = [];
  const f2 = Math.round(f / 2) * 2;
  const idB = idle(f2, 8), idW = idle(f2, 14);
  const buSitiWarung = (expr, headExtra = 0) => R(T, 'busiti', { seed: 8, expr, L: 'hang', R: 'bucket', blink: blinkAt(f, 8), look: -0.2,
    bob: q(idB.bob, 3), tilt: q(idB.tilt, 1), headTilt: q(idB.headTilt + headExtra, 1) }, BUSITI, {});
  const wargaB = () => R(T, 'wargaB', { seed: 14, expr: 'neutral', L: 'belly', R: 'hang', blink: blinkAt(f, 14),
    look: q(0.5 * Math.max(0, Math.sin(f * 0.008)), 2), bob: q(idW.bob, 3), tilt: q(idW.tilt, 1), headTilt: q(idW.headTilt, 1) }, [-8.2, 0, -4.0], {});

  switch (S) {
    case 'pagi':
      out.push(codetAt(f)); out.push(buSitiWarung('neutral')); out.push(wargaB());
      break;
    case 'gunung':
      break; // the mountain speaks alone
    case 'cuek': {
      out.push(codetAt(f)); out.push(wargaB());
      const w = walk(f, 251, 1.7, 0.8);
      out.push(R(T, 'wargaA', { seed: 11, expr: 'neutral', step: q(w.phase, 2), blink: blinkAt(f, 11), look: 0.2 }, [-10 + w.dist, 0, -1.6], {}));
      break;
    }
    case 'batuk':
      out.push(codetAt(f, { expr: 'grin', headTilt: q(4.5 * Math.sin((f - 353) * 0.11), 1) }));
      out.push(buSitiWarung('worry', 5 * Math.sin((f - 353) * 0.09)));
      break;
    case 'warung':
      out.push(codetAt(f, { expr: 'neutral', look: -0.25 }));
      out.push(buSitiWarung('talk', 2 * Math.sin((f - 444) * 0.06)));
      break;
    case 'sumur':
      out.push(codetAt(f, { expr: 'neutral' }));
      out.push(R(T, 'busiti', { seed: 8, expr: 'worry', L: 'hang', R: 'bucket', blink: blinkAt(f, 8), look: 0.3,
        bob: q(idB.bob, 3), tilt: q(idB.tilt, 1), headTilt: q(4 * Math.sin((f - 648) * 0.05), 1) }, SUMUR_B, {}));
      break;
    case 'ayam': {
      out.push(codetAt(f, { expr: 'neutral' })); out.push(buSitiWarung('worry'));
      const scat = ramp(f, 806, 866); // narration hits "berlarian": the yard erupts, but they stay in the yard
      const runPh = q((f - 800) / 30 * 2.4, 2);
      out.push(CH(T, 'putih', { step: q(scat > 0 ? runPh : (f % 46) / 46, 2), flap: q(scat * (0.6 + 0.4 * Math.sin(f * 0.9)), 2), run: scat, peck: scat > 0 ? 0 : q(Math.max(0, Math.sin(f * 0.11)), 2) },
        [2.4 + 3.2 * smooth(scat), 0, -2.4 + 0.7 * smooth(scat)]));
      out.push(CH(T, 'coklat', { step: q(scat > 0 ? runPh + 0.4 : (f % 52) / 52, 2), flap: q(scat * 0.8, 2), run: scat, peck: scat > 0 ? 0 : q(Math.max(0, Math.sin(f * 0.09 + 2)), 2) },
        [3.6 + 2.6 * smooth(scat), 0, -3.2 + 1.1 * smooth(scat)]));
      out.push(CH(T, 'putih', { step: q((f % 58) / 58, 2), flap: 0, run: 0, peck: q(Math.max(0, Math.sin(f * 0.13 + 4)), 2) }, [1.8, 0, -1.8]));
      out.push(CH(T, 'coklat', { step: q(scat > 0 ? runPh + 0.9 : (f % 49) / 49, 2), flap: q(scat * 0.7, 2), run: scat, peck: 0 },
        [4.8 - 3.0 * smooth(scat), 0, -2.0 - 0.5 * smooth(scat)]));
      break;
    }
    case 'pakrt': {
      const talkOn = (f % 52) < 34;
      out.push(R(T, 'pakrt', { seed: 6, expr: talkOn ? 'talk' : 'neutral', L: 'hang', R: 'point', blink: blinkAt(f, 6), look: -0.3,
        bob: q(idle(f2, 6).bob, 3), tilt: q(idle(f2, 6).tilt, 1), headTilt: q(idle(f2, 6).headTilt + (talkOn ? 2 * Math.sin(f * 0.14) : 0), 1) }, [2.7, 0, -4.1], {}));
      out.push(codetAt(f, { expr: 'neutral', look: 0.3 }));
      out.push(buSitiWarung('worry'));
      break;
    }
    case 'tawa':
      out.push(codetAt(f, { expr: 'laugh', bob: q(0.012 * Math.abs(Math.sin((f - 1171) * 0.32)), 3), headTilt: q(-4 + 2.5 * Math.sin((f - 1171) * 0.32), 1) }));
      out.push(buSitiWarung('neutral'));
      break;
    case 'langit':
      out.push(codetAt(f, { expr: 'nervous', headTilt: -9, blink: f > 1330 && f < 1334 ? 1 : blinkAt(f, 3) }));
      out.push(buSitiWarung('worry'));
      break;
    case 'burung':
      break; // sky only: flock + volcano (fx)
    case 'diam':
      // the whole kampung holds its breath: no idle, no blink, walker stopped mid-stride
      out.push(R(T, 'codet', { seed: 3, expr: 'nervous', L: 'cup', R: 'cup', blink: 0, look: 0.2, bob: 0, tilt: 0, headTilt: -6 }, CODET, {}));
      out.push(R(T, 'busiti', { seed: 8, expr: 'worry', L: 'hang', R: 'bucket', blink: 0, look: 0, bob: 0, tilt: 0, headTilt: 0 }, BUSITI, {}));
      out.push(R(T, 'wargaB', { seed: 14, expr: 'nervous', L: 'belly', R: 'hang', blink: 0, look: 0.4, bob: 0, tilt: 0, headTilt: -4 }, [-8.2, 0, -4.0], {}));
      out.push(R(T, 'wargaA', { seed: 11, expr: 'nervous', step: 0.35, blink: 0, look: 0.4 }, [-3.4, 0, -1.6], {}));
      break;
    case 'dentuman': {
      const boom = f >= 1800;
      const rip = f >= 1935 && f <= 2010 ? q(0.55 + 0.45 * Math.sin((f - 1935) * 0.55), 2) : f > 1830 && f < 1905 ? q(0.4 * Math.exp(-(f - 1830) / 22), 2) : 0;
      out.push(codetAt(f, { expr: f >= 2023 ? 'nervous' : 'shock', ripple: rip, blink: f >= 1802 && f < 1806 ? 0 : blinkAt(f, 3), headTilt: -3 }));
      out.push(buSitiWarung(f >= 1800 ? 'worry' : 'worry'));
      break;
    }
  }
  return out;
};

// ---------- 2D effects: smoke over the volcano; the flock in the burung shot ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const PEAK = [-44, 66, -300];
export const fxAt = (f, T) => {
  const S = shotAt(f).id, out = [];
  const big = S === 'gunung', dark = S === 'gunung' ? 0.38 : (S === 'langit' || S === 'burung' || S === 'diam' || S === 'dentuman') ? 0.3 : 0.12;
  const sc = big ? 34 : 22, n = big ? 4 : 3;
  const burst = S === 'dentuman' ? ramp(f, 1800, 1980) : 0;
  for (let i = 0; i < n; i++) {
    const t = q(((f / 30) * 0.055 + i / n) % 1, 2);
    out.push(FX('smoke' + i + '_' + t, (p) => { p.g.translate(-40, 260); T.fxSmoke(p, t, '#d5d9dc', q(dark + burst * 0.15, 2)); },
      [PEAK[0] + i * 4 - 4, PEAK[1] + 2, PEAK[2]], q(sc * (1 + burst * 0.35), 1)));
  }
  if (S === 'burung') {
    const k = ramp(f, 1509, 1664);
    const fx = lerp(70, -95, smooth(k)), flap = q((f / 30) * 9, 1);
    out.push(FX('flock_' + flap, (p) => T.flockDraw(p, 'flock', { flap, n: 8, seed: 4 }), [fx, 13, -160], 20, { order: 4 }));
    const fx2 = lerp(95, -60, smooth(ramp(f, 1540, 1664)));
    out.push(FX('flock2_' + flap, (p) => T.flockDraw(p, 'flock', { flap: flap + 2, n: 6, seed: 9 }), [fx2, 19, -175], 16, { order: 4 }));
  }
  return out;
};
