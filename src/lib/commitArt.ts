// Renders SongParams as an inline SVG "visual score", styled as stained glass.
// column = step, height = pitch, shape = chord family (● major, ■ minor, ▲ sus, jagged = strange),
// tail = how long a note rings, colour = chord. Bass and kicks get their own lanes at the bottom.
// Pure string output so it works both at build time (Astro) and in the browser (toys).

import {
  STEPS,
  describe,
  stepDuration,
  type Family,
  type SongParams,
} from './commitParams.ts';

export const ART_WIDTH = 480;
export const ART_HEIGHT = 270;

const PAD_X = 20;
const COL = (ART_WIDTH - PAD_X * 2) / STEPS;
const TOP = 28;
const BOTTOM = 192;
const BASS_Y = 218;
const KICK_Y = 244;

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const f = (n: number) => n.toFixed(1);

function shape(family: Family, cx: number, cy: number, s: number, cls: string): string {
  const pts = (p: number[][]) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
  switch (family) {
    case 'major':
      return `<circle class="${cls}" cx="${f(cx)}" cy="${f(cy)}" r="${f(s)}"/>`;
    case 'minor':
      return `<rect class="${cls}" x="${f(cx - s)}" y="${f(cy - s)}" width="${f(s * 2)}" height="${f(s * 2)}"/>`;
    case 'sus':
      return `<polygon class="${cls}" points="${pts([[cx, cy - s * 1.15], [cx + s, cy + s * 0.85], [cx - s, cy + s * 0.85]])}"/>`;
    case 'strange':
      return `<polygon class="${cls}" points="${pts([
        [cx - s, cy + s], [cx - s * 0.5, cy - s], [cx, cy + s * 0.2], [cx + s * 0.5, cy - s], [cx + s, cy + s],
      ])}"/>`;
  }
}

const stepX = (step: number) => PAD_X + COL * step + COL / 2;

/** Fit the y-axis to this song's own pitch range (at least MIN_SPAN semitones) so chords spread out. */
const MIN_SPAN = 20;
function pitchScale(pitches: number[]) {
  let lo = Math.min(...pitches) - 1;
  let hi = Math.max(...pitches) + 1;
  if (hi - lo < MIN_SPAN) {
    const mid = (hi + lo) / 2;
    lo = mid - MIN_SPAN / 2;
    hi = mid + MIN_SPAN / 2;
  }
  return (pitch: number) => BOTTOM - ((pitch - lo) / (hi - lo)) * (BOTTOM - TOP);
}

export function renderCommitArt(params: SongParams): string {
  const { chords, events, kicks, backdrop } = params;
  const dur = stepDuration(params);
  const pitchY = pitchScale(events.map((e) => e.pitch));
  const parts: string[] = [];

  // Backdrop: a seeded rose window and a gothic arcade, like a cathedral wall behind the glass.
  const { x: rx, y: ry, r } = backdrop;
  const rose: string[] = [`<circle cx="${rx}" cy="${ry}" r="${r}"/>`];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    rose.push(`<line x1="${rx}" y1="${ry}" x2="${f(rx + Math.cos(a) * r)}" y2="${f(ry + Math.sin(a) * r)}"/>`);
    rose.push(`<circle cx="${f(rx + Math.cos(a) * r * 0.66)}" cy="${f(ry + Math.sin(a) * r * 0.66)}" r="${f(r * 0.24)}"/>`);
  }
  rose.push(`<circle cx="${rx}" cy="${ry}" r="${f(r * 0.3)}"/>`);
  parts.push(`<g class="backdrop c${backdrop.color}">${rose.join('')}</g>`);

  const y = backdrop.arcadeY;
  const arcade: string[] = [];
  for (let x = 0; x < ART_WIDTH; x += 40) {
    arcade.push(`M${x} ${y + 24}V${y}Q${x} ${y - 14} ${x + 20} ${y - 24}Q${x + 40} ${y - 14} ${x + 40} ${y}V${y + 24}`);
  }
  parts.push(`<path class="arcade" d="${arcade.join('')}"/>`);

  // Staff lines, then faint bar lines at each chord change.
  for (let i = 0; i < 5; i++) {
    const ly = TOP + ((BOTTOM - TOP) / 4) * i;
    parts.push(`<line class="staff" x1="${PAD_X / 2}" y1="${ly}" x2="${ART_WIDTH - PAD_X / 2}" y2="${ly}"/>`);
  }
  for (const chord of chords.slice(1)) {
    const bx = f(PAD_X + COL * chord.step);
    parts.push(`<line class="barline" x1="${bx}" y1="${TOP - 10}" x2="${bx}" y2="${BASS_Y + 8}"/>`);
  }
  parts.push(`<line class="kickline" x1="${PAD_X / 2}" y1="${KICK_Y}" x2="${ART_WIDTH - PAD_X / 2}" y2="${KICK_Y}"/>`);

  // Bass lane: one bar per chord.
  chords.forEach((chord) => {
    const x = PAD_X + COL * chord.step + 2;
    const w = COL * chord.length - 4;
    parts.push(
      `<g class="ev" data-step="${chord.step}" data-len="${chord.length}">` +
        `<rect class="ink" x="${f(x + 2)}" y="${BASS_Y - 3}" width="${f(w)}" height="8"/>` +
        `<rect class="note-shape c${chord.color}" x="${f(x)}" y="${BASS_Y - 5}" width="${f(w)}" height="8"/></g>`,
    );
  });

  // Notes: ghost (quiet bed) notes first so the played notes sit on top.
  const ordered = [...events].sort((a, b) => a.velocity - b.velocity);
  for (const ev of ordered) {
    const cx = stepX(ev.step) + (ev.delay / dur) * COL;
    const cy = pitchY(ev.pitch);
    const ghost = ev.velocity < 0.5;
    const s = 3 + ev.velocity * 3.5;
    const tailEnd = stepX(ev.step + ev.length) - COL / 2 - 2;
    const g: string[] = [];
    if (tailEnd > cx + s) {
      g.push(`<line class="tail t${ev.color}" x1="${f(cx)}" y1="${f(cy)}" x2="${f(tailEnd)}" y2="${f(cy)}"/>`);
    }
    if (!ghost) g.push(`<g class="shadow" transform="translate(2 2)">${shape(ev.family, cx, cy, s, 'ink')}</g>`);
    g.push(shape(ev.family, cx, cy, s, `note-shape c${ev.color}`));
    parts.push(`<g class="ev${ghost ? ' ghost' : ''}" data-step="${ev.step}" data-len="${ev.length}">${g.join('')}</g>`);
  }

  kicks.forEach((kick, i) => {
    if (!kick) return;
    const cx = stepX(i);
    parts.push(`<rect class="kick ev" data-step="${i}" data-len="1" x="${f(cx - 3.5)}" y="${KICK_Y - 3.5}" width="7" height="7"/>`);
  });

  const label = escapeXml(`Generated score for ${params.hash.slice(0, 7)}: ${describe(params)}`);
  return `<svg class="commit-art" viewBox="0 0 ${ART_WIDTH} ${ART_HEIGHT}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}
