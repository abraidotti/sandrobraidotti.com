import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRAW_ORDER, LEGEND, PARTS, SIZE } from '../src/lib/spriteParts.ts';
import { ARCHETYPES, displayName, spriteParams } from '../src/lib/spriteParams.ts';
import { BLOCKLIST } from '../src/lib/spriteNames.ts';
import { renderSprite, spriteFrames } from '../src/lib/spriteArt.ts';
import { spriteStory } from '../src/lib/spriteStory.ts';

const MANY = Array.from({ length: 500 }, (_, i) => `seed-${i}`);

test('parts use known pixels and keep a 1px margin for the outline', () => {
  for (const part of PARTS) {
    for (const [layer, runs] of [part.layers, ...Object.values(part.variants ?? {})].flatMap((l) => Object.entries(l))) {
      assert.ok(DRAW_ORDER.some(([s, l]) => s === part.slot && l === layer), `${part.id}: ${layer} layer is never drawn`);
      for (const [y, x, pixels] of runs!) {
        assert.ok(y >= 1 && y <= SIZE - 2, `${part.id}: row ${y} outside the margin`);
        assert.ok(x >= 1 && x + pixels.length <= SIZE - 1, `${part.id}: row ${y} runs outside the margin`);
        for (const ch of pixels) assert.ok(ch === '.' || ch in LEGEND, `${part.id}: unknown pixel "${ch}"`);
      }
    }
  }
});

test('action frames use known pixels, stay inside the margin, and have a duration', () => {
  for (const part of PARTS.filter((p) => p.action)) {
    assert.equal(part.slot, 'weapon', `${part.id}: only weapons act`);
    for (const frame of part.action!.frames) {
      assert.ok(frame.ms > 0, `${part.id}: frame without a duration`);
      for (const [y, x, pixels] of frame.runs) {
        assert.ok(y >= 1 && y <= SIZE - 2 && x >= 1 && x + pixels.length <= SIZE - 1, `${part.id}: action row ${y} outside the margin`);
        for (const ch of pixels) assert.ok(ch === '.' || ch in LEGEND, `${part.id}: unknown pixel "${ch}"`);
      }
    }
  }
});

test('a sword-carrier renders its attack, ready to play', () => {
  const seed = MANY.find((s) => spriteParams(s).parts.weapon === 'falchion')!;
  const svg = renderSprite(spriteParams(seed));
  assert.match(svg, /data-verb="attack" data-act-ms="\d+,\d+,\d+"/);
  for (const i of [0, 1, 2]) assert.ok(svg.includes(`class="act act-${i}"`), `missing action frame ${i}`);
});

test('archetypes only reference parts in the right slot', () => {
  for (const archetype of ARCHETYPES) {
    for (const [slot, ids] of Object.entries(archetype.parts)) {
      for (const id of ids) {
        if (id) assert.equal(PARTS.find((p) => p.id === id)?.slot, slot, `${archetype.id}: ${id}`);
      }
    }
  }
});

test('every build turns up, and only wears parts drawn for it', () => {
  const seen = new Set<string>();
  for (const seed of MANY) {
    const p = spriteParams(seed);
    seen.add(p.build);
    for (const id of Object.values(p.parts)) {
      const allowed = PARTS.find((part) => part.id === id)!.builds;
      assert.ok(!allowed || allowed.includes(p.build), `${seed}: ${p.build} wearing ${id}`);
    }
  }
  assert.deepEqual([...seen].sort(), ['androgynous', 'feminine', 'masculine']);
});

test('same seed always makes the same sprite and name', () => {
  for (const seed of ['bones', '270adff4c8e0b1f6a2d3e4f5a6b7c8d9e0f1a2b3']) {
    assert.deepEqual(spriteParams(seed), spriteParams(seed));
    assert.equal(renderSprite(spriteParams(seed)), renderSprite(spriteParams(seed)));
  }
});

