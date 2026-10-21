// Client-side wiring for every [data-commit-song] on the page.
// One tune plays at a time; nothing plays until the visitor clicks.

import { commitParams, stepDuration } from './commitParams.ts';
import { TAIL, renderWav, scheduleSong } from './commitAudio.ts';

interface Playback {
  el: HTMLElement;
  master: GainNode;
  raf: number;
}

let ctx: AudioContext | undefined;
let current: Playback | undefined;

function setPlaying(el: HTMLElement, playing: boolean) {
  el.classList.toggle('is-playing', playing);
  const btn = el.querySelector<HTMLButtonElement>('[data-action="play"]');
  if (btn) {
    btn.setAttribute('aria-pressed', String(playing));
    btn.querySelector('.label')!.textContent = playing ? 'Stop' : 'Play';
  }
  if (!playing) el.querySelectorAll('.step.lit').forEach((s) => s.classList.remove('lit'));
}

export function stopCommitSong() {
  if (!current || !ctx) return;
  const { el, master, raf } = current;
  cancelAnimationFrame(raf);
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
  setTimeout(() => master.disconnect(), 250);
  setPlaying(el, false);
  current = undefined;
}

async function play(el: HTMLElement) {
  const wasThis = current?.el === el;
  stopCommitSong();
  if (wasThis) return;

  ctx ??= new AudioContext();
  await ctx.resume();
  const params = commitParams(el.dataset.hash ?? '');
  const dur = stepDuration(params);
  const { master, times } = scheduleSong(ctx, params, ctx.currentTime + 0.05);
  const end = times[times.length - 1] + dur + TAIL;
  const steps = Array.from(el.querySelectorAll<SVGGElement>('.step'));

  const playback: Playback = { el, master, raf: 0 };
  const tick = () => {
    const now = ctx!.currentTime;
    if (now > end) return stopCommitSong();
    steps.forEach((s, i) => s.classList.toggle('lit', now >= times[i] && now < times[i] + dur));
    playback.raf = requestAnimationFrame(tick);
  };
  current = playback;
  setPlaying(el, true);
  tick();
}

async function downloadWav(el: HTMLElement, btn: HTMLButtonElement) {
  const hash = el.dataset.hash ?? '';
  btn.disabled = true;
  try {
    const url = URL.createObjectURL(await renderWav(commitParams(hash)));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hash.slice(0, 7) || 'commit-song'}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener('click', (event) => {
  const btn = (event.target as Element).closest<HTMLButtonElement>('[data-commit-song] [data-action]');
  if (!btn) return;
  const el = btn.closest<HTMLElement>('[data-commit-song]')!;
  event.preventDefault();
  if (btn.dataset.action === 'play') play(el);
  else if (btn.dataset.action === 'wav') downloadWav(el, btn);
});
