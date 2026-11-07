// The hand-drawn parts library for the sprite machine.
//
// Every part is drawn on the same 32×32 template, facing left in three-quarter view, lit from the
// top left. Parts don't store colours: each pixel names a material and a shade, and the generator
// picks a palette ramp per material. One character per pixel:
//
//   skin a b c · hair d e f · cloth g h i · trim j k l · leather m n o · metal p q r · wood s t u
//   (each light, base, shadow) · bone x y (light, shadow) · * eye · w deep shadow · v glow
//
// A part is a list of runs: [row, first column, pixels]. '.' inside a run is transparent.
// The renderer adds the dark outline, so parts keep a 1px margin inside the canvas.

export const SIZE = 32;

export type Slot = 'cloak' | 'weapon' | 'legs' | 'torso' | 'face' | 'headgear';
/** 'back' sits behind the body; 'main' is the part itself. */
export type Layer = 'back' | 'main';
export type Run = [y: number, x: number, pixels: string];

export interface Part {
  id: string;
  slot: Slot;
  layers: Partial<Record<Layer, Run[]>>;
}

/** Bottom to top. */
export const DRAW_ORDER: [Slot, Layer][] = [
  ['cloak', 'back'],
  ['weapon', 'back'],
  ['legs', 'main'],
  ['torso', 'main'],
  ['face', 'main'],
  ['headgear', 'main'],
  ['cloak', 'main'],
  ['weapon', 'main'],
];

export type Material = 'skin' | 'hair' | 'cloth' | 'trim' | 'leather' | 'metal' | 'wood' | 'bone';

/** What each pixel character means: a material and shade (0 light, 1 base, 2 shadow), or a special. */
export const LEGEND: Record<string, [Material, number] | 'eye' | 'deep' | 'glow'> = {
  a: ['skin', 0], b: ['skin', 1], c: ['skin', 2],
  d: ['hair', 0], e: ['hair', 1], f: ['hair', 2],
  g: ['cloth', 0], h: ['cloth', 1], i: ['cloth', 2],
  j: ['trim', 0], k: ['trim', 1], l: ['trim', 2],
  m: ['leather', 0], n: ['leather', 1], o: ['leather', 2],
  p: ['metal', 0], q: ['metal', 1], r: ['metal', 2],
  s: ['wood', 0], t: ['wood', 1], u: ['wood', 2],
  x: ['bone', 0], y: ['bone', 1],
  '*': 'eye',
  w: 'deep',
  v: 'glow',
};

const fist: Run[] = [
  [17, 8, 'ab'],
  [18, 8, 'bc'],
];

