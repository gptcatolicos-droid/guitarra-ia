// Resolve the visual Spotify status for a catalog row.
// Green: embed correcto · Amarillo: revisión · Rojo: error/no encontrada · Gris: sin procesar
export function resolveSpotifyStatus(song) {
  const hasValidEmbed = !!(song.spotify_embed || song.spotify_embed_url || song.spotify_track_id);
  if (hasValidEmbed && song.spotify_match_status !== 'review_required') {
    return { key: 'ok', label: 'Embed', color: '#59B879', bg: 'rgba(89,184,121,0.15)' };
  }
  if (song.spotify_match_status === 'review_required') {
    return { key: 'review', label: 'Revisión', color: '#D8A62A', bg: 'rgba(216,166,42,0.15)' };
  }
  if (song.spotify_match_status === 'error' || song.spotify_match_status === 'not_found') {
    return { key: 'error', label: song.spotify_match_status === 'error' ? 'Error' : 'Sin match', color: '#E06464', bg: 'rgba(224,100,100,0.15)' };
  }
  return { key: 'unprocessed', label: 'Sin procesar', color: '#747B7F', bg: 'rgba(116,123,127,0.15)' };
}

export function hasValidEmbed(song) {
  return !!(song.spotify_embed || song.spotify_embed_url || song.spotify_track_id);
}