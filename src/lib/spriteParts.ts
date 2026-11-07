// The hand-drawn parts library for the sprite machine.
//
// Every part is drawn on the same 32×32 template, facing left in three-quarter view, lit from the
// top left. Parts don't store colours: each pixel names a material and a shade, and the generator
// picks a palette ramp per material. One character per pixel:
//
//   skin a b c · hair d e f · cloth g h i · trim j k l · leather m n o · metal p q r · wood s t u
//   (each light, base, shadow) · bone x y (light, shadow) · * eye · ^ brow · w deep shadow · v glow
//   · in action frames: ~ motion smear · _ erase
//
// A part is a list of runs: [row, first column, pixels]. '.' inside a run is transparent.
// The renderer adds the dark outline, so parts keep a 1px margin inside the canvas.

export const SIZE = 32;

export type Slot = 'cloak' | 'weapon' | 'legs' | 'torso' | 'face' | 'expression' | 'headgear';
/** 'back' sits behind the body; 'main' is the part itself. */
export type Layer = 'back' | 'main';
export type Run = [y: number, x: number, pixels: string];

/** Body types. Torsos, legs and jaws are drawn per build; heads, hands and gear line up across all of them. */
export type Build = 'masculine' | 'feminine' | 'androgynous';
export const BUILDS: Build[] = ['masculine', 'feminine', 'androgynous'];

type Layers = Partial<Record<Layer, Run[]>>;

/** One frame of an action: the weapon (and the hand on it) redrawn, drawn over everything else. */
export interface ActionFrame {
  runs: Run[];
  ms: number;
  /** The upper body leans forward (left) this many pixels. */
  lean?: number;
}

export interface Part {
  id: string;
  slot: Slot;
  /** Drawn for the masculine build, and for any build without its own variant. */
  layers: Layers;
  variants?: Partial<Record<Build, Layers>>;
  /** Only these builds can wear it (default: all). */
  builds?: Build[];
  /** Weapons: what a click makes the character do. */
  action?: { verb: string; frames: ActionFrame[] };
}

export const partLayer = (part: Part, build: Build, layer: Layer): Run[] =>
  (part.variants?.[build] ?? part.layers)[layer] ?? [];

/** Bottom to top. */
export const DRAW_ORDER: [Slot, Layer][] = [
  ['cloak', 'back'],
  ['weapon', 'back'],
  ['legs', 'main'],
  ['torso', 'main'],
  ['face', 'main'],
  ['expression', 'main'],
  ['headgear', 'main'],
  ['cloak', 'main'],
  ['weapon', 'main'],
];

export type Material = 'skin' | 'hair' | 'cloth' | 'trim' | 'leather' | 'metal' | 'wood' | 'bone';

/** What each pixel character means: a material and shade (0 light, 1 base, 2 shadow), or a special. */
export const LEGEND: Record<string, [Material, number] | 'eye' | 'brow' | 'deep' | 'glow' | 'smear' | 'erase'> = {
  a: ['skin', 0], b: ['skin', 1], c: ['skin', 2],
  d: ['hair', 0], e: ['hair', 1], f: ['hair', 2],
  g: ['cloth', 0], h: ['cloth', 1], i: ['cloth', 2],
  j: ['trim', 0], k: ['trim', 1], l: ['trim', 2],
  m: ['leather', 0], n: ['leather', 1], o: ['leather', 2],
  p: ['metal', 0], q: ['metal', 1], r: ['metal', 2],
  s: ['wood', 0], t: ['wood', 1], u: ['wood', 2],
  x: ['bone', 0], y: ['bone', 1],
  '*': 'eye',
  '^': 'brow',
  w: 'deep',
  v: 'glow',
  // Action frames only: '~' a pale motion smear, '_' clears what's beneath (e.g. the resting forearm).
  '~': 'smear',
  _: 'erase',
};

const fist: Run[] = [
  [17, 8, 'ab'],
  [18, 8, 'bc'],
];

/**
 * A staff with the orb on top, gripped at `handY` (and the row below), running from column `topX`
 * at the top to `footX` at the bottom (row 29). Upright is 8 and 8; a smaller top and larger foot
 * tilt it forward.
 */
