// Episode 2 "Langit Gelap di Siang Bolong" — Krakatau 1883 serial, Codet + kampung on the cartoon-short-kit engine.
// DRAFT built 26 Nov 2026 night, ahead of the final VO, so tomorrow only numbers move:
// - RULE (user, 26 Nov 2026): one phrase = one shot, and the shot SHOWS what the narration says.
// - Ep.2 standards: varied camera / SFX / expressions, in-scene dialogue WITH lipsync (c2 Pak RT, c5 Bu Siti, c7 Codet),
//   weather + time-of-day matched beat by beat, warung lamp ON from the c6 click, Ep.3 teaser tail (last shot, no VO).
// TIMING MODEL: boundaries derive from RAW (trimmed chunk seconds), GAP and ATEMPO below.
//   c1-c7 RAW are MEASURED. c8-c10 RAW are ESTIMATES (from the v1 long take n4) — after timing.py
//   runs on the assembled voice.wav, replace RAW[7..9] (and ATEMPO if it changes) with the real
//   values and re-check every window. LIP envelopes were measured from the trimmed chunk wavs
//   at ATEMPO 0.90 (RMS per playback frame, quantized 0-3, run-length encoded).
import { M, camFromKeys, idle, blinkAt, walk } from './motion.js';

export const FPS = 30, DECK = 0;

// ---------- timing ----------
const RAW = [8.67, 5.85, 9.74, 4.18, 5.37, 6.82, 5.65, 13.01, 5.29, 8.71, 7.27, 3.45, 11.60, 13.52]; // c1 c2 c3 c4 c5 c6 c7 c11 c12 c8 c13 c14 c9 c10 — ALL MEASURED (27 Nov, beats incl.)
const GAP = 0.15, ATEMPO = 0.90;
const F30 = (s) => Math.round(s * FPS);
const cStart = [], cEnd = [];
{ let acc = 0; for (let k = 0; k < RAW.length; k++) { const st = (acc + GAP * k) / ATEMPO; cStart.push(F30(st)); cEnd.push(F30(st + RAW[k] / ATEMPO)); acc += RAW[k]; } }
const VO_END = cEnd[RAW.length - 1];
const ph = (ci, f0, f1) => [Math.round(cStart[ci] + f0 * (cEnd[ci] - cStart[ci])), Math.round(cStart[ci] + f1 * (cEnd[ci] - cStart[ci])) - 1];
const W = {
  p1: ph(0, 0, 6 / 19), p2: ph(0, 6 / 19, 1),          // c1: dentuman lagi | matahari tidak bangun
  p3: ph(1, 0, 1),                                     // c2: PAK RT dialogue (lipsync)
  p4: ph(2, 0, 10 / 19), p5: ph(2, 10 / 19, 1),        // c3: asap hitam | abu mulai turun
  p6: ph(3, 0, 1),                                     // c4: semua berubah abu-abu
  p7: ph(4, 0, 1),                                     // c5: BU SITI dialogue (lipsync)
  p8: ph(5, 0, 8 / 15), p9: ph(5, 8 / 15, 1),          // c6: lampu warung dinyalakan | gelap kayak malam
  p10: ph(6, 0, 1),                                    // c7: CODET dialogue (lipsync)
  q1: ph(7, 0, 5 / 19), q2: ph(7, 5 / 19, 12 / 19), q3: ph(7, 12 / 19, 1), // c11: warga di sumur | menimba | air hangat, bau belerang
  q4: ph(8, 0, 1),                                     // c12: BU SITI dialogue at the well (lipsync)
  p11: ph(9, 0, 4 / 15), p12: ph(9, 4 / 15, 7 / 15), p13: ph(9, 7 / 15, 1), // c8: hening | ayam diam | sumur hangat
  q5: ph(10, 0, 5 / 15), q6: ph(10, 5 / 15, 10 / 15), q7: ph(10, 10 / 15, 1), // c13: PAK RT dialogue (lipsync, 3 shots share one envelope)
  q8: ph(11, 0, 0.55), q9: ph(11, 0.55, 1),              // c14: close-up tangan Pak RT gemetar | muka Codet menyadari
  p14: ph(12, 0, 9 / 16), p15: ph(12, 9 / 16, 1),      // c9: suara datang lagi | gelas berdenting, tanah bergetar
  p16: ph(13, 0, 4 / 31), p17: ph(13, 4 / 31, 23 / 31), p18: ph(13, 23 / 31, 1), // c10: lari | laut surut | tidak ada yang menyuruh
  teaser: [VO_END + 1, VO_END + 90],                   // teaser card shot (text added in post)
};
export const TOTAL = VO_END + 91;
const LAMP_ON = Math.round(W.p8[0] + 0.68 * (W.p8[1] - W.p8[0])); // "menyalakan lampu" lands ~68% into p8

