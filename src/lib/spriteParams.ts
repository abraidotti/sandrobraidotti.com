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
  /** Restricts these materials to the named ramps. */
  palette?: Partial<Record<Material, string[]>>;
  /** Always (or never) corrupted, instead of one in five. */
  corrupted?: boolean;
  /** Corrupted without blighting the palette (for archetypes already dressed in the dark). */
  unblighted?: boolean;
  /** How the character is described, instead of "a [corrupted] <id>". */
  label?: string;
}

const EXPRESSIONS = ['grim', 'scowling', 'weary', 'snarling', 'haunted', 'smirking'];
/** About two in five carry a mark. */
const MARKS = [null, null, null, null, null, null, 'scar', 'eyepatch', 'stubble', 'war paint'];

export const ARCHETYPES: Archetype[] = [
  {
    id: 'sellsword',
    weight: 3,
    parts: {
      face: ['gaunt', 'long-haired', 'bearded'],
      expression: EXPRESSIONS,
      mark: MARKS,
      headgear: [null, null, 'kettle hat', 'kettle hat', 'hood'],
      torso: ['gambeson'],
      legs: ['trousers'],
      cloak: [null, 'ragged cloak'],
      weapon: ['falchion', 'spear'],
    },
  },
  {
    id: 'crossbowman',
    weight: 2,
    parts: {
      face: ['gaunt', 'long-haired', 'bearded'],
      expression: EXPRESSIONS,
      mark: MARKS,
      headgear: ['broad hat', 'broad hat', null, null, 'hood'],
      torso: ['leather jerkin'],
      legs: ['trousers'],
      cloak: [null, null, 'ragged cloak'],
      weapon: ['crossbow'],
    },
  },
  {
    id: 'fallen knight',
    weight: 2,
    parts: {
      face: ['gaunt', 'long-haired', 'bearded'],
      expression: EXPRESSIONS,
      mark: MARKS,
      headgear: ['great helm', 'great helm', 'kettle hat', null],
      torso: ['chainmail'],
      legs: ['greaves'],
      cloak: [null, 'ragged cloak', 'ragged cloak'],
      weapon: ['warhammer'],
    },
  },
  {
    id: 'gravedigger',
    weight: 2,
    parts: {
      face: ['gaunt', 'long-haired', 'bearded'],
      expression: EXPRESSIONS,
      mark: MARKS,
      headgear: ['broad hat', null, null, 'hood'],
      torso: ['oilskin coat'],
      legs: ['coat skirt'],
      cloak: [null, null, 'ragged cloak'],
      weapon: ['lantern and dagger'],
    },
  },
  {
    id: 'hedge-wizard',
    weight: 2,
    parts: {
      face: ['gaunt', 'long-haired', 'bearded'],
      expression: EXPRESSIONS,
      mark: MARKS,
      headgear: ['hood', 'hood', null, null, 'broad hat'],
      torso: ['robe'],
      legs: ['robe skirt'],
      cloak: [null, 'ragged cloak'],
      weapon: ['staff'],
    },
  },
  {
    // Sorcerers bound to a dark master: masked, always corrupted, robed in dark colours.
    id: 'taken',
    weight: 1,
    corrupted: true,
    unblighted: true,
    label: 'one of the Taken',
    palette: { cloth: ['soot', 'slate', 'oxblood'], trim: ['soot', 'slate', 'oxblood'] },
    parts: {
      face: ['gaunt', 'long-haired'],
      expression: ['grim'],
      mark: [null],
      headgear: ['mask'],
      torso: ['robe'],
      legs: ['robe skirt'],
      cloak: ['ragged cloak', 'ragged cloak', null],
      weapon: ['sorcery'],
    },
  },
  {
    // A wereleopard. Very rare. The whole beast is one part, so it can move as one.
    id: 'forvalaka',
    weight: 0.15,
    corrupted: false,
    label: 'a forvalaka',
    parts: {
      face: [null], expression: [null], mark: [null], headgear: [null], torso: [null], legs: [null], cloak: [null],
      weapon: ['forvalaka'],
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

const SLOTS: Slot[] = ['face', 'expression', 'mark', 'headgear', 'torso', 'legs', 'cloak', 'weapon'];

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
    const allowed = archetype.palette?.[material];
    const options = Object.entries(RAMPS[material])
      .filter(([name, r]) => (!allowed || allowed.includes(name)) && r !== except)
      .map(([, r]) => r);
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

  // About one in five comes out wrong, unless the archetype decides.
  const corrupted = archetype.corrupted ?? rand() < 0.2;
  if (corrupted && !archetype.unblighted) {
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

/** e.g. "a corrupted hedge-wizard", or the archetype's own label ("one of the Taken"). */
export function kindOf(params: SpriteParams): string {
  return ARCHETYPES.find((a) => a.id === params.archetype)?.label ?? `a ${params.corrupted ? 'corrupted ' : ''}${params.archetype}`;
}

/** e.g. "a corrupted hedge-wizard · seed 1a2b3c4" */
export function describeSprite(params: SpriteParams): string {
  const kind = kindOf(params);
  return params.typed ? kind : `${kind} · seed ${params.seed.slice(0, 7)}`;
}
