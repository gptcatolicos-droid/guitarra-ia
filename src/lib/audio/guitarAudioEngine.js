// GuitarAudioEngine — Web Audio synth (Karplus-Strong style pluck) for guitar chords.
//
// Provisional synth engine. The public API (playChord / stop) is designed so a
// real sampled-guitar soundfont can replace the internal synthesis later WITHOUT
// touching PlayableChord or any consumer component.
//
// No external audio, no autoplay: the AudioContext is created lazily on the first
// user gesture and resumed if the browser suspended it.

let ctx = null;
let masterGain = null;
let activeNodes = [];

// Standard tuning open-string MIDI notes, low(6th) -> high(1st).
// Matches the CHORD_LIBRARY `frets` order: index 0 = string 6 (E2).
const OPEN_STRING_MIDI = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

// Must be called from within a user gesture handler.
export async function initAudio() {
  const c = ensureContext();
  if (!c) return false;
  if (c.state === 'suspended') {
    try { await c.resume(); } catch (_) { /* ignore */ }
  }
  return c.state === 'running';
}

export function isReady() {
  return !!ctx && ctx.state === 'running';
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Convert a `frets` array (+baseFret) into sounding MIDI notes, low->high.
// frets[i]: -1 muted, 0 open, >0 fret pressed. Returns [{ midi, stringIndex }].
export function fretsToMidi(frets, baseFret = 1) {
  if (!Array.isArray(frets)) return [];
  const notes = [];
  for (let i = 0; i < Math.min(frets.length, 6); i++) {
    const f = frets[i];
    if (f === -1 || f === null || f === undefined) continue; // muted
    // baseFret shifts positive fret numbers; open (0) stays open.
    const absoluteFret = f === 0 ? 0 : f + (baseFret > 1 ? baseFret - 1 : 0);
    notes.push({ midi: OPEN_STRING_MIDI[i] + absoluteFret, stringIndex: i });
  }
  return notes;
}

// Karplus-Strong plucked-string voice — reasonable steel-string acoustic timbre.
function pluck(c, freq, startTime, duration, gain) {
  const sampleRate = c.sampleRate;
  const N = Math.max(2, Math.round(sampleRate / freq));
  const bufferLen = Math.ceil(sampleRate * duration);
  const buffer = c.createBuffer(1, bufferLen, sampleRate);
  const data = buffer.getChannelData(0);

  // Excitation noise burst.
  const noise = new Float32Array(N);
  for (let i = 0; i < N; i++) noise[i] = Math.random() * 2 - 1;

  const decay = 0.996; // string sustain factor
  for (let i = 0; i < bufferLen; i++) {
    if (i < N) {
      data[i] = noise[i];
    } else {
      data[i] = decay * 0.5 * (data[i - N] + data[i - N + 1]);
    }
  }

  const src = c.createBufferSource();
  src.buffer = buffer;

  const g = c.createGain();
  g.__isVoiceGain = true; // tag so stopAll fades only voice gains
  g.gain.setValueAtTime(0.0001, startTime);
  g.gain.linearRampToValueAtTime(gain, startTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  // Gentle low-pass so highs are not harsh.
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 3800;

  src.connect(lp);
  lp.connect(g);
  g.connect(masterGain);

  src.start(startTime);
  src.stop(startTime + duration);

  activeNodes.push(src, g, lp);
  src.onended = () => {
    try { src.disconnect(); g.disconnect(); lp.disconnect(); } catch (_) {}
    activeNodes = activeNodes.filter((n) => n !== src && n !== g && n !== lp);
  };
}

// Fade out and disconnect the currently sounding voices (previous chord).
// This mutes and detaches the individual pluck voices — it does NOT touch the
// master gain, so an incoming chord scheduled right after is fully audible.
export function stopAll(fadeSec = 0.08) {
  if (!ctx) return;
  const now = ctx.currentTime;
  activeNodes.forEach((n) => {
    // Only fade the tagged per-voice gain nodes.
    if (n && n.__isVoiceGain && n.gain) {
      try {
        n.gain.cancelScheduledValues(now);
        n.gain.setValueAtTime(Math.max(n.gain.value, 0.0001), now);
        n.gain.exponentialRampToValueAtTime(0.0001, now + fadeSec);
      } catch (_) {}
    }
  });
  const toKill = activeNodes;
  activeNodes = [];
  setTimeout(() => {
    toKill.forEach((n) => { try { n.disconnect(); } catch (_) {} });
  }, fadeSec * 1000 + 30);
}

// Play a chord from sounding MIDI notes (low->high).
// mode: 'strum' (default) or 'arpeggio'.
export function playNotes(notes, { mode = 'strum' } = {}) {
  const c = ensureContext();
  if (!c || c.state !== 'running' || !notes.length) return;

  // Fade the previous chord's voices (master gain stays at full level).
  stopAll(0.05);

  const start = c.currentTime + 0.02;
  const perString = mode === 'arpeggio' ? 0.15 : 0.032; // 32ms strum / 150ms arpeggio
  const duration = mode === 'arpeggio' ? 1.6 : 2.2;

  notes.forEach((n, i) => {
    // Slight human variation in timing and level.
    const jitter = (Math.random() - 0.5) * 0.008;
    const t = start + i * perString + jitter;
    const gain = (0.55 + Math.random() * 0.12) * (mode === 'arpeggio' ? 0.9 : 1);
    pluck(c, midiToFreq(n.midi), t, duration, gain);
  });
}