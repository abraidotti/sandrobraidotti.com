// Web Audio rendering of SongParams. Works with a live AudioContext
// (playback) or an OfflineAudioContext (.wav export).

import { midiToFreq, stepDuration, type SongParams, type Wave } from './commitParams.ts';

const PEAK: Record<Wave, number> = { sine: 0.32, triangle: 0.3, square: 0.1, sawtooth: 0.11 };

/** Seconds of tail after the last step so the delay can ring out. */
export const TAIL = 1.6;

export function songLength(params: SongParams): number {
  return params.steps.length * stepDuration(params) + TAIL;
}

/**
 * Schedules the whole song starting at `start` into `ctx`.
 * Returns the master gain node (so playback can be faded/stopped) and each step's start time.
 */
export function scheduleSong(ctx: BaseAudioContext, params: SongParams, start: number) {
  const dur = stepDuration(params);

  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.destination);

  // Dotted-eighth feedback delay for a bit of space.
  const delay = ctx.createDelay(2);
  delay.delayTime.value = dur * 1.5;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.3;
  const wet = ctx.createGain();
  wet.gain.value = 0.25;
  delay.connect(feedback).connect(delay);
  delay.connect(wet).connect(master);

  const voiceBus = ctx.createBiquadFilter();
  voiceBus.type = 'lowpass';
  voiceBus.frequency.value = 2600;
  voiceBus.connect(master);
  voiceBus.connect(delay);

  const times: number[] = [];
  params.steps.forEach((step, i) => {
    const t = start + i * dur;
    times.push(t);

    if (step.on) {
      const len = dur * step.length * 0.9;
      const osc = ctx.createOscillator();
      osc.type = step.wave;
      osc.frequency.value = midiToFreq(step.pitch);
      const env = ctx.createGain();
      const peak = PEAK[step.wave];
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(peak, t + 0.01);
      env.gain.exponentialRampToValueAtTime(peak * 0.5, t + Math.min(0.12, len));
      env.gain.setValueAtTime(peak * 0.5, t + len);
      env.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08);
      osc.connect(env).connect(voiceBus);
      osc.start(t);
      osc.stop(t + len + 0.1);
    }

    if (step.kick) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.55, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(env).connect(master);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  });

  return { master, times };
}

export async function renderWav(params: SongParams): Promise<Blob> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, Math.ceil(songLength(params) * sampleRate), sampleRate);
  scheduleSong(ctx, params, 0);
  return encodeWav(await ctx.startRendering());
}

/** 16-bit PCM WAV encoder. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const dataSize = frames * channels * 2;
  const view = new DataView(new ArrayBuffer(44 + dataSize));
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const s = Math.max(-1, Math.min(1, data[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}