const SHOTDEF = [
  ['p1', 'pagiAbu'], ['p2', 'pagiAbu'], ['p3', 'pagiAbu'],
  ['p4', 'gloom1'], ['p5', 'gloom1'], ['p6', 'gloom1'],
  ['p7', 'gloom2'], ['p8', 'gloom2'], ['p9', 'gloom2'], ['p10', 'gloom2'],
  ['q1', 'gloom2'], ['q2', 'gloom2'], ['q3', 'gloom2'], ['q4', 'gloom2'],
  ['p11', 'gloom2'], ['p12', 'gloom2'], ['p13', 'gloom2'],
  ['q5', 'gloom2'], ['q6', 'gloom2'], ['q7', 'gloom2'], ['q8', 'gloom2'], ['q9', 'gloom2'],
  ['p14', 'gloom2'], ['p15', 'gloom2'],
  ['p16', 'gloomSea'], ['p17', 'gloomSea'], ['p18', 'gloomSea'], ['teaser', 'gloomSea'],
];
export const SHOTS = SHOTDEF.map(([id, light], i) => ({
  id, light, a: W[id][0], b: i + 1 < SHOTDEF.length ? W[SHOTDEF[i + 1][0]][0] - 1 : TOTAL - 1,
}));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (f, a, b) => clamp((f - a) / (b - a));
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

// ---------- lights ----------
const DAY = { az: 140, el: 46, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.15, sun: '#fff1dc', sunI: 2.5, fog: '#cadcf0', fogNear: 70, fogFar: 400,
  skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.1, waterDeep: '#2c6c8c', waterShal: '#5aaec4', glint: '#effaff', vig: 0.2, shadowExt: 18 };
const GLOOM1 = { ...DAY, sky: '#b9b4a4', skyTop: '#6d7b96', skyHor: '#c9bda6', fog: '#b3a894', fogNear: 60, fogFar: 520, sun: '#ffc490', sunI: 1.8, hemi: 0.95, sat: 0.92 };
const GLOOM2 = { ...DAY, sky: '#9d9a90', skyTop: '#525e73', skyHor: '#a49a86', fog: '#97907e', fogNear: 55, fogFar: 460, sun: '#f0b98a', sunI: 1.35, hemi: 0.8, sat: 0.85, vig: 0.3 };
export const LIGHTS = {
  day: DAY,
  pagiAbu: { ...DAY, sky: '#c9c2ae', skyTop: '#7d8aa0', skyHor: '#d3c9ae', fog: '#c4bda6', fogNear: 58, fogFar: 380, sun: '#ffe9c4', sunI: 1.9, hemi: 1.0, sat: 0.98 },
  gloom1: GLOOM1,
  gloom2: GLOOM2,
  gloomSea: { ...GLOOM2, waterDeep: '#3d4a52', waterShal: '#5d6d72', glint: '#cfd4cd', fogFar: 560 },
};
export const lightFor = (S, f) => ({ ...LIGHTS[S.light] });

// ---------- lipsync envelopes (measured from the trimmed dialogue chunks) ----------
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

