// Turns a commit hash (or any string) into a deterministic little song:
// a looping chord progression, mostly lush and dreamy, sometimes unsettling.
// The same params drive both the SVG "score" and the Web Audio playback,
// so what you see is literally what you hear.

/** How a chord feels; drives the shape it gets in the art. */
export type Family = 'major' | 'minor' | 'sus' | 'strange';
export type Timbre = 'velvet' | 'glass' | 'hollow' | 'choir';
export type Perform = 'pad' | 'strum' | 'arp' | 'pulse';
export type Groove = 'backbeat' | 'four on the floor' | 'half-time' | 'shuffle';

export interface Chord {
  step: number;
  length: number;
  name: string;
  family: Family;
  /** Voiced MIDI notes, low to high. */
  notes: number[];
  bass: number;
  /** Palette index, 1-5 (maps to .c1-.c5 / --art-1..5). */
  color: number;
  /** Detune in cents; strange chords drift out of tune. */
  drift: number;
}

export interface NoteEvent {
  step: number;
  /** Length in steps. */
  length: number;
  pitch: number;
  chord: number;
  family: Family;
  color: number;
  /** Seconds after the step starts (strums). */
  delay: number;
  /** 0-1. */
  velocity: number;
}

export interface SongParams {
  hash: string;
  key: number;
  modeName: string;
  tempo: number;
  timbre: Timbre;
  perform: Perform;
  /** 0 = purely dreamy, up to ~0.8 = noticeably unsettling. */
  unease: number;
  /** Tape wobble: depth in cents and rate in Hz. */
  wobble: { depth: number; rate: number };
  chords: Chord[];
  events: NoteEvent[];
  /** A regular beat: the same bar repeated, with a small fill at the end. Each array has STEPS entries. */
  drums: { groove: Groove; kick: boolean[]; snare: boolean[]; hat: number[] };
  /** Bar 3 opens with a lone kick and the chord comes in on the third eighth. */
  lateEntry: boolean;
  /** Bars (0-3) with an arpeggio over the chords: every bar for arp songs, two otherwise. */
  arpBars: number[];
  /** Phaser swirl on the chords: sweep rate in Hz and depth 0-1. */
  phaser: { rate: number; depth: number };
  /** How far the chords duck on each kick (sidechain pump), 0-1. */
  pump: number;
  /** Seeded background decoration for the art. */
  backdrop: { x: number; y: number; r: number; color: number; arcadeY: number };
}

export const STEPS = 32;
export const STEPS_PER_CHORD = 4;
/** Steps per bar (eighth notes in 4/4). */
export const BAR = 8;
export const PITCH_MAX = 90;

const MODES: Record<string, number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  // Harmonic minor: only borrowed from, for its major V.
  harmonic: [0, 2, 3, 5, 7, 8, 11],
};

/** A scale degree (0 = tonic) of the song's mode, or [degree, mode] to borrow a chord on the same tonic. */
type Step = number | [number, string];

interface Progression {
  mode: string;
  /** Four chords play twice; eight play once. */
  steps: Step[];
  weight: number;
}

// Classic progressions that loop well, leaning dark and cinematic.
const PROGRESSIONS: Progression[] = [
  { mode: 'aeolian', steps: [0, 5, 2, 6], weight: 3 }, // i–VI–III–VII
  { mode: 'aeolian', steps: [0, 6, 5, [4, 'harmonic']], weight: 3 }, // Andalusian: i–VII–VI–V
  { mode: 'aeolian', steps: [0, 5, 3, [4, 'harmonic']], weight: 3 }, // i–VI–iv–V
  { mode: 'aeolian', steps: [3, 6, 2, 5, 1, [4, 'harmonic'], 0, 0], weight: 3 }, // minor circle of fifths: iv–VII–III–VI–ii°–V–i
  { mode: 'aeolian', steps: [0, 3, 6, 2], weight: 2 }, // minor circle: i–iv–VII–III
  { mode: 'aeolian', steps: [3, 5, 6, 0], weight: 2 }, // rising: iv–VI–VII–i
  { mode: 'dorian', steps: [0, 2, 6, 3], weight: 2 }, // i–III–VII–IV
  { mode: 'phrygian', steps: [0, 1, 0, 6], weight: 2 }, // i–♭II–i–♭vii
  { mode: 'phrygian', steps: [0, 1, 6, 5], weight: 1 }, // i–♭II–♭vii–♭VI
  { mode: 'dorian', steps: [0, 3, 0, 3], weight: 1 }, // i–IV vamp
  { mode: 'ionian', steps: [0, 5, 3, [3, 'aeolian']], weight: 1 }, // bittersweet: I–vi–IV–iv
  { mode: 'lydian', steps: [0, 1, 0, 1], weight: 1 }, // floating: I–II
];

