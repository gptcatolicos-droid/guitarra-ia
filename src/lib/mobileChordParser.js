import { isChordLine } from '@/lib/musicTheory';

const INFO_LINE = /^(tono|tom|tuning|afinación|afinado|capo|key|intro|tempo)\s*:/i;

function snapToWordBoundary(text, index) {
  const position = Math.max(0, Math.min(index, text.length));
  if (position === 0 || position === text.length || /\s/.test(text[position])) return position;
  let start = position;
  let end = position;
  while (start > 0 && !/\s/.test(text[start - 1])) start -= 1;
  while (end < text.length && !/\s/.test(text[end])) end += 1;
  return position - start < end - position ? start : end;
}

function makeSegments(chordLine, lyricLine) {
  const chords = [...chordLine.matchAll(/\S+/g)].map((match) => ({ chord: match[0], index: match.index }));
  if (!chords.length) return [];

  const boundaries = chords.map(({ index }, i) => {
    if (i === 0) return 0;
    return snapToWordBoundary(lyricLine, index);
  });
  boundaries.push(lyricLine.length);

  return chords.map(({ chord }, index) => ({
    chord,
    lyric: lyricLine.slice(boundaries[index], boundaries[index + 1]).trim(),
  }));
}

function parseInfoLine(text) {
  const [label, ...value] = text.split(':');
  return { type: 'info', label: `${label}:`, value: value.join(':').trim() };
}

export function parseMobileChordSheet(content) {
  const lines = content.replace(/\r/g, '').split('\n');
  const rows = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const next = lines[index + 1];
    const trimmed = line.trim();

    if (!trimmed) {
      rows.push({ type: 'space' });
    } else if (/^\[.+\]$/.test(trimmed)) {
      rows.push({ type: 'section', text: trimmed.slice(1, -1) });
    } else if (INFO_LINE.test(trimmed)) {
      rows.push(parseInfoLine(trimmed));
    } else if (isChordLine(line) && next !== undefined && next.trim() && !isChordLine(next)) {
      const segments = makeSegments(line, next);
      if (segments.some((segment) => segment.lyric)) {
        rows.push({ type: 'music', segments });
        index += 1;
      } else {
        rows.push({ type: 'progression', chords: line.trim().split(/\s+/) });
      }
    } else if (isChordLine(line)) {
      rows.push({ type: 'progression', chords: line.trim().split(/\s+/) });
    } else {
      rows.push({ type: 'lyric', text: line.trim() });
    }
  }

  return rows;
}