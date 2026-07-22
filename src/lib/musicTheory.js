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
  // === C ===
  "C":     { frets: [-1, 3, 2, 0, 1, 0] },
  "C7":    { frets: [-1, 3, 2, 3, 1, 0] },
  "Cm":    { frets: [3, 3, 5, 5, 4, 3], barre: 3 },
  "Cm7":   { frets: [3, 3, 5, 3, 4, 3], barre: 3 },
  "Cmaj7": { frets: [-1, 3, 2, 0, 0, 0] },
  "Csus2": { frets: [-1, 3, 0, 0, 1, 0] },
  "Csus4": { frets: [-1, 3, 3, 0, 1, 1] },
  "Cadd9": { frets: [-1, 3, 2, 0, 3, 0] },

  // === C# / Db ===
  "C#":    { frets: [-1, 4, 3, 1, 2, 1], barre: 1 },
  "C#m":   { frets: [-1, 4, 6, 6, 5, 4], barre: 4 },
  "C#m7":  { frets: [-1, 4, 6, 4, 5, 4], barre: 4 },
  "C#7":   { frets: [-1, 4, 3, 4, 2, 1], barre: 1 },
  "C#maj7":{ frets: [-1, 4, 3, 1, 1, 1], barre: 1 },
  "Db":    { frets: [-1, 4, 3, 1, 2, 1], barre: 1 },
  "Dbm":   { frets: [-1, 4, 6, 6, 5, 4], barre: 4 },

  // === D ===
  "D":     { frets: [-1, -1, 0, 2, 3, 2] },
  "D7":    { frets: [-1, -1, 0, 2, 1, 2] },
  "Dm":    { frets: [-1, -1, 0, 2, 3, 1] },
  "Dm7":   { frets: [-1, -1, 0, 2, 1, 1] },
  "Dmaj7": { frets: [-1, -1, 0, 2, 2, 2] },
  "Dsus2": { frets: [-1, -1, 0, 2, 3, 0] },
  "Dsus4": { frets: [-1, -1, 0, 2, 3, 3] },
  "Dadd9": { frets: [-1, -1, 0, 2, 3, 0] },

  // === D# / Eb ===
  "D#":    { frets: [-1, 6, 5, 3, 4, 3], barre: 3 },
  "D#m":   { frets: [6, 6, 8, 8, 7, 6], barre: 6 },
  "D#7":   { frets: [-1, 6, 5, 6, 4, 3], barre: 3 },
  "Eb":    { frets: [-1, 6, 5, 3, 4, 3], barre: 3 },
  "Ebm":   { frets: [6, 6, 8, 8, 7, 6], barre: 6 },
  "Eb7":   { frets: [-1, 6, 5, 6, 4, 3], barre: 3 },

  // === E ===
  "E":     { frets: [0, 2, 2, 1, 0, 0] },
  "E7":    { frets: [0, 2, 0, 1, 0, 0] },
  "Em":    { frets: [0, 2, 2, 0, 0, 0] },
  "Em7":   { frets: [0, 2, 0, 0, 0, 0] },
  "Emaj7": { frets: [0, 2, 1, 1, 0, 0] },
  "Esus2": { frets: [0, 2, 2, 4, 0, 0] },
  "Esus4": { frets: [0, 2, 2, 2, 0, 0] },

  // === F ===
  "F":     { frets: [1, 3, 3, 2, 1, 1], barre: 1 },
  "F7":    { frets: [1, 3, 1, 2, 1, 1], barre: 1 },
  "Fm":    { frets: [1, 3, 3, 1, 1, 1], barre: 1 },
  "Fm7":   { frets: [1, 3, 1, 1, 1, 1], barre: 1 },
  "Fmaj7": { frets: [-1, -1, 3, 2, 1, 0] },
  "Fsus2": { frets: [1, 1, 3, 3, 1, 1], barre: 1 },

  // === F# / Gb ===
  "F#":    { frets: [2, 4, 4, 3, 2, 2], barre: 2 },
  "F#m":   { frets: [2, 4, 4, 2, 2, 2], barre: 2 },
  "F#m7":  { frets: [2, 4, 2, 2, 2, 2], barre: 2 },
  "F#7":   { frets: [2, 4, 2, 3, 2, 2], barre: 2 },
  "F#maj7":{ frets: [2, 4, 3, 3, 2, 2], barre: 2 },
  "Gb":    { frets: [2, 4, 4, 3, 2, 2], barre: 2 },
  "Gbm":   { frets: [2, 4, 4, 2, 2, 2], barre: 2 },

  // === G ===
  "G":     { frets: [3, 2, 0, 0, 0, 3] },
  "G7":    { frets: [3, 2, 0, 0, 0, 1] },
  "Gm":    { frets: [3, 5, 5, 3, 3, 3], barre: 3 },
  "Gm7":   { frets: [3, 5, 3, 3, 3, 3], barre: 3 },
  "Gmaj7": { frets: [3, 2, 0, 0, 0, 2] },
  "Gsus2": { frets: [3, 0, 0, 0, 3, 3] },
  "Gsus4": { frets: [3, 3, 0, 0, 1, 3] },
  "Gadd9": { frets: [3, 2, 0, 2, 0, 3] },

  // === G# / Ab ===
  "G#":    { frets: [4, 6, 6, 5, 4, 4], barre: 4 },
  "G#m":   { frets: [4, 6, 6, 4, 4, 4], barre: 4 },
  "G#m7":  { frets: [4, 6, 4, 4, 4, 4], barre: 4 },
  "G#7":   { frets: [4, 6, 4, 5, 4, 4], barre: 4 },
  "G#maj7":{ frets: [4, 6, 5, 5, 4, 4], barre: 4 },
  "Ab":    { frets: [4, 6, 6, 5, 4, 4], barre: 4 },
  "Abm":   { frets: [4, 6, 6, 4, 4, 4], barre: 4 },
  "Ab7":   { frets: [4, 6, 4, 5, 4, 4], barre: 4 },

  // === A ===
  "A":     { frets: [-1, 0, 2, 2, 2, 0] },
  "A7":    { frets: [-1, 0, 2, 0, 2, 0] },
  "Am":    { frets: [-1, 0, 2, 2, 1, 0] },
  "Am7":   { frets: [-1, 0, 2, 0, 1, 0] },
  "Amaj7": { frets: [-1, 0, 2, 1, 2, 0] },
  "Asus2": { frets: [-1, 0, 2, 2, 0, 0] },
  "Asus4": { frets: [-1, 0, 2, 2, 3, 0] },
  "Aadd9": { frets: [-1, 0, 2, 4, 2, 0] },

  // === A# / Bb ===
  "A#":    { frets: [-1, 1, 3, 3, 3, 1], barre: 1 },
  "A#m":   { frets: [-1, 1, 3, 3, 2, 1], barre: 1 },
  "A#7":   { frets: [-1, 1, 3, 1, 3, 1], barre: 1 },
  "A#maj7":{ frets: [-1, 1, 3, 2, 3, 1], barre: 1 },
  "Bb":    { frets: [-1, 1, 3, 3, 3, 1], barre: 1 },
  "Bbm":   { frets: [-1, 1, 3, 3, 2, 1], barre: 1 },
  "Bb7":   { frets: [-1, 1, 3, 1, 3, 1], barre: 1 },
  "Bbmaj7":{ frets: [-1, 1, 3, 2, 3, 1], barre: 1 },

  // === B ===
  "B":     { frets: [-1, 2, 4, 4, 4, 2], barre: 2 },
  "B7":    { frets: [-1, 2, 1, 2, 0, 2] },
  "Bm":    { frets: [-1, 2, 4, 4, 3, 2], barre: 2 },
  "Bm7":   { frets: [-1, 2, 4, 2, 3, 2], barre: 2 },
  "Bmaj7": { frets: [-1, 2, 4, 3, 4, 2], barre: 2 },
  "Bsus2": { frets: [-1, 2, 4, 4, 2, 2], barre: 2 },
  "Bsus4": { frets: [-1, 2, 4, 4, 5, 2], barre: 2 },

  // === Slash chords más comunes ===
  "G/B":   { frets: [-1, 2, 0, 0, 0, 3] },
  "D/F#":  { frets: [2, -1, 0, 2, 3, 2] },
  "A/C#":  { frets: [-1, 4, 2, 2, 2, 0] },
  "E/G#":  { frets: [4, -1, 2, 1, 0, 0] },
  "C/G":   { frets: [3, 3, 2, 0, 1, 0] },
  "Am/E":  { frets: [0, 0, 2, 2, 1, 0] },
  "G#7/C": { frets: [4, 3, 4, 4, 4, 4], barre: 4 },
  "G#m/C#":{ frets: [4, 6, 6, 4, 4, 4], barre: 4 },
  "A/C":   { frets: [-1, 3, 2, 2, 2, 0] },
  "F#/A#": { frets: [1, 1, 3, 3, 2, 1], barre: 1 },
};

export function getChordDiagram(chordName) {
  // Direct match
  if (CHORD_LIBRARY[chordName]) return CHORD_LIBRARY[chordName];

  const parsed = parseChord(chordName);
  if (!parsed) return null;

  // Try slash chord: look up root+quality ignoring bass
  const withoutBass = parsed.root + parsed.quality;
  if (withoutBass !== chordName && CHORD_LIBRARY[withoutBass]) return CHORD_LIBRARY[withoutBass];

  // Determine quality category
  const q = parsed.quality;
  const isMinor = (q.startsWith('m') || q === 'min') && !q.startsWith('maj');

  // Try base root with quality simplified
  const candidates = [
    parsed.root + q,                              // exact quality
    isMinor ? parsed.root + 'm' : parsed.root,   // m or major base
    parsed.root + '7',
    parsed.root + 'm7',
  ];

  for (const c of candidates) {
    if (CHORD_LIBRARY[c]) return CHORD_LIBRARY[c];
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