// Parses a .txt file content and extracts song metadata

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'unknown';
}

function detectKey(content) {
  const match = content.match(/(?:Tonalidad|Tono|Tom|Key|Clave)[:\s]+([A-G][#b]?m?)/i);
  return match ? match[1].trim() : null;
}

function detectCapo(content) {
  const match = content.match(/(?:Capo|Cejilla|Ceja)[:\s]+(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

function detectTuning(content) {
  const match = content.match(/(?:Afinaci[oó]n|Tuning)[:\s]+(.+)/i);
  return match ? match[1].trim() : 'Estándar (E A D G B e)';
}

function detectDifficulty(content) {
  const lower = content.toLowerCase();
  if (lower.includes('avanzad') || lower.includes('difícil') || lower.includes('dificil')) return 'Avanzada';
  if (lower.includes('intermedi') || lower.includes('moderado')) return 'Intermedia';
  return 'Fácil';
}

function extractChords(content) {
  const chordPattern = /\b([A-G][#b]?(?:sus[24]?|maj7?|min7?|dim7?|aug|m7?|7|9|11|add9)?(?:\/[A-G][#b]?)?)\b/g;
  const found = new Set();
  let m;
  while ((m = chordPattern.exec(content)) !== null) {
    if (m[1].length <= 6) found.add(m[1]);
  }
  return Array.from(found).slice(0, 30);
}

function hasTablature(content) {
  return /[eEBGDAd]\|[-\d|hpbr~\s]+/.test(content);
}

function hasChords(content) {
  const lines = content.split('\n');
  return lines.some(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    const tokens = trimmed.split(/\s+/);
    return tokens.length >= 1 && tokens.length <= 8 &&
      tokens.every(t => /^[A-G][#b]?(?:sus[24]?|maj7?|m7?|7|9|dim|aug)?(?:\/[A-G][#b]?)?$/.test(t));
  });
}

export function parseFileName(fileName) {
  const base = fileName.replace(/\.(txt|md)$/i, '');
  // Format: "Artist - Title" or "artist_title" or just "title"
  const dashMatch = base.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (dashMatch) {
    return { artist: dashMatch[1].trim(), title: dashMatch[2].trim() };
  }
  return { artist: null, title: base.replace(/[-_]/g, ' ').trim() };
}

export function parseFileContent(content, fileName, contentType) {
  const lines = content.split('\n').map(l => l.trimEnd());

  // Try to find artist/title from header lines
  let artistName = null;
  let title = null;

  for (const line of lines.slice(0, 15)) {
    const t = line.trim();
    if (!t) continue;
    const titleMatch = t.match(/^(?:T[ií]tulo?|Title|Song|Cancion|Canci[oó]n)[:\s]+(.+)$/i);
    const artistMatch = t.match(/^(?:Artista?|Artist|Banda?|Band|Grupo)[:\s]+(.+)$/i);
    if (titleMatch) title = titleMatch[1].trim();
    if (artistMatch) artistName = artistMatch[1].trim();
  }

  // Fallback to filename
  if (!title || !artistName) {
    const fromFile = parseFileName(fileName);
    if (!title) title = fromFile.title;
    if (!artistName) artistName = fromFile.artist || 'Artista desconocido';
  }

  const isTab = contentType === 'tablatura' || hasTablature(content);

  return {
    title,
    artistName,
    artistSlug: slugify(artistName),
    slug: slugify(title),
    originalKey: detectKey(content),
    capo: detectCapo(content),
    tuning: detectTuning(content),
    difficulty: detectDifficulty(content),
    hasChords: !isTab && hasChords(content),
    hasTablature: isTab,
    contentRaw: !isTab ? content : null,
    tablature: isTab ? content : null,
    chordsUsed: extractChords(content),
  };
}