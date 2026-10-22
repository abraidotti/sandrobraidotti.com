// Web Audio rendering of SongParams. Works with a live AudioContext
// (playback) or an OfflineAudioContext (.wav export).

import { STEPS, midiToFreq, stepDuration, type SongParams, type Timbre } from './commitParams.ts';

/** Seconds of tail after the last step so the reverb can ring out. */
export const TAIL = 3.5;

export function songLength(params: SongParams): number {
  return STEPS * stepDuration(params) + TAIL;
}

interface Partial {
  type: OscillatorType;
  /** Semitones from the note. */
  interval: number;
  /** Cents of extra detune, for chorus-y width. */
  detune: number;
  gain: number;
}

interface Voice {
  partials: Partial[];
  attack: number;
  release: number;
  cutoff: number;
  level: number;
}

const VOICES: Record<Timbre, Voice> = {
  // Detuned saws through a dark filter: the classic lush pad.
  velvet: {
    partials: [
      { type: 'sawtooth', interval: 0, detune: -8, gain: 1 },
      { type: 'sawtooth', interval: 0, detune: 8, gain: 1 },
    ],
    attack: 0.06, release: 0.9, cutoff: 1500, level: 0.035,
  },
  // Bell-ish: triangle plus a quiet octave shimmer.
  glass: {
    partials: [
      { type: 'triangle', interval: 0, detune: 0, gain: 1 },
      { type: 'sine', interval: 12, detune: 4, gain: 0.35 },
    ],
    attack: 0.01, release: 1.2, cutoff: 5000, level: 0.07,
  },
  // Filtered square with a sine core: woody, a bit eerie.
  hollow: {
    partials: [
      { type: 'square', interval: 0, detune: -4, gain: 0.7 },
      { type: 'sine', interval: 0, detune: 4, gain: 1 },
    ],
    attack: 0.03, release: 0.8, cutoff: 1100, level: 0.05,
  },
  // Slow-breathing triangles with a sub: an organ/choir haze.
  choir: {
    partials: [
      { type: 'triangle', interval: 0, detune: -11, gain: 1 },
      { type: 'triangle', interval: 0, detune: 11, gain: 1 },
      { type: 'sine', interval: -12, detune: 0, gain: 0.4 },
    ],
    attack: 0.35, release: 1.4, cutoff: 2600, level: 0.04,
  },
};

/** Deterministic white noise, for snare and hats. */
function noise(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 7;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    data[i] = ((seed >>> 0) / 4294967296) * 2 - 1;
  }
  return buffer;
}

/** Deterministic stereo impulse response: exponentially decaying noise. */
function impulse(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  let seed = 1;
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      data[i] = ((seed >>> 0) / 4294967296 * 2 - 1) * Math.pow(1 - i / length, 2.6);
    }
  }
  return buffer;
}

/**
 * Schedules the whole song starting at `start` into `ctx`.
 * Returns the master gain node (so playback can be faded/stopped) and each step's start time.
 */
export function scheduleSong(ctx: BaseAudioContext, params: SongParams, start: number) {
  const dur = stepDuration(params);
  const voice = VOICES[params.timbre];

  const master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  master.connect(comp).connect(ctx.destination);

  const reverb = ctx.createConvolver();
  reverb.buffer = impulse(ctx, 3);
  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.45;
  reverbSend.connect(reverb).connect(master);

  const delay = ctx.createDelay(3);
  delay.delayTime.value = dur * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  const delaySend = ctx.createGain();
  delaySend.gain.value = 0.18;
  delaySend.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(master);
  delay.connect(reverbSend);

  const voiceBus = ctx.createBiquadFilter();
  voiceBus.type = 'lowpass';
  voiceBus.frequency.value = voice.cutoff;
  voiceBus.Q.value = 0.7;
  voiceBus.connect(master);
  voiceBus.connect(reverbSend);
  voiceBus.connect(delaySend);

  // Tape wobble: one slow LFO bending every oscillator's pitch together.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = params.wobble.rate;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = params.wobble.depth;
  lfo.connect(lfoDepth);
  lfo.start(start);
  lfo.stop(start + songLength(params));

  for (const ev of params.events) {
    const t = start + ev.step * dur + ev.delay;
    const len = ev.length * dur;
    const peak = voice.level * ev.velocity;
    const attack = Math.min(voice.attack, len * 0.5);
    const end = t + len + voice.release;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(peak, t + attack);
    env.gain.setTargetAtTime(peak * 0.7, t + attack, 0.3);
    env.gain.setValueAtTime(peak * 0.7, t + len);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(voiceBus);

    for (const p of voice.partials) {
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = midiToFreq(ev.pitch + p.interval);
      osc.detune.value = p.detune + params.chords[ev.chord].drift;
      lfoDepth.connect(osc.detune);
      const g = ctx.createGain();
      g.gain.value = p.gain;
      osc.connect(g).connect(env);
      osc.start(t);
      osc.stop(end + 0.05);
    }
  }

  // Bass: a round sub under each chord, mostly dry.
  const bassBus = ctx.createBiquadFilter();
  bassBus.type = 'lowpass';
  bassBus.frequency.value = 420;
  bassBus.connect(master);
  for (const chord of params.chords) {
    const t = start + chord.step * dur;
    const len = chord.length * dur;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.2, t + 0.02);
    env.gain.setTargetAtTime(0.14, t + 0.02, 0.2);
    env.gain.setValueAtTime(0.14, t + len - 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.25);
    env.connect(bassBus);
    for (const type of ['sine', 'triangle'] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = midiToFreq(chord.bass);
      osc.detune.value = chord.drift;
      const g = ctx.createGain();
      g.gain.value = type === 'sine' ? 1 : 0.4;
      osc.connect(g).connect(env);
      osc.start(t);
      osc.stop(t + len + 0.3);
    }
  }

  // Drums: kick, a soft snare that blooms into the reverb, and quiet hats.
  const noiseBuf = noise(ctx, 0.5);
  const snareBus = ctx.createBiquadFilter();
  snareBus.type = 'bandpass';
  snareBus.frequency.value = 1800;
  snareBus.Q.value = 0.8;
  snareBus.connect(master);
  const snareVerb = ctx.createGain();
  snareVerb.gain.value = 0.6;
  snareBus.connect(snareVerb).connect(reverbSend);
  const hatBus = ctx.createBiquadFilter();
  hatBus.type = 'highpass';
  hatBus.frequency.value = 7000;
  hatBus.connect(master);

  const hit = (bus: AudioNode, t: number, peak: number, decay: number) => {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const env = ctx.createGain();
    env.gain.setValueAtTime(peak, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + decay);
    src.connect(env).connect(bus);
    src.start(t);
    src.stop(t + decay + 0.02);
  };

  const { kick, snare, hat } = params.drums;
  const times: number[] = [];
  for (let i = 0; i < STEPS; i++) {
    const t = start + i * dur;
    times.push(t);

    if (kick[i]) {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.5, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      osc.connect(env).connect(master);
      osc.start(t);
      osc.stop(t + 0.35);
    }

    if (snare[i]) {
      hit(snareBus, t, 0.32, 0.2);
      const body = ctx.createOscillator();
      body.type = 'triangle';
      body.frequency.setValueAtTime(200, t);
      body.frequency.exponentialRampToValueAtTime(160, t + 0.08);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.14, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      body.connect(env).connect(snareBus);
      body.start(t);
      body.stop(t + 0.14);
    }

    if (hat[i] > 0) hit(hatBus, t, 0.09 * hat[i], 0.05);
  }

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