// One bar of each groove, in eighth notes. Hats are velocities (0 = silent).
const GROOVES: Record<Groove, { kick: number[]; snare: number[]; hat: number[] }> = {
  backbeat: { kick: [1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hat: [0.6, 1, 0.6, 1, 0.6, 1, 0.6, 1] },
  'four on the floor': { kick: [1, 0, 1, 0, 1, 0, 1, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hat: [0, 1, 0, 1, 0, 1, 0, 1] },
  'half-time': { kick: [1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0], hat: [0.6, 1, 0.6, 1, 0.6, 1, 0.6, 1] },
  shuffle: { kick: [1, 0, 0, 1, 0, 0, 0, 0], snare: [0, 0, 1, 0, 0, 0, 1, 0], hat: [1, 0, 0.7, 1, 0, 0.7, 1, 0] },
};

// Out-of-key colours for the unsettling moments.
const STRANGE: [string, number[]][] = [
  ['dim7', [0, 3, 6, 9]],
  ['aug', [0, 4, 8, 14]],
  ['m(maj7)', [0, 3, 7, 11]],
  ['7♭9', [0, 4, 7, 10, 13]],
  ['maj7♯11', [0, 4, 7, 11, 18]],
  ['7sus4♭9', [0, 5, 7, 10, 13]],
];

const CHORD_NAMES: Record<string, string> = {
  '0,4,7': '', '0,3,7': 'm', '0,3,6': 'dim', '0,4,8': 'aug',
  '0,4,7,11': 'maj7', '0,3,7,10': 'm7', '0,4,7,10': '7', '0,3,6,10': 'm7♭5', '0,3,6,9': 'dim7',
  '0,2,4,7,11': 'maj9', '0,2,3,7,10': 'm9', '0,2,4,7,10': '9', '0,2,3,6,10': 'm9♭5',
  '0,1,3,7,10': 'm7♭9', '0,1,4,7,10': '7♭9', '0,1,3,6,10': 'm7♭5♭9', '0,2,4,6,11': 'maj9♯11', '0,2,4,7': 'add9', '0,2,3,7': 'm(add9)',
  '0,2,7': 'sus2', '0,5,7': 'sus4', '0,2,7,11': 'maj7sus2', '0,2,7,10': '7sus2', '0,5,7,10': '7sus4',
  '0,5,7,11': 'maj7sus4', '0,2,5,7,10': '9sus4', '0,2,5,7,11': 'maj9sus4',
};

const NOTE_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

// cyrb128: string -> four 32-bit seeds.
function cyrb128(str: string): [number, number, number, number] {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

// sfc32 PRNG: returns floats in [0, 1).
function sfc32(a: number, b: number, c: number, d: number): () => number {
  return () => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

const mod12 = (n: number) => ((n % 12) + 12) % 12;

function nameFor(rootPc: number, intervals: number[]): string {
  const key = [...new Set(intervals.map(mod12))].sort((a, b) => a - b).join(',');
  return NOTE_NAMES[rootPc] + (CHORD_NAMES[key] ?? '*');
}

function familyFor(intervals: number[]): Family {
  const pcs = new Set(intervals.map(mod12));
  if (pcs.has(4)) return 'major';
  if (pcs.has(3)) return 'minor';
  return 'sus';
}

/** Stack thirds within the mode: diatonic 7th (or 9th) chord on `degree`. */
function diatonic(scale: number[], degree: number, size: number): number[] {
  const at = (i: number) => scale[(degree + i) % 7] + 12 * Math.floor((degree + i) / 7) - scale[degree];
  const tones = [0, 2, 4, 6, 8].slice(0, size).map(at);
  return tones.sort((a, b) => a - b);
}

/** At most four voices, so the chord stays clear under the bass and arpeggio: drop the fifth, then the root (the bass has it). */
function thin(intervals: number[]): number[] {
  if (intervals.length > 4) intervals = intervals.filter((iv) => iv !== 7);
  if (intervals.length > 4) intervals = intervals.filter((iv) => iv !== 0);
  return intervals;
}

/** Every way to place each chord tone in one of three octaves. */
function spreads(intervals: number[]): number[][] {
  if (!intervals.length) return [[]];
  const rest = spreads(intervals.slice(1));
  return [0, 12, 24].flatMap((o) => rest.map((r) => [intervals[0] + o, ...r]));
}

/** Pick an open voicing (within an octave and a half) closest to the previous one (smooth voice leading). */
function voice(rootPc: number, intervals: number[], prev: number[] | undefined): number[] {
  let best: number[] = [];
  let bestCost = Infinity;
  for (let root = 48 + rootPc - 12; root <= 64; root += 12) {
    for (const spread of spreads(intervals)) {
      const notes = spread.map((iv) => root + iv).sort((a, b) => a - b);
      const top = notes[notes.length - 1];
      if (notes[0] < 50 || top > PITCH_MAX - 2 || top - notes[0] > 19 || new Set(notes).size < notes.length) continue;
      // Seconds smear the chord, and close intervals low down sound muddy.
      const seconds = notes.filter((n, j) => j > 0 && n - notes[j - 1] <= 2).length;
      const mud = notes.filter((n, j) => j > 0 && n < 62 && n - notes[j - 1] < 3).length;
      const cost = seconds * 6 + mud * 8 + (prev
        ? notes.reduce((sum, n) => sum + Math.min(...prev.map((p) => Math.abs(p - n))), 0)
        : Math.abs(notes[0] - 55));
      if (cost < bestCost) {
        bestCost = cost;
        best = notes;
      }
    }
  }
  return best;
}

export function commitParams(hash: string): SongParams {
  const rand = sfc32(...cyrb128(hash.trim().toLowerCase()));
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
  const weighted = <T>(items: [T, number][]): T => {
    let r = rand() * items.reduce((s, [, w]) => s + w, 0);
    for (const [item, w] of items) if ((r -= w) < 0) return item;
    return items[items.length - 1][0];
  };

  const key = int(0, 11);
  const prog = weighted(PROGRESSIONS.map((p): [Progression, number] => [p, p.weight]));
  const modeName = prog.mode;
  const scale = MODES[modeName];
  const tempo = int(76, 112);
  const timbre = pick<Timbre>(['velvet', 'glass', 'hollow', 'choir']);
  const perform = weighted<Perform>([['pad', 3], ['strum', 3], ['arp', 1], ['pulse', 1]]);
  // Most songs are pure dream; some carry a little dread.
  const unease = rand() < 0.6 ? 0 : 0.25 + rand() * 0.55;
  const wobble = { depth: 4 + rand() * 8 + unease * 18, rate: 0.25 + rand() * 0.9 };

  // Each chord of the progression is spelled once, so a four-chord loop repeats exactly.
  const spelled = prog.steps.map((step) => {
    const [degree, from] = typeof step === 'number' ? [step, scale] : [step[0], MODES[step[1]]];
    const rootPc = mod12(key + from[degree]);
    let intervals = diatonic(from, degree, rand() < 0.4 ? 5 : 4);
    // A diatonic ♭9 is a dark colour: keep it only for songs with some unease.
    if (unease === 0) intervals = intervals.filter((iv) => iv !== 13);
    // Lush sus colour, only where the fifth is perfect. The home chord keeps its quality, and so do
    // borrowed chords: it's why they're borrowed.
    if (rand() < 0.15 && typeof step === 'number' && degree !== 0 && intervals.includes(7) && !intervals.includes(13)) {
      const sus = rand() < 0.5 ? 2 : 5;
      intervals = intervals.map((iv) => (iv === 3 || iv === 4 ? sus : iv)).sort((a, b) => a - b);
    }
    return { step, rootPc, intervals, name: nameFor(rootPc, intervals), family: familyFor(intervals), color: int(1, 5), drift: (rand() - 0.5) * 6 };
  });

  const chords: Chord[] = [];
  let substituted = false;
  for (let i = 0; i < STEPS / STEPS_PER_CHORD; i++) {
    const s = spelled[i % spelled.length];
    const prev = chords[i - 1];
    const at = { step: i * STEPS_PER_CHORD, length: STEPS_PER_CHORD };
    // Uneasy songs may twist one chord in the second half, once the loop has been heard,
    // but never the home chord or a borrowed one. Chromatic root, out-of-key colour, a little out of tune.
    if (i >= 4 && !substituted && typeof s.step === 'number' && s.step !== 0 && rand() < unease * 0.55) {
      substituted = true;
      const [quality, ivs] = pick(STRANGE);
      const rootPc = mod12(prev.bass + pick([1, 3, 4, 6, 8, 9]));
      const drift = s.drift + (rand() - 0.5) * 50 * unease;
      chords.push({ ...at, name: NOTE_NAMES[rootPc] + quality, family: 'strange', notes: voice(rootPc, thin(ivs), prev.notes), bass: 36 + rootPc, color: int(1, 5), drift });
      continue;
    }
    // A repeated chord reuses its first voicing, unless it follows the strange one.
    const echo = i >= spelled.length && prev.family !== 'strange' ? chords[i - spelled.length] : undefined;
    const notes = echo ? echo.notes : voice(s.rootPc, thin(s.intervals), prev?.notes);
    chords.push({ ...at, name: s.name, family: s.family, notes, bass: 36 + s.rootPc, color: s.color, drift: s.drift });
  }

  const events: NoteEvent[] = [];
  const strumGap = 0.03 + rand() * 0.06;
  const arpPattern = pick(['up', 'down', 'updown', 'random'] as const);
  const pulse = Array.from({ length: STEPS_PER_CHORD }, (_, i) => i === 0 || rand() < 0.55);
  const arpIndex = (s: number, n: number) =>
    arpPattern === 'up' ? s % n
    : arpPattern === 'down' ? n - 1 - (s % n)
    : arpPattern === 'updown' ? [0, 1, 2, 1][s] % n
    : int(0, n - 1);

  chords.forEach((chord, c) => {
    const base = { chord: c, family: chord.family, color: chord.color };
    const n = chord.notes.length;
    if (perform === 'pad' || perform === 'strum') {
      const down = perform === 'strum' && c % 2 === 1 && rand() < 0.5;
      chord.notes.forEach((pitch, j) => {
        const order = down ? n - 1 - j : j;
        events.push({ ...base, step: chord.step, length: chord.length, pitch, delay: perform === 'strum' ? order * strumGap : 0, velocity: 0.8 });
      });
    } else if (perform === 'arp') {
      // Soft bed of the chord underneath the arpeggio.
      chord.notes.forEach((pitch) => events.push({ ...base, step: chord.step, length: chord.length, pitch, delay: 0, velocity: 0.3 }));
      for (let s = 0; s < chord.length; s++) {
        events.push({ ...base, step: chord.step + s, length: 2, pitch: chord.notes[arpIndex(s, n)] + 12, delay: 0, velocity: 0.75 });
      }
    } else {
      pulse.forEach((on, s) => {
        if (!on) return;
        chord.notes.forEach((pitch) => events.push({ ...base, step: chord.step + s, length: 1, pitch, delay: 0, velocity: 0.7 }));
      });
    }
  });

  // Drums: one groove repeated every bar, with a fill in the last bar.
  const groove = weighted<Groove>([['backbeat', 3], ['half-time', 3], ['four on the floor', 2], ['shuffle', 2]]);
  const bar = GROOVES[groove];
  const drums = {
    groove,
    kick: Array.from({ length: STEPS }, (_, i) => bar.kick[i % BAR] === 1),
    snare: Array.from({ length: STEPS }, (_, i) => bar.snare[i % BAR] === 1),
    hat: Array.from({ length: STEPS }, (_, i) => bar.hat[i % BAR]),
  };
  const fill = pick(['snare roll', 'kick pickup', 'open']);
  const last = STEPS - BAR;
  if (fill === 'snare roll') [5, 7].forEach((s) => (drums.snare[last + s] = true));
  if (fill === 'kick pickup') drums.kick[STEPS - 1] = true;
  if (fill === 'open') drums.hat[STEPS - 1] = 0;

  const backdrop = {
    x: int(70, 410),
    y: int(50, 170),
    r: int(45, 90),
    color: int(1, 5),
    arcadeY: int(34, 180),
  };

  // Sometimes bar 3 takes a breath: a lone kick on the downbeat, then the chord enters on the third eighth.
  // Drawn last so songs without it are unchanged.
  const lateEntry = rand() < 0.35;
  if (lateEntry) {
    const index = (2 * BAR) / STEPS_PER_CHORD;
    const chord = chords[index];
    const entry = chord.step + 2;
    // Sustained notes from the downbeat now start at the entry; anything shorter is dropped.
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];
      // Earlier notes stop at the downbeat so the kick stands alone.
      if (ev.step < chord.step && ev.step + ev.length > chord.step) ev.length = chord.step - ev.step;
      if (ev.chord !== index || ev.step >= entry) continue;
      if (ev.step === chord.step && ev.step + ev.length > entry) {
        ev.length -= entry - ev.step;
        ev.step = entry;
      } else {
        events.splice(i, 1);
      }
    }
    if (!events.some((e) => e.chord === index && e.step === entry)) {
      for (const pitch of chord.notes) {
        events.push({ chord: index, family: chord.family, color: chord.color, step: entry, length: 1, pitch, delay: 0, velocity: 0.7 });
      }
    }
    chord.length -= entry - chord.step;
    chord.step = entry;
    for (let s = 2 * BAR; s < entry; s++) {
      drums.kick[s] = s === 2 * BAR;
      drums.snare[s] = false;
      drums.hat[s] = 0;
    }
  }

  // Songs that aren't arpeggiated throughout get a soft arpeggio over the chords in two bars,
  // one in each half. Drawn after the rest so it doesn't change them.
  const bars = STEPS / BAR;
  const arpBars = perform === 'arp' ? [...Array(bars).keys()] : [int(0, bars / 2 - 1), int(bars / 2, bars - 1)];
  if (perform !== 'arp') {
    chords.forEach((chord, c) => {
      if (!arpBars.includes(Math.floor(chord.step / BAR))) return;
      for (let s = 0; s < chord.length; s++) {
        const pitch = chord.notes[arpIndex(s, chord.notes.length)] + 12;
        // Stop at the chord's end, so nothing rings into a late entry's gap.
        const length = Math.min(2, chord.length - s);
        events.push({ chord: c, family: chord.family, color: chord.color, step: chord.step + s, length, pitch, delay: 0, velocity: 0.55 });
      }
    });
  }

  // Production colour, drawn last so the notes are unchanged.
  const phaser = { rate: 0.08 + rand() * 0.27, depth: 0.4 + rand() * 0.6 };
  const pump = 0.35 + rand() * 0.3;

  return { hash, key, modeName, tempo, timbre, perform, unease, wobble, chords, events, drums, lateEntry, arpBars, phaser, pump, backdrop };
}

/** Seconds per step (steps are eighth notes). */
export function stepDuration(params: SongParams): number {
  return 60 / params.tempo / 2;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function describe(params: SongParams): string {
  return `${NOTE_NAMES[params.key]} ${params.modeName} · ${params.timbre} ${params.perform} · ${params.drums.groove} · ${params.tempo} bpm`;
}

/** e.g. "Am9 → Fmaj7 → Cadd9 → G7sus4 → …" */
export function progression(params: SongParams): string {
  return params.chords.map((c) => c.name).join(' → ');
}
