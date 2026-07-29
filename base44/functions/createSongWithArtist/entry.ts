import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { hasMeaningfulSongContent } from '../../shared/songContentFlags.js';

// Normalize a name: remove accents, lowercase, trim, collapse spaces
function normalizeName(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(text) {
  return normalizeName(text)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

function spotifyEmbedDetails(value) {
  const embed = (value || '').trim();
  if (!embed) return { embed: '', embedUrl: '', trackId: '' };
  const src = embed.match(/src=["']([^"']+)["']/i)?.[1] || embed;
  const embedUrl = src.split('?')[0];
  const trackId = embedUrl.match(/\/track\/([A-Za-z0-9]+)/)?.[1] || '';
  return { embed, embedUrl, trackId };
}

function youtubeEmbedDetails(value) {
  const embed = (value || '').trim();
  if (!embed) return { embed: '', videoId: '' };
  const source = embed.match(/src=["']([^"']+)["']/i)?.[1] || embed;
  const videoId = source.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/i)?.[1] || '';
  return { embed, videoId };
}

// Find existing artist by slug or normalized name match
async function findExistingArtist(base44, artistName) {
  const slug = slugify(artistName);
  const normalized = normalizeName(artistName);

  // Try by slug first
  const bySlug = await base44.asServiceRole.entities.Artist.filter({ slug });
  if (bySlug && bySlug.length > 0) return bySlug[0];

  // Try by normalized name
  const all = await base44.asServiceRole.entities.Artist.filter({});
  for (const a of all) {
    const aN = normalizeName(a.name);
    if (aN === normalized) return a;
    // Also check aliases
    if (a.aliases && a.aliases.some(al => normalizeName(al) === normalized)) return a;
  }
  return null;
}

// Find or create artist — returns { artist, created, reused }
async function findOrCreateArtist(base44, artistName, identity = {}) {
  if (!artistName) throw new Error('artist_name is required');
  const imageUrl = (identity.imageUrl || '').trim();
  const spotifyUrl = (identity.spotifyUrl || '').trim();
  const existing = await findExistingArtist(base44, artistName);
  if (existing) {
    // Artists own their identity. Updating it here updates every existing
    // song dynamically without storing the same image thousands of times.
    const updates: Record<string, string> = {};
    if (imageUrl) updates.image_url = imageUrl;
    if (spotifyUrl) updates.spotify_artist_url = spotifyUrl;
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Artist.update(existing.id, updates);
      return { artist: { ...existing, ...updates }, created: false, reused: true };
    }
    return { artist: existing, created: false, reused: true };
  }

  const slug = slugify(artistName);
  const artist = await base44.asServiceRole.entities.Artist.create({
    name: artistName,
    slug,
    normalized_name: normalizeName(artistName),
    is_demo: false,
    is_featured: false,
    ...(imageUrl ? { image_url: imageUrl } : {}),
    ...(spotifyUrl ? { spotify_artist_url: spotifyUrl } : {}),
  });

  // Auto-fetch only when the editor did not provide the official image.
  if (!imageUrl) {
    try {
      const res = await base44.asServiceRole.functions.invoke('spotifyArtist', {
        artist_name: artistName,
        ...(spotifyUrl ? { spotify_url: spotifyUrl } : {}),
      });
      if (res?.data?.image_url) {
        await base44.asServiceRole.entities.Artist.update(artist.id, { image_url: res.data.image_url });
        artist.image_url = res.data.image_url;
      }
    } catch (_) { /* non-critical */ }
  }

  return { artist, created: true, reused: false };
}

// Extract the first valid chord token from a chord sheet, to use as fallback key
const CHORD_RE = /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|°|ø)?[0-9]*(\/[A-G](#|b)?)?$/;
function firstChordFromContent(content) {
  if (!content) return '';
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || (line.startsWith('[') && line.endsWith(']'))) continue;
    const tokens = line.split(/\s+/);
    // A chord line is one where every token looks like a chord
    if (tokens.length && tokens.every((t) => CHORD_RE.test(t))) {
      // Return the root chord (strip slash bass so "Am/E" -> "Am")
      return tokens[0].split('/')[0];
    }
  }
  return '';
}

