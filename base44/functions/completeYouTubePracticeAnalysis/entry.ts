import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

const MAX_AUDIO_BYTES = 80 * 1024 * 1024;
const EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg']);
const CALLBACK_WINDOW_MS = 10 * 60 * 1000;

async function hmac(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature)).map((n) => n.toString(16).padStart(2, '0')).join('');
}

function recentTimestamp(value: string) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && Math.abs(Date.now() - timestamp) <= CALLBACK_WINDOW_MS;
}

function safeEqual(left = '', right = '') {
  if (left.length !== right.length || !left.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function validPracticeMap(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const map = value as Record<string, unknown>;
  if (!Array.isArray(map.chord_cues) || map.chord_cues.length < 2) return false;
  return map.chord_cues.every((cue) => {
    if (!cue || typeof cue !== 'object') return false;
    const row = cue as Record<string, unknown>;
    return Number.isFinite(Number(row.time)) && Number(row.time) >= 0 && Boolean(String(row.chord || '').trim());
  });
}

async function handleWorkerCallback(
  req: Request,
  rawBody: string,
  payload: Record<string, unknown>,
  base44: ReturnType<typeof createClientFromRequest>,
) {
  const timestamp = req.headers.get('x-guitarraia-timestamp') || '';
  const receivedSignature = req.headers.get('x-guitarraia-signature') || '';
  const secret = Deno.env.get('YOUTUBE_PRACTICE_CALLBACK_SECRET') || '';

  if (!secret || !recentTimestamp(timestamp)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expectedSignature = await hmac(secret, `${timestamp}.${rawBody}`);
  if (!safeEqual(receivedSignature, expectedSignature)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const songId = String(payload.song_id || '').trim();
  const videoId = String(payload.video_id || '').trim();
  const status = String(payload.status || '').trim();
  if (!songId || !['ready', 'error', 'processing'].includes(status)) {
    return Response.json({ error: 'Callback inválido.' }, { status: 400 });
  }

  const song = (await base44.asServiceRole.entities.Song.filter({ id: songId }))?.[0];
  if (!song) return Response.json({ error: 'Canción no encontrada.' }, { status: 404 });

  if (videoId && song.youtube_video_id && videoId !== song.youtube_video_id) {
    return Response.json({ error: 'El video no coincide con la canción.' }, { status: 409 });
  }

  if (status === 'processing') {
    await base44.asServiceRole.entities.Song.update(song.id, {
      youtube_analysis_status: 'processing',
      youtube_analysis_error: null,
      youtube_analysis_updated_at: new Date().toISOString(),
    });
    return Response.json({ success: true, status: 'processing' });
  }

  if (status === 'error') {
    await base44.asServiceRole.entities.Song.update(song.id, {
      youtube_practice_enabled: false,
      youtube_analysis_status: 'error',
      youtube_analysis_error: String(payload.error || 'El analizador no pudo completar el proceso.').slice(0, 500),
      youtube_analysis_updated_at: new Date().toISOString(),
    });
    return Response.json({ success: true, status: 'error' });
  }

  if (!validPracticeMap(payload.map)) {
    return Response.json({ error: 'El mapa de práctica no es válido.' }, { status: 400 });
  }

  const map = payload.map as Record<string, unknown>;
  const confidence = Number(map.confidence);
  await base44.asServiceRole.entities.Song.update(song.id, {
    youtube_video_id: videoId || song.youtube_video_id,
    youtube_practice_map: JSON.stringify(map),
    youtube_practice_enabled: false,
    youtube_analysis_status: 'ready',
    youtube_analysis_error: null,
    youtube_analysis_confidence: Number.isFinite(confidence) ? confidence : null,
    youtube_analysis_provider: String(map.provider || 'ChordMini'),
    youtube_analysis_updated_at: new Date().toISOString(),
  });

  return Response.json({ success: true, status: 'ready' });
}

async function handleAdminUploadTicket(
  payload: Record<string, unknown>,
  base44: ReturnType<typeof createClientFromRequest>,
) {
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const songId = String(payload.songId || '').trim();
  const filename = String(payload.filename || '').trim();
  const contentType = String(payload.contentType || 'application/octet-stream');
  const size = Number(payload.size);
  const ext = filename.toLowerCase().split('.').pop() || '';

  if (!songId || !EXTENSIONS.has(ext) || !Number.isFinite(size) || size <= 0 || size > MAX_AUDIO_BYTES) {
    return Response.json({ error: 'Sube un audio MP3, WAV, M4A, AAC u OGG de máximo 80 MB.' }, { status: 400 });
  }

  const song = (await base44.asServiceRole.entities.Song.filter({ id: songId }))?.[0];
  if (!song) return Response.json({ error: 'Canción no encontrada.' }, { status: 404 });
  if (!song.youtube_embed && !song.youtube_video_id) {
    return Response.json({ error: 'Guarda primero la URL de YouTube de esta canción.' }, { status: 400 });
  }

  const workerUrl = Deno.env.get('YOUTUBE_PRACTICE_WORKER_URL');
  const secret = Deno.env.get('YOUTUBE_PRACTICE_UPLOAD_SECRET');
  if (!workerUrl || !secret) {
    return Response.json({ error: 'La carga privada de audio aún no está configurada.' }, { status: 503 });
  }

  const objectName = `incoming/${song.id}/${crypto.randomUUID()}.${ext}`;
  const timestamp = String(Date.now());
  const signature = await hmac(secret, `${timestamp}.${song.id}.${objectName}`);

  await base44.asServiceRole.entities.Song.update(song.id, {
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
    expires_at: new Date(Date.now() + CALLBACK_WINDOW_MS).toISOString(),
    content_type: contentType,
  });
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  try {
    const rawBody = await req.text();
    let payload: Record<string, unknown>;
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return Response.json({ error: 'JSON inválido.' }, { status: 400 });
    }

    const isWorkerCallback = Boolean(
      req.headers.get('x-guitarraia-signature')
      && payload.song_id
      && payload.status,
    );

    if (isWorkerCallback) {
      return await handleWorkerCallback(req, rawBody, payload, base44);
    }

    return await handleAdminUploadTicket(payload, base44);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible completar la operación.';
    return Response.json({ error: message }, { status: 500 });
  }
});
