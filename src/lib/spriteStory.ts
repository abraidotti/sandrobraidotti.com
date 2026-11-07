// A ledger entry for each sprite, in the voice of a dry company annalist: where they enlisted, why,
// what they carry, what they did, and how it ended (or hasn't yet). Seeded like everything else,
// so the same name always gets the same record. Places stay general; nothing names the books.

import { dice } from './seed.ts';
import type { SpriteParams } from './spriteParams.ts';

export interface LedgerLine {
  label: string;
  text: string;
}

const ORIGINS = [
  'a fishing town where the fish had long since given up',
  'a hill farm that burned the year they left it',
  'the slums under a cathedral nobody prays in any more',
  'a salt-marsh village with more graves than houses',
  'a garrison town on a border that kept moving',
  'a mining camp in the high country. The mine is still there; the camp is not',
  'a river barge, which they insist counts as a place',
  'a place they will not name, which is answer enough',
  'a monastery that asked them to leave, politely, twice',
  'the back of a debtor’s wagon',
  'a city that has since changed its name, and its mind',
  'a toll bridge they say their family owned. Nobody believes them',
  'a plague town, on the way out of it, at speed',
  'a travelling circus that went bankrupt in the same week',
  'a temple orphanage, which they describe as good training',
  'a lighthouse with no ships left to warn',
  'a vineyard on a hill that changed hands four times in one war',
  'a debtors’ prison, by way of a window',
  'a ferry crossing, where they were the ferry',
  'the last inn before the mountains, which is now the first ruin',
  'a city of bells, all of them stolen since',
  'a quarry town where everyone is the colour of dust',
];
const ENLISTED = ['Enlisted out of {o}.', 'Signed on at {o}.', 'Came to us from {o}.'];
const WHEN = [
  '', ' A wet spring.', ' The winter the rations ran out.', ' The same week as the fire.', ' Late, and in the rain.',
  ' Under a red moon, they would have us note.', ' Mid-retreat, which counts.', ' The day the old colours were burned.',
];

const REASONS = [
  'Says they joined for the pay. Has never been paid on time, and has not left.',
  'Debts, the kind with knives attached.',
  'Wanted to see the world. Has now seen a great deal of mud.',
  'A sibling in the ranks, once. Stayed after.',
  'Would not say. The sergeant did not ask.',
  'Needed somewhere the law would not follow.',
  'Lost a wager. Has honoured it for eleven years.',
  'Hunger, mostly.',
  'Revenge on a man who has since died of old age. They are still looking for someone else to blame.',
  'Thought it would be quieter than home. Has not said whether it is.',
  'A recruiting sergeant, a jug of wine, and a contract they could not read.',
  'Followed someone in. That someone deserted the next spring. They stayed.',
  'Says the company is the only family that ever paid them. It has not, strictly, paid them.',
  'Was told the company never retreats. Has since learned the word “regroup.”',
  'A prophecy, delivered by a drunk. They are waiting for it to come true.',
  'Ran out of other ideas.',
  'Soldiers burned their village. They joined the soldiers. Has not explained this.',
  'Wanted a uniform. The company does not have uniforms. They stayed anyway.',
  'The magistrate offered a choice. This was the other choice.',
];

const RANKS = [
  'Private. Has been offered corporal twice and declined, citing the paperwork.',
  'Corporal, by attrition.',
  'Sergeant. Earned it the hard way, which is the only way they have been allowed to do anything.',
  'Private, again.',
  'Standard-bearer, on account of being too stubborn to drop it.',
  'Unclear. The previous annalist’s handwriting is to blame.',
  'Corporal, sergeant, and corporal again, all in one bad week.',
  'Quartermaster’s assistant, which they treat as a holy office.',
  'Scout, on account of being the hardest to find.',
  'Drummer, though the drum was lost two campaigns ago.',
];
const WIZARD_RANKS = [
  'Company wizard, junior. There is no senior; there used to be.',
  'Listed as a cook, for reasons that made sense to an officer at the time.',
  'Apprentice to a wizard who has since become a small tree.',
  'Officially a physician. Unofficially, nobody asks.',
];

const KIN = [
  'None listed.',
  'A parent who writes every season. They answer every third letter.',
  'Three siblings, all of whom have asked that the company keep them.',
  'The quartermaster, by their own designation. The quartermaster has not agreed.',
  'A dog, left with a farmer. They ask after it.',
  'Listed as “whoever is left.”',
  'A spouse in a city they will not name, who may or may not know they are alive.',
  'A child they have never met, and a coin set aside every payday.',
  'An aunt who once fought off bandits with a ladle. They speak of little else.',
  'Their old sergeant, now dead. They have not updated it.',
  'Two names, both crossed out in their own hand.',
];

