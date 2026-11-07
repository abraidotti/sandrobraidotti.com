// Turns any string into a deterministic grimdark character: an archetype, one hand-drawn part per
// slot, a muted palette, and sometimes a corruption. Typed text names the character; a hash gets a
// generated name. Pure data, so it works at build time and in the browser.

import { dice } from './seed.ts';
import { BUILDS, RAMPS, partById, type Build, type Material, type Ramp, type Slot } from './spriteParts.ts';
import { generatedName } from './spriteNames.ts';

export interface Archetype {
  id: string;
  weight: number;
  /** Allowed part ids per slot; null means the slot can be empty. Repeats weight the pick. */
  parts: Record<Slot, (string | null)[]>;
}

const EXPRESSIONS = ['grim', 'scowling', 'weary', 'snarling', 'haunted', 'smirking'];

export const ARCHETYPES: Archetype[] = [
  {
    id: 'sellsword',
    weight: 3,
    parts: {
      face: ['gaunt', 'long-haired', 'bearded'],
      expression: EXPRESSIONS,
      headgear: [null, 'kettle hat', 'kettle hat', 'hood'],
      torso: ['gambeson'],
      legs: ['trousers'],
      cloak: [null, 'ragged cloak'],
      weapon: ['falchion'],
    },
  },
  {
    id: 'hedge-wizard',
    weight: 2,
    parts: {
      face: ['gaunt', 'long-haired', 'bearded'],
      expression: EXPRESSIONS,
      headgear: ['hood', 'hood', null],
      torso: ['robe'],
      legs: ['robe skirt'],
      cloak: [null, 'ragged cloak'],
      weapon: ['staff'],
    },
  },
];

export interface SpriteParams {
  /** The normalised seed the sprite is built from. */
  seed: string;
  name: string;
  /** True when the name was typed rather than generated. */
  typed: boolean;
  build: Build;
  archetype: string;
  parts: Partial<Record<Slot, string>>;
  palette: Record<Material, Ramp>;
  /** Glowing eyes and a blighted palette. */
  corrupted: boolean;
}

const SLOTS: Slot[] = ['face', 'expression', 'headgear', 'torso', 'legs', 'cloak', 'weapon'];

/** Mix a hex colour toward another by `t` (0-1). */
export function mix(a: string, b: string, t: number): string {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')).join('');
}

/**
 * `input` is the seed. When `typed`, it's also the character's name (as typed); otherwise the name
 * is generated from the seed.
 */
export function spriteParams(input: string, typed = false): SpriteParams {
  const seed = input.trim().toLowerCase();
  const { rand, pick, weighted } = dice(seed);

  const build = pick(BUILDS);
  const archetype = weighted(ARCHETYPES.map((a): [Archetype, number] => [a, a.weight]));
  const parts: Partial<Record<Slot, string>> = {};
  for (const slot of SLOTS) {
    const options = archetype.parts[slot].filter((id) => !id || (partById(id).builds ?? BUILDS).includes(build));
    const id = pick(options);
    if (id) parts[slot] = id;
  }

  const ramp = (material: Material, except?: Ramp) => {
    const options = Object.values(RAMPS[material]).filter((r) => r !== except);
    return pick(options);
  };
  const cloth = ramp('cloth');
  let palette: Record<Material, Ramp> = {
    skin: ramp('skin'),
    hair: ramp('hair'),
    cloth,
    trim: ramp('trim', cloth),
    leather: ramp('leather'),
    metal: ramp('metal'),
    wood: ramp('wood'),
    bone: ramp('bone'),
  };

  // About one in five comes out wrong.
  const corrupted = rand() < 0.2;
  if (corrupted) {
    palette = Object.fromEntries(
      Object.entries(palette).map(([m, r]) => [m, r.map((c) => mix(c, m === 'skin' ? '#5c6a58' : '#2a3428', m === 'skin' ? 0.5 : 0.35)) as Ramp]),
    ) as Record<Material, Ramp>;
  }

  const name = typed ? input.trim() : generatedName(seed, archetype.id, parts, corrupted);
  return { seed, name, typed, build, archetype: archetype.id, parts, palette, corrupted };
}

/** Long typed names are shortened for display; the full text still seeds the sprite. */
export const NAME_MAX = 24;
export function displayName(name: string): string {
  return name.length > NAME_MAX ? name.slice(0, NAME_MAX - 1) + '…' : name;
}

/** e.g. "a corrupted hedge-wizard · seed 1a2b3c4" */
export function describeSprite(params: SpriteParams): string {
  const kind = `a ${params.corrupted ? 'corrupted ' : ''}${params.archetype}`;
  return params.typed ? kind : `${kind} · seed ${params.seed.slice(0, 7)}`;
}