// ---------- cameras: one entry per shot; a cut at every phrase ----------
const K = (id, p0, l0, f0, p1, l1, f1) => [{ f: W[id][0], pos: p0, look: l0, fov: f0 }, { f: W[id][1], pos: p1, look: l1, fov: f1 }];
const CAMS = {
  p1: K('p1', [10.5, 3.2, 16.5], [-7.5, 2.2, -15], 43, [9.4, 3.0, 13.5], [-5.5, 2.0, -13.5], 41),
  p2: K('p2', [0, 6, -20], [-40, 48, -300], 36, [-2, 6.5, -22], [-42, 50, -300], 35),
  p3: K('p3', [3.4, 2.0, -1.2], [-16, 10, -80], 40, [3.35, 2.05, -1.4], [-17, 11, -82], 39),
  p4: K('p4', [-2, 7, -30], [-44, 50, -300], 30, [-5, 8.5, -40], [-44, 55, -300], 29),
  p5: K('p5', [2.2, 0.7, 1.8], [0.2, 1.6, -5.2], 42, [2.0, 0.75, 1.4], [0.2, 1.6, -5.2], 41),
  p6: K('p6', [7.5, 3.4, 6.5], [-3, 2.2, -8], 40, [4.5, 2.2, 4.5], [0.6, 1.3, -5.2], 38),
  p7: K('p7', [1.8, 1.9, 0.5], [-1.6, 1.4, -6.4], 37, [1.6, 1.85, 0.1], [-1.6, 1.4, -6.4], 36),
  p8: K('p8', [2.35, 1.85, 2.3], [-0.3, 1.35, -6.2], 38, [2.3, 1.85, 1.9], [-0.3, 1.35, -6.2], 37),
  p9: K('p9', [11.5, 3.6, 17.5], [-7.5, 2.0, -14], 44, [11.3, 3.55, 17.2], [-7.5, 2.0, -14], 44),
  p10: K('p10', [3.1, 1.9, 1.8], [-0.2, 1.35, -5.8], 38, [3.0, 1.9, 1.5], [-0.2, 1.35, -5.8], 37),
  p11: K('p11', [10.5, 3.2, 16.5], [-7.5, 2.2, -15], 43, [10.5, 3.2, 16.5], [-7.5, 2.2, -15], 43),
  p12: K('p12', [5.4, 0.8, 0.6], [3.4, 0.35, -2.6], 40, [5.2, 0.8, 0.3], [3.4, 0.35, -2.6], 40),
  p13: K('p13', [9.8, 1.7, 0.8], [5.0, 0.9, -6.2], 38, [9.3, 1.65, 0.3], [5.0, 0.9, -6.2], 38),
  p14: K('p14', [10.5, 3.2, 16.5], [-20, 10, -80], 42, [9.0, 3.4, 13.0], [-30, 16, -120], 40),
  p15: K('p15', [2.3, 1.7, 0.9], [0.9, 1.4, -4.6], 34, [2.3, 1.7, 0.9], [0.9, 1.4, -4.6], 34),
  q1: K('q1', [9.5, 3.0, 3.5], [4.4, 0.9, -5.4], 42, [9.0, 2.9, 3.0], [4.4, 0.9, -5.4], 41),
  q2: K('q2', [6.4, 1.5, -1.6], [4.4, 1.0, -5.4], 38, [6.2, 1.5, -1.9], [4.4, 1.0, -5.4], 37),
  q3: K('q3', [7.4, 1.6, -1.8], [4.1, 0.9, -5.2], 40, [7.2, 1.55, -2.1], [4.1, 0.9, -5.2], 40),
  q4: K('q4', [8.4, 2.3, 1.4], [3.9, 1.25, -4.8], 42, [8.2, 2.25, 1.1], [3.9, 1.25, -4.8], 41),
  q5: K('q5', [6.5, 1.8, -0.9], [3.2, 1.3, -4.2], 38, [6.3, 1.8, -1.2], [3.2, 1.3, -4.2], 37),
  q6: K('q6', [8.6, 2.4, 1.6], [3.0, 1.2, -4.6], 40, [8.4, 2.35, 1.3], [3.0, 1.2, -4.6], 40),
  q7: K('q7', [9.6, 3.0, 6.0], [2.0, 1.2, -5.0], 42, [9.4, 2.9, 5.7], [2.0, 1.2, -5.0], 42),
  q8: K('q8', [4.8, 1.6, -1.4], [2.7, 1.1, -4.1], 40, [4.7, 1.55, -1.6], [2.7, 1.1, -4.1], 40),
  q9: K('q9', [6.7, 1.7, -0.4], [5.0, 1.25, -3.0], 38, [6.6, 1.65, -0.7], [5.0, 1.25, -3.0], 38),
  p17: K('p17', [56, 9.5, 22], [100, 0, -6], 44, [54, 8.5, 20], [101, 0, -6], 43),
  p18: K('p18', [76.5, 1.8, 7.5], [80.5, 1.3, 1.0], 36, [76.2, 1.75, 7.0], [80.5, 1.3, 1.0], 35),
  teaser: K('teaser', [54, 8.5, 20], [101, 0, -6], 43, [53.5, 8.3, 19.5], [101, 0, -6], 43),
};
const codetRunX = (f) => lerp(6, 47, smooth(ramp(f, W.p16[0], W.p16[1])));
export const camAt = (f) => {
  const S = shotAt(f);
  if (S.id === 'p16') { // tracking: the camera runs alongside Codet toward the beach
    const x = codetRunX(f);
    return { pos: [x + 8.5, 2.6, 10.5], look: [x, 1.1, 0.8], fov: 40 };
  }
  const c = camFromKeys(CAMS[S.id], f, { creep: S.id === 'p11' || S.id === 'p15' ? 0 : 0.0012, kicks: [] });
  if (S.id === 'p15' && f >= W.p15[0] + 8) { // the big one: a deep shudder, stronger than Ep.1
    const d = f - W.p15[0] - 8, amp = 0.085 * Math.exp(-d / 26);
    c.pos = [c.pos[0] + amp * Math.sin(f * 1.9), c.pos[1] + amp * 0.7 * Math.sin(f * 2.6 + 1), c.pos[2]];
    c.look = [c.look[0] + amp * 1.6 * Math.sin(f * 2.3 + 0.5), c.look[1] + amp * Math.sin(f * 1.7), c.look[2]];
  }
  if (S.id === 'p14' && f > W.p14[1] - 0.2 * (W.p14[1] - W.p14[0])) { // a tremor heralds it
    const amp = 0.018;
    c.pos = [c.pos[0] + amp * Math.sin(f * 2.1), c.pos[1] + amp * 0.6 * Math.sin(f * 2.9), c.pos[2]];
  }
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const CODET = [0.9, 0, -4.6], BUSITI = [-1.9, 0, -6.8], SUMUR_B = [4.4, 0, -5.4], PAKRT = [2.7, 0, -4.1];
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  const T = { p1: [CODET, 5], p2: [[-44, 55, -300], 2], p3: [[2.7, 1.2, -4.1], 6], p4: [[-44, 55, -300], 2],
    p5: [CODET, 6], p6: [CODET, 5], p7: [BUSITI, 6], p8: [[-0.6, 1.5, -6.2], 6], p9: [CODET, 5], p10: [CODET, 6],
    p11: [CODET, 5], p12: [[3.4, 0.3, -2.6], 4.5], p13: [SUMUR_B, 5], p14: [[-30, 20, -120], 4], p15: [CODET, 7],
    q1: [SUMUR_B, 5], q2: [[4.4, 0.9, -5.4], 4.5], q3: [[4.4, 0.7, -5.4], 4], q4: [[4.6, 1.3, -5.2], 6],
    q5: [[3.2, 1.3, -4.2], 6], q6: [[3.0, 1.2, -4.6], 5], q7: [[2.0, 1.2, -5.0], 5], q8: [[2.7, 1.0, -4.1], 4], q9: [[5.0, 1.2, -3.0], 5],
    p16: [[codetRunX(f), 1.2, 1.5], 5], p17: [[95, 1, -7], 4], p18: [[80, 1.2, 2], 6], teaser: [[95, 1, -7], 4] }[S.id];
  return { focus: dist(C.pos, [T[0][0], T[0][1] + 1.2, T[0][2]]), cinf: T[1] };
};

