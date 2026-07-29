import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MAX_AUDIO_BYTES = 80 * 1024 * 1024;
const EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg']);

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
    const { songId, filename, contentType, size } = await req.json();
    const ext = String(filename || '').trim().toLowerCase().split('.').pop() || '';
    if (!songId || !EXTENSIONS.has(ext) || !Number.isFinite(size) || size <= 0 || size > MAX_AUDIO_BYTES) {
      return Response.json({ error: 'Sube un audio MP3, WAV, M4A, AAC u OGG de máximo 80 MB.' }, { status: 400 });
    }
    const song = (await base44.asServiceRole.entities.Song.filter({ id: songId }))?.[0];
    if (!song) return Response.json({ error: 'Canción no encontrada.' }, { status: 404 });
    if (!song.youtube_embed && !song.youtube_video_id) return Response.json({ error: 'Guarda primero la URL de YouTube de esta canción.' }, { status: 400 });

    const workerUrl = Deno.env.get('YOUTUBE_PRACTICE_WORKER_URL');
    const secret = Deno.env.get('YOUTUBE_PRACTICE_UPLOAD_SECRET');
    if (!workerUrl || !secret) return Response.json({ error: 'La carga privada de audio aún no está configurada.' }, { status: 503 });

    const objectName = 'incoming/' + song.id + '/' + crypto.randomUUID() + '.' + ext;
    const timestamp = String(Date.now());
    const signature = await hmac(secret, timestamp + '.' + song.id + '.' + objectName);
    await base44.asServiceRole.entities.Song.update(song.id, {
      youtube_practice_enabled: false,
      youtube_practice_map: null,
      youtube_analysis_status: 'awaiting_audio',
      youtube_analysis_error: null,
    });
    return Response.json({
      upload_url: workerUrl.replace(/\/$/, '') + '/upload',
      object_name: objectName,
      timestamp,
      signature,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      content_type: contentType || 'application/octet-stream',
    });
  } catch (error) {
    return Response.json({ error: error.message || 'No fue posible preparar la carga.' }, { status: 500 });
  }
});
