import fs from 'node:fs';

const moduleSource = `import { pool } from './db.js';

let cachedToken = null;
let tokenExpiresAt = 0;

function clean(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/\\([^)]*\\)|\\[[^\\]]*\\]/g, ' ')
    .replace(/\\b(official|audio|video|lyrics?|letra|acordes|tablatura|unplugged|live|remaster(?:ed)?|version|versión)\\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function words(value = '') {
  return new Set(clean(value).split(/\\s+/).filter(Boolean));
}

function similarity(a, b) {
  const left = words(a);
  const right = words(b);
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const word of left) if (right.has(word)) common++;
  return (2 * common) / (left.size + right.size);
}

function hasSpotifyPlayer(song = {}) {
  return Boolean(song.spotify_embed || song.spotify_embed_url || song.spotify_track_id);
}

async function spotifyToken() {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) return cachedToken;
  const id = String(process.env.SPOTIFY_CLIENT_ID || '').trim();
  const secret = String(process.env.SPOTIFY_CLIENT_SECRET || '').trim();
  if (!id || !secret) throw new Error('Spotify credentials are not configured');
  const auth = Buffer.from(id + ':' + secret).toString('base64');
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new Error('Spotify token failed: ' + response.status);
  const payload = await response.json();
  cachedToken = payload.access_token;
  tokenExpiresAt = Date.now() + Number(payload.expires_in || 3600) * 1000;
  return cachedToken;
}

async function resolveSongRecord(songId) {
  const value = String(songId || '').trim();
  if (!value) return null;
  const result = await pool.query(
    \`SELECT id,data FROM entity_records
     WHERE entity_name='Song'
       AND (id::text=$1 OR data->>'id'=$1)
     LIMIT 1\`,
    [value]
  );
  return result.rows[0] || null;
}

async function searchSpotify(song) {
  const token = await spotifyToken();
  const title = String(song.title || '').replace(/\\s*-\\s*\\d+\\s*-\\s*[a-f0-9]{6,}\\s*$/i, '').trim();
  const artist = String(song.artist_name || '').trim();
  const q = 'track:' + title + (artist ? ' artist:' + artist : '');
  const response = await fetch(
    'https://api.spotify.com/v1/search?type=track&limit=10&market=CO&q=' + encodeURIComponent(q),
    { headers: { Authorization: 'Bearer ' + token } }
  );
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after') || 2);
    const error = new Error('Spotify rate limit');
    error.retryAfter = Math.min(30, Math.max(1, retryAfter));
    throw error;
  }
  if (!response.ok) throw new Error('Spotify search failed: ' + response.status);
  const payload = await response.json();
  const candidates = payload.tracks?.items || [];
  const ranked = candidates.map((track) => {
    const titleScore = similarity(title, track.name);
    const artistScore = Math.max(0, ...(track.artists || []).map((item) => similarity(artist, item.name)));
    const score = titleScore * 0.7 + artistScore * 0.3;
    return { track, titleScore, artistScore, score };
  }).sort((a, b) => b.score - a.score);
  return ranked[0] || null;
}

function spotifyPatch(best) {
  const track = best.track;
  const embed = 'https://open.spotify.com/embed/track/' + track.id + '?utm_source=generator';
  return {
    spotify_track_id: track.id,
    spotify_track_name: track.name,
    spotify_artist_name: (track.artists || []).map((a) => a.name).join(', '),
    spotify_album_name: track.album?.name || null,
    spotify_duration_ms: track.duration_ms || null,
    spotify_url: track.external_urls?.spotify || null,
    spotify_embed: embed,
    spotify_embed_url: embed,
    spotify_match_score: Number(best.score.toFixed(4)),
    spotify_match_status: 'matched',
    spotify_match_method: 'spotify-api-auto',
    spotify_synced_at: new Date().toISOString(),
    spotify_sync_error: null,
  };
}

export async function syncSpotifyForSongRecord(songId, { force = false } = {}) {
  const row = await resolveSongRecord(songId);
  if (!row) throw new Error('Canción no encontrada');
  const song = row.data || {};
  if (song.spotify_manual_lock || (!force && hasSpotifyPlayer(song))) {
    return { skipped: true, reason: song.spotify_manual_lock ? 'manual_lock' : 'already_has_player', songId: song.id || row.id };
  }

  try {
    const best = await searchSpotify(song);
    if (!best) {
      const patch = { spotify_match_status: 'not_found', spotify_match_method: 'spotify-api-auto', spotify_sync_error: null, spotify_synced_at: new Date().toISOString() };
      await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1', [row.id, JSON.stringify(patch)]);
      return { skipped: false, matched: false, status: 'not_found', songId: song.id || row.id };
    }

    const safe = best.score >= 0.82 && best.titleScore >= 0.82 && (best.artistScore >= 0.58 || !song.artist_name);
    const patch = safe ? spotifyPatch(best) : {
      spotify_track_id: best.track.id,
      spotify_track_name: best.track.name,
      spotify_artist_name: (best.track.artists || []).map((a) => a.name).join(', '),
      spotify_album_name: best.track.album?.name || null,
      spotify_duration_ms: best.track.duration_ms || null,
      spotify_url: best.track.external_urls?.spotify || null,
      spotify_match_score: Number(best.score.toFixed(4)),
      spotify_match_status: 'review_required',
      spotify_match_method: 'spotify-api-proposal',
      spotify_synced_at: new Date().toISOString(),
      spotify_sync_error: null,
    };
    await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1', [row.id, JSON.stringify(patch)]);
    return { skipped: false, matched: safe, status: patch.spotify_match_status, songId: song.id || row.id, score: patch.spotify_match_score };
  } catch (error) {
    const patch = { spotify_match_status: 'error', spotify_sync_error: error.message, spotify_synced_at: new Date().toISOString() };
    await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1', [row.id, JSON.stringify(patch)]);
    throw error;
  }
}

export async function syncSpotifyCatalogBatch({ batchSize = 20, retryNotFound = true } = {}) {
  const size = Math.max(1, Math.min(50, Number(batchSize) || 20));
  const statuses = retryNotFound ? ['pending','error','not_found'] : ['pending','error'];
  const result = await pool.query(
    \`SELECT id,data FROM entity_records
     WHERE entity_name='Song'
       AND NOT COALESCE((data->>'spotify_manual_lock')::boolean,false)
       AND COALESCE(data->>'spotify_embed','')=''
       AND COALESCE(data->>'spotify_embed_url','')=''
       AND COALESCE(data->>'spotify_track_id','')=''
       AND COALESCE(data->>'spotify_match_status','pending') = ANY($2::text[])
     ORDER BY updated_date ASC, created_date ASC
     LIMIT $1\`,
    [size, statuses]
  );

  let matched = 0, review = 0, notFound = 0, failed = 0, skipped = 0;
  const errors = [];
  for (const row of result.rows) {
    try {
      const outcome = await syncSpotifyForSongRecord(row.id);
      if (outcome.skipped) skipped++;
      else if (outcome.status === 'matched') matched++;
      else if (outcome.status === 'review_required') review++;
      else if (outcome.status === 'not_found') notFound++;
    } catch (error) {
      failed++;
      errors.push({ id: row.data?.id || row.id, error: error.message });
      if (error.retryAfter) await new Promise((resolve) => setTimeout(resolve, error.retryAfter * 1000));
    }
  }

  const remainingResult = await pool.query(
    \`SELECT COUNT(*)::int AS remaining FROM entity_records
     WHERE entity_name='Song'
       AND NOT COALESCE((data->>'spotify_manual_lock')::boolean,false)
       AND COALESCE(data->>'spotify_embed','')=''
       AND COALESCE(data->>'spotify_embed_url','')=''
       AND COALESCE(data->>'spotify_track_id','')=''
       AND COALESCE(data->>'spotify_match_status','pending') = ANY($1::text[])\`,
    [statuses]
  );
  const remaining = remainingResult.rows[0]?.remaining || 0;
  return {
    jobId: 'spotify-catalog', status: remaining ? 'running' : 'completed',
    processed: result.rows.length, matched, review, notFound, failed, skipped, errors,
    remaining, hasMore: remaining > 0,
  };
}
`;

