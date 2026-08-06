import fs from 'node:fs';

const moduleSource = `import { pool } from './db.js';

const NOTE_PATTERN = '(?:[A-G](?:#|b)?|Do|Re|Mi|Fa|Sol|La|Si)(?:m|maj|min|sus|dim|aug|add)?(?:\\d{0,2})?(?:\\/[A-G](?:#|b)?)?';
const chordRegex = new RegExp('(?:^|\\s|\\[|\\()(' + NOTE_PATTERN + ')(?=$|\\s|\\]|\\)|[|,;:-])', 'i');
const explicitKeyRegex = new RegExp('(?:tono|tonalidad|key)\\s*[:=-]\\s*(' + NOTE_PATTERN + ')', 'i');

function normalizeAccidental(value='') {
  return String(value).replace(/♯/g, '#').replace(/♭/g, 'b').trim();
}

function noteToEnglish(value='') {
  const clean = normalizeAccidental(value);
  const match = clean.match(/^(Do|Re|Mi|Fa|Sol|La|Si)(.*)$/i);
  if (!match) return clean;
  const map = { do:'C', re:'D', mi:'E', fa:'F', sol:'G', la:'A', si:'B' };
  return map[match[1].toLowerCase()] + (match[2] || '');
}

function rootKey(chord='') {
  const normalized = noteToEnglish(chord).replace(/[()[\\]]/g, '');
  const match = normalized.match(/^([A-G](?:#|b)?)(m?)/i);
  if (!match) return null;
  return match[1].toUpperCase().replace('B', 'B') + (match[2] ? 'm' : '');
}

function inferKey(song={}) {
  const raw = String(song.content_raw || song.tablature || song.content || '');
  if (!raw.trim()) return null;
  const lines = raw.split(/\\r?\\n/).slice(0, 45);
  const header = lines.slice(0, 20).join(' ');
  const explicit = header.match(explicitKeyRegex);
  if (explicit) {
    const key = rootKey(explicit[1]);
    if (key) return { key, method:'explicit_header', evidence:explicit[0].slice(0,120) };
  }

  for (const originalLine of lines) {
    const line = originalLine.replace(/<[^>]+>/g,' ').replace(/\\{[^}]+\\}/g,' ').trim();
    if (!line || /^\s*(?:capo|afinaci[oó]n|tuning|tempo|intro|verso|coro|estrofa|puente)\s*:?\s*$/i.test(line)) continue;
    if (/^[eBGDAE]\\|[-0-9hpsbrx/\\\\~. ]+$/i.test(line)) continue;
    const match = line.match(chordRegex);
    if (!match) continue;
    const key = rootKey(match[1]);
    if (key) return { key, method:'first_chord', evidence:line.slice(0,160) };
  }
  return null;
}

function normalizedName(value='') {
  return String(value).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

function imageCandidate(data={}) {
  const candidates = [data.image_url, data.artist_image_url, data.spotify_image_url, data.spotify_artist_image, data.cover_image_url];
  return candidates.find((value) => typeof value === 'string' && /^https?:\\/\\//i.test(value.trim()))?.trim() || null;
}

export async function repairSongKeysAndArtistImages() {
  const songsResult = await pool.query(\"SELECT id,data FROM entity_records WHERE entity_name='Song'\");
  const artistsResult = await pool.query(\"SELECT id,data FROM entity_records WHERE entity_name='Artist'\");
  const songs = songsResult.rows;
  const artists = artistsResult.rows;

  let keysAssigned = 0;
  let keysUnresolved = 0;
  const unresolvedSamples = [];
  for (const row of songs) {
    if (String(row.data?.original_key || '').trim()) continue;
    const inferred = inferKey(row.data || {});
    if (!inferred) {
      keysUnresolved++;
      if (unresolvedSamples.length < 30) unresolvedSamples.push({ id:row.data?.id || row.id, title:row.data?.title, artist:row.data?.artist_name });
      continue;
    }
    const patch = {
      original_key: inferred.key,
      key_detection_method: inferred.method,
      key_detection_evidence: inferred.evidence,
      key_detected_at: new Date().toISOString()
    };
    await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1',[row.id,JSON.stringify(patch)]);
    keysAssigned++;
  }

  const artistBySlug = new Map();
  const artistByName = new Map();
  for (const artist of artists) {
    const slug = String(artist.data?.slug || '').trim().toLowerCase();
    const name = normalizedName(artist.data?.name);
    if (slug && !artistBySlug.has(slug)) artistBySlug.set(slug, []);
    if (slug) artistBySlug.get(slug).push(artist);
    if (name && !artistByName.has(name)) artistByName.set(name, []);
    if (name) artistByName.get(name).push(artist);
  }

  const imageBySlug = new Map();
  const imageByName = new Map();
  for (const artist of artists) {
    const image = imageCandidate(artist.data);
    if (!image) continue;
    const slug = String(artist.data?.slug || '').trim().toLowerCase();
    const name = normalizedName(artist.data?.name);
    if (slug) imageBySlug.set(slug,image);
    if (name) imageByName.set(name,image);
  }
  for (const song of songs) {
    const image = imageCandidate(song.data);
    if (!image) continue;
    const slug = String(song.data?.artist_slug || '').trim().toLowerCase();
    const name = normalizedName(song.data?.artist_name);
    if (slug && !imageBySlug.has(slug)) imageBySlug.set(slug,image);
    if (name && !imageByName.has(name)) imageByName.set(name,image);
  }

  let artistsUpdated = 0;
  let songLinksRepaired = 0;
  for (const artist of artists) {
    const slug = String(artist.data?.slug || '').trim().toLowerCase();
    const name = normalizedName(artist.data?.name);
    const image = imageCandidate(artist.data) || imageBySlug.get(slug) || imageByName.get(name);
    if (image && image !== artist.data?.image_url) {
      await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1',[artist.id,JSON.stringify({image_url:image,image_sync_source:'catalog_consolidation'})]);
      artistsUpdated++;
    }
  }

  for (const song of songs) {
    const slug = String(song.data?.artist_slug || '').trim().toLowerCase();
    const name = normalizedName(song.data?.artist_name);
    const matches = (slug && artistBySlug.get(slug)) || (name && artistByName.get(name)) || [];
    if (!matches.length) continue;
    const preferred = matches.find((row) => imageCandidate(row.data)) || matches[0];
    const externalArtistId = preferred.data?.id || preferred.id;
    if (String(song.data?.artist_id || '') !== String(externalArtistId)) {
      await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1',[song.id,JSON.stringify({artist_id:externalArtistId})]);
      songLinksRepaired++;
    }
  }

  const stats = await pool.query(\`SELECT
    COUNT(*)::int AS total,
    COUNT(*) FILTER (WHERE COALESCE(data->>'original_key','')='')::int AS missing_key,
    COUNT(*) FILTER (WHERE COALESCE(data->>'original_key','')<>'')::int AS with_key
    FROM entity_records WHERE entity_name='Song'\`);
  console.log('SONG_KEY_ARTIST_IMAGE_REPAIR', {
    keysAssigned,
    keysUnresolved,
    artistsUpdated,
    songLinksRepaired,
    ...stats.rows[0],
    unresolvedSamples
  });
}
`;

fs.writeFileSync('server/song-key-artist-image-repair.js', moduleSource);

let index = fs.readFileSync('server/index.js','utf8');
if (!index.includes("from './song-key-artist-image-repair.js'")) {
  index = index.replace('import express from "express";', 'import express from "express";\nimport { repairSongKeysAndArtistImages } from \'./song-key-artist-image-repair.js\';');
}
if (!index.includes('await repairSongKeysAndArtistImages();')) {
  const anchor = index.includes('await ensureSongSeoCatalog();') ? 'await ensureSongSeoCatalog();' : 'await initDatabase();';
  index = index.replace(anchor, anchor + '\nawait repairSongKeysAndArtistImages();');
}
fs.writeFileSync('server/index.js', index);
console.log('Song key and artist image repair installed.');
