/**
 * Minimal synthesised SFX — no audio files, no third-party library, no licence surface.
 * Everything is generated with oscillators so the Docker image and the
 * "honest boundary" asset story stay unchanged.
 *
 * Audio is muted when the player turns it off, and also when the OS asks for
 * reduced motion (matching the existing presentation-degradation policy).
 */
import { prefs } from './runtime.js';

let ctx = null;
let mutedForSession = false;

const audible = () => prefs().sfx && !mutedForSession;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) { mutedForSession = true; return null; }
    try { ctx = new Ctor(); } catch { mutedForSession = true; return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** One shaped tone. `to` different from `from` glides the pitch. */
function tone({ wave = 'sine', from, to = from, dur = 0.12, gain = 0.06, delay = 0 }) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(from, start);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + dur);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.02, dur / 3));
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Short filtered noise burst — gives the bomb some body. */
function noise({ dur = 0.6, gain = 0.09 }) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime;
  const frames = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, start);
  filter.frequency.exponentialRampToValueAtTime(180, start + dur);
  const amp = ac.createGain();
  amp.gain.setValueAtTime(gain, start);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start(start);
}

const RECIPES = {
  select: () => tone({ wave: 'square', from: 880, dur: 0.06, gain: 0.035 }),
  play: () => tone({ wave: 'triangle', from: 440, to: 660, dur: 0.12, gain: 0.055 }),
  pass: () => tone({ wave: 'sine', from: 300, to: 210, dur: 0.14, gain: 0.05 }),
  bomb: () => { noise({ dur: 0.6, gain: 0.09 }); tone({ wave: 'sawtooth', from: 120, to: 60, dur: 0.5, gain: 0.07 }); },
  win: () => [523.25, 659.25, 783.99].forEach((freq, index) => tone({ wave: 'triangle', from: freq, dur: 0.22, gain: 0.06, delay: index * 0.11 })),
  lose: () => [392, 329.63, 261.63].forEach((freq, index) => tone({ wave: 'sine', from: freq, dur: 0.26, gain: 0.055, delay: index * 0.13 })),
  unlock: () => [659.25, 987.77].forEach((freq, index) => tone({ wave: 'triangle', from: freq, dur: 0.3, gain: 0.06, delay: index * 0.12 }))
};

/** Fire a named sound. Silent no-op when muted or unsupported. */
export function sfx(name) {
  if (!audible() || reducedMotion()) return;
  try { RECIPES[name]?.(); } catch { mutedForSession = true; }
}

/** Called from the settings toggle so the AudioContext is created inside a user gesture. */
export function primeAudio() {
  if (!audible()) return;
  audio();
}
