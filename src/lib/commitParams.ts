// Turns a commit hash (or any string) into a deterministic little song.
// The same params drive both the SVG "score" and the Web Audio playback,
// so what you see is literally what you hear.

export type Wave = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface Step {
  on: boolean;
  /** Scale degree, 0 (lowest) to DEGREES - 1 (highest). */
  degree: number;
  /** MIDI note number. */
  pitch: number;
  wave: Wave;
  /** Note length in steps (1-3). */
  length: number;
  /** Palette index, 1-5 (maps to .c1-.c5 / --art-1..5). */
  color: number;
  kick: boolean;
}

export interface SongParams {
  hash: string;
  root: number;
  scaleName: string;
  scale: number[];
  tempo: number;
  steps: Step[];
  /** Seeded background decoration for the art. */
  backdrop: { x: number; y: number; r: number; color: number; arcadeY: number };
}

export const STEPS = 16;
export const DEGREES = 10;

const SCALES: Record<string, number[]> = {
  'major pentatonic': [0, 2, 4, 7, 9],
  'minor pentatonic': [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

const WAVES: Wave[] = ['sine', 'square', 'triangle', 'sawtooth'];

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

export function commitParams(hash: string): SongParams {
  const rand = sfc32(...cyrb128(hash.trim().toLowerCase()));
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const pick = <T>(items: T[]): T => items[Math.floor(rand() * items.length)];

  const root = int(45, 57); // A2..A3
  const scaleName = pick(Object.keys(SCALES));
  const scale = SCALES[scaleName];
  const tempo = int(84, 140);
  // Each song leans on one waveform so it has a recognisable voice.
  const leadWave = pick(WAVES);
  const density = 0.5 + rand() * 0.35;

  const degreeToPitch = (degree: number) =>
    root + 12 * Math.floor(degree / scale.length) + scale[degree % scale.length];

  const steps: Step[] = [];
  let degree = int(0, DEGREES - 1);
  for (let i = 0; i < STEPS; i++) {
    // Mostly stepwise melody with the occasional leap.
    degree = rand() < 0.7 ? degree + int(-2, 2) : int(0, DEGREES - 1);
    degree = Math.max(0, Math.min(DEGREES - 1, degree));
    steps.push({
      on: i === 0 || rand() < density,
      degree,
      pitch: degreeToPitch(degree),
      wave: rand() < 0.6 ? leadWave : pick(WAVES),
      length: int(1, 3),
      color: int(1, 5),
      kick: i % 4 === 0 ? rand() < 0.85 : rand() < 0.12,
    });
  }

  const backdrop = {
    x: int(60, 340),
    y: int(40, 160),
    r: int(40, 80),
    color: int(1, 5),
    arcadeY: int(30, 170),
  };

  return { hash, root, scaleName, scale, tempo, steps, backdrop };
}

/** Seconds per step (steps are eighth notes). */
export function stepDuration(params: SongParams): number {
  return 60 / params.tempo / 2;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

export function describe(params: SongParams): string {
  return `${NOTE_NAMES[params.root % 12]} ${params.scaleName} · ${params.tempo} bpm`;
}