// ---------- world state ----------
export const worldAt = (f) => {
  const id = shotAt(f).id;
  return { flagAmp: id === 'p11' ? 0.004 : id === 'p12' ? 0.01 : 0.03, lampOn: f >= LAMP_ON, helmet: null };
};

// ---------- actors ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.codetFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const CH = (T, variant, o, pos, s = 1.4) => ({ key: 'ch' + variant + JSON.stringify(o), draw: (p) => T.chickenDraw(p, variant, o), x: pos[0], y: pos[1], z: pos[2], s, blob: true, shadow: true });
let T0 = null;
const codetAt = (f, o = {}, pos = CODET) => {
  const id = idle(Math.round(f / 2) * 2, 3);
  return R(T0, 'codet', { seed: 3, expr: 'nervous', L: 'cup', R: 'cup', blink: blinkAt(f, 3), look: 0,
    bob: q(id.bob, 3), tilt: q(id.tilt, 1), headTilt: q(id.headTilt, 1), ...o }, pos, {});
};

export const actorsAt = (f, T) => {
  T0 = T;
  const S = shotAt(f).id, out = [];
  const f2 = Math.round(f / 2) * 2;
  const idB = idle(f2, 8), idW = idle(f2, 14);
  const buSiti = (expr, o = {}, pos = BUSITI) => R(T, 'busiti', { seed: 8, expr, L: 'hang', R: 'bucket', blink: blinkAt(f, 8), look: -0.2,
    bob: q(idB.bob, 3), tilt: q(idB.tilt, 1), headTilt: q(idB.headTilt, 1), ...o }, pos, {});
  const wargaB = (expr = 'nervous', o = {}) => R(T, 'wargaB', { seed: 14, expr, L: 'belly', R: 'hang', blink: blinkAt(f, 14),
    look: 0.3, bob: q(idW.bob, 3), tilt: q(idW.tilt, 1), headTilt: q(idW.headTilt, 1), ...o }, [-8.2, 0, -4.0], {});
  const frozen = (who, seed, expr, o, pos) => R(T, who, { seed, expr, blink: 0, look: 0.3, bob: 0, tilt: 0, headTilt: -4, ...o }, pos, {});

  switch (S) {
    case 'p1': // payoff wide: the morning after — everyone up, but the light is wrong
      out.push(codetAt(f, { expr: 'worry' })); out.push(buSiti('worry')); out.push(wargaB('worry'));
      break;
    case 'p2': // sky and the smoking peak only
      break;
    case 'p3': // PAK RT dialogue, over his shoulder, looking up (lipsync c2)
      out.push(R(T, 'pakrt', { seed: 6, expr: 'worry', lip: lipAt('p3', f), L: 'hang', R: 'hang', blink: blinkAt(f, 6), look: -0.2,
        bob: q(idle(f2, 6).bob, 3), tilt: q(idle(f2, 6).tilt, 1), headTilt: q(-8 + 1.5 * Math.sin(f * 0.1), 1) }, PAKRT, {}));
      out.push(codetAt(f, { expr: 'nervous', look: 0.35, headTilt: -6 }));
      break;
    case 'p4': // the mountain alone, smoking black
      break;
    case 'p5': // low angle: ash begins to fall past the camera, Codet under it
      out.push(codetAt(f, { expr: 'nervous', L: 'hang', R: 'hang', look: 0.2, headTilt: -10 }));
      out.push(buSiti('worry'));
      break;
    case 'p6': // everything turns grey: roofs, banana leaves, Codet's coffee
      out.push(codetAt(f, { expr: 'bingung', ripple: 0 }));
      out.push(buSiti('worry'));
      break;
    case 'p7': { // BU SITI dialogue at the clothesline (lipsync c5); Codet hurries in to help
      out.push(buSiti('kesal', { lip: lipAt('p7', f), L: 'hang', R: 'hang', headTilt: q(3.5 * Math.sin(f * 0.16), 1) }));
      const wIn = ramp(f, W.p7[0] + 0.55 * (W.p7[1] - W.p7[0]), W.p7[1]);
      const wx = lerp(3.6, 2.2, smooth(wIn));
      out.push(R(T, 'codet', { seed: 3, expr: 'nervous', step: q(wIn > 0 && wIn < 1 ? (f / 30) * 2.6 : 0, 2), L: 'hang', R: 'hang',
        blink: blinkAt(f, 3), look: -0.3, bob: q(idle(f2, 3).bob, 3), tilt: 0, headTilt: 0 }, [wx, 0, -3.2], {}));
      break;
    }
    case 'p8': // close-up: Bu Siti reaches up and clicks the warung lamp on at 10 AM
      out.push(buSiti(f >= LAMP_ON ? 'worry' : 'neutral', { R: f >= LAMP_ON ? 'bucket' : 'point', look: 0.1 }));
      out.push(codetAt(f, { expr: 'nervous', look: -0.25 }));
      break;
    case 'p9': // wide: midday dark as night, one warm lamp in the gloom
      out.push(codetAt(f, { expr: 'nervous' })); out.push(buSiti('worry')); out.push(wargaB('nervous'));
      break;
    case 'p10': { // two-shot at the warung: Codet asks (lipsync c7); Bu Siti has no answer
      const late = ramp(f, W.p10[0] + 0.75 * (W.p10[1] - W.p10[0]), W.p10[1]);
      out.push(codetAt(f, { expr: late > 0.5 ? 'takut' : 'bingung', lip: lipAt('p10', f), L: 'hang', R: 'hang', look: -0.25 }));
      out.push(buSiti(late > 0.5 ? 'takut' : 'worry'));
      break;
    }
    case 'q1': // the well crowd: everyone gathered, one villager drawing water
      out.push(buSiti('worry', {}, SUMUR_B));
      out.push(frozen('wargaA', 11, 'nervous', { L: 'bucket', R: 'hang', step: 0.3 }, [5.9, 0, -4.3]));
      out.push(codetAt(f, { expr: 'nervous', look: 0.3 }, [6.9, 0, -3.2]));
      break;
    case 'q2': // the draw: the bucket comes up, the villager holds the dipper a long time
      out.push(R(T, 'wargaA', { seed: 11, expr: 'nervous', L: 'bucket', R: 'hang', blink: blinkAt(f, 11), look: 0.2,
        bob: q(idle(f2, 11).bob, 3), tilt: q(idle(f2, 11).tilt, 1), headTilt: q(-6 + 1.5 * Math.sin(f * 0.08), 1) }, [5.2, 0, -4.6], {}));
      out.push(buSiti('worry', {}, SUMUR_B));
      break;
    case 'q3': // the water is warm — Codet sniffs the sulphur in the air
      out.push(codetAt(f, { expr: 'bingung', look: 0.3, headTilt: -4 }, [4.0, 0, -4.9]));
      out.push(buSiti('worry', {}, SUMUR_B));
      break;
    case 'q4': { // BU SITI dialogue at the well (lipsync c12); Pak RT listens
      out.push(buSiti('worry', { lip: lipAt('q4', f), L: 'bucket', R: 'hang', headTilt: q(3 * Math.sin(f * 0.14), 1) }, SUMUR_B));
      out.push(R(T, 'pakrt', { seed: 6, expr: 'worry', L: 'hang', R: 'hang', blink: blinkAt(f, 6), look: 0.25,
        bob: q(idle(f2, 6).bob, 3), tilt: q(idle(f2, 6).tilt, 1), headTilt: q(-6, 1) }, [3.4, 0, -4.2], {}));
      break;
    }
    case 'q5': // PAK RT dialogue: both hands up, calming the crowd (lipsync c13, part 1)
      out.push(R(T, 'pakrt', { seed: 6, expr: 'worry', lip: lipAt('q5', f), L: 'hang', R: 'hang', blink: blinkAt(f, 6), look: 0,
        bob: q(idle(f2, 6).bob, 3), tilt: q(idle(f2, 6).tilt, 1), headTilt: q(-4, 1) }, PAKRT, {}));
      out.push(buSiti('worry'));
      out.push(frozen('wargaA', 11, 'nervous', { L: 'belly', R: 'hang', look: 0.4 }, [-3.4, 0, -1.6]));
      break;
    case 'q6': // "...mungkin cuma cuaca." — the villagers look at each other (lipsync c13, part 2)
      out.push(R(T, 'pakrt', { seed: 6, expr: 'worry', lip: lipAt('q5', f, W.q5[0]), L: 'hang', R: 'hang', blink: blinkAt(f, 6), look: 0,
        bob: q(idle(f2, 6).bob, 3), tilt: q(idle(f2, 6).tilt, 1), headTilt: q(-4, 1) }, PAKRT, {}));
      out.push(frozen('wargaA', 11, 'nervous', { L: 'belly', R: 'hang', look: 0.4 }, [-3.4, 0, -1.6]));
      out.push(frozen('wargaB', 14, 'nervous', { L: 'belly', R: 'hang', look: -0.3 }, [-8.2, 0, -4.0]));
      break;
    case 'q7': // "Semua pulang ke rumah masing-masing." — nobody moves
      out.push(frozen('pakrt', 6, 'worry', { L: 'hang', R: 'hang', look: 0.3, headTilt: -4 }, PAKRT));
      out.push(frozen('busiti', 8, 'worry', { L: 'hang', R: 'bucket' }, BUSITI));
      out.push(frozen('wargaA', 11, 'nervous', { L: 'belly', R: 'hang', look: 0.4 }, [-3.4, 0, -1.6]));
      out.push(frozen('wargaB', 14, 'nervous', { L: 'belly', R: 'hang', look: -0.3 }, [-8.2, 0, -4.0]));
      break;
    case 'q8': // close-up: Pak RT's hands tremble as he speaks
      out.push(R(T, 'pakrt', { seed: 6, expr: 'takut', L: 'hang', R: 'hang', blink: blinkAt(f, 6), look: 0.2,
        bob: q(0.3 * Math.sin(f * 0.9), 2), tilt: q(1.2 * Math.sin(f * 0.8), 1), headTilt: q(-6, 1) }, PAKRT, {}));
      break;
    case 'q9': // cut to Codet: he notices the trembling hands
      out.push(codetAt(f, { expr: 'shock', look: 0.4, headTilt: -3 }, [5.0, 0, -3.0]));
      break;
    case 'p11': // no one answers: the whole kampung frozen mid-breath
      out.push(frozen('codet', 3, 'nervous', { L: 'cup', R: 'cup', look: 0.2, headTilt: -6 }, CODET));
      out.push(frozen('busiti', 8, 'worry', { L: 'hang', R: 'bucket' }, BUSITI));
      out.push(frozen('wargaB', 14, 'nervous', { L: 'belly', R: 'hang', look: 0.4 }, [-8.2, 0, -4.0]));
      out.push(frozen('wargaA', 11, 'nervous', { step: 0.35, look: 0.4 }, [-3.4, 0, -1.6]));
      break;
    case 'p12': // the chickens, silent and alert for the first time ever
      out.push(CH(T, 'putih', { step: 0.2, flap: 0, run: 0, peck: 0 }, [2.4, 0, -2.4]));
      out.push(CH(T, 'coklat', { step: 0.55, flap: 0, run: 0, peck: 0 }, [3.6, 0, -3.2]));
      out.push(CH(T, 'putih', { step: 0.8, flap: 0, run: 0, peck: 0 }, [1.8, 0, -1.8]));
      out.push(CH(T, 'coklat', { step: 0.35, flap: 0, run: 0, peck: 0 }, [4.8, 0, -2.0]));
      break;
    case 'p13': // the well: yesterday muddy, today warm
      out.push(buSiti('worry', {}, SUMUR_B));
      out.push(codetAt(f, { expr: 'nervous', look: 0.3 }, [6.8, 0, -3.4]));
      break;
    case 'p14': // the sound returns — bigger, closer; everyone looks up
      out.push(codetAt(f, { expr: 'takut', L: 'hang', R: 'hang', headTilt: -8 }));
      out.push(buSiti('takut')); out.push(wargaB('takut'));
      break;
    case 'p15': { // glasses ping, the ground shakes, chests shake
      const shake = f >= W.p15[0] + 8 ? q(0.55 + 0.45 * Math.sin((f - W.p15[0]) * 0.55), 2) : 0;
      out.push(codetAt(f, { expr: 'takut', ripple: shake, headTilt: -3 }));
      out.push(buSiti('takut'));
      break;
    }
    case 'p16': { // Codet runs for the beach
      const x = codetRunX(f);
      out.push(R(T, 'codet', { seed: 3, expr: 'takut', step: q(((f - W.p16[0]) / 30) * 3.4, 2), L: 'hang', R: 'hang',
        blink: blinkAt(f, 3), look: 0.3, bob: 0, tilt: 0, headTilt: 3 }, [x, 0, 1.5], {}));
      break;
    }
    case 'p17': { // the reveal: Codet arrives at the shore and stops dead
      const ax = lerp(70, 80, smooth(ramp(f, W.p17[0], W.p17[0] + 0.3 * (W.p17[1] - W.p17[0]))));
      const moving = ax < 79.9;
      out.push(R(T, 'codet', { seed: 3, expr: 'takut', step: q(moving ? (f / 30) * 3.4 : 0, 2), L: 'hang', R: 'hang',
        blink: blinkAt(f, 3), look: 0.4, bob: 0, tilt: 0, headTilt: -4 }, [ax, 0, 2], {}));
      break;
    }
    case 'p18': // close on Codet: the sea has run away and nobody told it to
      out.push(R(T, 'codet', { seed: 3, expr: f < W.p18[0] + 0.3 * (W.p18[1] - W.p18[0]) ? 'shock' : 'takut', L: 'hang', R: 'hang',
        blink: blinkAt(f, 3), look: 0.5, bob: q(idle(f2, 3).bob, 3), tilt: 0, headTilt: -4 }, [80, 0, 2], {}));
      break;
    case 'teaser': // held wide over the dark sea; the card text is laid in during post
      out.push(R(T, 'codet', { seed: 3, expr: 'takut', L: 'hang', R: 'hang', blink: blinkAt(f, 3), look: 0.4,
        bob: 0, tilt: 0, headTilt: -4 }, [80, 0, 2], {}));
      break;
  }
  return out;
};

