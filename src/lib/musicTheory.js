export const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const CHORD_PATTERN = /^[A-G](#|b)?(sus[24]?|maj[79]?|min[79]?|dim7?|aug7?|m[79]?|m6|6|7|9|11|13|add[69]?|°|ø)?(\/[A-G](#|b)?)?$/;

export function isChord(token) {
  if (!token || token.length > 15) return false;
  return CHORD_PATTERN.test(token);
}

export function isChordLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return false;
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return false;
  return tokens.every(t => isChord(t));
}

export function parseChord(chord) {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return null;
  const root = match[1];
  const rest = match[2];
  let quality = rest;
  let bass = null;
  const slashIndex = rest.indexOf('/');
  if (slashIndex !== -1) {
    quality = rest.substring(0, slashIndex);
    bass = rest.substring(slashIndex + 1);
  }
  return { root, quality, bass };
}

function noteToIndex(note, preferFlats) {
  const notes = preferFlats ? NOTES_FLAT : NOTES_SHARP;
  let idx = notes.indexOf(note);
  if (idx === -1) {
    const otherNotes = preferFlats ? NOTES_SHARP : NOTES_FLAT;
    idx = otherNotes.indexOf(note);
  }
  return idx;
}

export function transposeChord(chord, semitones, preferFlats = false) {
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  if (semitones === 0) return chord;
  const notes = preferFlats ? NOTES_FLAT : NOTES_SHARP;

  const rootIdx = noteToIndex(parsed.root, preferFlats);
  if (rootIdx === -1) return chord;
  const newRoot = notes[(rootIdx + semitones + 1200) % 12];

  let result = newRoot + parsed.quality;
  if (parsed.bass) {
    const bassIdx = noteToIndex(parsed.bass, preferFlats);
    if (bassIdx !== -1) {
      const newBass = notes[(bassIdx + semitones + 1200) % 12];
      result += '/' + newBass;
    } else {
      result += '/' + parsed.bass;
    }
  }
  return result;
}

export function transposeContent(content, semitones, preferFlats = false) {
  if (semitones === 0) return content;
  return content.split('\n').map(line => {
    if (isChordLine(line)) {
      return line.split(/(\s+)/).map(token => {
        if (!token.trim()) return token;
        return isChord(token) ? transposeChord(token, semitones, preferFlats) : token;
      }).join('');
    }
    return line;
  }).join('\n');
}

export const CHORD_LIBRARY = {
  "C":     { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  "C7":    { frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  "Cmaj7": { frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  "D":     { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  "D7":    { frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  "Dm":    { frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  "Dm7":   { frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  "Dmaj7": { frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1] },
  "E":     { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  "E7":    { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  "Em":    { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  "Em7":   { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  "F":     { frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: 1 },
  "F7":    { frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barre: 1 },
  "Fm":    { frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barre: 1 },
  "Fmaj7": { frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  "G":     { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  "G7":    { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  "Gmaj7": { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 1, 0, 0, 0, 2] },
  "A":     { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  "A7":    { frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
  "Am":    { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  "Am7":   { frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  "Amaj7": { frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  "B7":    { frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  "Bm":    { frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: 2 },
  "Bm7":   { frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3] },
  "Bbmaj7": { frets: [-1, 1, 3, 2, 3, 1], fingers: [0, 1, 3, 2, 4, 1], barre: 1 },
};

export function getChordDiagram(chordName) {
  if (CHORD_LIBRARY[chordName]) return CHORD_LIBRARY[chordName];
  const parsed = parseChord(chordName);
  if (parsed) {
    const base = parsed.root + (parsed.quality.startsWith('m') && !parsed.quality.startsWith('maj') ? 'm' : '');
    if (CHORD_LIBRARY[base]) return CHORD_LIBRARY[base];
  }
  return null;
}

export function extractChordsFromContent(content) {
  const chords = new Set();
  const lines = content.split('\n');
  for (const line of lines) {
    if (isChordLine(line)) {
      line.trim().split(/\s+/).forEach(token => {
        if (isChord(token)) chords.add(token);
      });
    }
  }
  return Array.from(chords);
}

export function parseSections(content) {
  const sections = [];
  let currentName = null;
  let currentLines = [];

  for (const line of content.split('\n')) {
    const m = line.match(/^\[(.+)\]\s*$/);
    if (m) {
      if (currentName !== null) {
        sections.push({ name: currentName, lines: currentLines });
      }
      currentName = m[1];
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentName !== null) {
    sections.push({ name: currentName, lines: currentLines });
  }
  if (sections.length === 0 && content.trim()) {
    sections.push({ name: 'Canción', lines: content.split('\n') });
  }
  return sections;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function calculateTransposeSemitones(originalKey, targetKey) {
  if (!originalKey || !targetKey) return 0;
  const normalize = (k) => {
    const parsed = parseChord(k);
    return parsed ? parsed.root : k;
  };
  const origRoot = normalize(originalKey);
  const targetRoot = normalize(targetKey);
  let origIdx = NOTES_SHARP.indexOf(origRoot);
  if (origIdx === -1) origIdx = NOTES_FLAT.indexOf(origRoot);
  let targetIdx = NOTES_SHARP.indexOf(targetRoot);
  if (targetIdx === -1) targetIdx = NOTES_FLAT.indexOf(targetRoot);
  if (origIdx === -1 || targetIdx === -1) return 0;
  return (targetIdx - origIdx + 12) % 12;
}