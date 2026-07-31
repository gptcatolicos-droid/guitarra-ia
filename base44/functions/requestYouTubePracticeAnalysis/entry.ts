import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
// deployment-version: private-audio-validation-v3

const CHORD = /\b([A-G](?:#|b)?(?:(?:maj|min|m|M|sus|add|dim|aug)?\d*)?(?:\/[A-G](?:#|b)?)?)\b/g;
const SECTION = /^\s*\[?\s*(intro|verso|coro|pre[-\s]?coro|puente|solo|outro|interludio|estrofa)\s*\]?/i;
const MAX_AUDIO_BYTES = 80 * 1024 * 1024;
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg']);

function videoId(value = '') {
  const match = String(value).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/))([\w-]{11})/i);
  return match?.[1] || '';
}

function cifrado(song: any) {
  const raw = String(song.content_raw || song.content || song.tablature || '');
  const chords: string[] = [];
  const sections: Array<{ label: string; firstChord: string }> = [];
  let lastLabel = '';
  raw.split(/\r?\n/).forEach((line: string) => {
    const section = line.match(SECTION)?.[1];
    if (section) lastLabel = section.charAt(0).toUpperCase() + section.slice(1).toLowerCase();
    const found = [...line.matchAll(CHORD)].map((m) => m[1]);
    if (!found.length) return;
    const remainder = line.replace(CHORD, '').replace(/[\s\d()[\]{}:;|,./xX*+\-–—]/g, '');
    if (!(Boolean(section) || remainder.length <= Math.max(1, Math.floor(line.length * 0.18)))) return;
    const before = chords.length;
    found.forEach((chord) => chords.push(chord));
    if (lastLabel && before < chords.length && !sections.some((item) => item.label === lastLabel)) {
      sections.push({ label: lastLabel, firstChord: found[0] });
    }
  });
  return { chords, sections };
}

function validObjectName(songId: string, objectName: string) {
  const prefix = `incoming/${songId}/`;
  if (!objectName.startsWith(prefix)) return false;

  const filename = objectName.slice(prefix.length);
  if (!filename || filename.includes('/') || filename.includes('..')) return false;

  return /\.(mp3|wav|m4a|aac|ogg)$/i.test(filename);
}

async function hmac(secret: string, payload: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature)).map((n) => n.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await req.json();
    const {
      action,
      songId,
      audioObjectName,
      filename,
      contentType,
      size,
    } = payload;

    const song = (await base44.asServiceRole.entities.Song.filter({ id: songId }))?.[0];
    if (!song) return Response.json({ error: 'Canción no encontrada.' }, { status: 404 });

    if (action === 'create_upload_ticket') {
      const extension = String(filename || '').toLowerCase().split('.').pop() || '';
      const audioSize = Number(size);

      if (
        !AUDIO_EXTENSIONS.has(extension)
        || !Number.isFinite(audioSize)
        || audioSize <= 0
        || audioSize > MAX_AUDIO_BYTES
      ) {
        return Response.json({
          error: 'Sube un audio MP3, WAV, M4A, AAC u OGG de máximo 80 MB.',
        }, { status: 400 });
      }

      const id = song.youtube_video_id || videoId(song.youtube_embed);
      if (!id) {
        return Response.json({
          error: 'Guarda primero una URL válida de YouTube.',
        }, { status: 400 });
      }

      const workerUrl = Deno.env.get('YOUTUBE_PRACTICE_WORKER_URL');
      const uploadSecret = Deno.env.get('YOUTUBE_PRACTICE_UPLOAD_SECRET');

      if (!workerUrl || !uploadSecret) {
        return Response.json({
          error: 'La carga privada de audio aún no está configurada.',
        }, { status: 503 });
      }

      const objectName = `incoming/${song.id}/${crypto.randomUUID()}.${extension}`;
      const timestamp = String(Date.now());
      const signature = await hmac(
        uploadSecret,
        `${timestamp}.${song.id}.${objectName}`,
      );

      await base44.asServiceRole.entities.Song.update(song.id, {
        youtube_video_id: id,
        youtube_practice_enabled: false,
        youtube_practice_map: null,
        youtube_analysis_status: 'awaiting_audio',
        youtube_analysis_error: null,
        youtube_analysis_updated_at: new Date().toISOString(),
      });

      return Response.json({
        upload_url: `${workerUrl.replace(/\/$/, '')}/upload`,
        object_name: objectName,
        timestamp,
        signature,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        content_type: contentType || 'application/octet-stream',
      });
    }

    const normalizedAudioObjectName = String(audioObjectName || '').trim();
    if (!normalizedAudioObjectName) {
      return Response.json({ error: 'No se recibió la referencia del audio privado.' }, { status: 400 });
    }

    const id = song.youtube_video_id || videoId(song.youtube_embed);
    const source = cifrado(song);
    if (!id) return Response.json({ error: 'Pega primero una URL válida de YouTube.' }, { status: 400 });
    if (source.chords.length < 2) return Response.json({ error: 'La canción necesita un cifrado con al menos dos acordes.' }, { status: 400 });

    const workerUrl = Deno.env.get('YOUTUBE_PRACTICE_WORKER_URL');
    const secret = Deno.env.get('YOUTUBE_PRACTICE_REQUEST_SECRET');
    if (!workerUrl || !secret) return Response.json({ error: 'La integración de análisis aún no está configurada.' }, { status: 503 });

    const body = JSON.stringify({
      song_id: song.id,
      video_id: id,
      audio_object_name: audioObjectName,
      catalog_chords: source.chords,
      catalog_sections: source.sections,
    });
    const timestamp = String(Date.now());
    const signature = await hmac(secret, timestamp + '.' + body);
    await base44.asServiceRole.entities.Song.update(song.id, {
      youtube_video_id: id,
      youtube_practice_enabled: false,
      youtube_analysis_status: 'queued',
      youtube_analysis_error: null,
      youtube_practice_map: null,
    });
    const worker = await fetch(workerUrl.replace(/\/$/, '') + '/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-guitarraia-timestamp': timestamp, 'x-guitarraia-signature': signature },
      body,
    });
    if (!worker.ok) {
      const detail = await worker.text();
      await base44.asServiceRole.entities.Song.update(song.id, { youtube_analysis_status: 'error', youtube_analysis_error: 'No se pudo iniciar el análisis.' });
      return Response.json({ error: detail || 'El analizador no respondió.' }, { status: 502 });
    }
    return Response.json({ success: true, status: 'queued' });
  } catch (error) {
    return Response.json({ error: error.message || 'No se pudo solicitar el análisis.' }, { status: 500 });
  }
});
