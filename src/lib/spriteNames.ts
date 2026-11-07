// Generated names for sprites seeded by a hash. Soldiers go by nicknames; the corrupted go by titles.
// Names roll on their own seed, so changing these lists never changes anyone's sprite.

import { dice } from './seed.ts';
import type { Slot } from './spriteParts.ts';

/** Nicknames a part can lend, so the name fits the look. */
const PART_WORDS: Record<string, string[]> = {
  falchion: ['Notch', 'Hack', 'Cleaver', 'Chopper'],
  spear: ['Skewer', 'Reach', 'Long', 'Prod'],
  crossbow: ['Quarrel', 'Latch', 'Crank', 'Twang'],
  'broad hat': ['Brim', 'Shady'],
  'leather jerkin': ['Hide', 'Strap'],
  warhammer: ['Maul', 'Anvil', 'Knock', 'Thud'],
  'great helm': ['Bucket', 'Visor'],
  chainmail: ['Rings', 'Rattle'],
  'lantern and dagger': ['Wick', 'Lamp', 'Shiv', 'Gloam'],
  'oilskin coat': ['Damp', 'Oily'],
  sickle: ['Hook', 'Reaper', 'Crescent'],
  'hand axe': ['Hatchet', 'Chop', 'Kindling'],
  'flanged mace': ['Flange', 'Knuckle', 'Mace'],
  spade: ['Shovel', 'Digger', 'Clod'],
  'round shield': ['Boss', 'Board'],
  'heater shield': ['Wall', 'Bulwark'],
  grimoire: ['Ink', 'Pages', 'Rune'],
  'pointed cowl': ['Cowl', 'Hush', 'Steeple'],
  'cult robe': ['Deacon', 'Chanter'],
  shortbow: ['Fletch', 'Nock', 'Arrow', 'Plume'],
  'feathered cap': ['Feather', 'Jay'],
  eyepatch: ['Patch', 'Squint', 'Wink'],
  scar: ['Seam', 'Stitch', 'Scar'],
  stubble: ['Scruff', 'Bristle'],
  'war paint': ['Daub', 'Smear', 'Paint'],
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

/** The Taken go by grander titles than the merely corrupted. */
const TAKEN_TITLES = [
  'the Veiled', 'the Unbowed', 'Hushwalker', 'Ashcrown', 'the Weeping Lantern', 'the Thousand Doors', 'Gravesong',
  'the Pale Hand', 'Dusksworn', 'the Quiet Flood', 'the Stitched King', 'Thornqueen', 'the Hollow Bell',
];
/** What frightened people call a forvalaka. */
const BEAST_NAMES = [
  'the Spotted Hunger', 'the Thing in the Reeds', 'Velvet Paws', 'the Night Cat', 'Old Rosette', 'the Grinning Dark',
  'Soft-Foot', 'the Kitchen Ghost', 'Whiskers-in-the-Well', 'the Long Purr',
];

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
  const roll = (): string => {
    if (archetype === 'forvalaka') return pick(BEAST_NAMES);
    if (archetype === 'taken') return pick(TAKEN_TITLES);
    if (corrupted) {
      return weighted<() => string>([
        [() => pick(TITLES), 1],
        [() => pick(DREAD) + pick(DOER), 2],
      ])();
    }
    return weighted<() => string>([
      [() => pick(partWords.length ? partWords : SINGLE), 3],
      [() => pick(SINGLE), 3],
      [() => pick(TRAIT) + pick(BODY), 3],
      [() => `${pick(COUNT)}-${pick(COUNTED)}`, 2],
    ])();
  };
  for (let attempt = 0; attempt < 8; attempt++) {
    const name = roll();
    if (!blocked(name)) return name;
  }
  return pick(SINGLE);
}
