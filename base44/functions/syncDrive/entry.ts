import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const FOLDER_ID = '1VlFY-cSfhxqcAhDtiBBW8nsZkXcnl9z1';

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'unknown';
}

function detectKey(content) {
  const match = content.match(/(?:Tonalidad|Tom|Key|Clave)[:\s]+([A-G][#b]?m?)/i);
  return match ? match[1] : null;
}

function detectCapo(content) {
  const match = content.match(/(?:Capo|Cejilla)[:\s]+(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}

function detectDifficulty(content) {
  const lower = content.toLowerCase();
  if (lower.includes('avanzad') || lower.includes('difícil') || lower.includes('dificil')) return 'Avanzada';
  if (lower.includes('intermedi') || lower.includes('moderado')) return 'Intermedia';
  return 'Fácil';
}

function extractChords(content) {
  const chordPattern = /\b([A-G][#b]?(?:sus[24]?|maj7?|min7?|dim7?|aug|m7?|7|9|11|add9)?(?:\/[A-G][#b]?)?)\b/g;
  const found = new Set();
  let match;
  while ((match = chordPattern.exec(content)) !== null) {
    found.add(match[1]);
  }
  return Array.from(found).slice(0, 20);
}

function hasTablature(content) {
  return /[eEBGDAd]\|[-\d|]+/.test(content);
}

async function listFilesInFolder(folderId, accessToken) {
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,modifiedTime)&pageSize=1000`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Drive API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.files || [];
}

async function downloadFile(fileId, accessToken) {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Download error: ${res.status}`);
  return res.text();
}

async function parseArtistAndTitle(fileName, content, folderName) {
  // Try to extract from content headers
  const titleMatch = content.match(/^(?:Titulo|Título|Title|Song)[:\s]+(.+)$/mi);
  const artistMatch = content.match(/^(?:Artista|Artist|Banda|Band)[:\s]+(.+)$/mi);

  let title = titleMatch ? titleMatch[1].trim() : null;
  let artistName = artistMatch ? artistMatch[1].trim() : null;

  // Fallback: parse from filename (e.g. "juanes-la-camisa-negra.txt" or "La Camisa Negra.txt")
  if (!title) {
    const baseName = fileName.replace(/\.(txt|md|html|json)$/i, '');
    // If format is "artist - title" or "artist_title"
    const dashSplit = baseName.split(/\s*[-–]\s*/);
    if (dashSplit.length >= 2) {
      artistName = artistName || dashSplit[0].trim();
      title = dashSplit.slice(1).join(' - ').trim();
    } else {
      title = baseName.replace(/[-_]/g, ' ').trim();
    }
  }

  // Fallback: use folder name as artist
  if (!artistName && folderName) {
    artistName = folderName.replace(/[-_]/g, ' ').trim();
  }
  if (!artistName) artistName = 'Artista desconocido';
  if (!title) title = fileName.replace(/\.(txt|md|html|json)$/i, '');

  return { title, artistName };
}

async function upsertArtist(base44, artistName) {
  const slug = slugify(artistName);
  const existing = await base44.asServiceRole.entities.Artist.filter({ slug });
  if (existing && existing.length > 0) return existing[0];
  return base44.asServiceRole.entities.Artist.create({
    name: artistName,
    slug,
    normalized_name: artistName.toLowerCase(),
    is_demo: false,
  });
}

async function upsertSong(base44, { title, artistName, artistSlug, content, fileName, isTab }) {
  const slug = slugify(title);
  const existing = await base44.asServiceRole.entities.Song.filter({ slug, artist_slug: artistSlug });
  
  const songData = {
    title,
    slug,
    artist_name: artistName,
    artist_slug: artistSlug,
    original_key: detectKey(content),
    capo: detectCapo(content),
    difficulty: detectDifficulty(content),
    language: 'Español',
    // Formatting differences must never hide a non-empty cifrado.
    has_chords: !isTab && content.trim().length > 0,
    has_tablature: isTab || hasTablature(content),
    content_raw: !isTab ? content : null,
    tablature: isTab || hasTablature(content) ? content : null,
    chords_used: extractChords(content),
    status: 'published',
    is_demo: false,
  };

  if (existing && existing.length > 0) {
    return base44.asServiceRole.entities.Song.update(existing[0].id, songData);
  }
  return base44.asServiceRole.entities.Song.create(songData);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Get access token from connector
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');

    // Update sync state to running
    const syncStates = await base44.asServiceRole.entities.SyncState.list();
    let syncRecord = syncStates.length > 0 ? syncStates[0] : null;
    const syncUpdate = { status: 'running', last_synced_at: new Date().toISOString(), total_files: 0, processed_files: 0, error_files: 0, folder_id: FOLDER_ID };
    if (syncRecord) {
      await base44.asServiceRole.entities.SyncState.update(syncRecord.id, syncUpdate);
    } else {
      syncRecord = await base44.asServiceRole.entities.SyncState.create(syncUpdate);
    }

    const results = { processed: 0, errors: 0, songs: 0, artists: new Set() };
    const errorLog = [];

    // List top-level items in the main folder
    const topItems = await listFilesInFolder(FOLDER_ID, accessToken);
    
    for (const item of topItems) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        // It's a subfolder (e.g. "Cifrado" or "Tablatura" or an artist folder)
        const isTabFolder = item.name.toLowerCase().includes('tablatura') || item.name.toLowerCase().includes('tab');
        const subFiles = await listFilesInFolder(item.id, accessToken);
        
        for (const subItem of subFiles) {
          if (subItem.mimeType === 'application/vnd.google-apps.folder') {
            // Artist-level subfolder
            const artistFiles = await listFilesInFolder(subItem.id, accessToken);
            for (const file of artistFiles) {
              if (!file.mimeType.includes('text') && !file.name.match(/\.(txt|md|csv)$/i)) continue;
              try {
                const content = await downloadFile(file.id, accessToken);
                if (!content || content.trim().length < 20) continue;
                const { title, artistName } = await parseArtistAndTitle(file.name, content, subItem.name);
                const artist = await upsertArtist(base44, artistName);
                await upsertSong(base44, { title, artistName: artist.name, artistSlug: artist.slug, content, fileName: file.name, isTab: isTabFolder });
                results.processed++;
                results.songs++;
                results.artists.add(artist.name);
              } catch (e) {
                results.errors++;
                errorLog.push(`${file.name}: ${e.message}`);
              }
            }
          } else if (subItem.name.match(/\.(txt|md|csv)$/i) || subItem.mimeType.includes('text')) {
            // Direct file in subfolder
            try {
              const content = await downloadFile(subItem.id, accessToken);
              if (!content || content.trim().length < 20) continue;
              const { title, artistName } = await parseArtistAndTitle(subItem.name, content, item.name);
              const artist = await upsertArtist(base44, artistName);
              await upsertSong(base44, { title, artistName: artist.name, artistSlug: artist.slug, content, fileName: subItem.name, isTab: isTabFolder });
              results.processed++;
              results.songs++;
              results.artists.add(artist.name);
            } catch (e) {
              results.errors++;
              errorLog.push(`${subItem.name}: ${e.message}`);
            }
          }
        }
      } else if (item.name.match(/\.(txt|md)$/i) || item.mimeType.includes('text')) {
        // Direct file at root level
        try {
          const content = await downloadFile(item.id, accessToken);
          if (!content || content.trim().length < 20) continue;
          const { title, artistName } = await parseArtistAndTitle(item.name, content, null);
          const artist = await upsertArtist(base44, artistName);
          await upsertSong(base44, { title, artistName: artist.name, artistSlug: artist.slug, content, fileName: item.name, isTab: false });
          results.processed++;
          results.songs++;
          results.artists.add(artist.name);
        } catch (e) {
          results.errors++;
          errorLog.push(`${item.name}: ${e.message}`);
        }
      }
    }

    // Update sync state to completed
    await base44.asServiceRole.entities.SyncState.update(syncRecord.id, {
      status: 'completed',
      last_synced_at: new Date().toISOString(),
      total_files: results.processed + results.errors,
      processed_files: results.processed,
      error_files: results.errors,
      last_error: errorLog.length > 0 ? errorLog.slice(0, 5).join(' | ') : null,
    });

    return Response.json({
      status: 'completed',
      songs_created: results.songs,
      artists_found: results.artists.size,
      files_processed: results.processed,
      files_with_errors: results.errors,
      errors: errorLog.slice(0, 10),
    });
  } catch (error) {
    // Try to update sync state to error
    try {
      const base44 = createClientFromRequest(req);
      const syncStates = await base44.asServiceRole.entities.SyncState.list();
      if (syncStates.length > 0) {
        await base44.asServiceRole.entities.SyncState.update(syncStates[0].id, {
          status: 'error',
          last_error: error.message,
        });
      }
    } catch (_) { /* ignore */ }
    return Response.json({ error: error.message }, { status: 500 });
  }
});