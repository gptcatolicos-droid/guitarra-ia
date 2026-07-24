// Global chord-sound settings + play helper. Persists the on/off toggle and the
// playback mode (strum/arpeggio) so every PlayableChord across the app shares them.
import { useSyncExternalStore, useCallback } from 'react';
import { initAudio, playNotes, stopAll } from './guitarAudioEngine';
import { resolveVoicing } from './chordVoicing';

const STORAGE_KEY = 'gia_chord_sound';

const defaultSettings = { enabled: true, mode: 'strum' };

function readSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (_) {}
  return defaultSettings;
}

let current = readSettings();
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

export function setChordSoundSettings(patch) {
  current = { ...current, ...patch };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch (_) {}
  if (patch.enabled === false) stopAll(0.1);
  emit();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return current;
}

export function useChordSound() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Play a chord by displayed name. Resolves the voicing (respecting capo) and
  // plays it through the shared engine. Safe no-op when sound is disabled.
  const play = useCallback(async (displayName, { capo = 0, mode } = {}) => {
    if (!current.enabled) return { recognized: false, played: false };
    const ready = await initAudio(); // first user gesture unlocks/resumes audio
    if (!ready) return { recognized: false, played: false };
    const voicing = resolveVoicing(displayName, { capo });
    if (!voicing || !voicing.recognized || !voicing.notes.length) {
      return { recognized: false, played: false };
    }
    playNotes(voicing.notes, { mode: mode || current.mode });
    return { recognized: true, played: true };
  }, []);

  return { settings, setSettings: setChordSoundSettings, play, stopAll };
}