const MARKS = [
  'A brand on the left hand, partly burned over by a second, worse brand.',
  'Missing the top of one ear. Says a horse did it. The horse is not available for comment.',
  'A tattoo of a ship, though they have never been to sea.',
  'A scar from collarbone to hip that they show to recruits, for effect.',
  'None, which in this company is itself remarkable.',
  'A limp that comes and goes with the weather, and with the duty roster.',
  'Eyebrows that have grown back wrong since the explosion.',
  'A tattoo of a name that is not theirs.',
  'Teeth filed to points. Will not say by whom.',
  'A notch in the left ear, matched by a notch in the right, for symmetry.',
  'Freckles in the shape of a constellation, they insist.',
  'A ring of old rope burn around the neck. Nobody has asked twice.',
];

const HABITS = [
  'Sharpens everything. Has been asked to stop sharpening the spoons.',
  'Sings while digging latrines, which has made latrine duty strangely popular.',
  'Counts the dead after every fight, out loud, and gets it right.',
  'Keeps a tally of every bridge they have crossed. The tally is on their arm.',
  'Prays before battle to a god nobody else has heard of.',
  'Never sits with their back to a door.',
  'Talks to the horses. Some say the horses answer.',
  'Collects buttons from the fallen, ours and theirs. Has several hundred.',
  'Writes a letter home every night and burns it every morning.',
  'Cheats at cards so badly it must be a kind of honesty.',
  'Sleeps sitting up, boots on, blade in hand.',
  'Whistles the same four notes before every fight. Nobody knows the rest of the tune.',
  'Haggles with the dead for their boots. Usually wins.',
  'Feeds every stray in camp. The camp has many strays.',
];

const DEBTS = [
  'Six coppers to the cook, a knife to the farrier, and an apology to almost everyone.',
  'Nothing, they claim. The ledger disagrees.',
  'A life, to a corporal now dead. They pay it to the corporal’s replacement.',
  'A great deal of money to someone who is still looking for them.',
  'A song, to a tavern keeper, to be delivered on their return. They have not returned.',
  'Three days’ rations to a scout, payable in a dry pair of socks.',
  'A favour to a witch. The witch has not yet said what.',
  'Their boots, to whoever outlives them. Bids are being taken.',
  'An explanation to the quartermaster, overdue by two campaigns.',
  'Half a horse. Nobody is sure which half.',
];

const WOUNDS = [
  'Arrow to the thigh, healed crooked. Spear to the side, healed straight. Pride, unhealed.',
  'Two fingers short on the off hand.',
  'Struck by lightning once, they say. Their hair has not lain flat since.',
  'Nothing of note, which makes the others suspicious.',
  'A burn across the back from a fire they will not describe.',
  'Broken nose, three times, each time by a friend.',
  'Stabbed in the back by an ally, which they call the most honest wound they own.',
  'Bitten by something in a marsh. The bite still moves sometimes.',
  'A cracked skull, mended with a coin. The coin is foreign.',
  'Frostbite took three toes. They keep them in a pouch.',
  'Kicked by a mule, twice, by the same mule.',
  'Deaf in one ear since a siege engine went off beside them. Claims to prefer it.',
];

const DISCIPLINE = [
  'Reprimanded twice for dicing on watch, once for winning.',
  'Reprimanded for selling company boots back to the company.',
  'Reprimanded for insubordination, on the occasion they were right.',
  'No reprimands recorded. The annalist suspects bribery.',
  'Commended once, for an act of bravery nobody else saw.',
  'Commended for bringing back the wounded, including one who was not ours.',
  'Reprimanded for stealing a pig. Commended for sharing it.',
  'Reprimanded for deserting, briefly, to attend a wedding. Returned with cake.',
  'Reprimanded for fighting. The other party was reprimanded for losing.',
  'Commended for valour, posthumously, by mistake. Declined to correct it.',
  'Reprimanded for sleeping on watch. Claims to have been watching with their eyes closed.',
];

