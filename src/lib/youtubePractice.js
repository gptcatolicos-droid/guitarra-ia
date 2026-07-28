export function getYouTubeVideoId(value = '') {
  const text = String(value || '').trim();
  if (!text) return '';
  const direct = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i);
  if (direct?.[1]) return direct[1];
  const iframe = text.match(/youtube\.com\/embed\/([\w-]{11})/i);
  return iframe?.[1] || '';
}

export function getYouTubePracticeMap(song) {
  const raw = song?.youtube_practice_map;
  if (!raw) return null;
  try {
    const map = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(map?.chord_cues) || map.chord_cues.length < 2) return null;
    return map;
  } catch {
    return null;
  }
}

export function hasYouTubePractice(song) {
  const videoId = song?.youtube_video_id || getYouTubeVideoId(song?.youtube_embed);
  return Boolean(videoId && song?.youtube_analysis_status === 'ready' && getYouTubePracticeMap(song));
}