// ---------- 2D effects: volcano smoke; falling ash where the narration says ash ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
const PEAK = [-44, 66, -300];
const SMOKE_DARK = { p1: 0.30, p2: 0.34, p3: 0.30, p4: 0.62, p5: 0.45, p6: 0.45, p7: 0.48, p8: 0.48, p9: 0.50, p10: 0.50,
  q1: 0.50, q2: 0.50, q3: 0.50, q4: 0.50, q5: 0.50, q6: 0.50, q7: 0.50, q8: 0.50, q9: 0.50,
  p11: 0.50, p12: 0.50, p13: 0.50, p14: 0.55, p15: 0.55, p16: 0.35, p17: 0.35, p18: 0.38, teaser: 0.40 };
const ASH = { p5: [0.50, 0.4, -3.0], p6: [0.70, 0.4, -3.0], p7: [0.85, -0.6, -4.2], p8: [0.50, 0.2, -4.6], p9: [0.40, 0.4, -3.0],
  q1: [0.20, 4.6, -4.6], q2: [0.22, 4.6, -4.6], q3: [0.30, 4.6, -4.6], q4: [0.20, 4.6, -4.6],
  p10: [0.45, 0.2, -4.2], p11: [0.22, 0.4, -3.0], p13: [0.18, 4.6, -4.6], p16: [0.20, 24, 1.0], p18: [0.15, 79, -1.0] };
export const fxAt = (f, T) => {
  const S = shotAt(f).id, out = [];
  const big = S === 'p4', sc = big ? 36 : 22, n = big ? 5 : 3;
  const burst = S === 'p15' ? ramp(f, W.p15[0], W.p15[0] + 0.4 * (W.p15[1] - W.p15[0])) : S === 'p14' ? 0.4 * ramp(f, W.p14[0], W.p14[1]) : 0;
  for (let i = 0; i < n; i++) {
    const t = q(((f / 30) * 0.055 + i / n) % 1, 2);
    out.push(FX('smoke' + i + '_' + t, (p) => { p.g.translate(-40, 260); T.fxSmoke(p, t, '#d5d9dc', q((SMOKE_DARK[S] || 0.3) + burst * 0.15, 2)); },
      [PEAK[0] + i * 4 - 4, PEAK[1] + 2, PEAK[2]], q(sc * (1 + burst * 0.35), 1)));
  }
  const ash = ASH[S];
  if (ash) out.push({ key: 'ash' + f, draw: (p) => T.fxAsh(p, f, ash[0], 3), x: ash[1], y: 2.6, z: ash[2], s: 5.6, blob: false, shadow: false, order: 6 });
  return out;
};