const ITEMS = [
  'a tin cup with three dents, each with a story',
  'a letter they cannot read and will not let anyone else read',
  'a lucky coin that has never once been lucky',
  'a pressed flower gone brown in oilcloth',
  'a child’s carved horse, missing a leg',
  'dice that are almost certainly loaded',
  'the key to a door that no longer exists',
  'a ledger of their own, kept in a cipher',
  'a whetstone worn to a sliver, and the patience to use it',
  'a list of names, some crossed out',
  'a pipe they never light, and tobacco they never share',
  'a holy relic of doubtful origin, and a strong opinion about it',
  'a bone flute made from something they will not name',
  'a map of a country nobody else has heard of',
  'a locket with a curl of hair the colour of nobody in the company',
  'a sack of seeds for a garden they mean to plant when this is all over',
  'an officer’s ring, which they say was a gift, and was not',
  'three teeth, not their own, on a string',
];
/** Items that come from what the sprite is actually wearing or holding. */
const PART_ITEMS: Record<string, string[]> = {
  falchion: ['a falchion with a notch in the edge they refuse to grind out'],
  spear: ['a spear with a rag tied below the head, for luck or for blood, depending on the day'],
  crossbow: ['a crossbow with eleven notches on the stock and room for many more', 'a quiver of bolts, each fletched by hand and named'],
  'broad hat': ['a broad hat that has stopped two arrows and one wedding'],
  'leather jerkin': ['a leather jerkin cut down from someone larger, and less lucky'],
  warhammer: ['a warhammer reforged so often none of the original remains. They still call it by its first name'],
  'great helm': ['a great helm with a dent the exact shape of a mace'],
  chainmail: ['a mail shirt missing a hand’s width of rings over the heart, which they find funny'],
  'lantern and dagger': ['a lantern that has never once gone out, even in the rain, even underwater', 'a dagger with a bone handle, and an answer ready if anyone asks whose bone'],
  'oilskin coat': ['an oilskin coat that smells of earth no matter how often it is washed, which is never'],
  staff: ['a staff of blackthorn that stays warm on cold nights'],
  hood: ['a hood they have not been seen without'],
  'kettle hat': ['a kettle hat with someone else’s name scratched inside it'],
  'ragged cloak': ['a cloak that is now more patch than cloak'],
  bearded: ['a beard they describe as load-bearing'],
  'long-haired': ['hair they cut for no one, and twice drew a knife over'],
  gambeson: ['a quilted coat with a different repair for every campaign'],
  robe: ['a robe stitched with symbols that rearrange themselves when nobody is looking'],
};

const FEATS: Record<string, string[]> = {
  sellsword: [
    'Held the left end of the line at the ford for most of an afternoon. The right end did not hold. We do not discuss the right end.',
    'Took a wall on the second try, which is the try that counts.',
    'Carried a wounded corporal four miles. The corporal complained the entire way and has never thanked them.',
    'Once disarmed a duellist with a frying pan. The pan is now company property.',
    'Claims more kills that summer than the plague. Nobody trusts the count, least of all the plague.',
    'Stood alone on a bridge for the length of a hymn. The enemy knew the hymn and waited for it to end.',
    'Brought down a mounted knight with a tent pole and a strong opinion.',
    'Led a night raid on the enemy’s supply wagons and came back with forty barrels of the wrong thing.',
    'Talked a mutiny down from the walls, then joined the next one.',
    'Was first through the breach. Was also first back out, which is why they are still alive.',
  ],
  crossbowman: [
    'Put a bolt through a herald’s banner at three hundred paces. The herald took the hint.',
    'Held a gatehouse alone through a night with forty bolts and thirty-nine excuses for the fortieth.',
    'Shot the rope on a hanging, mid-sentence. The sentence was not finished. Neither, it turned out, was the condemned.',
    'Has never missed, by their own account. The account is long and contains several redefinitions of “miss.”',
    'Brought down a wyvern-sized bird nobody could name. The company ate it. Nobody could name the taste either.',
  ],
  'fallen knight': [
    'Was a knight once, with lands and a horse. Lost both in a single afternoon and one bad decision.',
    'Unhorsed a champion at a tourney, then the champion’s brother, then the brother’s horse.',
    'Broke a shield wall by walking into it and not stopping.',
    'Still keeps the vigil of a dead order, alone, every midwinter.',
    'Took a gate off its hinges in three blows. The gate is on display somewhere. They are not invited.',
  ],
  gravedigger: [
    'Has buried half the company at one time or another. Speaks well of all of them, especially the ones who owed money.',
    'Dug a grave in frozen ground in an hour, then dug a second one beside it for the officer who said it could not be done.',
    'Walked into a crypt with a lantern and a knife, and came out with the lantern, the knife, and a prisoner.',
    'Knows every way into a graveyard after dark, and three ways out that do not involve the gate.',
    'Kept a night watch over the dead after a battle. In the morning there were fewer looters, and one more grave.',
  ],
  'hedge-wizard': [
    'Turned a river fog into something that ate a cavalry patrol. Has not repeated the trick, and goes quiet when asked.',
    'Kept the camp fires lit through a winter that wanted them out.',
    'Talked a bridge into holding for one more wagon.',
    'Cured the flux in half the company. The other half remains unsure what was in the cure.',
    'Lost a contest of wills with a minor sorcerer, then won the rematch, which was not a contest of wills.',
    'Called down a hailstorm on an enemy camp. Our camp was beside it.',
    'Found water in a dry country by asking it nicely.',
    'Sealed a plague pit with a word. Will not tell anyone the word.',
    'Made the enemy’s horses forget they were horses for most of a morning.',
    'Read the bones before a battle and refused to say what they said. We won. They still will not say.',
  ],
};
const ANY_FEATS = [
  'Survived the retreat from the hill country, which most did not.',
  'Has been mentioned in these records four times, three of them as a complaint.',
  'Once went three days without sleep to guard a prisoner who turned out to be the wrong man.',
  'Won the company its winter quarters in a game of cards against a duke.',
  'Kept a dying sergeant laughing until the end.',
  'Has buried more friends than most people have had.',
  'Found the way out of a burning city by smell alone.',
];

