// Renders SpriteParams as pixels: stacks the parts in draw order, colours them from the palette,
// adds a dark outline, and makes a second "breathing" frame for the idle animation.
// Each frame also carries hidden eyelids (for blinking) and flares over glowing pixels (for
// flickering), which CSS shows and hides.
// Pure string output so it works both at build time (Astro) and in the browser (machines).

import { dice } from './seed.ts';
import { DEEP, DRAW_ORDER, EYE, GLOW, LEGEND, OUTLINE, SIZE, SMEAR, partById, partLayer, type ActionFrame } from './spriteParts.ts';
import { kindOf, mix, type SpriteParams } from './spriteParams.ts';

/** A frame: SIZE rows of SIZE colours, null where transparent. */
export type Frame = (string | null)[][];

/** The upper body (rows up to the belt) sinks a pixel on the second frame. */
const WAIST = 20;
/** On the second frame, the cloak's hem (from this row down) stirs a pixel. */
const HEM = 23;
/** Seconds per breath; blinks land on a whole number of breaths so they stay in step. */
const BREATH = 1.4;

/**
 * Stacks the parts. With `sway`, the cloak's hem stirs. With an action frame, the weapon is replaced
 * by the frame's drawing, laid over everything after the body leans.
 */
function charGrid(params: SpriteParams, { sway = false, action }: { sway?: boolean; action?: ActionFrame } = {}): string[][] {
  let grid = Array.from({ length: SIZE }, () => Array<string>(SIZE).fill('.'));
  for (const [slot, layer] of DRAW_ORDER) {
    const id = params.parts[slot];
    if (!id || (action && slot === 'weapon' && layer === 'main')) continue;
    for (const [y, x, pixels] of partLayer(partById(id), params.build, layer)) {
      const shift = sway && slot === 'cloak' && layer === 'back' && y >= HEM ? 1 : 0;
      [...pixels].forEach((ch, i) => {
        if (ch !== '.') grid[y][x + i + shift] = ch;
      });
    }
  }
  if (action) {
    const lean = action.lean ?? 0;
    grid = grid.map((row, y) => (y <= WAIST ? row.map((_, x) => row[x + lean] ?? '.') : row));
    for (const [y, x, pixels] of action.runs) {
      [...pixels].forEach((ch, i) => {
        if (ch !== '.') grid[y][x + i] = ch === '_' ? '.' : ch;
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
  if (meaning === 'smear') return SMEAR;
  if (meaning === 'erase') return null;
  const [material, shade] = meaning;
  return params.palette[material][shade];
}

/** Outlines solid pixels only: a motion smear stays soft-edged. */
function outline(frame: Frame): Frame {
  return frame.map((row, y) =>
    row.map((c, x) => {
      if (c) return c;
      const near = [frame[y - 1]?.[x], frame[y + 1]?.[x], row[x - 1], row[x + 1]];
      return near.some((n) => n && n !== SMEAR) ? OUTLINE : null;
    }),
  );
}

const glows = (params: SpriteParams, ch: string) => LEGEND[ch] === 'glow' || (params.corrupted && LEGEND[ch] === 'eye');

/** The idle animation's two frames, with their eyelids and flares. */
function frameSet(params: SpriteParams) {
  const grids = [charGrid(params), breathe(charGrid(params, { sway: true }))];
  const lid = params.palette.skin[2];
  const flare = mix(params.corrupted ? GLOW.corrupt : GLOW.ember, '#ffffff', 0.45);
  return grids.map((g) => ({
    frame: outline(g.map((row) => row.map((ch) => colour(params, ch)))),
    lids: g.map((row) => row.map((ch) => (LEGEND[ch] === 'eye' ? lid : null))),
    flares: g.map((row) => row.map((ch) => (glows(params, ch) ? flare : null))),
  }));
}

/** The idle animation's two frames. */
export function spriteFrames(params: SpriteParams): [Frame, Frame] {
  const [a, b] = frameSet(params);
  return [a.frame, b.frame];
}

/** What clicking the sprite does, for screen readers: "Make Gallbinder attack". */
export function actLabel(params: SpriteParams): string {
  const verb = params.parts.weapon ? partById(params.parts.weapon).action?.verb : undefined;
  return verb ? `Make ${params.name} ${verb}` : params.name;
}

/** The weapon's action, if it has one: its verb and each frame with its duration. */
export function spriteAction(params: SpriteParams) {
  const action = params.parts.weapon ? partById(params.parts.weapon).action : undefined;
  if (!action) return undefined;
  return {
    verb: action.verb,
    frames: action.frames.map((f) => ({ ms: f.ms, frame: outline(charGrid(params, { action: f }).map((row) => row.map((ch) => colour(params, ch)))) })),
  };
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
  const label = escapeXml(`${params.name}, ${kindOf(params)}`);
  const frames = frameSet(params)
    .map(({ frame, lids, flares }, i) =>
      `<g class="frame-${'ab'[i]}">${rects(frame)}<g class="lids">${rects(lids)}</g><g class="flares">${rects(flares)}</g></g>`,
    )
    .join('');
  // Everyone blinks every few breaths, each on their own beat.
  const blinkDelay = -dice(`${params.seed}:blink`).int(0, 3) * BREATH;
  // Action frames stay hidden until a click steps through them (see the sprite machine page).
  const action = spriteAction(params);
  const acts = action?.frames.map(({ frame }, i) => `<g class="act act-${i}">${rects(frame)}</g>`).join('') ?? '';
  const actAttrs = action ? ` data-verb="${action.verb}" data-act-ms="${action.frames.map((f) => f.ms).join(',')}"` : '';
  return (
    `<svg class="sprite-art" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges" role="img" aria-label="${label}" style="--blink-delay:${blinkDelay}s"${actAttrs} xmlns="http://www.w3.org/2000/svg">` +
    `${frames}${acts}</svg>`
  );
}
