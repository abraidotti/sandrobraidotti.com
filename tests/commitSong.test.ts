import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STEPS, DEGREES, commitParams } from '../src/lib/commitParams.ts';
import { renderCommitArt } from '../src/lib/commitArt.ts';

const HASHES = [
  '270adff4c8e0b1f6a2d3e4f5a6b7c8d9e0f1a2b3',
  '8400153aaaabbbbccccddddeeeeffff000011112',
  'not even a hash',
];

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

test('params stay in musical ranges', () => {
  for (const hash of HASHES) {
    const p = commitParams(hash);
    assert.equal(p.steps.length, STEPS);
    assert.ok(p.steps[0].on, 'first step always plays');
    assert.ok(p.tempo >= 84 && p.tempo <= 140);
    for (const s of p.steps) {
      assert.ok(s.degree >= 0 && s.degree < DEGREES);
      assert.ok(s.length >= 1 && s.length <= 3);
      assert.ok(s.color >= 1 && s.color <= 5);
    }
  }
});

test('SVG escapes user-supplied text', () => {
  const svg = renderCommitArt(commitParams('<script>"x"</script>'));
  assert.ok(!svg.includes('<script>'));
});

test('snapshot: known hash keeps its song', () => {
  // If this fails, every existing post's art and tune changed. Only update it on purpose.
  const p = commitParams(HASHES[0]);
  assert.deepEqual(
    { root: p.root, scale: p.scaleName, tempo: p.tempo, on: p.steps.map((s) => (s.on ? 1 : 0)).join('') },
    SNAPSHOT,
  );
});

const SNAPSHOT = { root: 47, scale: 'major pentatonic', tempo: 104, on: '1101101111011111' };