const DEATHS = [
  'Fell at a river crossing, still arguing about the order of march.',
  'Died of a fever in winter camp, two days short of spring.',
  'Killed holding a door so the rest could get through it. The door held too.',
  'Died in their sleep, which nobody who knew them believed.',
  'Went over the wall one night and did not come back. Their pack was found folded.',
  'Buried on a hillside with their boots on, as requested, and their dice, as stolen.',
  'Drowned crossing a river they had sworn was shallow. It was, mostly.',
  'Lost in the fog on a night march. The fog has not given anyone else back either.',
  'Died laughing at something the sergeant said. The sergeant has not been funny since.',
  'Struck by a stray arrow while complaining about stray arrows.',
  'Thrown from a horse they had just finished boasting about.',
  'Died covering the retreat. Several of us owe them the rest of our lives, and know it.',
  'Poisoned at a feast held in the company’s honour. The host has since been paid a visit.',
  'Walked into the sea one grey morning, and kept walking.',
];
const STATUSES = [
  'Still with us, against the odds and most of the officers.',
  'Expected to die badly, and late.',
  'Promoted twice, demoted three times. Currently a private, and content.',
  'Will outlive these records, if only to spite them.',
  'On the sick list again. Suspected of enjoying it.',
  'Alive. Unimpressed about it.',
  'Has asked to be left out of these records. Request denied, and recorded.',
  'Missing, presumed drunk.',
  'Retired twice. Returned twice. Will not discuss the farm.',
  'Under arrest, for the third time this season, over the same pig.',
  'Alive, though the healers have stopped promising.',
  'Deserted last spring. Came back in summer with an excuse nobody believed and a cart of wine nobody refused.',
  'Absent without leave. Their dice are being held as surety.',
];
const CORRUPTED = [
  'Since the night in the drowned chapel, their shadow arrives a moment late.',
  'The annalist has stopped writing down what they say in their sleep.',
  'Something answers when they call. They no longer call.',
  'No longer eats. Nobody has said so aloud.',
  'The dogs will not go near them. Lately, neither will the sergeant.',
  'Their reflection has stopped keeping time with them.',
  'Speaks, sometimes, in a voice from much further away.',
  'The wounded heal faster near them, and then stop healing at all.',
  'Came back from the dead once already. Has not mentioned it, and neither have we.',
  'Their tent is always cold. In summer, frost forms on the inside.',
];

export function spriteStory(params: SpriteParams): LedgerLine[] {
  const { rand, pick } = dice(`${params.seed}:story`);
  const lines: LedgerLine[] = [
    { label: 'Enlisted', text: pick(ENLISTED).replace('{o}', pick(ORIGINS)) + pick(WHEN) },
  ];

  const wizard = params.archetype === 'hedge-wizard';
  const partItems = Object.values(params.parts).flatMap((id) => PART_ITEMS[id] ?? []);
  // Every possible middle entry, in ledger order; each record keeps two to four of them.
  const middle: LedgerLine[] = [
    { label: 'Rank', text: pick(wizard && rand() < 0.5 ? WIZARD_RANKS : RANKS) },
    { label: 'Reason given', text: pick(REASONS) },
    { label: 'Next of kin', text: pick(KIN) },
    { label: 'Carries', text: (partItems.length && rand() < 0.6 ? pick(partItems) : pick(ITEMS)).replace(/^./, (c) => c.toUpperCase()) + '.' },
    { label: 'Marks', text: pick(MARKS) },
    { label: 'Habits', text: pick(HABITS) },
    { label: 'Owes', text: pick(DEBTS) },
    { label: 'Wounds', text: pick(WOUNDS) },
    { label: 'Of note', text: pick(rand() < 0.75 ? FEATS[params.archetype] ?? ANY_FEATS : ANY_FEATS) },
    { label: 'Disciplinary', text: pick(DISCIPLINE) },
  ];
  const keep = new Set<number>();
  const count = 2 + Math.floor(rand() * 3);
  while (keep.size < count) keep.add(Math.floor(rand() * middle.length));
  lines.push(...middle.filter((_, i) => keep.has(i)));

  if (params.corrupted) lines.push({ label: 'Remarks', text: pick(CORRUPTED) });
  else if (rand() < 0.35) lines.push({ label: 'Fate', text: pick(DEATHS) });
  else lines.push({ label: 'Status', text: pick(STATUSES) });
  return lines;
}