const staffX = (y: number, topX: number, footX: number) => Math.round(topX + ((footX - topX) * (y - 1)) / 28);
function staff(handY: number, topX = 8, footX = 8): Run[] {
  const shaft: Run[] = [];
  for (let y = 4; y <= 29; y++) {
    if (y === handY || y === handY + 1) continue;
    shaft.push([y, staffX(y, topX, footX), y < handY ? 'st' : 'tu']);
  }
  return [
    [1, topX, 'vv'], [2, topX - 1, 'svvu'], [3, topX - 1, 'sttu'],
    ...shaft,
    [handY, staffX(handY, topX, footX), 'ab'], [handY + 1, staffX(handY + 1, topX, footX), 'bc'],
  ];
}

/** The front arm raised to grip a staff at `handY`: the resting sleeve erased, a sleeve drawn up to the hand. */
function raisedSleeve(handY: number, topX: number, footX: number): Run[] {
  const hx = staffX(handY, topX, footX);
  const sleeve = (y: number, from: number, to: number): Run[] => (from <= to ? [[y, from, 'g' + 'h'.repeat(to - from)]] : []);
  return [
    [16, 9, '___'], [17, 9, '___'], [18, 9, '___'], [19, 10, '__'],
    ...sleeve(12, hx + 2, 10), ...sleeve(13, hx + 3, 12), ...sleeve(14, hx + 4, 13),
  ];
}

/** An upright spear, gripped at `handY`: leaf-shaped head, a rag tied below it, tilting like the staff. */
function spearUp(handY: number, topX = 8, footX = 8): Run[] {
  const t = topX;
  const shaft: Run[] = [];
  for (let y = 7; y <= 29; y++) {
    if (y === handY || y === handY + 1) continue;
    shaft.push([y, staffX(y, topX, footX), y < handY ? 'st' : 'tu']);
  }
  return [
    [1, t, 'p'], [2, t, 'pq'], [3, t - 1, 'ppq'], [4, t - 1, 'pqr'], [5, t, 'qr'], [6, t, 'rr'],
    ...shaft,
    [7, t + 2, 'jk'], [8, t + 2, 'kl'], [9, t + 3, 'l'],
    [handY, staffX(handY, topX, footX), 'ab'], [handY + 1, staffX(handY + 1, topX, footX), 'bc'],
  ];
}

/** A levelled spear pointing forward: tip at `tipX`, shaft two rows deep (`y`, `y`+1) back to `endX`, rag streaming. */
function spearLevel(tipX: number, y: number, endX: number, handX: number): Run[] {
  const shaftFrom = tipX + 6;
  return [
    [y - 1, tipX + 2, 'pq'], [y, tipX, 'ppqqr'], [y + 1, tipX, 'qqrrr'], [y + 2, tipX + 2, 'rr'],
    [y, tipX + 5, 'r'], [y + 1, tipX + 5, 'r'],
    [y, shaftFrom, 's'.repeat(endX - shaftFrom + 1)], [y + 1, shaftFrom, 't'.repeat(endX - shaftFrom + 1)],
    [y - 1, tipX + 7, 'jkk'], [y - 2, tipX + 9, 'kl'],
    [y, handX, 'ab'], [y + 1, handX, 'bc'],
  ];
}

/**
 * A crossbow held across the body at the hip, moved by `dx`/`dy` for other poses. The string is
 * drawn back to the nut when `cocked`, snapped straight otherwise; `bolt` lays one in the groove.
 */
function crossbow({ dx = 0, dy = 0, cocked = true, bolt = false } = {}): Run[] {
  const string: Run[] = cocked
    ? [[14, 8, 'x'], [15, 9, 'x'], [16, 10, 'x'], [19, 10, 'x'], [20, 9, 'x'], [21, 8, 'x']]
    : [14, 15, 16, 19, 20, 21].map((y): Run => [y, 8, 'x']);
  const runs: Run[] = [
    // the prod (the bow), its tips swept back
    [13, 7, 'r'], [14, 6, 'qr'], [15, 6, 'q'], [16, 6, 'p'], [17, 5, 'pp'], [18, 5, 'qq'], [19, 6, 'q'], [20, 6, 'q'], [21, 6, 'qr'], [22, 7, 'r'],
    // the stock, butt tucked under the arm
    [17, 7, 'ssssssss'], [18, 7, 'tttttttu'], [17, 15, 'tu'], [18, 15, 'uu'], [19, 15, 'uu'],
    ...string,
    ...(bolt ? ([[16, 3, 'pq'], [16, 5, 'sssss'], [16, 10, 'xy']] as Run[]) : []),
    [17, 8, 'ab'], [18, 8, 'bc'],
  ];
  return runs.map(([y, x, px]) => [y + dy, x + dx, px]);
}

