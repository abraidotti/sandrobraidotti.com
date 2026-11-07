// Renders SpriteParams as pixels: stacks the parts in draw order, colours them from the palette,
// adds a dark outline, and makes a second "breathing" frame for the idle animation.
// Pure string output so it works both at build time (Astro) and in the browser (machines).

import { DEEP, DRAW_ORDER, EYE, GLOW, LEGEND, OUTLINE, SIZE, partById, partLayer } from './spriteParts.ts';
import { mix, type SpriteParams } from './spriteParams.ts';

/** A frame: SIZE rows of SIZE colours, null where transparent. */
export type Frame = (string | null)[][];

/** The upper body (rows up to the belt) sinks a pixel on the second frame. */
const WAIST = 20;

function charGrid(params: SpriteParams): string[][] {
  const grid = Array.from({ length: SIZE }, () => Array<string>(SIZE).fill('.'));
  for (const [slot, layer] of DRAW_ORDER) {
    const id = params.parts[slot];
    if (!id) continue;
    for (const [y, x, pixels] of partLayer(partById(id), params.build, layer)) {
      [...pixels].forEach((ch, i) => {
        if (ch !== '.') grid[y][x + i] = ch;
      });
    }
  }
  return grid;
}

function breathe(grid: string[][]): string[][] {
  return grid.map((row, y) =>
    row.map((ch, x) => {
      const above = y > 0 && y - 1 <= WAIST ? grid[y - 1][x] : '.';
      if (y <= WAIST) return above;
      return above !== '.' ? above : ch;
    }),
  );
}

const luminance = (hex: string) => [1, 3, 5].reduce((sum, i, k) => sum + parseInt(hex.slice(i, i + 2), 16) * [0.3, 0.59, 0.11][k], 0);

/** Brows always sit darker than the skin: the hair's shadow, or a deepened skin shadow if that's darker. */
function brow(params: SpriteParams): string {
  const hair = params.palette.hair[2];
  const skin = mix(params.palette.skin[2], OUTLINE, 0.45);
  return luminance(hair) < luminance(skin) ? hair : skin;
}

function colour(params: SpriteParams, ch: string): string | null {
  if (ch === '.') return null;
  const meaning = LEGEND[ch];
  const glow = params.corrupted ? GLOW.corrupt : GLOW.ember;
  if (meaning === 'eye') return params.corrupted ? glow : EYE;
  if (meaning === 'brow') return brow(params);
  if (meaning === 'deep') return DEEP;
  if (meaning === 'glow') return glow;
  const [material, shade] = meaning;
  return params.palette[material][shade];
}

function outline(frame: Frame): Frame {
  return frame.map((row, y) =>
    row.map((c, x) => {
      if (c) return c;
      const near = [frame[y - 1]?.[x], frame[y + 1]?.[x], row[x - 1], row[x + 1]];
      return near.some(Boolean) ? OUTLINE : null;
    }),
  );
}

/** The idle animation's two frames. */
export function spriteFrames(params: SpriteParams): [Frame, Frame] {
  const grid = charGrid(params);
  const toFrame = (g: string[][]) => outline(g.map((row) => row.map((ch) => colour(params, ch))));
  return [toFrame(grid), toFrame(breathe(grid))];
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** One rect per horizontal run of a colour. */
function rects(frame: Frame): string {
  const out: string[] = [];
  frame.forEach((row, y) => {
    for (let x = 0; x < SIZE; ) {
      const c = row[x];
      let end = x + 1;
      while (end < SIZE && row[end] === c) end++;
      if (c) out.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${c}"/>`);
      x = end;
    }
  });
  return out.join('');
}

export function renderSprite(params: SpriteParams): string {
  const [a, b] = spriteFrames(params);
  const label = escapeXml(`${params.name}, a ${params.corrupted ? 'corrupted ' : ''}${params.archetype}`);
  return (
    `<svg class="sprite-art" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">` +
    `<g class="frame-a">${rects(a)}</g><g class="frame-b">${rects(b)}</g></svg>`
  );
}
