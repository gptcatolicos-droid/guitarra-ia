// Compatibilidad central para toda la experiencia de práctica con YouTube.
// Este archivo debe subirse junto con YouTubePracticePlayer.jsx.
export function getYouTubeVideoId(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';

  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i);
  return match?.[1] || '';
}

export function getYouTubePracticeMap(song) {
  const rawMap = song?.youtube_practice_map;
  if (!rawMap) return null;

  try {
    const map = typeof rawMap === 'string' ? JSON.parse(rawMap) : rawMap;
    return Array.isArray(map?.chord_cues) && map.chord_cues.length >= 2 ? map : null;
  } catch {
    return null;
  }
}

export function hasYouTubePractice(song) {
  const videoId = song?.youtube_video_id || getYouTubeVideoId(song?.youtube_embed);
  return Boolean(videoId && song?.youtube_analysis_status === 'ready' && getYouTubePracticeMap(song));
}