export const PARTS: Part[] = [
  // ---------- faces ----------
  {
    id: 'gaunt',
    slot: 'face',
    layers: {
      main: [
        [4, 14, 'eeeee'],
        [5, 13, 'deeeeef'],
        [6, 12, 'ddeeeeeff'],
        [7, 12, 'aabbbbeef'],
        [8, 12, 'b*bb*bcef'],
        [9, 11, 'babbbbbcef'],
        [10, 12, 'abbcbbcf'],
        [11, 13, 'bbbbcc'],
        [12, 14, 'cccc'],
      ],
    },
  },
  {
    id: 'bearded',
    slot: 'face',
    layers: {
      main: [
        [4, 14, 'eeeee'],
        [5, 13, 'deeeeef'],
        [6, 12, 'ddeeeeeff'],
        [7, 12, 'aabbbbeef'],
        [8, 12, 'b*bb*bcef'],
        [9, 11, 'babbbbbcef'],
        [10, 12, 'beeeeecf'],
        [11, 12, 'deeeeef'],
        [12, 13, 'eeeef'],
        [13, 14, 'fef'],
      ],
    },
  },

  // ---------- headgear ----------
  {
    id: 'kettle hat',
    slot: 'headgear',
    layers: {
      main: [
        [2, 14, 'pppq'],
        [3, 13, 'ppqqqr'],
        [4, 12, 'pqqqqqrr'],
        [5, 12, 'pqqqqqqrr'],
        [6, 10, 'rqqqqqqqqqrrr'],
        [7, 10, 'rr'],
        [7, 21, 'rr'],
      ],
    },
  },
  {
    id: 'hood',
    slot: 'headgear',
    layers: {
      main: [
        [3, 14, 'ghhhi'],
        [4, 13, 'ghhhhhi'],
        [5, 12, 'ghhhhhhii'],
        [6, 11, 'ghhhhhhhhii'],
        [7, 11, 'ghwwwwwhiii'],
        [8, 11, 'gw'],
        [8, 18, 'hiii'],
        [9, 11, 'g'],
        [9, 18, 'hiii'],
        [10, 11, 'gh'],
        [10, 18, 'hii'],
        [11, 12, 'g'],
        [11, 18, 'hhii'],
        [12, 12, 'ghh'],
        [12, 17, 'hhhii'],
        [13, 12, 'ghhhhhhhii'],
      ],
    },
  },

  // ---------- torsos ----------
  {
    id: 'gambeson',
    slot: 'torso',
    layers: {
      main: [
        [13, 15, 'bbc'],
        [14, 11, 'ghhhhhhhhii'],
        [15, 10, 'gghhihhihhhii'],
        [16, 10, 'ghhhihhihhhii'],
        [17, 9, 'gghhhihhihhhii'],
        [18, 9, 'ghihhihhihhhii'],
        [19, 12, 'hhihhihhhii'],
        [20, 12, 'mnnnpnnnobc'],
        [21, 12, 'ghhihhhii'],
        [22, 12, 'hhhihhhii'],
      ],
    },
  },
  {
    id: 'robe',
    slot: 'torso',
    layers: {
      main: [
        [13, 15, 'bbc'],
        [14, 11, 'ghhhhhhhhii'],
        [15, 10, 'gghhhhhhhhhii'],
        [16, 10, 'ghhhhhhhhhhii'],
        [17, 9, 'gghhhhhhhhhhii'],
        [18, 9, 'ghhhhhhhhhhhii'],
        [19, 10, 'ihhhhhhhhhhii'],
        [20, 12, 'jkkkkkkkl'],
        [20, 21, 'bc'],
        [21, 11, 'ghhhhihhhii'],
        [22, 11, 'ghhhhihhhii'],
      ],
    },
  },

  // ---------- legs ----------
  {
    id: 'trousers',
    slot: 'legs',
    layers: {
      main: [
        [23, 12, 'jkkl'], [23, 17, 'jkkl'],
        [24, 12, 'jkkl'], [24, 17, 'jkkl'],
        [25, 12, 'jkkl'], [25, 17, 'jkkl'],
        [26, 12, 'mnno'], [26, 17, 'mnno'],
        [27, 12, 'mnno'], [27, 17, 'mnno'],
        [28, 11, 'mmnno'], [28, 16, 'mmnno'],
        [29, 11, 'ooooo'], [29, 16, 'ooooo'],
      ],
    },
  },
  {
    id: 'robe skirt',
    slot: 'legs',
    layers: {
      main: [
        [23, 12, 'ghhhihhhi'],
        [24, 11, 'ghhhhihhhii'],
        [25, 11, 'ghhhhihhhii'],
        [26, 11, 'ghhhhihhhii'],
        [27, 10, 'ghhhhhihhhii'],
        [28, 10, 'ghhhhhihhhiii'],
        [29, 9, 'mm'],
        [29, 11, 'iiihiiihii'],
      ],
    },
  },

  // ---------- cloaks ----------
  {
    id: 'ragged cloak',
    slot: 'cloak',
    layers: {
      back: [
        [14, 19, 'jkkl'],
        [15, 20, 'kkkl'],
        [16, 20, 'kkkll'],
        [17, 20, 'kkkll'],
        [18, 20, 'kkkkl'],
        [19, 20, 'kkkkl'],
        [20, 20, 'kkkkl'],
        [21, 20, 'kkkkl'],
        [22, 20, 'kkkkl'],
        [23, 20, 'kkkkl'],
        [24, 20, 'kkkkl'],
        [25, 20, 'kkkkl'],
        [26, 20, 'kkkkl'],
        [27, 19, 'kkl.kl'],
        [28, 20, 'l..l'],
      ],
      main: [
        [13, 12, 'jjkkkkkkkl'],
        [14, 11, 'jkkkpkkkkkl'],
        [15, 11, 'jk'],
        [15, 20, 'kl'],
      ],
    },
  },

  // ---------- weapons ----------
  {
    id: 'falchion',
    slot: 'weapon',
    layers: {
      main: [
        [4, 9, 'p'],
        [5, 8, 'pq'],
        [6, 7, 'ppq'],
        [7, 7, 'pqq'],
        [8, 7, 'pqr'],
        ...[9, 10, 11, 12, 13, 14, 15].map((y): Run => [y, 8, 'pr']),
        [16, 6, 'rqqqqr'],
        ...fist,
        [19, 8, 'no'],
        [20, 8, 'qr'],
      ],
    },
  },
  {
    id: 'staff',
    slot: 'weapon',
    layers: {
      main: [
        [1, 8, 'vv'],
        [2, 7, 'svvu'],
        [3, 7, 'sttu'],
        [4, 8, 'st'],
        ...[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((y): Run => [y, 8, 'st']),
        ...fist,
        ...[19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29].map((y): Run => [y, 8, 'tu']),
      ],
    },
  },
];

export const partById = (id: string): Part => {
  const part = PARTS.find((p) => p.id === id);
  if (!part) throw new Error(`No sprite part "${id}"`);
  return part;
};

/** A colour ramp: light, base, shadow. */
export type Ramp = [string, string, string];

export const RAMPS: Record<Material, Record<string, Ramp>> = {
  skin: {
    pale: ['#e8c4a8', '#c99a7c', '#94664f'],
    olive: ['#d1a882', '#a87e5c', '#74533b'],
    brown: ['#a8724e', '#82543a', '#563526'],
    deep: ['#7a5038', '#5a3826', '#3a2318'],
  },
  hair: {
    black: ['#4a4040', '#2e2828', '#1c1717'],
    brown: ['#7a5a3e', '#56402c', '#38291c'],
    grey: ['#a8a39a', '#7d7870', '#55514b'],
    white: ['#d9d4c8', '#b0aa9c', '#827d72'],
    rust: ['#a0583a', '#743e28', '#4c2819'],
  },
  cloth: {
    umber: ['#8a6a48', '#64492f', '#42301f'],
    oxblood: ['#8c3a34', '#642621', '#421714'],
    moss: ['#6e7448', '#4f5532', '#343921'],
    slate: ['#5f6b78', '#434d58', '#2c333b'],
    ash: ['#8a857c', '#66625b', '#45423d'],
    soot: ['#4a4548', '#333033', '#211f21'],
  },
  trim: {},
  leather: {
    tan: ['#8a5e3c', '#66432a', '#452c1b'],
    dark: ['#5e4434', '#433024', '#2c1f17'],
  },
  metal: {
    iron: ['#b4b8bc', '#80868c', '#52575c'],
    bronze: ['#b49a62', '#86703f', '#584827'],
    blackened: ['#7c7a80', '#55535a', '#38363b'],
  },
  wood: {
    ash: ['#9a7650', '#735537', '#4c3723'],
    bog: ['#6e5440', '#503c2c', '#33261c'],
  },
  bone: {
    bone: ['#ddd3ba', '#a89e86', '#7a725e'],
  },
};
// Trim draws from the same muted cloths; the generator keeps it different from the cloth.
RAMPS.trim = RAMPS.cloth;

export const OUTLINE = '#140f11';
export const EYE = '#1c1416';
export const DEEP = '#241c1e';
export const GLOW = { ember: '#f0a040', corrupt: '#9be06a' };
