import fs from 'node:fs';

const backend = String.raw`import { pool } from './db.js';

function clean(value='') { return String(value || '').replace(/\s+/g, ' ').trim(); }
function cleanTitle(value='') { return clean(value).replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '').replace(/\s+\d+$/, '').trim(); }
function makeSeo(song={}) {
  const title = cleanTitle(song.title || 'Canción');
  const artist = clean(song.artist_name || 'artista');
  const key = clean(song.original_key || 'tono por confirmar');
  const difficulty = clean(song.difficulty || 'nivel adaptable');
  const capo = song.capo === 0 || song.capo === '0' ? 'sin capo' : song.capo ? 'capo en el traste ' + song.capo : 'capo opcional';
  const chords = Array.isArray(song.chords_used) ? song.chords_used.filter(Boolean).slice(0, 8) : [];
  const chordText = chords.length ? chords.join(', ') : 'los acordes indicados en el cifrado';
  const now = new Date().toISOString();
  let score = 70 + (song.original_key ? 8 : 0) + (song.difficulty ? 5 : 0) + (chords.length ? 7 : 0) + ((song.content_raw || song.tablature) ? 5 : 0) + ((song.spotify_embed || song.youtube_video_id) ? 5 : 0);
  return {
    seo_title: (title + ' de ' + artist + ': acordes y tablatura | GuitarraIA').slice(0, 68),
    seo_meta_description: ('Aprende a tocar ' + title + ' de ' + artist + ' en guitarra. Acordes, tono ' + key + ', ' + capo + ', ritmo y guía práctica en GuitarraIA.').slice(0, 158),
    seo_intro: title + ' de ' + artist + ' puede estudiarse en guitarra con el cifrado organizado por secciones. Esta guía reúne acordes, tonalidad de referencia y recomendaciones para acompañarla con precisión.',
    seo_how_to_play: 'Practica lentamente con ' + chordText + '. Trabaja cada sección por separado, mantén un pulso estable y aumenta la velocidad gradualmente. Dificultad estimada: ' + difficulty + '.',
    seo_original_key_text: 'La tonalidad de referencia es ' + key + '. Puedes transportar los acordes en GuitarraIA para ajustarlos a tu voz.',
    seo_capo_text: 'Configuración recomendada: ' + capo + '. Verifica que coincida con la versión que estás escuchando.',
    seo_beginner_tips: ['Practica primero los cambios sin cantar.', 'Usa metrónomo y aumenta la velocidad poco a poco.', 'Escucha la dinámica original antes de elegir el rasgueo.'],
    seo_faq: [
      { question: '¿Cuáles son los acordes de ' + title + '?', answer: 'El cifrado de GuitarraIA incluye ' + chordText + ' dentro de las secciones de la canción.' },
      { question: '¿En qué tono se toca ' + title + '?', answer: 'La tonalidad de referencia registrada es ' + key + '.' },
      { question: '¿Necesito capo para tocar ' + title + '?', answer: 'La guía recomienda ' + capo + ', aunque puede variar según la versión.' }
    ],
    seo_quality_score: Math.min(100, score),
    seo_status: 'published',
    seo_generated_at: now,
    seo_updated_at: now,
    seo_generator: 'guitarraia-rule-engine-v2',
    seo_canonical_path: '/' + clean(song.artist_slug) + '/' + clean(song.slug),
    seo_review_notes: song.original_key ? null : 'Tonalidad pendiente de validación editorial.'
  };
}

async function resolveSong(identifier) {
  const value = String(identifier || '');
  const result = await pool.query("SELECT id,data FROM entity_records WHERE entity_name='Song' AND (id::text=$1 OR data->>'id'=$1) LIMIT 1", [value]);
  return result.rows[0] || null;
}

export async function generateSeoForSongRecord(songId, force=false) {
  const row = await resolveSong(songId);
  if (!row) throw new Error('Canción no encontrada');
  if (row.data?.seo_manual_lock && !force) return { skipped:true, reason:'locked' };
  if (row.data?.seo_title && row.data?.seo_status === 'published' && !force) return { skipped:true, reason:'already_generated' };
  const patch = makeSeo(row.data);
  await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1', [row.id, JSON.stringify(patch)]);
  return { skipped:false, songId: row.data?.id || row.id, seo:patch };
}

export async function generateSeoCatalogBatch(options={}) {
  const size = Math.max(1, Math.min(200, Number(options.batchSize) || 100));
  const force = Boolean(options.force);
  const dryRun = Boolean(options.dryRun);
  const offset = Math.max(0, Number(options.offset) || 0);
  const pendingClause = "AND COALESCE((data->>'seo_manual_lock')::boolean,false)=false AND (data->>'seo_title' IS NULL OR data->>'seo_title'='' OR COALESCE(data->>'seo_status','pending') IN ('pending','error'))";
  const unlockedClause = "AND COALESCE((data->>'seo_manual_lock')::boolean,false)=false";
  const clause = force ? unlockedClause : pendingClause;
  const totalResult = await pool.query("SELECT COUNT(*)::int total FROM entity_records WHERE entity_name='Song' " + clause);
  const total = totalResult.rows[0]?.total || 0;
  const rows = await pool.query("SELECT id,data FROM entity_records WHERE entity_name='Song' " + clause + " ORDER BY created_date,id LIMIT $1 OFFSET $2", [size, force ? offset : 0]);
  if (dryRun) return { dryRun:true,total,selected:rows.rows.length,offset,batchSize:size,hasMore:rows.rows.length < total,nextOffset:offset + rows.rows.length };
  let succeeded=0, failed=0;
  const errors=[];
  for (const row of rows.rows) {
    try {
      const patch = makeSeo(row.data || {});
      await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1', [row.id, JSON.stringify(patch)]);
      succeeded++;
    } catch (error) { failed++; errors.push({ id: row.data?.id || row.id, error:error.message }); }
  }
  const remainingResult = await pool.query("SELECT COUNT(*)::int total FROM entity_records WHERE entity_name='Song' " + pendingClause);
  const remaining = remainingResult.rows[0]?.total || 0;
  return { processed:rows.rows.length,succeeded,failed,skipped:0,errors,total,remaining,hasMore:force ? offset + rows.rows.length < total : remaining > 0,nextOffset:force ? offset + rows.rows.length : 0 };
}

export async function ensureSongSeoCatalog() {
  let generated=0;
  for (let i=0; i<20; i++) {
    const result = await generateSeoCatalogBatch({ batchSize:200 });
    generated += result.succeeded;
    if (!result.hasMore || !result.processed) break;
  }
  const stats = await pool.query("SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE data->>'seo_title' IS NOT NULL AND data->>'seo_title'<>'')::int optimized FROM entity_records WHERE entity_name='Song'");
  console.log('SONG_SEO_CATALOG_ENSURED', { generated, ...stats.rows[0] });
}
`;