// Detect duplicate song by slug + artist_slug
async function detectDuplicate(base44, songSlug, artistSlug) {
  const existing = await base44.asServiceRole.entities.Song.filter({
    slug: songSlug,
    artist_slug: artistSlug,
  });
  return existing && existing.length > 0 ? existing[0] : null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      artist_name,
      content_raw,
      tablature,
      original_key,
      capo = 0,
      tuning,
      difficulty,
      language = 'Español',
      has_chords,
      has_tablature,
      chords_used = [],
      spotify_embed = '',
      youtube_embed = '',
      artist_image_url = '',
      spotify_artist_url = '',
      is_unplugged = false,
      dryRun = false,
    } = body;

    // --- Validations ---
    if (!title || title.trim().length < 2) {
      return Response.json({ error: 'El título es obligatorio y debe tener al menos 2 caracteres.' }, { status: 400 });
    }
    if (!artist_name || artist_name.trim().length < 1) {
      return Response.json({ error: 'El nombre del artista es obligatorio.' }, { status: 400 });
    }
    if (!content_raw && !tablature) {
      return Response.json({ error: 'Debes proveer acordes (content_raw) o tablatura.' }, { status: 400 });
    }

    const songSlug = slugify(title);
    const artistSlug = slugify(artist_name);

    // --- Duplicate detection ---
    const duplicate = await detectDuplicate(base44, songSlug, artistSlug);
    if (duplicate) {
      return Response.json({
        error: 'duplicate',
        message: `Ya existe la canción "${title}" de ${artist_name}.`,
        existing_id: duplicate.id,
      }, { status: 409 });
    }

    if (dryRun) {
      // Find artist without creating
      const existingArtist = await findExistingArtist(base44, artist_name);
      return Response.json({
        dryRun: true,
        songSlug,
        artistSlug,
        artistAction: existingArtist ? 'reuse' : 'create',
        artistId: existingArtist?.id || null,
        duplicate: false,
      });
    }

    // --- Find or create artist ---
    const { artist, created: artistCreated, reused: artistReused } = await findOrCreateArtist(base44, artist_name, {
      imageUrl: artist_image_url,
      spotifyUrl: spotify_artist_url,
    });

    // --- Auto-detect key from first chord if none provided ---
    const resolvedKey = (original_key && original_key.trim())
      ? original_key.trim()
      : firstChordFromContent(content_raw);

    // --- Create song ---
    const manualSpotify = spotifyEmbedDetails(spotify_embed);
    const manualYouTube = youtubeEmbedDetails(youtube_embed);
    const songData = {
      title: title.trim(),
      slug: songSlug,
      artist_name: artist.name, // use canonical name from artist record
      artist_slug: artistSlug,
      artist_id: artist.id,
      original_key: resolvedKey || '',
      capo: Number(capo) || 0,
      tuning: tuning || 'Estándar',
      difficulty: difficulty || 'Intermedia',
      language: language || 'Español',
      // Content is authoritative: a stale UI flag must not hide it.
      has_chords: Boolean(has_chords) || hasMeaningfulSongContent(content_raw),
      has_tablature: Boolean(has_tablature) || hasMeaningfulSongContent(tablature),
      content_raw: content_raw || '',
      tablature: tablature || '',
      chords_used: chords_used || [],
      status: 'published',
      is_demo: false,
      is_unplugged: Boolean(is_unplugged),
      views: 0,
      spotify_match_status: manualSpotify.embed ? 'matched' : 'pending',
      ...(manualYouTube.embed ? {
        youtube_embed: manualYouTube.embed,
        youtube_video_id: manualYouTube.videoId,
        youtube_practice_enabled: false,
        youtube_analysis_status: manualYouTube.videoId ? 'awaiting_audio' : 'not_requested',
      } : {}),
      ...(manualSpotify.embed ? {
        spotify_embed: manualSpotify.embed,
        spotify_embed_url: manualSpotify.embedUrl,
        ...(manualSpotify.trackId ? { spotify_track_id: manualSpotify.trackId } : {}),
        spotify_match_method: 'manual',
        spotify_manual_lock: true,
      } : {}),
    };

    const song = await base44.asServiceRole.entities.Song.create(songData);

    // --- Trigger Spotify sync async (non-blocking) ---
    if (!manualSpotify.embed) {
      try {
        await base44.asServiceRole.functions.invoke('syncSpotifyForSong', { songId: song.id });
      } catch (_) { /* Spotify failure doesn't block song creation */ }
    }

    return Response.json({
      success: true,
      songId: song.id,
      songSlug,
      artistSlug,
      artistId: artist.id,
      artistCreated,
      artistReused,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
