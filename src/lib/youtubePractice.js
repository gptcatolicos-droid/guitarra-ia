/**
 * Obtiene el ID desde una URL de YouTube, un enlace de embed o un iframe.
 * No realiza peticiones ni modifica datos de canciones.
 */
export function getYouTubeVideoId(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const source = raw.match(/src=["']([^"']+)["']/i)?.[1] || raw;
  return source.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/i,
  )?.[1] || '';
}

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * La canción piloto conserva su práctica ya validada aunque todavía no tenga
 * el campo de YouTube guardado. Se elimina al guardar su URL desde Admin.
 */
export function isYouTubePracticePilot(song) {
  const title = normalize(song?.title);
  const artist = normalize(song?.artist_name);
  return title.includes('silent lucidity') && artist.includes('queensryche');
}

export function hasYouTubePractice(song) {
  return Boolean(
    song?.youtube_video_id
    || getYouTubeVideoId(song?.youtube_embed)
    || isYouTubePracticePilot(song),
  );
}
