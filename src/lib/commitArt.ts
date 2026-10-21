// Renders SongParams as an inline SVG "visual score".
// column = step, height = pitch, shape = waveform, size = note length, fill = palette colour.
// Pure string output so it works both at build time (Astro) and in the browser (toys).

import { DEGREES, STEPS, describe, type SongParams, type Wave } from './commitParams.ts';

export const ART_WIDTH = 400;
export const ART_HEIGHT = 240;

const PAD_X = 24;
const COL = (ART_WIDTH - PAD_X * 2) / STEPS;
const TOP = 36;
const BOTTOM = 188;
const KICK_Y = 214;

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function shape(wave: Wave, cx: number, cy: number, s: number, cls: string): string {
  const pts = (p: number[][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  switch (wave) {
    case 'sine':
      return `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${s}"/>`;
    case 'square':
      return `<rect class="${cls}" x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" rx="2"/>`;
    case 'triangle':
      return `<polygon class="${cls}" points="${pts([[cx, cy - s], [cx + s, cy + s], [cx - s, cy + s]])}"/>`;
    case 'sawtooth':
      return `<polygon class="${cls}" points="${pts([
        [cx - s, cy + s], [cx - s * 0.1, cy - s], [cx - s * 0.1, cy], [cx + s, cy - s], [cx + s, cy + s],
      ])}"/>`;
  }
}

export function renderCommitArt(params: SongParams): string {
  const { steps, backdrop } = params;
  const parts: string[] = [];

  // Backdrop: a seeded rose window and a gothic arcade, like a cathedral wall behind the glass.
  const { x: rx, y: ry, r } = backdrop;
  const rose: string[] = [`<circle cx="${rx}" cy="${ry}" r="${r}"/>`];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    const px = (rx + Math.cos(a) * r * 0.66).toFixed(1);
    const py = (ry + Math.sin(a) * r * 0.66).toFixed(1);
    rose.push(`<line x1="${rx}" y1="${ry}" x2="${(rx + Math.cos(a) * r).toFixed(1)}" y2="${(ry + Math.sin(a) * r).toFixed(1)}"/>`);
    rose.push(`<circle cx="${px}" cy="${py}" r="${(r * 0.24).toFixed(1)}"/>`);
  }
  rose.push(`<circle cx="${rx}" cy="${ry}" r="${(r * 0.3).toFixed(1)}"/>`);
  parts.push(`<g class="backdrop c${backdrop.color}">${rose.join('')}</g>`);

  const y = backdrop.arcadeY;
  const arcade: string[] = [];
  for (let x = 0; x < ART_WIDTH; x += 40) {
    arcade.push(`M${x} ${y + 24}V${y}Q${x} ${y - 14} ${x + 20} ${y - 24}Q${x + 40} ${y - 14} ${x + 40} ${y}V${y + 24}`);
  }
  parts.push(`<path class="arcade" d="${arcade.join('')}"/>`);

  // Staff lines.
  for (let i = 0; i < 5; i++) {
    const y = TOP + ((BOTTOM - TOP) / 4) * i;
    parts.push(`<line class="staff" x1="${PAD_X / 2}" y1="${y}" x2="${ART_WIDTH - PAD_X / 2}" y2="${y}"/>`);
  }
  parts.push(`<line class="kickline" x1="${PAD_X / 2}" y1="${KICK_Y}" x2="${ART_WIDTH - PAD_X / 2}" y2="${KICK_Y}"/>`);

  steps.forEach((step, i) => {
    const cx = PAD_X + COL * i + COL / 2;
    const cy = BOTTOM - ((BOTTOM - TOP) / (DEGREES - 1)) * step.degree;
    const s = 7 + step.length * 3;
    const g: string[] = [];
    if (step.on) {
      g.push(`<g class="shadow" transform="translate(3 3)">${shape(step.wave, cx, cy, s, 'ink')}</g>`);
      g.push(shape(step.wave, cx, cy, s, `note-shape c${step.color}`));
    } else {
      g.push(`<circle class="rest" cx="${cx}" cy="${cy}" r="2.5"/>`);
    }
    if (step.kick) {
      g.push(`<rect class="kick" x="${cx - 4}" y="${KICK_Y - 4}" width="8" height="8"/>`);
    }
    parts.push(`<g class="step" data-step="${i}">${g.join('')}</g>`);
  });

  const label = escapeXml(`Generated score for ${params.hash.slice(0, 7)}: ${describe(params)}`);
  return `<svg class="commit-art" viewBox="0 0 ${ART_WIDTH} ${ART_HEIGHT}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}
