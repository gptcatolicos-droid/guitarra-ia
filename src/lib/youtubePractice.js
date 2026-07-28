/**
 * Normaliza una URL, URL de embed o iframe de YouTube y devuelve su video ID.
 * No hace llamadas externas: solo valida información ya almacenada en la canción.
 */
export function getYouTubeVideoId(value = '') {
  const raw = String(value || '').trim();

  if (!raw) return '';

  const source = raw.match(/src=["']([^"']+)["']/i)?.[1] || raw;
  const match = source.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/i,
  );

  return match?.[1] || '';
}

/**
 * Indica si la canción tiene un video de práctica válido configurado.
 */
export function hasYouTubePractice(song) {
  return Boolean(
    song?.youtube_video_id || getYouTubeVideoId(song?.youtube_embed),
  );
}
