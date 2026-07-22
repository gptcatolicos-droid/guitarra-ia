import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// ── helpers ──────────────────────────────────────────────────────────────────

function slugHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function buildSourceHash(song) {
  const parts = [
    song.title, song.artist_name, song.original_key,
    song.capo, song.difficulty, song.content_raw?.slice(0, 200) || '',
    song.chords_used?.join(',') || '',
  ];
  return slugHash(parts.join('|'));
}

function extractChordsFromContent(content) {
  if (!content) return [];
  const CHORD_RE = /^[A-G](#|b)?(sus[24]?|maj[79]?|min[79]?|dim7?|aug7?|m[79]?|m6|6|7|9|11|13|add[69]?|°|ø)?(\/[A-G](#|b)?)?$/;
  const chords = new Set();
  for (const line of content.split('\n')) {
    const tokens = line.trim().split(/\s+/);
    if (tokens.length === 0) continue;
    const allChords = tokens.every(t => CHORD_RE.test(t) && t.length > 0);
    if (allChords) tokens.forEach(t => { if (t) chords.add(t); });
  }
  return Array.from(chords);
}

function hasBarreChords(chords) {
  const BARRE = ['F', 'Fm', 'F7', 'Bb', 'Bbm', 'Bm', 'C#m', 'G#m', 'Ab', 'Abm', 'Eb', 'Ebm'];
  return chords.some(c => BARRE.includes(c) || (c.includes('m') && !c.startsWith('Em') && !c.startsWith('Am') && !c.startsWith('Dm')));
}

function buildPrompt(song, chordList, relatedTitles) {
  return `Eres un editor musical especializado en guitarra y SEO útil.
Genera contenido breve y práctico para una página de acordes de guitarra.
NO inventes hechos musicales. Usa ÚNICAMENTE los datos proporcionados.
Si un dato no está disponible, devuelve null para esa sección.
No escribas letras completas ni contenido protegido.
No uses frases promocionales genéricas como "icónica", "maravillosa", "cautivado generaciones".
No repitas excesivamente el título o artista.

DATOS:
Título: ${song.title}
Artista: ${song.artist_name}
Tono original verificado: ${song.original_key || 'NO DISPONIBLE'}
Capo verificado: ${song.capo > 0 ? `Cejilla ${song.capo}` : 'Sin cejilla'}
Dificultad: ${song.difficulty || 'NO DISPONIBLE'}
Acordes reales detectados: ${chordList.length > 0 ? chordList.join(', ') : 'NO DISPONIBLE'}
Tiene acordes con cejilla: ${hasBarreChords(chordList) ? 'Sí' : 'No'}
Álbum: ${song.spotify_album_name || song.album || 'NO DISPONIBLE'}
Canciones relacionadas disponibles: ${relatedTitles.length > 0 ? relatedTitles.join(', ') : 'ninguna'}
Idioma de la canción: ${song.language || 'Español'}

REGLAS ESTRICTAS:
- seoTitle: descriptivo y natural, max 60 chars
- metaDescription: resume utilidad real, 140-155 chars
- h1: "${song.title}: acordes para guitarra"
- intro: 60-120 palabras, explica qué encontrará el guitarrista
- howToPlay: solo consejos basados en datos verificados arriba. Si difficulty o chords no disponibles → null
- originalKeyText: null si original_key no existe
- capoText: null si capo = 0 o no existe
- strummingText: siempre null (no hay datos de rasgueo)
- easyVersionText: null (se calculará por separado)
- chordExplanation: explica los acordes reales detectados, o null si no hay acordes
- beginnerTips: 3-5 consejos concretos basados en datos reales, o []
- faq: 2-4 preguntas reales que buscaría un guitarrista, con respuestas usando datos disponibles
- keywordCluster: 8-12 frases de búsqueda naturales para esta canción
- factsUsed: lista los campos realmente usados
- warnings: campos con datos insuficientes
- qualityScore: 0-100 según completitud de datos reales

DEVUELVE JSON VÁLIDO:
{
  "seoTitle": "",
  "metaDescription": "",
  "h1": "",
  "intro": "",
  "howToPlay": null,
  "originalKeyText": null,
  "capoText": null,
  "strummingText": null,
  "easyVersionText": null,
  "chordExplanation": null,
  "beginnerTips": [],
  "faq": [],
  "keywordCluster": [],
  "factsUsed": [],
  "warnings": [],
  "qualityScore": 0
}`;
}

// ── main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { songId, force = false, dryRun = false } = body;

    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    // Load song
    const song = await base44.asServiceRole.entities.Song.get(songId);
    if (!song) return Response.json({ error: 'Song not found' }, { status: 404 });

    // Skip if locked
    if (song.seo_manual_lock && !force) {
      return Response.json({ skipped: true, reason: 'manual_lock', songId });
    }

    // Check if source hash changed
    const sourceHash = buildSourceHash(song);
    if (!force && song.seo_source_hash === sourceHash && song.seo_status === 'published') {
      return Response.json({ skipped: true, reason: 'no_changes', songId, sourceHash });
    }

    if (dryRun) {
      const chordList = extractChordsFromContent(song.content_raw);
      return Response.json({
        dryRun: true,
        songId,
        title: song.title,
        artist: song.artist_name,
        sourceHash,
        chordList,
        hasChords: chordList.length > 0,
        hasBarreChords: hasBarreChords(chordList),
        originalKey: song.original_key || null,
        capo: song.capo || 0,
        difficulty: song.difficulty || null,
        currentSeoStatus: song.seo_status,
        wouldRegenerate: !song.seo_manual_lock,
      });
    }

    // Mark as processing
    await base44.asServiceRole.entities.Song.update(songId, { seo_status: 'processing' });

    // Extract chords from content
    const chordList = extractChordsFromContent(song.content_raw);

    // Load related songs (same artist)
    let relatedTitles = [];
    try {
      const related = await base44.asServiceRole.entities.Song.filter(
        { artist_slug: song.artist_slug },
        '-views', 8
      );
      relatedTitles = related
        .filter(s => s.id !== song.id)
        .map(s => s.title.replace(/\s*\d+$/, '').trim())
        .slice(0, 5);
    } catch (_) {}

    // Generate with LLM
    const prompt = buildPrompt(song, chordList, relatedTitles);
    const llmResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          seoTitle: { type: 'string' },
          metaDescription: { type: 'string' },
          h1: { type: 'string' },
          intro: { type: 'string' },
          howToPlay: { type: ['string', 'null'] },
          originalKeyText: { type: ['string', 'null'] },
          capoText: { type: ['string', 'null'] },
          strummingText: { type: ['string', 'null'] },
          easyVersionText: { type: ['string', 'null'] },
          chordExplanation: { type: ['string', 'null'] },
          beginnerTips: { type: 'array', items: { type: 'string' } },
          faq: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } } } },
          keywordCluster: { type: 'array', items: { type: 'string' } },
          factsUsed: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          qualityScore: { type: 'number' },
        },
        required: ['seoTitle', 'metaDescription', 'h1', 'intro', 'qualityScore'],
      },
    });

    // Validate
    const warnings = llmResult.warnings || [];
    const qualityScore = llmResult.qualityScore || 0;
    const needsReview = qualityScore < 40 || warnings.length > 3;

    const now = new Date().toISOString();
    const updateData = {
      seo_status: needsReview ? 'review_required' : 'generated',
      seo_title: llmResult.seoTitle || null,
      seo_meta_description: llmResult.metaDescription || null,
      seo_h1: llmResult.h1 || null,
      seo_intro: llmResult.intro || null,
      seo_how_to_play: llmResult.howToPlay || null,
      seo_original_key_text: llmResult.originalKeyText || null,
      seo_capo_text: llmResult.capoText || null,
      seo_strumming_text: llmResult.strummingText || null,
      seo_easy_version_text: llmResult.easyVersionText || null,
      seo_chord_explanation: llmResult.chordExplanation || null,
      seo_beginner_tips: llmResult.beginnerTips || [],
      seo_faq: llmResult.faq || [],
      seo_keyword_cluster: llmResult.keywordCluster || [],
      seo_quality_score: qualityScore,
      seo_review_notes: warnings.length > 0 ? warnings.join('; ') : null,
      seo_source_hash: sourceHash,
      seo_generated_at: now,
      seo_updated_at: now,
    };

    await base44.asServiceRole.entities.Song.update(songId, updateData);

    return Response.json({
      success: true,
      songId,
      title: song.title,
      seoStatus: updateData.seo_status,
      qualityScore,
      warnings,
      chordCount: chordList.length,
    });

  } catch (error) {
    // Try to mark as error if we have the songId
    try {
      const body2 = await req.clone().json().catch(() => ({}));
      if (body2.songId) {
        const base44b = createClientFromRequest(req);
        await base44b.asServiceRole.entities.Song.update(body2.songId, {
          seo_status: 'error',
          seo_review_notes: error.message,
        });
      }
    } catch (_) {}
    return Response.json({ error: error.message }, { status: 500 });
  }
});