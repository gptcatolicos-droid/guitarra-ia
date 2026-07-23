import { isChord, isChordLine } from '@/lib/musicTheory';

const NOTE_NAMES = {
  do: 'C', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B',
};

export function normalizeChordName(value = '') {
  const input = value.trim().replace(/♯/g, '#').replace(/♭/g, 'b');
  const spanish = input.toLowerCase().match(/\b(do|re|mi|fa|sol|la|si)\b(?:\s+(mayor|menor|m|7|séptima))?/i);
  if (spanish) {
    const root = NOTE_NAMES[spanish[1].toLowerCase()];
    const modifier = (spanish[2] || '').toLowerCase();
    return modifier === 'menor' || modifier === 'm' ? `${root}m` : modifier === '7' || modifier === 'séptima' ? `${root}7` : root;
  }

  const match = input.match(/(?:^|\s)([A-Ga-g])([#b]?)(maj7|m7|sus2|sus4|dim|aug|add9|m|7|6|9)?(?:\s|$)/);
  if (!match) return null;
  const chord = `${match[1].toUpperCase()}${match[2]}${match[3] || ''}`;
  return isChord(chord) ? chord : null;
}

export function getStartingChord(song) {
  const chordLine = (song.content_raw || '').split('\n').find((line) => isChordLine(line));
  return chordLine ? chordLine.trim().split(/\s+/)[0] : null;
}

export function findSongsStartingWithChord(songs, chord) {
  const expected = normalizeChordName(chord);
  if (!expected) return [];
  return songs.filter((song) => getStartingChord(song) === expected);
}

export function extractChordNames(text = '') {
  const chords = new Set();
  const normalizedText = text.replace(/♯/g, '#').replace(/♭/g, 'b');
  normalizedText.match(/\b[A-G](?:#|b)?(?:maj7|m7|sus2|sus4|dim|aug|add9|m|7|6|9)?\b/g)?.forEach((candidate) => {
    if (isChord(candidate)) chords.add(candidate);
  });
  return [...chords];
}