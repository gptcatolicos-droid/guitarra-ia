// ChordVoicingResolver — turns a displayed chord name into a playable voicing.
//
// It reuses the existing chord library + parser from musicTheory so the SOUND
// always matches the diagram the user sees. Handles transposition and capo by
// working on the already-transposed display name (what is on screen).

import { getChordDiagram, parseChord } from '@/lib/musicTheory';
import { fretsToMidi } from './guitarAudioEngine';

// Resolve the voicing for the chord exactly as displayed on screen.
// `capo`: if provided and > 0, the real sounding pitch is capo semitones higher
// than the open-position shape the guitarist plays.
export function resolveVoicing(displayName, { capo = 0 } = {}) {
  if (!displayName) return null;
  const diagram = getChordDiagram(displayName);
  if (!diagram || !Array.isArray(diagram.frets)) {
    return { name: displayName, recognized: false, notes: [], diagram: null };
  }

  const baseFret = diagram.baseFret || 1;
  let notes = fretsToMidi(diagram.frets, baseFret);

  // Capo raises the real sounding pitch of every fretted/open note.
  if (capo > 0) {
    notes = notes.map((n) => ({ ...n, midi: n.midi + capo }));
  }

  return {
    name: displayName,
    recognized: true,
    diagram,
    notes,
  };
}

// Lightweight recognition check for diagnostics (no audio side effects).
export function isRecognizedChord(name) {
  if (!name) return false;
  if (!parseChord(name)) return false;
  return !!getChordDiagram(name);
}