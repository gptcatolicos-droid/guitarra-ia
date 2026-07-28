import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CHORD = /\b([A-G](?:#|b)?(?:(?:maj|min|m|M|sus|add|dim|aug)?\d*)?(?:\/[A-G](?:#|b)?)?)\b/g;
const SECTION = /^\s*\[?\s*(intro|verso|coro|pre[-\s]?coro|puente|solo|outro|interludio|estrofa)\s*\]?/i;

function videoId(value = '') {
  const match = String(value).match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/))([\w-]{11})/i);
  return match?.[1] || '';
}

function cifrado(song: any) {
  const raw = String(song.content_raw || song.tablature || '');
  const chords: string[] = [];
  const sections: Array<{ label: string; firstChord: string }> = [];
  let lastLabel = '';
  raw.split(/\r?\n/).forEach((line: string) => {
    const section = line.match(SECTION)?.[1];
    if (section) lastLabel = section.charAt(0).toUpperCase() + section.slice(1).toLowerCase();
    const found = [...line.matchAll(CHORD)].map((m) => m[1]);
    if (!found.length) return;
    // Sólo aceptamos líneas que parecen ser de acordes. Así no se confunden
    // letras sueltas de la letra de la canción con acordes reales.
    const remainder = line.replace(CHORD, '').replace(/[\s\d()[\]{}:;|,./xX*+\-–—]/g, '');
    const chordLine = Boolean(section) || remainder.length <= Math.max(1, Math.floor(line.length * 0.18));
    if (!chordLine) return;
    const before = chords.length;
    found.forEach((chord) => chords.push(chord));
    if (lastLabel && before < chords.length && !sections.some((item) => item.label === lastLabel)) sections.push({ label: lastLabel, firstChord: found[0] });
  });
  return { chords: chords.filter((chord, index) => index === 0 || chord !== chords[index - 1]), sections };
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
    const { songId } = await req.json();
    const song = (await base44.asServiceRole.entities.Song.filter({ id: songId }))?.[0];
    if (!song) return Response.json({ error: 'Canción no encontrada.' }, { status: 404 });

    const id = song.youtube_video_id || videoId(song.youtube_embed);
    const source = cifrado(song);
    if (!id) return Response.json({ error: 'Pega primero una URL válida de YouTube.' }, { status: 400 });
    if (source.chords.length < 2) return Response.json({ error: 'La canción necesita un cifrado con al menos dos acordes.' }, { status: 400 });

    const workerUrl = Deno.env.get('YOUTUBE_PRACTICE_WORKER_URL');
    const secret = Deno.env.get('YOUTUBE_PRACTICE_REQUEST_SECRET');
    if (!workerUrl || !secret) return Response.json({ error: 'La integración de análisis aún no está configurada.' }, { status: 503 });

    const body = JSON.stringify({ song_id: song.id, video_id: id, video_url: `https://www.youtube.com/watch?v=${id}`, catalog_chords: source.chords, catalog_sections: source.sections });
    const timestamp = String(Date.now());
    const signature = await hmac(secret, `${timestamp}.${body}`);
    await base44.asServiceRole.entities.Song.update(song.id, {
      youtube_video_id: id,
      youtube_practice_enabled: false,
      youtube_analysis_status: 'queued',
      youtube_analysis_error: null,
      youtube_practice_map: null,
    });
    const worker = await fetch(workerUrl.replace(/\/$/, '') + '/analyze', { method: 'POST', headers: { 'content-type': 'application/json', 'x-guitarraia-timestamp': timestamp, 'x-guitarraia-signature': signature }, body });
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