test('frames are 32×32 and the second one breathes', () => {
  for (const seed of MANY.slice(0, 50)) {
    const [a, b] = spriteFrames(spriteParams(seed));
    for (const frame of [a, b]) {
      assert.equal(frame.length, SIZE);
      for (const row of frame) assert.equal(row.length, SIZE);
    }
    assert.notDeepEqual(a, b);
  }
});

test('every sprite can blink, and glowing pixels can flicker', () => {
  for (const seed of MANY.slice(0, 50)) {
    const p = spriteParams(seed);
    const svg = renderSprite(p);
    // Both frames close both eyes.
    assert.equal((svg.match(/<g class="lids"><rect/g) ?? []).length, 2, `${seed}: no eyelids`);
    const glowing = p.corrupted || Object.values(p.parts).some((id) => JSON.stringify(PARTS.find((part) => part.id === id)!.layers).includes('v'));
    assert.equal(/<g class="flares"><rect/.test(svg), glowing, `${seed}: flares`);
  }
});

test('typed text is the name, as typed; hashes get generated names', () => {
  const typed = spriteParams('  Bartholomew ', true);
  assert.equal(typed.name, 'Bartholomew');
  assert.equal(typed.typed, true);
  // Same character whatever the capitals.
  assert.deepEqual(spriteParams('bartholomew', true).parts, typed.parts);
  const hashed = spriteParams('1a2b3c4d5e');
  assert.equal(hashed.typed, false);
  assert.notEqual(hashed.name, '1a2b3c4d5e');
  assert.ok(hashed.name.length > 0);
});

test('generated names never borrow from the books', () => {
  for (const seed of MANY) {
    const { name } = spriteParams(seed);
    const n = name.toLowerCase().replace(/^the /, '');
    assert.ok(!BLOCKLIST.includes(n) && !BLOCKLIST.includes(`the ${n}`), `${seed}: ${name}`);
  }
});

test('some sprites come out corrupted, most do not', () => {
  const corrupted = MANY.filter((s) => spriteParams(s).corrupted).length;
  assert.ok(corrupted > MANY.length * 0.1 && corrupted < MANY.length * 0.3, `${corrupted}/${MANY.length} corrupted`);
});

test('every character gets a ledger entry: enlisted first, an ending last', () => {
  for (const seed of MANY) {
    const p = spriteParams(seed);
    const story = spriteStory(p);
    assert.deepEqual(story, spriteStory(spriteParams(seed)), `${seed}: story not stable`);
    assert.ok(story.length >= 4 && story.length <= 6, `${seed}: ${story.length} lines`);
    assert.equal(story[0].label, 'Enlisted');
    assert.equal(story.at(-1)!.label, p.corrupted ? 'Remarks' : story.at(-1)!.label === 'Fate' ? 'Fate' : 'Status');
  }
});

test('ledgers say "they" and keep clear of the books', () => {
  const PLACES = ['juniper', 'charm', 'roses', 'oar', 'beryl', 'gea-xle', 'taglios', 'opal', 'barrowland', 'khatovar', 'dejagore', 'kiaulune', 'forsberg', 'the plain of fear'];
  const text = MANY.flatMap((s) => spriteStory(spriteParams(s)).map((l) => l.text)).join(' ').toLowerCase();
  assert.doesNotMatch(text, /\b(he|she|his|her|hers|him|himself|herself)\b/);
  for (const place of PLACES) assert.ok(!new RegExp(`\\b${place}\\b`).test(text), `mentions ${place}`);
});

test('long names are shortened for display only', () => {
  const long = 'Bartholomew of the Seventeen Drowned Bells';
  assert.equal(spriteParams(long, true).name, long);
  assert.equal(displayName(long).length, 24);
});

test('SVG escapes typed names', () => {
  const svg = renderSprite(spriteParams('<script>"x"</script>', true));
  assert.ok(!svg.includes('<script>'));
});
