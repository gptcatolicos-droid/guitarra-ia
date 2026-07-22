import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { findBestMatch, validateTrackId, buildUpdatePayload } from '../../shared/spotifySearch.js';
import { scoreMatch, getMatchStatus } from '../../shared/spotifyMatch.js';

const MAX_CONCURRENCY = 2;

async function processSong(song, base44) {
  if (song.spotify_manual_lock) return 'skipped';
  if (!song.title || !song.artist_name) {
    await base44.asServiceRole.entities.Song.update(song.id, {
      spotify_match_status: 'review_required',
      spotify_sync_error: 'Missing title or artist',
      spotify_last_sync: new Date().toISOString(),
    });
    return 'review_required';
  }

  const { candidates, method, cleanTitle, artist } = await findBestMatch(song);

  if (!candidates.length) {
    await base44.asServiceRole.entities.Song.update(song.id, {
      spotify_match_status: 'not_found',
      spotify_last_sync: new Date().toISOString(),
    });
    return 'not_found';
  }

  const scored = candidates
    .map(track => ({ track, score: scoreMatch(cleanTitle, artist, track) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const matchStatus = method === 'isrc' ? 'matched' : getMatchStatus(best.score);

  if (!validateTrackId(best.track.id)) {
    await base44.asServiceRole.entities.Song.update(song.id, {
      spotify_match_status: 'error',
      spotify_sync_error: 'Invalid track ID',
      spotify_last_sync: new Date().toISOString(),
    });
    return 'error';
  }

  const payload = buildUpdatePayload(best.track, method, best.score, matchStatus, song.spotify_isrc);
  await base44.asServiceRole.entities.Song.update(song.id, payload);
  return matchStatus;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { batchSize = 20, jobId, action = 'process' } = body;

    // Handle pause action
    if (action === 'pause' && jobId) {
      await base44.asServiceRole.entities.SpotifySyncJob.update(jobId, { status: 'paused' });
      return Response.json({ status: 'paused' });
    }

    let job;
    if (jobId) {
      const jobs = await base44.asServiceRole.entities.SpotifySyncJob.filter({ id: jobId });
      job = jobs?.[0];
      if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
    } else {
      const pendingCount = (await base44.asServiceRole.entities.Song.filter({ spotify_match_status: 'pending' }, '-created_date', 5000) || []).length;
      job = await base44.asServiceRole.entities.SpotifySyncJob.create({
        status: 'running',
        total_records: pendingCount,
        processed_records: 0,
        matched_records: 0,
        review_records: 0,
        not_found_records: 0,
        error_records: 0,
        started_at: new Date().toISOString(),
      });
    }

    await base44.asServiceRole.entities.SpotifySyncJob.update(job.id, { status: 'running' });

    // Get next batch
    const allPending = [];
    const p1 = await base44.asServiceRole.entities.Song.filter({ spotify_match_status: 'pending' }, '-created_date', batchSize);
    allPending.push(...(p1 || []));

    if (allPending.length < batchSize) {
      const p2 = await base44.asServiceRole.entities.Song.filter({ spotify_match_status: 'error' }, '-created_date', batchSize - allPending.length);
      allPending.push(...(p2 || []));
    }

    const toProcess = allPending.filter(s => !s.spotify_manual_lock).slice(0, batchSize);

    if (toProcess.length === 0) {
      await base44.asServiceRole.entities.SpotifySyncJob.update(job.id, {
        status: 'completed',
        finished_at: new Date().toISOString(),
      });
      return Response.json({ jobId: job.id, status: 'completed', processed: 0 });
    }

    const results = { matched: 0, review_required: 0, not_found: 0, error: 0, skipped: 0 };
    const chunks = [];
    for (let i = 0; i < toProcess.length; i += MAX_CONCURRENCY) {
      chunks.push(toProcess.slice(i, i + MAX_CONCURRENCY));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(s => processSong(s, base44).catch(() => 'error'))
      );
      for (const r of chunkResults) {
        if (r === 'matched') results.matched++;
        else if (r === 'review_required') results.review_required++;
        else if (r === 'not_found') results.not_found++;
        else if (r === 'error') results.error++;
        else results.skipped++;
      }
      await new Promise(r => setTimeout(r, 300));
    }

    await base44.asServiceRole.entities.SpotifySyncJob.update(job.id, {
      processed_records: (job.processed_records || 0) + toProcess.length,
      matched_records: (job.matched_records || 0) + results.matched,
      review_records: (job.review_records || 0) + results.review_required,
      not_found_records: (job.not_found_records || 0) + results.not_found,
      error_records: (job.error_records || 0) + results.error,
      status: 'paused',
    });

    return Response.json({
      jobId: job.id,
      processed: toProcess.length,
      results,
      hasMore: toProcess.length === batchSize,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});