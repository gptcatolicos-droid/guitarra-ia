import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { buildSongFlagRepair } from '../../shared/songContentFlags.js';

const DEFAULT_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 500;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const offset = Math.max(0, Number(body.offset) || 0);
    const requestedLimit = Number(body.limit) || DEFAULT_BATCH_SIZE;
    const limit = Math.min(MAX_BATCH_SIZE, Math.max(1, requestedLimit));

    const songs = await base44.asServiceRole.entities.Song.list(
      'created_date',
      limit,
      offset,
      ['id', 'title', 'artist_name', 'has_chords', 'has_tablature', 'content_raw', 'tablature'],
    );

    const updates = [];
    let chordsActivated = 0;
    let tablaturesActivated = 0;
    const samples = [];

    for (const song of songs) {
      const repair = buildSongFlagRepair(song);
      if (Object.keys(repair).length === 0) continue;

      if (repair.has_chords === true) chordsActivated += 1;
      if (repair.has_tablature === true) tablaturesActivated += 1;

      updates.push({ id: song.id, ...repair });
      if (samples.length < 10) {
        samples.push({
          id: song.id,
          title: song.title,
          artist: song.artist_name,
          changes: repair,
        });
      }
    }

    if (!dryRun && updates.length > 0) {
      await base44.asServiceRole.entities.Song.bulkUpdate(updates);
    }

    const scanned = songs.length;
    const nextOffset = offset + scanned;

    return Response.json({
      success: true,
      dryRun,
      scanned,
      fixedSongs: updates.length,
      chordsActivated,
      tablaturesActivated,
      offset,
      nextOffset,
      done: scanned < limit,
      samples,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || 'No se pudo reparar el catálogo.' },
      { status: 500 },
    );
  }
});