/** A warhammer held upright, the head (flat face forward, beak behind) `dy` rows lower than at rest. */
function hammerUp(dy = 0): Run[] {
  const head: Run[] = [[3, 5, 'pqqqqqr'], [4, 4, 'ppqqqqqrr'], [5, 5, 'rqqqqqr']];
  const haft: Run[] = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((y) => [y, 8, 'st']);
  return [
    ...[...head, ...haft].map(([y, x, px]): Run => [y + dy, x, px]).filter(([y]) => y < 17),
    ...fist,
    [19, 8, 'tu'], [20, 8, 'tu'], [21, 8, 'tu'], [22, 8, 'qr'],
  ];
}

/** A quiver of bolts at the hip, fletchings showing. */
const quiver: Run[] = [[17, 21, 'x'], [18, 20, 'xy'], [19, 20, 'nn'], [20, 20, 'mn'], [21, 20, 'mn'], [22, 20, 'mo'], [23, 20, 'oo']];

/** Shift runs sideways, so glow effects follow a tilted staff's orb. */
const shifted = (runs: Run[], dx: number): Run[] => runs.map(([y, x, px]) => [y, x + dx, px]);

// Faces share a head (rows 4-9) and differ by build in the jaw (rows 10-13). The feminine and
// androgynous heads have a softer profile (no protruding nose); the feminine one adds a lash at the
// near eye's outer corner.
const head: Run[] = [
  [4, 14, 'eeeee'],
  [5, 13, 'deeeeef'],
  [6, 12, 'ddeeeeeff'],
  [7, 12, 'aabbbbeef'],
  [8, 12, 'abbbbbcef'],
  [9, 11, 'babbbbbcef'],
];
const heads: Record<Build, Run[]> = {
  masculine: head,
  feminine: [...head.slice(0, 4), [8, 12, 'wbbbbbcef'], [9, 12, 'abbbbbcef']],
  androgynous: [...head.slice(0, 5), [9, 12, 'abbbbbcef']],
};
const jaws: Record<Build, Run[]> = {
  masculine: [[10, 12, 'abbbbcbf'], [11, 12, 'abbbbbc'], [12, 13, 'bbbcc'], [13, 14, 'ccc']],
  feminine: [[10, 12, 'abbbbbbf'], [11, 12, 'abbbbc'], [12, 13, 'bbcc'], [13, 14, 'cc']],
  androgynous: [[10, 12, 'abbbbcbf'], [11, 12, 'abbbbc'], [12, 13, 'bbcc'], [13, 14, 'cc']],
};
const slimLegs: Run[] = [
  [23, 12, 'jkl'], [23, 16, 'jkl'],
  [24, 12, 'jkl'], [24, 16, 'jkl'],
  [25, 12, 'jkl'], [25, 16, 'jkl'],
  [26, 12, 'mno'], [26, 16, 'mno'],
  [27, 12, 'mno'], [27, 16, 'mno'],
  [28, 11, 'mmno'], [28, 15, 'mmno'],
  [29, 11, 'oooo'], [29, 15, 'oooo'],
];

const faceFor = (extra: Run[] = []) => ({
  layers: { main: [...heads.masculine, ...jaws.masculine, ...extra] },
  variants: {
    feminine: { main: [...heads.feminine, ...jaws.feminine, ...extra] },
    androgynous: { main: [...heads.androgynous, ...jaws.androgynous, ...extra] },
  },
});

