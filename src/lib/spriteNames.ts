// Generated names for sprites seeded by a hash. Soldiers go by nicknames; the corrupted go by titles.
// Names roll on their own seed, so changing these lists never changes anyone's sprite.

import { dice } from './seed.ts';
import type { Slot } from './spriteParts.ts';

/** Nicknames a part can lend, so the name fits the look. */
const PART_WORDS: Record<string, string[]> = {
  falchion: ['Notch', 'Hack', 'Cleaver', 'Chopper'],
  spear: ['Skewer', 'Reach', 'Long', 'Prod'],
  staff: ['Wick', 'Hex', 'Murmur', 'Cant'],
  hood: ['Cowl', 'Hush', 'Shade'],
  'kettle hat': ['Pot', 'Tin', 'Bucket'],
  bearded: ['Whisker', 'Bristle', 'Thatch'],
  'ragged cloak': ['Tatters', 'Rags', 'Flap'],
  grim: ['Dour', 'Stony'],
  scowling: ['Sour', 'Glower'],
  weary: ['Droop', 'Yawn'],
  snarling: ['Fang', 'Snarl'],
  haunted: ['Twitch', 'Startle'],
  smirking: ['Smirk', 'Sly'],
};

const SINGLE = [
  'Moth', 'Lantern', 'Mudlark', 'Tallow', 'Cinder', 'Thistle', 'Gristle', 'Sallow', 'Murk', 'Nettle',
  'Flint', 'Grub', 'Spade', 'Brine', 'Soot', 'Pickle', 'Mallet', 'Ladle', 'Mutton', 'Gorse',
];
const TRAIT = ['Crow', 'Ash', 'Salt', 'Iron', 'Rust', 'Grey', 'Mud', 'Cold', 'Crook', 'Split', 'Bent', 'Pale', 'Stone', 'Rot'];
const BODY = ['foot', 'finger', 'hand', 'bone', 'tooth', 'jaw', 'knee', 'back', 'neck', 'skull', 'gut', 'shank'];
const COUNT = ['Two', 'Three', 'Half', 'No', 'Nine'];
const COUNTED = ['Toes', 'Fingers', 'Teeth', 'Ears', 'Thumbs', 'Knuckles'];

const TITLES = ['the Hollow', 'the Unquiet', 'the Pale', 'the Weeping', 'the Drowned', 'the Hungry', 'the Lantern-Eyed', 'the Mourner'];
const DREAD = ['Ash', 'Thorn', 'Grave', 'Rot', 'Moth', 'Hollow', 'Cinder', 'Gall'];
const DOER = ['weeper', 'binder', 'mouth', 'singer', 'walker', 'wright'];

/**
 * Names and titles from Glen Cook's The Black Company, which the sprites are inspired by but never
 * named after. Generated names must not match any of these.
 */
export const BLOCKLIST = [
  'croaker', 'one-eye', 'goblin', 'silent', 'elmo', 'raven', 'darling', 'lady', 'captain', 'lieutenant',
  'candy', 'otto', 'hagop', 'pawnbroker', 'tom-tom', 'murgen', 'sleepy', 'mogaba', 'swan', 'blade',
  'mather', 'lofty', 'spider', 'dominator', 'soulcatcher', 'limper', 'howler', 'stormbringer',
  'shapeshifter', 'nightcrawler', 'moonbiter', 'faceless man', 'hanged man', 'feather', 'journey',
  'whisper', 'bomanz', 'asa', 'longshadow', 'narayan', 'toadkiller dog', 'shivetya', 'kina', 'sahra',
  'thai dei', 'uncle doj', 'cordy', 'torque', 'willow', 'smoke', 'tracker',
];

const blocked = (name: string) => {
  const n = name.toLowerCase().replace(/^the /, '');
  return BLOCKLIST.includes(n) || BLOCKLIST.includes(`the ${n}`);
};

export function generatedName(seed: string, archetype: string, parts: Partial<Record<Slot, string>>, corrupted: boolean): string {
  const { pick, weighted } = dice(`${seed}:name:${archetype}`);
  const partWords = Object.values(parts).flatMap((id) => PART_WORDS[id] ?? []);
  for (let attempt = 0; attempt < 8; attempt++) {
    const name = corrupted
      ? weighted<() => string>([
          [() => pick(TITLES), 1],
          [() => pick(DREAD) + pick(DOER), 2],
        ])()
      : weighted<() => string>([
          [() => pick(partWords.length ? partWords : SINGLE), 3],
          [() => pick(SINGLE), 3],
          [() => pick(TRAIT) + pick(BODY), 3],
          [() => `${pick(COUNT)}-${pick(COUNTED)}`, 2],
        ])();
    if (!blocked(name)) return name;
  }
  return pick(SINGLE);
}
