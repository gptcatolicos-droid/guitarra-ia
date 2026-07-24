// Shared Spotify search + track processing utilities
import { spotifyFetch } from './spotifyAuth.js';

const MARKET = 'CO';

export async function searchSpotify(query) {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=${MARKET}&limit=10`;
  const res = await spotifyFetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.tracks?.items || [];
}

export function buildEmbedUrl(trackId) {
  return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
}

// A song already has a usable Spotify embed if any of these identifiers is present.
export function hasValidEmbed(song) {
  return !!(song?.spotify_embed || song?.spotify_embed_url || song?.spotify_track_id);
}

export function validateTrackId(id) {
  return /^[A-Za-z0-9]{10,30}$/.test(id || '');
}

export async function findBestMatch(song) {
  const cleanTitle = (song.title || '').replace(/\s*\d+$/, '').trim();
  const artist = song.artist_name || '';

  let candidates = [];
  let method = 'fuzzy_artist_title';

  if (song.spotify_isrc) {
    candidates = await searchSpotify(`isrc:${song.spotify_isrc}`);
    if (candidates.length) method = 'isrc';
  }
  if (!candidates.length) {
    candidates = await searchSpotify(`track:"${cleanTitle}" artist:"${artist}"`);
    if (candidates.length) method = 'exact_artist_title';
  }
  if (!candidates.length) {
    candidates = await searchSpotify(`${cleanTitle} ${artist}`);
  }

  return { candidates, method, cleanTitle, artist };
}

export function buildUpdatePayload(track, method, score, matchStatus, existingIsrc) {
  const trackId = track.id;
  return {
    spotify_track_id: trackId,
    spotify_uri: track.uri,
    spotify_url: track.external_urls?.spotify,
    spotify_embed_url: buildEmbedUrl(trackId),
    spotify_embed: buildEmbedUrl(trackId),
    spotify_track_name: track.name,
    spotify_artist_name: (track.artists || []).map(a => a.name).join(', '),
    spotify_album_name: track.album?.name,
    spotify_duration_ms: track.duration_ms,
    spotify_isrc: track.external_ids?.isrc || existingIsrc,
    spotify_match_score: Math.round(score * 100) / 100,
    spotify_match_status: matchStatus,
    spotify_match_method: method,
    spotify_last_sync: new Date().toISOString(),
    spotify_sync_error: null,
  };
}