fs.writeFileSync('server/song-seo.js', backend);

let functions = fs.readFileSync('server/functions.js', 'utf8');
if (!functions.includes("from './song-seo.js'")) functions = "import { generateSeoForSongRecord, generateSeoCatalogBatch } from './song-seo.js';\n" + functions;
if (!functions.includes("req.params.name === 'generateSeoForSong'")) {
  functions = functions.replace('functionsRouter.post("/:name", async (req, res) => {', `functionsRouter.post("/:name", async (req, res) => {\n  if (req.params.name === 'generateSeoForSong') { try { return res.json(await generateSeoForSongRecord(req.body?.songId, Boolean(req.body?.force))); } catch (error) { return res.status(400).json({error:error.message}); } }\n  if (req.params.name === 'generateSeoForCatalogBatch') { try { return res.json(await generateSeoCatalogBatch(req.body || {})); } catch (error) { return res.status(500).json({error:error.message}); } }`);
}
fs.writeFileSync('server/functions.js', functions);

let index = fs.readFileSync('server/index.js', 'utf8');
if (!index.includes("from './song-seo.js'")) index = index.replace('import express from "express";', 'import express from "express";\nimport { ensureSongSeoCatalog } from \'./song-seo.js\';');
if (!index.includes('await ensureSongSeoCatalog();')) index = index.replace('await initDatabase();', 'await initDatabase();\nawait ensureSongSeoCatalog();');
fs.writeFileSync('server/index.js', index);
console.log('Song SEO v2 installed.');
