import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

async function hmac(secret: string, payload: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature)).map((n) => n.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  try {
    const timestamp = req.headers.get('x-guitarraia-timestamp') || '';
    const received = req.headers.get('x-guitarraia-signature') || '';
    const body = await req.text();
    const secret = Deno.env.get('YOUTUBE_PRACTICE_CALLBACK_SECRET');
    if (!secret || !timestamp || Math.abs(Date.now() - Number(timestamp)) > 10 * 60 * 1000) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (received !== await hmac(secret, `${timestamp}.${body}`)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const data = JSON.parse(body);
    const base44 = createClientFromRequest(req);
    const song = (await base44.asServiceRole.entities.Song.filter({ id: data.song_id }))?.[0];
    if (!song || song.youtube_video_id !== data.video_id) return Response.json({ error: 'Canción no encontrada.' }, { status: 404 });
    if (data.status !== 'ready' || !Array.isArray(data.map?.chord_cues) || data.map.chord_cues.length < 2) {
      await base44.asServiceRole.entities.Song.update(song.id, { youtube_practice_enabled: false, youtube_analysis_status: 'error', youtube_analysis_error: data.error || 'El análisis no encontró una sincronización utilizable.' });
      return Response.json({ success: true });
    }
    await base44.asServiceRole.entities.Song.update(song.id, {
      youtube_practice_enabled: true,
      youtube_analysis_status: 'ready',
      youtube_analysis_error: null,
      youtube_analysis_confidence: Number(data.map.confidence) || null,
      youtube_analysis_updated_at: new Date().toISOString(),
      youtube_analysis_provider: 'ChordMini',
      youtube_practice_map: JSON.stringify(data.map),
    });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Callback inválido.' }, { status: 500 });
  }
});
