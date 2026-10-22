// Turns a commit hash (or any string) into a deterministic little song:
// an Orchid-style chord progression, mostly lush and dreamy, sometimes unsettling.
// The same params drive both the SVG "score" and the Web Audio playback,
// so what you see is literally what you hear.

/** How a chord feels; drives the shape it gets in the art. */
export type Family = 'major' | 'minor' | 'sus' | 'strange';
export type Timbre = 'velvet' | 'glass' | 'hollow' | 'choir';
export type Perform = 'pad' | 'strum' | 'arp' | 'pulse';

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
  kicks: boolean[];
  /** Seeded background decoration for the art. */
  backdrop: { x: number; y: number; r: number; color: number; arcadeY: number };
}

export const STEPS = 32;
export const STEPS_PER_CHORD = 4;
export const PITCH_MAX = 90;

const MODES: Record<string, number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
};
const MODE_WEIGHTS: [string, number][] = [
  ['aeolian', 3], ['dorian', 3], ['lydian', 2], ['ionian', 2], ['mixolydian', 2], ['phrygian', 1],
];

// Scale-degree progressions (0 = tonic) that loop nicely.
const TEMPLATES = [
  [0, 5, 3, 4], [0, 3, 5, 4], [0, 2, 3, 4], [5, 3, 0, 4],
  [0, 3, 0, 4], [0, 4, 5, 3], [0, 6, 5, 3], [0, 5, 1, 4],
];

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
  '0,1,3,7,10': 'm7♭9', '0,1,3,6,10': 'm7♭5♭9', '0,2,4,6,11': 'maj9♯11', '0,2,4,7': 'add9', '0,2,3,7': 'm(add9)',
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

/** Pick the inversion/octave of a chord closest to the previous voicing (smooth voice leading). */
function voice(rootPc: number, intervals: number[], prev: number[] | undefined): number[] {
  let best: number[] = [];
  let bestCost = Infinity;
  for (let root = 48 + rootPc - 12; root <= 64; root += 12) {
    for (let inv = 0; inv < intervals.length; inv++) {
      const notes = intervals.map((iv, j) => root + iv + (j < inv ? 12 : 0)).sort((a, b) => a - b);
      if (notes[0] < 50 || notes[notes.length - 1] > PITCH_MAX - 2) continue;
      const cost = prev
        ? notes.reduce((sum, n) => sum + Math.min(...prev.map((p) => Math.abs(p - n))), 0)
        : Math.abs(notes[0] - 55);
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
  const modeName = weighted(MODE_WEIGHTS);
  const scale = MODES[modeName];
  const tempo = int(76, 112);
  const timbre = pick<Timbre>(['velvet', 'glass', 'hollow', 'choir']);
  const perform = weighted<Perform>([['pad', 3], ['strum', 3], ['arp', 3], ['pulse', 1]]);
  // Most songs are pure dream; some carry a little dread.
  const unease = rand() < 0.6 ? 0 : 0.25 + rand() * 0.55;
  const wobble = { depth: 4 + rand() * 8 + unease * 18, rate: 0.25 + rand() * 0.9 };

  // A–A′ form: the template, then a variation with a new cadence.
  const template = pick(TEMPLATES);
  const degrees = [...template, ...template];
  degrees[7] = pick([4, 3, 5, 6, 1].filter((d) => d !== degrees[6]));

  const chords: Chord[] = [];
  let prevNotes: number[] | undefined;
  let prevRootPc = key;
  degrees.forEach((degree, i) => {
    let rootPc: number;
    let intervals: number[];
    let name: string;
    let family: Family;
    let drift = (rand() - 0.5) * 6;

    if (i > 0 && rand() < unease * 0.5) {
      // Unsettling substitution: chromatic root, out-of-key colour, a little out of tune.
      const [quality, ivs] = pick(STRANGE);
      rootPc = mod12(prevRootPc + pick([1, 3, 4, 6, 8, 9]));
      intervals = ivs;
      name = NOTE_NAMES[rootPc] + quality;
      family = 'strange';
      drift += (rand() - 0.5) * 50 * unease;
    } else {
      rootPc = mod12(key + scale[degree]);
      intervals = diatonic(scale, degree, rand() < 0.4 ? 5 : 4);
      // A diatonic ♭9 is a dark colour: keep it only for songs with some unease.
      if (unease === 0) intervals = intervals.filter((iv) => iv !== 13);
      // Lush sus colour, only where the fifth is perfect.
      if (rand() < 0.22 && intervals.includes(7) && !intervals.includes(13)) {
        const sus = rand() < 0.5 ? 2 : 5;
        intervals = intervals.map((iv) => (iv === 3 || iv === 4 ? sus : iv)).sort((a, b) => a - b);
      }
      name = nameFor(rootPc, intervals);
      family = familyFor(intervals);
    }

    const notes = voice(rootPc, intervals, prevNotes);
    chords.push({
      step: i * STEPS_PER_CHORD,
      length: STEPS_PER_CHORD,
      name,
      family,
      notes,
      bass: 36 + rootPc,
      color: int(1, 5),
      drift,
    });
    prevNotes = notes;
    prevRootPc = rootPc;
  });

  const events: NoteEvent[] = [];
  const strumGap = 0.03 + rand() * 0.06;
  const arpPattern = pick(['up', 'down', 'updown', 'random'] as const);
  const pulse = Array.from({ length: STEPS_PER_CHORD }, (_, i) => i === 0 || rand() < 0.55);

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
        const idx =
          arpPattern === 'up' ? s % n
          : arpPattern === 'down' ? n - 1 - (s % n)
          : arpPattern === 'updown' ? [0, 1, 2, 1][s] % n
          : int(0, n - 1);
        events.push({ ...base, step: chord.step + s, length: 2, pitch: chord.notes[idx] + 12, delay: 0, velocity: 0.75 });
      }
    } else {
      pulse.forEach((on, s) => {
        if (!on) return;
        chord.notes.forEach((pitch) => events.push({ ...base, step: chord.step + s, length: 1, pitch, delay: 0, velocity: 0.7 }));
      });
    }
  });

  const kicks = Array.from({ length: STEPS }, (_, i) =>
    i % 8 === 0 ? rand() < 0.9 : i % 8 === 4 ? rand() < 0.3 : rand() < 0.07,
  );

  const backdrop = {
    x: int(70, 410),
    y: int(50, 170),
    r: int(45, 90),
    color: int(1, 5),
    arcadeY: int(34, 180),
  };

  return { hash, key, modeName, tempo, timbre, perform, unease, wobble, chords, events, kicks, backdrop };
}

/** Seconds per step (steps are eighth notes). */
export function stepDuration(params: SongParams): number {
  return 60 / params.tempo / 2;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function describe(params: SongParams): string {
  return `${NOTE_NAMES[params.key]} ${params.modeName} · ${params.timbre} ${params.perform} · ${params.tempo} bpm`;
}

/** e.g. "Am9 → Fmaj7 → Cadd9 → G7sus4 → …" */
export function progression(params: SongParams): string {
  return params.chords.map((c) => c.name).join(' → ');
}
