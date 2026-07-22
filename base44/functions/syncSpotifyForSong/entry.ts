import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findBestMatch, validateTrackId, buildUpdatePayload } from '../../shared/spotifySearch.js';
import { scoreMatch, getMatchStatus } from '../../shared/spotifyMatch.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { songId, force = false } = body;

    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    const songs = await base44.asServiceRole.entities.Song.filter({ id: songId });
    const song = songs?.[0];
    if (!song) return Response.json({ error: 'Song not found' }, { status: 404 });

    if (song.spotify_manual_lock && !force) {
      return Response.json({ status: 'skipped', reason: 'manual_lock' });
    }

    if (!song.title || !song.artist_name) {
      await base44.asServiceRole.entities.Song.update(songId, {
        spotify_match_status: 'review_required',
        spotify_sync_error: 'Missing title or artist',
        spotify_last_sync: new Date().toISOString(),
      });
      return Response.json({ status: 'review_required', reason: 'missing_data' });
    }

    await base44.asServiceRole.entities.Song.update(songId, {
      spotify_match_status: 'processing',
      spotify_last_sync: new Date().toISOString(),
    });

    const { candidates, method, cleanTitle, artist } = await findBestMatch(song);

    if (!candidates.length) {
      await base44.asServiceRole.entities.Song.update(songId, {
        spotify_match_status: 'not_found',
        spotify_sync_error: null,
        spotify_last_sync: new Date().toISOString(),
      });
      return Response.json({ status: 'not_found' });
    }

    const scored = candidates
      .map(track => ({ track, score: scoreMatch(cleanTitle, artist, track) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const matchStatus = method === 'isrc' ? 'matched' : getMatchStatus(best.score);

    if (!validateTrackId(best.track.id)) {
      await base44.asServiceRole.entities.Song.update(songId, {
        spotify_match_status: 'error',
        spotify_sync_error: 'Invalid track ID format',
        spotify_last_sync: new Date().toISOString(),
      });
      return Response.json({ status: 'error', reason: 'invalid_track_id' });
    }

    const payload = buildUpdatePayload(best.track, method, best.score, matchStatus, song.spotify_isrc);
    await base44.asServiceRole.entities.Song.update(songId, payload);

    return Response.json({
      status: matchStatus,
      score: best.score,
      track_name: best.track.name,
      artist_name: payload.spotify_artist_name,
      track_id: best.track.id,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});