fs.writeFileSync('server/spotify-sync.js', moduleSource);

let functions = fs.readFileSync('server/functions.js', 'utf8');
if (!functions.includes("from './spotify-sync.js'")) {
  functions = "import { syncSpotifyForSongRecord, syncSpotifyCatalogBatch } from './spotify-sync.js';\n" + functions;
}
const routeNeedle = 'functionsRouter.post("/:name", async (req, res) => {';
if (functions.includes(routeNeedle) && !functions.includes("req.params.name === 'syncSpotifyForSong'")) {
  functions = functions.replace(routeNeedle, routeNeedle + `
  if (req.params.name === 'syncSpotifyForSong') {
    try { return res.json(await syncSpotifyForSongRecord(req.body?.songId, { force:Boolean(req.body?.force) })); }
    catch (error) { return res.status(500).json({ error:error.message }); }
  }
  if (req.params.name === 'syncSpotifyCatalogBatch') {
    try { return res.json(await syncSpotifyCatalogBatch(req.body || {})); }
    catch (error) { return res.status(500).json({ error:error.message }); }
  }`);
}
fs.writeFileSync('server/functions.js', functions);

const uiPath = 'src/components/admin/SpotifySyncAdmin.jsx';
let ui = fs.readFileSync(uiPath, 'utf8');
ui = ui.replace(
  "const syncableSongs = missingPlayerSongs.filter((song) => !song.spotify_match_status || song.spotify_match_status === 'pending' || song.spotify_match_status === 'error');",
  "const syncableSongs = missingPlayerSongs.filter((song) => !song.spotify_manual_lock && (!song.spotify_match_status || ['pending','error','not_found'].includes(song.spotify_match_status)));"
);
ui = ui.replace(
  "batchSize: BATCH_SIZE,",
  "batchSize: BATCH_SIZE, retryNotFound: true,"
);
ui = ui.replace(
  "batchSize: BATCH_SIZE,\n        });",
  "batchSize: BATCH_SIZE, retryNotFound: true,\n        });"
);
fs.writeFileSync(uiPath, ui);
console.log('Protected Spotify catalog synchronization installed.');
