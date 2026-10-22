import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BAR, STEPS, STEPS_PER_CHORD, commitParams, progression } from '../src/lib/commitParams.ts';
import { renderCommitArt } from '../src/lib/commitArt.ts';

const HASHES = [
  '270adff4c8e0b1f6a2d3e4f5a6b7c8d9e0f1a2b3',
  '8400153aaaabbbbccccddddeeeeffff000011112',
  'not even a hash',
];

// A spread of hashes for statistical checks.
const MANY = Array.from({ length: 300 }, (_, i) => `hash-${i}`);

test('same hash always produces identical params and SVG', () => {
  for (const hash of HASHES) {
    assert.deepEqual(commitParams(hash), commitParams(hash));
    assert.equal(renderCommitArt(commitParams(hash)), renderCommitArt(commitParams(hash)));
  }
});

test('different hashes produce different songs', () => {
  const svgs = new Set(HASHES.map((h) => renderCommitArt(commitParams(h))));
  assert.equal(svgs.size, HASHES.length);
});

test('songs are 32 steps of 8 voice-led chords', () => {
  for (const hash of MANY) {
    const p = commitParams(hash);
    for (const lane of [p.drums.kick, p.drums.snare, p.drums.hat]) assert.equal(lane.length, STEPS);
    assert.equal(p.chords.length, STEPS / STEPS_PER_CHORD);
    assert.ok(p.tempo >= 76 && p.tempo <= 112);
    for (const c of p.chords) {
      assert.ok(c.notes.length >= 3 && c.notes.length <= 5, `${hash}: ${c.name} has ${c.notes.length} notes`);
      assert.ok(c.notes[0] >= 50 && c.notes[c.notes.length - 1] <= 88, `${hash}: ${c.name} voiced out of range`);
      assert.ok(c.bass >= 36 && c.bass < 48);
      assert.ok(!c.name.includes('*'), `${hash}: unnamed chord ${c.name}`);
    }
    for (const e of p.events) {
      assert.ok(e.step >= 0 && e.step < STEPS && e.velocity > 0 && e.velocity <= 1);
    }
  }
});

test('voice leading keeps chord changes smooth', () => {
  let total = 0;
  let moves = 0;
  for (const hash of MANY) {
    const { chords } = commitParams(hash);
    for (let i = 1; i < chords.length; i++) {
      total += Math.abs(chords[i].notes[0] - chords[i - 1].notes[0]);
      moves++;
    }
  }
  assert.ok(total / moves < 6, `average lowest-voice jump ${total / moves} semitones`);
});

test('drums are a regular beat: every bar the same except the last', () => {
  for (const hash of MANY) {
    const { drums, lateEntry } = commitParams(hash);
    // A late entry rewrites the first two eighths of bar 3; compare the rest of the bar.
    const bar = (lane: (boolean | number)[], n: number) =>
      lane.slice(n * BAR + (lateEntry && n === 2 ? 2 : 0), (n + 1) * BAR).join();
    const barTail = (lane: (boolean | number)[], n: number) => lane.slice(n * BAR + 2, (n + 1) * BAR).join();
    for (const lane of [drums.kick, drums.snare, drums.hat]) {
      for (let n = 1; n < STEPS / BAR - 1; n++) {
        const reference = lateEntry && n === 2 ? barTail(lane, 0) : bar(lane, 0);
        assert.equal(bar(lane, n), reference, `${hash}: bar ${n} differs`);
      }
    }
    for (let n = 0; n < STEPS / BAR; n++) assert.ok(drums.kick[n * BAR], `${hash}: no kick on the downbeat of bar ${n}`);
  }
});

test('late entry: bar 3 opens with a lone kick, chord arrives on the third eighth', () => {
  const late = MANY.filter((h) => commitParams(h).lateEntry);
  assert.ok(late.length > MANY.length * 0.2 && late.length < MANY.length * 0.5, `${late.length}/${MANY.length} late entries`);
  const start = 2 * BAR;
  for (const hash of late) {
    const { drums, events, chords } = commitParams(hash);
    assert.ok(drums.kick[start] && !drums.kick[start + 1], `${hash}: kick pattern`);
    assert.ok(!drums.snare[start] && !drums.snare[start + 1] && !drums.hat[start] && !drums.hat[start + 1], `${hash}: drums not silent`);
    assert.ok(!events.some((e) => e.step >= start && e.step < start + 2), `${hash}: a note sounds before the entry`);
    assert.ok(events.some((e) => e.step === start + 2), `${hash}: nothing enters on the third eighth`);
    assert.equal(chords[start / STEPS_PER_CHORD].step, start + 2);
    // Nothing from the previous chord rings into the gap.
    assert.ok(!events.some((e) => e.step < start && e.step + e.length > start), `${hash}: earlier note rings into the gap`);
  }
});

test('mostly dreamy, sometimes unsettling', () => {
  const uneasy = MANY.filter((h) => commitParams(h).chords.some((c) => c.family === 'strange')).length;
  assert.ok(uneasy > MANY.length * 0.15 && uneasy < MANY.length * 0.5, `${uneasy}/${MANY.length} songs have strange chords`);
});

test('SVG escapes user-supplied text', () => {
  const svg = renderCommitArt(commitParams('<script>"x"</script>'));
  assert.ok(!svg.includes('<script>'));
});

test('snapshot: known hash keeps its song', () => {
  // If this fails, every existing post's art and tune changed. Only update it on purpose.
  const p = commitParams(HASHES[0]);
  assert.deepEqual(
    { mode: p.modeName, tempo: p.tempo, timbre: p.timbre, perform: p.perform, chords: progression(p) },
    SNAPSHOT,
  );
});

const SNAPSHOT = {
  mode: 'aeolian',
  tempo: 89,
  timbre: 'velvet',
  perform: 'strum',
  chords: 'Dm7 → Fmaj9 → Gm7 → Am7 → D7sus2 → Fmaj9 → Gm9 → B♭maj7',
};
