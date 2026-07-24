import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findBestMatch, validateTrackId, buildUpdatePayload, hasValidEmbed } from '../../shared/spotifySearch.js';
import { analyzeMatch, getVerdict } from '../../shared/spotifyMatch.js';

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

    // Never overwrite an existing valid embed unless explicitly forced.
    if (hasValidEmbed(song) && !force) {
      return Response.json({ status: 'skipped', reason: 'existing_embed' });
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
      .map(track => ({ track, analysis: analyzeMatch(cleanTitle, artist, track) }))
      .sort((a, b) => b.analysis.score - a.analysis.score);

    const best = scored[0];
    const verdict = getVerdict(best.analysis, method);
    const matchStatus = verdict.status;

    // Discarded matches must not fill the record with a wrong/approximate track.
    if (matchStatus === 'not_found') {
      await base44.asServiceRole.entities.Song.update(songId, {
        spotify_match_status: 'not_found',
        spotify_sync_error: null,
        spotify_last_sync: new Date().toISOString(),
      });
      return Response.json({ status: 'not_found', reason: verdict.reason, score: best.analysis.score });
    }

    if (!validateTrackId(best.track.id)) {
      await base44.asServiceRole.entities.Song.update(songId, {
        spotify_match_status: 'error',
        spotify_sync_error: 'Invalid track ID format',
        spotify_last_sync: new Date().toISOString(),
      });
      return Response.json({ status: 'error', reason: 'invalid_track_id' });
    }

    const payload = buildUpdatePayload(best.track, method, best.analysis.score, matchStatus, song.spotify_isrc);

    // Only auto-approved matches write the embed. Review cases store the suggested
    // track metadata WITHOUT the embed, so an admin can confirm it first.
    if (matchStatus === 'review_required') {
      delete payload.spotify_embed;
      delete payload.spotify_embed_url;
    }
    await base44.asServiceRole.entities.Song.update(songId, payload);

    return Response.json({
      status: matchStatus,
      reason: verdict.reason,
      score: best.analysis.score,
      title_similarity: best.analysis.titleSim,
      artist_similarity: best.analysis.artistSim,
      track_name: best.track.name,
      artist_name: payload.spotify_artist_name,
      track_id: best.track.id,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});