export const PARTS: Part[] = [
  // ---------- faces ----------
  // Faces are bare: the expression slot draws brows (row 7), eyes (row 8: near eye x13-14, far eye
  // x16-17) and the mouth (around row 11, x13-16) on top, so any expression fits any face.
  { id: 'gaunt', slot: 'face', ...faceFor() },
  {
    id: 'long-haired',
    slot: 'face',
    // Hair falls behind the jaw and over the back shoulder.
    ...faceFor([[10, 19, 'ef'], [11, 18, 'eef'], [12, 18, 'eff'], [13, 18, 'eff'], [14, 18, 'ef'], [15, 19, 'f']]),
  },
  {
    id: 'bearded',
    slot: 'face',
    builds: ['masculine'],
    layers: { main: [...head, [10, 12, 'bbeeebcf'], [11, 12, 'deeeeef'], [12, 13, 'eeeef'], [13, 14, 'fef']] },
  },

  // ---------- expressions ----------
  {
    id: 'grim',
    slot: 'expression',
    layers: { main: [[7, 13, '^^'], [7, 16, '^^'], [8, 13, '*'], [8, 16, '*'], [11, 13, 'cwwc']] },
  },
  {
    id: 'scowling',
    slot: 'expression',
    layers: { main: [[7, 13, 'c^^'], [7, 16, '^'], [8, 13, '*c'], [8, 16, '*c'], [11, 14, 'ww'], [12, 13, 'c'], [12, 16, 'c']] },
  },
  {
    id: 'weary',
    slot: 'expression',
    layers: { main: [[7, 13, '^^'], [7, 16, '^'], [8, 13, '*'], [8, 16, '*'], [9, 13, 'c'], [9, 16, 'c'], [11, 14, 'ww']] },
  },
  {
    id: 'snarling',
    slot: 'expression',
    layers: { main: [[7, 13, 'c^^'], [7, 16, '^'], [8, 13, '*c'], [8, 16, '*c'], [10, 13, 'c'], [11, 13, 'wxxw']] },
  },
  {
    id: 'haunted',
    slot: 'expression',
    layers: { main: [[7, 12, '^'], [7, 17, '^'], [8, 13, '*'], [8, 16, '*'], [11, 14, 'w'], [12, 14, 'w']] },
  },
  {
    id: 'smirking',
    slot: 'expression',
    layers: { main: [[7, 13, '^^'], [7, 16, '^^'], [8, 13, '*'], [8, 16, '*c'], [11, 13, 'cww'], [10, 16, 'w']] },
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

  {
    id: 'broad hat',
    slot: 'headgear',
    // Leather crown with a band, and a wide brim that shades the brows.
    layers: {
      main: [
        [2, 14, 'mmnn'],
        [3, 13, 'mnnnno'],
        [4, 13, 'mnnnno'],
        [5, 12, 'jkkkkkkl'],
        [6, 9, 'mmnnnnnnnnnnnno'],
        [7, 9, 'oo'], [7, 12, 'wwwww'], [7, 22, 'oo'],
      ],
    },
  },

  {
    id: 'great helm',
    slot: 'headgear',
    // A battered barrel helm: a tattered plume streaming back, a riveted brow band over a shadowed
    // eye slit (eyes glow through it on the corrupted), a nasal bar, breath holes, a dent, some rust.
    layers: {
      main: [
        // plume
        [1, 14, 'jk'], [2, 13, 'jkkl'], [2, 18, 'kkl'], [3, 19, 'kkll'], [4, 20, 'kll'], [5, 21, 'kl'], [6, 22, 'l'],
        // crown with a ridge
        [3, 13, 'pqpqqr'],
        [4, 12, 'pqqpqqqr'],
        [5, 11, 'pqqqpqqqrr'],
        // riveted brow band, then the brow ridge's shadow over the slit
        [6, 11, 'rprrprrprr'],
        [7, 11, 'pqrrrrrqrr'],
        // the slit, split by the nasal bar
        [8, 11, 'qw*wp*wqrr'],
        [9, 11, 'pqqrpqqqro'],
        [10, 11, 'pqqqpqqqro'],
        // breath holes either side of the bar
        [11, 11, 'pwqwpwqwrr'],
        [12, 12, 'qwqpqwrr'],
        [13, 13, 'rrprr'],
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
    variants: {
      // Narrow shoulders, a cinched waist with the arm hanging free of it, hips flaring below.
      feminine: {
        main: [
          [13, 15, 'bc'],
          [14, 13, 'ghhhhhi'],
          [15, 12, 'gghihhihi'],
          [16, 10, 'gghhihhihhii'],
          [17, 9, 'gghhhihhihhii'],
          [18, 9, 'ghihiihhiihii'],
          [19, 14, 'hihh'], [19, 20, 'ii'],
          [20, 14, 'mpno'], [20, 20, 'bc'],
          [21, 12, 'ghhihhii'],
          [22, 11, 'ghhhihhhii'],
        ],
      },
      // Narrower shoulders, a straight waist.
      androgynous: {
        main: [
          [13, 15, 'bbc'],
          [14, 12, 'ghhhhhhhi'],
          [15, 11, 'gghhihhihii'],
          [16, 10, 'gghhihhihhii'],
          [17, 9, 'gghhhihhihhii'],
          [18, 9, 'ghihhihhihhii'],
          [19, 12, 'hhihhihhii'],
          [20, 12, 'mnnpnnno'], [20, 20, 'bc'],
          [21, 12, 'ghhihhii'],
          [22, 12, 'hhhihhii'],
        ],
      },
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
    variants: {
      feminine: {
        main: [
          [13, 15, 'bc'],
          [14, 13, 'ghhhhhi'],
          [15, 12, 'gghhhhhii'],
          [16, 10, 'gghhhhhhhhii'],
          [17, 9, 'gghhhhhhhhhii'],
          [18, 9, 'ghhhhhhhhhhii'],
          [19, 13, 'hhhhhi'], [19, 20, 'ii'],
          [20, 14, 'jkkl'], [20, 20, 'bc'],
          [21, 12, 'ghhhihhii'],
          [22, 11, 'ghhhhihhhii'],
        ],
      },
      androgynous: {
        main: [
          [13, 15, 'bbc'],
          [14, 12, 'ghhhhhhhi'],
          [15, 11, 'gghhhhhhhii'],
          [16, 10, 'gghhhhhhhhii'],
          [17, 9, 'gghhhhhhhhhii'],
          [18, 9, 'ghhhhhhhhhhii'],
          [19, 10, 'ihhhhhhhhhii'],
          [20, 12, 'jkkkkkkl'], [20, 20, 'bc'],
          [21, 11, 'ghhhhihhhii'],
          [22, 11, 'ghhhhihhhii'],
        ],
      },
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
    variants: {
      feminine: { main: slimLegs },
      androgynous: { main: slimLegs },
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
    // A single-edged blade: lit cutting edge on the left, a belly swelling toward the clipped tip.
    layers: {
      main: [
        [3, 9, 'q'],
        [4, 8, 'pq'],
        [5, 7, 'ppq'],
        [6, 7, 'ppq'],
        [7, 7, 'ppr'],
        [8, 7, 'pqr'],
        ...[9, 10, 11, 12, 13, 14, 15].map((y): Run => [y, 8, 'pr']),
        [16, 7, 'rqqr'],
        ...fist,
        [19, 8, 'qr'],
      ],
    },
    action: {
      verb: 'attack',
      frames: [
        // Wind-up: blade raised high, the forearm lifted from the shoulder.
        {
          ms: 170,
          runs: [
            [16, 9, '___'], [17, 9, '___'], [18, 9, '___'],
            [1, 9, 'q'], [2, 8, 'pq'], [3, 7, 'ppq'], [4, 7, 'ppq'], [5, 7, 'pqr'],
            ...[6, 7, 8, 9].map((y): Run => [y, 8, 'pr']),
            [10, 7, 'rqqr'],
            [11, 8, 'ab'], [12, 8, 'bc'],
            [13, 9, 'gh'], [14, 9, 'ggh'],
          ],
        },
        // Strike: lunging forward, the blade swept down through a pale arc.
        {
          ms: 150,
          lean: 1,
          runs: [
            [16, 8, '___'], [17, 8, '___'], [18, 8, '___'],
            [2, 6, '~~'], [3, 5, '~~'], [4, 4, '~~'], [5, 3, '~~'], [6, 3, '~'], [7, 2, '~~'],
            ...[8, 9, 10, 11].map((y): Run => [y, 2, '~']),
            [12, 2, '~~'], [13, 2, '~~'], [14, 2, '~~'], [15, 2, '~~'], [16, 3, '~'],
            [15, 7, 'ggh'], [16, 7, 'ghh'],
            [15, 5, 'ab'], [16, 5, 'bc'],
            [17, 4, 'rq'],
            [18, 3, 'pq'], [19, 3, 'pq'], [20, 2, 'ppq'], [21, 2, 'pqr'], [22, 2, 'pq'], [23, 2, 'pr'], [24, 2, 'q'],
          ],
        },
        // Recover: blade lowered, point down, before settling back to guard.
        {
          ms: 200,
          runs: [
            [18, 7, 'ab'], [19, 7, 'bc'],
            [20, 6, 'rqqr'],
            [21, 7, 'pr'], [22, 7, 'pr'], [23, 7, 'pr'], [24, 6, 'ppr'], [25, 6, 'ppq'], [26, 6, 'pq'], [27, 7, 'q'],
          ],
        },
      ],
    },
  },
  {
    id: 'spear',
    slot: 'weapon',
    layers: { main: spearUp(17) },
    action: {
      verb: 'thrust',
      frames: [
        // Coil: the spear swings level and draws right back, butt past the shoulders; the body rocks back.
        {
          ms: 220,
          lean: -1,
          runs: [
            [16, 9, '___'], [17, 9, '___'], [18, 9, '___'],
            ...spearLevel(8, 17, 29, 14),
            [16, 12, 'ghh'],
          ],
        },
        // Thrust: a two-pixel lunge, the spear at full stretch, speed lines streaming off the head, dust at the front foot.
        {
          ms: 110,
          lean: 2,
          runs: [
            [16, 7, '_____'], [17, 7, '_____'], [18, 7, '_____'],
            ...spearLevel(1, 17, 22, 8),
            [16, 9, 'gh'],
            [13, 5, '~~~~'], [14, 7, '~~~'], [21, 6, '~~~~'], [22, 4, '~~~'],
            [16, 1, '~'], [19, 1, '~'],
            [28, 8, '~'], [29, 6, '~~'],
          ],
        },
        // Impact: held at full extension; a starburst at the tip throws off sparks.
        {
          ms: 200,
          lean: 2,
          runs: [
            [16, 7, '_____'], [17, 7, '_____'], [18, 7, '_____'],
            ...spearLevel(2, 17, 23, 9),
            [16, 10, 'gh'],
            [11, 4, '~'], [12, 3, '~'], [13, 2, '~'], [14, 1, '~~'], [15, 1, '~'], [16, 1, '~'],
            [19, 1, '~'], [20, 1, '~'], [21, 1, '~~'], [22, 2, '~'], [23, 3, '~'], [24, 4, '~'],
            [17, 1, '~'], [18, 1, '~'],
            [10, 6, 'v'], [12, 7, 'v'], [23, 7, 'v'], [25, 6, 'v'], [15, 4, 'v'], [20, 4, 'v'],
            [29, 7, '~'],
          ],
        },
        // Recover: the spear swings back up at a tilt as the weight comes off the front foot.
        { ms: 240, lean: 1, runs: spearUp(17, 5, 10) },
      ],
    },
  },
  {
    id: 'crossbow',
    slot: 'weapon',
    layers: { main: [...quiver, ...crossbow()] },
    action: {
      verb: 'loose',
      frames: [
        // Aim: up to the shoulder, a bolt in the groove, the far eye squeezed shut.
        {
          ms: 280,
          runs: [
            ...quiver,
            [16, 9, '___'], [17, 9, '___'], [18, 9, '___'],
            ...crossbow({ dx: -2, dy: -5, bolt: true }),
            [13, 8, 'gh'], [14, 8, 'ggh'],
            [8, 16, 'c'],
          ],
        },
        // Loose: the string snaps, the bolt is gone in a streak, the recoil rocks the body back.
        {
          ms: 90,
          lean: -1,
          runs: [
            ...quiver,
            [16, 9, '___'], [17, 9, '___'], [18, 9, '___'],
            ...crossbow({ dx: -1, dy: -5, cocked: false }),
            [13, 9, 'gh'], [14, 9, 'ggh'],
            [11, 1, '~~~'], [8, 1, '~'], [9, 2, '~'], [13, 2, '~'], [14, 1, '~'],
            [8, 16, 'c'],
          ],
        },
        // Kick: the nose jumps up from the recoil, the string still humming.
        {
          ms: 180,
          lean: -1,
          runs: [
            ...quiver,
            [16, 9, '___'], [17, 9, '___'], [18, 9, '___'],
            ...crossbow({ dx: 0, dy: -6, cocked: false }),
            [12, 10, 'gh'], [13, 10, 'gh'], [14, 9, 'ggh'],
            [10, 2, '~'],
          ],
        },
        // Reload: nose down, foot in the stirrup, cranking the string back.
        {
          ms: 320,
          runs: [
            ...quiver,
            [16, 9, '___'], [17, 9, '___'], [18, 9, '___'],
            ...[16, 17, 18, 19, 20, 21, 22, 23, 24].map((y): Run => [y, 9, 'st']),
            [25, 5, 'rqqppppqqr'], [26, 5, 'r'], [26, 14, 'r'],
            [24, 6, 'x'], [23, 7, 'x'], [22, 8, 'x'], [22, 11, 'x'], [23, 12, 'x'], [24, 13, 'x'],
            [12, 11, 'q'], [13, 10, 'qr'],
            [14, 9, 'ab'], [15, 9, 'bc'],
          ],
        },
      ],
    },
  },
  {
    id: 'warhammer',
    slot: 'weapon',
    layers: { main: hammerUp() },
    action: {
      verb: 'smash',
      frames: [
        // Raise: heaved up overhead, the head hanging back past the shoulders; the body rocks back.
        {
          ms: 260,
          lean: -1,
          runs: [
            [16, 9, '___'], [17, 9, '___'], [18, 9, '___'],
            [12, 10, 'g'], [13, 10, 'ghh'], [14, 10, 'ghhh'],
            [8, 13, 'st'], [7, 14, 'st'], [6, 16, 'st'], [5, 18, 'st'], [4, 20, 'st'],
            [1, 21, 'pqqqr'], [2, 20, 'pqqqqrr'], [3, 21, 'rqqqr'],
            [9, 11, 'ab'], [10, 11, 'bc'],
          ],
        },
        // Smash: brought down through a huge arc into the ground in front, the whole body behind it.
        {
          ms: 100,
          lean: 2,
          runs: [
            [16, 7, '_____'], [17, 7, '_____'], [18, 7, '_____'],
            [3, 9, '~~'], [4, 7, '~~'], [5, 5, '~~'], [6, 4, '~'], [7, 3, '~'],
            ...[8, 9, 10, 11, 12].map((y): Run => [y, 2, '~']),
            ...[13, 14, 15, 16, 17, 18, 19].map((y): Run => [y, 1, '~']),
            [16, 8, 'ggh'], [17, 9, 'gh'],
            [20, 7, 'st'], [21, 7, 'st'], [22, 6, 'st'], [23, 6, 'st'], [24, 5, 'st'],
            [25, 2, 'pqqqr'], [26, 2, 'pqqqr'], [27, 2, 'pqqqr'], [28, 3, 'rr'], [24, 3, 'r'],
            [18, 7, 'ab'], [19, 7, 'bc'],
          ],
        },
        // Impact: held there as the ground cracks, stone chips fly and a shockwave of dust rolls out.
        {
          ms: 240,
          lean: 2,
          runs: [
            [16, 7, '_____'], [17, 7, '_____'], [18, 7, '_____'],
            [16, 8, 'ggh'], [17, 9, 'gh'],
            [20, 7, 'st'], [21, 7, 'st'], [22, 6, 'st'], [23, 6, 'st'], [24, 5, 'st'],
            [25, 2, 'pqqqr'], [26, 2, 'pqqqr'], [27, 2, 'pqqqr'], [28, 3, 'rr'], [24, 3, 'r'],
            [18, 7, 'ab'], [19, 7, 'bc'],
            [29, 1, '~~~~~~~~~'], [28, 8, '~~'], [27, 10, '~'], [28, 1, '~'], [27, 1, '~'],
            [22, 2, '~'], [23, 1, '~'], [21, 6, '~'], [20, 7, '~'],
            [24, 9, 'v'], [22, 9, 'v'], [26, 10, 'v'], [21, 4, 'v'], [19, 2, 'v'],
          ],
        },
        // Recover: dragged back up, the head still low and heavy.
        { ms: 280, lean: 1, runs: hammerUp(4) },
      ],
    },
  },
  {
    id: 'staff',
    slot: 'weapon',
    layers: { main: staff(17) },
    action: {
      verb: 'cast',
      frames: [
        // Gather: the hand slides up, the staff tips forward, a halo forms round the orb.
        {
          ms: 220,
          runs: [
            ...raisedSleeve(11, 6, 9),
            ...staff(11, 6, 9),
            ...shifted([[1, 6, '~'], [1, 11, '~'], [3, 5, '~'], [3, 12, '~'], [4, 7, '~'], [4, 10, '~']], -2),
          ],
        },
        // Flare: tipped well forward, the orb bursts into a star with a white-hot core.
        {
          ms: 160,
          runs: [
            ...raisedSleeve(11, 4, 11),
            ...staff(11, 4, 11),
            ...shifted([
              [1, 8, '~~'],
              [1, 5, 'v'], [1, 7, '~'], [1, 10, '~'], [1, 12, 'v'],
              [2, 6, '~'], [2, 11, '~'],
              [3, 5, '~'], [3, 12, '~v'],
              [4, 6, '~'], [4, 11, '~'],
              [5, 5, 'v'], [5, 12, 'v'],
            ], -4),
          ],
        },
        // Release: leaning in behind the tilted staff, sparks fly forward from the orb.
        {
          ms: 180,
          lean: 1,
          runs: [
            ...raisedSleeve(11, 4, 11),
            ...staff(11, 4, 11),
            [2, 1, '~'], [4, 1, 'v'], [5, 2, 'v'], [6, 1, '~'], [7, 2, 'v'], [8, 1, 'v'],
          ],
        },
        // Settle: back at rest, a couple of embers still drifting.
        { ms: 240, runs: [...staff(17), [5, 2, 'v'], [9, 3, 'v']] },
      ],
    },
  },
];

export const partById = (id: string): Part => {
  const part = PARTS.find((p) => p.id === id);
  if (!part) throw new Error(`No sprite part "${id}"`);
  return part;
};

/**
 * A new part cut from an existing one, for every build: each pixel passes through `pixel`
 * (which can recolour it), then `extra` runs are laid on top.
 */
function recut(
  baseId: string,
  id: string,
  pixel: (ch: string, x: number, y: number, build: Build) => string,
  extra: (build: Build) => Run[] = () => [],
): Part {
  const base = partById(baseId);
  const main = (build: Build): Run[] => [
    ...partLayer(base, build, 'main').flatMap(([y, x, pixels]) => [...pixels].map((ch, i): Run => [y, x + i, pixel(ch, x + i, y, build)])),
    ...extra(build),
  ];
  return {
    id,
    slot: base.slot,
    layers: { main: main('masculine') },
    variants: { feminine: { main: main('feminine') }, androgynous: { main: main('androgynous') } },
  };
}

const chestCols: Record<Build, [number, number]> = { masculine: [12, 20], feminine: [12, 19], androgynous: [12, 19] };
const inChest = (x: number, build: Build) => x >= chestCols[build][0] && x <= chestCols[build][1];
const recolour = (map: Record<string, string>) => (ch: string) => map[ch] ?? ch;

// The leather jerkin: leather over the chest, cloth sleeves, a trim belt, a strap from shoulder to hip.
PARTS.push(
  recut(
    'gambeson',
    'leather jerkin',
    (ch, x, y, build) => (y === 20 ? recolour({ m: 'j', n: 'k', o: 'l' })(ch) : inChest(x, build) ? recolour({ g: 'm', h: 'n', i: 'o' })(ch) : ch),
    () => [[14, 19, 'k'], [15, 18, 'k'], [16, 17, 'k'], [17, 16, 'k'], [18, 15, 'k'], [19, 14, 'k']],
  ),
);

// Chainmail: mail all over (a ring texture of alternating shades), the leather belt kept, and a
// tattered tabard in trim hanging down the front.
PARTS.push(
  recut(
    'gambeson',
    'chainmail',
    (ch, x, y) => {
      const mail: Record<string, string> = { g: 'p', h: (x + y) % 2 ? 'q' : 'r', i: 'r' };
      return y === 20 ? ch : (mail[ch] ?? ch);
    },
    () => [
      [15, 14, 'jkkkl'], [16, 14, 'jkkkl'], [17, 14, 'jkkkl'], [18, 14, 'jkkkl'],
      [21, 14, 'jkkkl'], [22, 14, 'k.k.l'],
    ],
  ),
);

// Greaves: metal over the shins, boots underneath.
PARTS.push(recut('trousers', 'greaves', recolour({ j: 'p', k: 'q', l: 'r' })));

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
export const SMEAR = '#efe9dc';
