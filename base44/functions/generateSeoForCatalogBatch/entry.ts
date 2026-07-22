import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      batchSize = 20,
      dryRun = false,
      force = false,
      processOnlyPending = true,
      offset = 0,
    } = body;

    // Load songs to process
    const statusFilter = processOnlyPending
      ? ['pending', 'error']
      : ['pending', 'error', 'generated', 'review_required'];

    // Fetch all songs (paginated in practice) and filter by seo_status
    const allSongs = await base44.asServiceRole.entities.Song.filter(
      { status: 'published' },
      '-views',
      500
    );

    const toProcess = allSongs
      .filter(s => !s.seo_manual_lock && statusFilter.includes(s.seo_status || 'pending'))
      .slice(offset, offset + batchSize);

    if (dryRun) {
      return Response.json({
        dryRun: true,
        totalEligible: allSongs.filter(s => !s.seo_manual_lock && statusFilter.includes(s.seo_status || 'pending')).length,
        batchSize,
        offset,
        wouldProcess: toProcess.map(s => ({
          id: s.id,
          title: s.title,
          artist: s.artist_name,
          currentStatus: s.seo_status || 'pending',
          hasChords: s.has_chords,
          hasKey: !!s.original_key,
          hasDifficulty: !!s.difficulty,
        })),
      });
    }

    // Process each song by invoking generateSeoForSong
    const results = [];
    for (const song of toProcess) {
      try {
        const res = await base44.asServiceRole.functions.invoke('generateSeoForSong', {
          songId: song.id,
          force,
        });
        results.push({ id: song.id, title: song.title, ...res });
      } catch (err) {
        results.push({ id: song.id, title: song.title, error: err.message });
        // Mark as error
        try {
          await base44.asServiceRole.entities.Song.update(song.id, {
            seo_status: 'error',
            seo_review_notes: err.message,
          });
        } catch (_) {}
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => r.error).length;
    const skipped = results.filter(r => r.skipped).length;

    return Response.json({
      success: true,
      processed: toProcess.length,
      succeeded,
      failed,
      skipped,
      nextOffset: offset + batchSize,
      hasMore: (offset + batchSize) < allSongs.filter(s => !s.seo_manual_lock && statusFilter.includes(s.seo_status || 'pending')).length,
      results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});