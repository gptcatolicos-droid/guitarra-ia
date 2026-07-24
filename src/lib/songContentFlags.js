/**
 * A content flag must never hide real musical content.
 *
 * Historical records may have has_chords / has_tablature set to false even
 * though their corresponding text field is populated. These helpers keep the
 * UI resilient while the permanent database repair is being applied.
 */
export function hasMeaningfulSongContent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function resolveSongContentFlags(song) {
  return {
    hasChords: Boolean(song?.has_chords) || hasMeaningfulSongContent(song?.content_raw),
    hasTablature: Boolean(song?.has_tablature) || hasMeaningfulSongContent(song?.tablature),
  };
}

export function withResolvedSongContentFlags(song) {
  if (!song) return song;
  const { hasChords, hasTablature } = resolveSongContentFlags(song);
  return {
    ...song,
    has_chords: hasChords,
    has_tablature: hasTablature,
  };
}
