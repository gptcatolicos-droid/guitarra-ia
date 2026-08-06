import fs from 'node:fs';

const backend = `import { pool } from './db.js';

function cleanTitle(value='') {
  return String(value).replace(/\\s*-\\s*\\d+\\s*-\\s*[a-f0-9]{6,}\\s*$/i, '').replace(/\\s+\\d+$/,'').trim();
}
function cleanText(value='') { return String(value || '').replace(/\\s+/g,' ').trim(); }
function seoPayload(song) {
  const title = cleanTitle(song.title || 'Canción');
  const artist = cleanText(song.artist_name || 'artista');
  const key = cleanText(song.original_key || 'tono indicado en el cifrado');
  const difficulty = cleanText(song.difficulty || 'nivel adaptable');
  const capoRaw = song.capo;
  const capo = capoRaw === 0 || capoRaw === '0' ? 'sin capo' : capoRaw ? ('capo en el traste ' + capoRaw) : 'capo opcional según tu registro vocal';
  const chords = Array.isArray(song.chords_used) ? song.chords_used.filter(Boolean).slice(0,8) : [];
  const chordText = chords.length ? chords.join(', ') : 'los acordes indicados en el cifrado';
  const path = '/' + (song.artist_slug || '') + '/' + (song.slug || '');
  const seoTitle = (title + ' de ' + artist + ': acordes y tablatura | GuitarraIA').slice(0,68);
  const description = ('Aprende a tocar ' + title + ' de ' + artist + ' en guitarra. Acordes, tono ' + key + ', ' + capo + ', consejos de ritmo y guía práctica en GuitarraIA.').slice(0,158);
  const intro = title + ' de ' + artist + ' es una canción que puedes estudiar en guitarra con el cifrado organizado por secciones. En esta guía encontrarás los acordes, la tonalidad de referencia y recomendaciones prácticas para acompañarla con un sonido limpio y musical.';
  const howTo = 'Empieza tocando lentamente con ' + chordText + '. Mantén el pulso estable, practica por secciones y une verso y coro solo cuando los cambios sean fluidos. La dificultad estimada es ' + difficulty + '.';
  const keyText = 'La tonalidad de referencia es ' + key + '. Puedes transportar los acordes desde GuitarraIA para adaptarlos a tu voz o a otra guitarra.';
  const capoText = 'Configuración recomendada: ' + capo + '. Comprueba siempre que la afinación y el tono coincidan con la versión que estás escuchando.';
  const tips = [
    'Practica primero los cambios de acordes sin cantar.',
    'Usa metrónomo y aumenta la velocidad gradualmente.',
    'Escucha la dinámica original antes de definir el patrón de rasgueo.'
  ];
  const faq = [
    { question: '¿Cuáles son los acordes de ' + title + '?', answer: 'El cifrado de GuitarraIA muestra ' + chordText + ' y su ubicación dentro de cada sección de la canción.' },
    { question: '¿En qué tono se toca ' + title + '?', answer: 'La tonalidad de referencia registrada es ' + key + '. Puedes transportarla para ajustarla a tu voz.' },
    { question: '¿Necesito capo para tocar ' + title + '?', answer: 'La guía indica ' + capo + '. El capo puede variar según la versión o el registro vocal.' }
  ];
  let score = 70;
  if (song.original_key) score += 8;
  if (song.difficulty) score += 5;
  if (chords.length) score += 7;
  if (song.content_raw || song.tablature) score += 5;
  if (song.spotify_embed || song.youtube_video_id) score += 5;
  return {
    seo_title: seoTitle,
    seo_meta_description: description,
    seo_intro: intro,
    seo_how_to_play: howTo,
    seo_original_key_text: keyText,
    seo_capo_text: capoText,
    seo_beginner_tips: tips,
    seo_faq: faq,
    seo_quality_score: Math.min(100, score),
    seo_status: 'published',
    seo_generated_at: new Date().toISOString(),
    seo_updated_at: new Date().toISOString(),
    seo_generator: 'guitarraia-rule-engine-v1',
    seo_canonical_path: path,
    seo_review_notes: (!song.original_key ? 'Tonalidad no registrada; se usó una recomendación editorial genérica.' : null)
  };
}

export async function generateSeoForSongRecord(songId, force=false) {
  const result = await pool.query(\"SELECT id,data FROM entity_records WHERE entity_name='Song' AND id=$1 LIMIT 1\",[songId]);
  const row = result.rows[0];
  if (!row) throw new Error('Canción no encontrada');
  if (row.data?.seo_manual_lock && !force) return { skipped:true, reason:'locked', song:row.data };
  if (row.data?.seo_status === 'published' && row.data?.seo_title && !force) return { skipped:true, reason:'already_generated', song:row.data };
  const patch = seoPayload(row.data || {});
  await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1',[row.id,JSON.stringify(patch)]);
  return { skipped:false, songId:row.id, seo:patch };
}

export async function generateSeoCatalogBatch({ batchSize=100, offset=0, processOnlyPending=true, force=false, dryRun=false }={}) {
  const size = Math.max(1,Math.min(200,Number(batchSize)||100));
  const start = Math.max(0,Number(offset)||0);
  const where = processOnlyPending && !force
    ? \"AND NOT (COALESCE((data->>'seo_manual_lock')::boolean,false)) AND (data->>'seo_title' IS NULL OR data->>'seo_title'='' OR COALESCE(data->>'seo_status','pending') IN ('pending','error'))\"
    : (force ? '' : \"AND NOT (COALESCE((data->>'seo_manual_lock')::boolean,false))\");
  const totalResult = await pool.query(\`SELECT COUNT(*)::int AS total FROM entity_records WHERE entity_name='Song' \\${where}\`);
  const total = totalResult.rows[0]?.total || 0;
  const rows = await pool.query(\`SELECT id,data FROM entity_records WHERE entity_name='Song' \\${where} ORDER BY created_date ASC,id ASC LIMIT $1 OFFSET $2\`,[size,start]);
  if (dryRun) return { dryRun:true,total,selected:rows.rows.length,offset:start,batchSize:size,hasMore:start+rows.rows.length<total,nextOffset:start+rows.rows.length };
  let succeeded=0,failed=0,skipped=0;
  const errors=[];
  for (const row of rows.rows) {
    try {
      if (row.data?.seo_manual_lock && !force) { skipped++; continue; }
      const patch=seoPayload(row.data||{});
      await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1',[row.id,JSON.stringify(patch)]);
      succeeded++;
    } catch(error) { failed++; errors.push({id:row.id,error:error.message}); }
  }
  const processed=rows.rows.length;
  const nextOffset=processOnlyPending && !force ? 0 : start+processed;
  const remainingResult=await pool.query(\`SELECT COUNT(*)::int AS total FROM entity_records WHERE entity_name='Song' AND NOT (COALESCE((data->>'seo_manual_lock')::boolean,false)) AND (data->>'seo_title' IS NULL OR data->>'seo_title'='' OR COALESCE(data->>'seo_status','pending') IN ('pending','error'))\`);
  const remaining=remainingResult.rows[0]?.total||0;
  return {processed,succeeded,failed,skipped,errors,total,remaining,hasMore:remaining>0,nextOffset};
}

export async function ensureSongSeoCatalog() {
  let totalProcessed=0;
  for (let round=0; round<40; round++) {
    const result=await generateSeoCatalogBatch({batchSize:200,offset:0,processOnlyPending:true,force:false,dryRun:false});
    totalProcessed += result.succeeded;
    if (!result.hasMore || result.processed===0) break;
  }
  const stats=await pool.query(\`SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE data->>'seo_title' IS NOT NULL AND data->>'seo_title'<>'' )::int optimized FROM entity_records WHERE entity_name='Song'\`);
  console.log('SONG_SEO_CATALOG_ENSURED',{processed:totalProcessed,...stats.rows[0]});
}
`;
fs.writeFileSync('server/song-seo.js', backend);

