/**
 * Returns only safe flag promotions.
 *
 * The repair never deletes content and never changes a true flag to false.
 * A populated content_raw activates chords; a populated tablature activates
 * tablature. This matches the fields consumed by ChordViewer/TablatureViewer.
 */
export function hasMeaningfulSongContent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildSongFlagRepair(song) {
  const shouldHaveChords =
    Boolean(song?.has_chords) || hasMeaningfulSongContent(song?.content_raw);
  const shouldHaveTablature =
    Boolean(song?.has_tablature) || hasMeaningfulSongContent(song?.tablature);

  const update = {};
  if (shouldHaveChords !== Boolean(song?.has_chords)) {
    update.has_chords = shouldHaveChords;
  }
  if (shouldHaveTablature !== Boolean(song?.has_tablature)) {
    update.has_tablature = shouldHaveTablature;
  }
  return update;
}