let functions=fs.readFileSync('server/functions.js','utf8');
if(!functions.includes("from './song-seo.js'")){
  functions = `import { generateSeoForSongRecord, generateSeoCatalogBatch } from './song-seo.js';\n` + functions;
}
if(!functions.includes("name === 'generateSeoForSong'")){
  functions=functions.replace('functionsRouter.post("/:name", async (req, res) => {', `functionsRouter.post("/:name", async (req, res) => {\n  if (req.params.name === 'generateSeoForSong') {\n    try { return res.json(await generateSeoForSongRecord(req.body?.songId, Boolean(req.body?.force))); }\n    catch(error){ return res.status(400).json({error:error.message}); }\n  }\n  if (req.params.name === 'generateSeoForCatalogBatch') {\n    try { return res.json(await generateSeoCatalogBatch(req.body || {})); }\n    catch(error){ return res.status(500).json({error:error.message}); }\n  }`);
}
fs.writeFileSync('server/functions.js',functions);

let index=fs.readFileSync('server/index.js','utf8');
if(!index.includes("from './song-seo.js'")){
  index=index.replace('import express from "express";', 'import express from "express";\nimport { ensureSongSeoCatalog } from \'./song-seo.js\';');
}
if(!index.includes('await ensureSongSeoCatalog();')){
  index=index.replace('await initDatabase();','await initDatabase();\nawait ensureSongSeoCatalog();');
}
fs.writeFileSync('server/index.js',index);

const seoPath='src/components/admin/SeoManager.jsx';
let seo=fs.readFileSync(seoPath,'utf8');
seo=seo.replace("const [batchOffset, setBatchOffset] = useState(0);", "const [batchOffset, setBatchOffset] = useState(0);\n  const [batchProgress, setBatchProgress] = useState({ processed:0, total:0, remaining:0 });");
const start=seo.indexOf('  const runBatch = async (force = false) => {');
const end=seo.indexOf('\n\n  const FILTERS = [',start);
if(start!==-1 && end!==-1){
  const replacement=`  const runBatch = async (force = false) => {\n    setBatchRunning(true);\n    setBatchLog([force ? 'Regenerando SEO del catálogo…' : 'Generando SEO pendiente del catálogo…']);\n    setBatchProgress({ processed:0,total:stats.total,remaining:stats.pending });\n    let processedTotal=0;\n    let cycles=0;\n    try {\n      while (cycles < 40) {\n        const res = await base44.functions.invoke('generateSeoForCatalogBatch', {\n          batchSize: 200, offset: force ? processedTotal : 0, processOnlyPending: !force, force, dryRun:false,\n        });\n        const d=res.data || {};\n        processedTotal += Number(d.succeeded || 0);\n        cycles++;\n        setBatchProgress({processed:processedTotal,total:Number(d.total || stats.total),remaining:Number(d.remaining || 0)});\n        setBatchLog(l => [...l.slice(-7), 'Lote '+cycles+': '+(d.succeeded||0)+' SEO generados, '+(d.failed||0)+' errores. Restantes: '+(d.remaining||0)]);\n        if (!d.hasMore || Number(d.processed||0)===0) break;\n      }\n      setBatchLog(l=>[...l,'✓ Proceso masivo finalizado. SEO generado: '+processedTotal]);\n      setBatchOffset(0);\n      onRefresh && await onRefresh();\n    } catch(err){ setBatchLog(l=>[...l,'Error: '+(err.message||'No se pudo completar el proceso')]); }\n    finally { setBatchRunning(false); }\n  };`;
  seo=seo.slice(0,start)+replacement+seo.slice(end);
}
seo=seo.replace('Generar pendientes', 'Generar SEO de todas las canciones pendientes');
seo=seo.replace('Regenerar lote', 'Regenerar SEO completo');
const marker='{batchLog.length > 0 && (';
if(seo.includes(marker) && !seo.includes('batchProgress.processed > 0')){
 seo=seo.replace(marker, `{batchRunning && (\n          <div className="space-y-1">\n            <div className="flex justify-between text-xs text-muted-foreground"><span>Progreso masivo</span><span>{batchProgress.processed} generadas · {batchProgress.remaining} restantes</span></div>\n            <div className="h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary transition-all" style={{width: Math.min(100, batchProgress.total ? (batchProgress.processed / batchProgress.total) * 100 : 0) + '%'}} /></div>\n          </div>\n        )}\n        ${marker}`);
}
fs.writeFileSync(seoPath,seo);
console.log('Song SEO bulk generation installed.');
