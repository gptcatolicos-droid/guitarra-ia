import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage';
import { useLocation } from 'react-router-dom';
import { findSongsStartingWithChord, normalizeChordName } from '@/lib/chordSearch';

const SYSTEM_PROMPT = `Eres Guitarra IA, un asistente musical especializado en acordes, cifrados y tablaturas para guitarristas de guitarraia.com.

Tienes acceso al catálogo interno de la plataforma. SOLO puedes responder con canciones que estén en el catálogo. NO busques ni inventes información de fuentes externas.

1. CONSOLIDACIÓN DE VERSIONES: Si hay múltiples archivos del mismo título/artista, trátelas como versiones alternativas. Compara y entrega UNA versión consolidada y limpia, organizada por secciones (Intro, Verso, Pre-coro, Coro, Puente, Final). No menciones nombres de archivos, versiones ni fuentes. NUNCA muestres el mismo tipo de contenido más de una vez.

2. ACORDES INDIVIDUALES: Si el usuario pide ver UN acorde específico (ej: "muéstrame el acorde de Am", "cómo se toca La menor"), muéstrale el diagrama en texto usando este formato:
   - Nombre del acorde y tipo
   - Posición de los dedos en formato: [cuerda: traste/dedo]
   - Indica cuerdas al aire (0) y mudas (x)
   - Luego incluye en chord_request: { name: "Am", frets: [0,0,2,2,1,0] } en el JSON
   - Además sugiere 3 canciones del catálogo que COMIENCEN con ese acorde en related_songs_for_chord

3. REGLAS:
   - SOLO usa el contenido del catálogo interno. NUNCA inventes acordes ni busques en fuentes externas.
   - Si la canción no está en el catálogo, di claramente: "No tengo esa canción en mi catálogo aún. Puedes sugerirla para agregarla."
   - Responde en español. Puedes mostrar canciones en cualquier idioma.
   - No muestres rutas, IDs, números de versión ni datos técnicos.
   - Si el usuario pregunta sobre RASGUEOS, RITMOS, TÉCNICAS, ARPEGIOS o FORMAS DE TOCAR (rock, balada, pop, bolero, etc.), usa la sección "ARTÍCULOS DE CONOCIMIENTO" que se incluye abajo. Responde basándote en ese contenido, explicando el patrón de rasgueo, los acordes y los consejos de práctica. Siempre incluye los patrones en bloques de código. No digas "no tengo esa canción" cuando la pregunta sea sobre técnica o rasgueo.

4. FORMATO OBLIGATORIO para cifrados y tablaturas:
   Usa bloques de código con triple backtick para el contenido musical. Así:
   
   \`\`\`
   [Intro]
   Am  F  C  G
   
   [Verso]
   Am              F
   Letra de la canción...
   \`\`\`
   
   SIEMPRE usa este formato de bloque de código. Nunca pongas los acordes como texto plano corrido.

5. CALIDAD: Prioriza versiones con estructura clara, acordes coherentes y secciones bien definidas.

6. SUGERENCIAS POST-RESPUESTA: Al final de CADA respuesta donde mostraste acordes o tablatura de un artista, incluye una sección corta con 2-3 sugerencias de otras canciones populares del mismo artista que estén en el catálogo. Usa este formato exacto al final:

---SUGERENCIAS---
["Nombre canción 1", "Nombre canción 2", "Nombre canción 3"]`;

const CHAT_SONG_FIELDS = [
  'id', 'title', 'slug', 'artist_name', 'artist_slug', 'artist_image',
  'original_key', 'capo', 'difficulty', 'has_chords', 'has_tablature',
  'spotify_embed', 'youtube_video_id', 'views', 'created_date',
];

const SUGGESTIONS = [
  'Muéstrame los acordes de La Camisa Negra',
  '¿Cómo tocar el rasgueo de una balada?',
  'Canciones fáciles con cuatro acordes',
  'Tablaturas de rock clásico',
];

// Normalize for matching (remove numbers, accents, trim)
const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\d+$/, '')
    .trim();

const toSlug = (value) => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function ChatInterface({ embedded, heroMode }) {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanningExternal, setScanningExternal] = useState(false);
  const [songsCache, setSongsCache] = useState([]);
  const [blogPostsCache, setBlogPostsCache] = useState([]);
  const scrollRef = useRef(null);
  const autoQueryFired = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let idleId;
    const urlQuery = new URLSearchParams(location.search).get('q')?.trim();

    const loadCatalog = () => base44.entities.Song.list('-views', 5000, 0, CHAT_SONG_FIELDS)
      .then((rows) => {
        if (!cancelled) setSongsCache((current) => {
          const known = new Set(current.map((song) => song.id));
          return [...current, ...(rows || []).filter((song) => !known.has(song.id))];
        });
      }).catch(() => {});

    if (urlQuery) {
      const querySlug = toSlug(urlQuery);
      Promise.all([
        base44.entities.Song.filter({ slug: querySlug }, '-views', 3, 0, CHAT_SONG_FIELDS),
        base44.entities.Artist.filter({ slug: querySlug }, '-created_date', 1, 0, ['id', 'slug']),
      ]).then(async ([exactSongs, exactArtists]) => {
        const relatedArtistSlug = exactArtists?.[0]?.slug || exactSongs?.[0]?.artist_slug;
        const artistSongs = relatedArtistSlug
          ? await base44.entities.Song.filter(
              { artist_slug: relatedArtistSlug },
              '-views',
              exactArtists?.[0] ? 500 : 8,
              0,
              CHAT_SONG_FIELDS,
            )
          : [];
        if (cancelled) return;
        const immediate = [...(exactSongs || []), ...(artistSongs || [])]
          .filter((song, index, rows) => rows.findIndex((candidate) => candidate.id === song.id) === index);
        if (immediate.length) setSongsCache(immediate);
        idleId = 'requestIdleCallback' in window
          ? window.requestIdleCallback(loadCatalog, { timeout: 800 })
          : window.setTimeout(loadCatalog, 200);
      }).catch(loadCatalog);
    } else {
      idleId = 'requestIdleCallback' in window
        ? window.requestIdleCallback(loadCatalog, { timeout: 700 })
        : window.setTimeout(loadCatalog, 150);
    }

    return () => {
      cancelled = true;
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, [location.search]);

  // Auto-fire query from URL param ?q=
  useEffect(() => {
    if (autoQueryFired.current) return;
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q && songsCache.length > 0) {
      autoQueryFired.current = true;
      handleSend(q);
    }
  }, [songsCache, location.search]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Tokenized local search — splits query into words and checks each against title/artist/slug
  const quickLocalSearch = (query, songs) => {
    const q = normalize(query);
    // Also tokenize: split by spaces, filter short words
    const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
    return songs.filter((s) => {
      const title = normalize(s.title);
      const artist = normalize(s.artist_name);
      // Normalize slugs (replace - and _ with space)
      const titleSlug = (s.slug || '').replace(/[-_]/g, ' ');
      const artistSlug = (s.artist_slug || '').replace(/[-_]/g, ' ');
      const allText = `${title} ${artist} ${titleSlug} ${artistSlug}`;
      // Full query match
      if (allText.includes(q)) return true;
      // Token match: every token must appear in the combined text
      if (tokens.length > 0 && tokens.every((t) => allText.includes(t))) return true;
      // Partial: any significant token (>=4 chars) matches
      if (tokens.some((t) => t.length >= 4 && allText.includes(t))) return true;
      return false;
    });
  };

  // Find blog posts relevant to a technique/rhythm query
  const findRelevantBlogPosts = (query, posts, max = 3) => {
    const q = normalize(query);
    const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
    const scored = posts.map((p) => {
      const title = normalize(p.title);
      const excerpt = normalize(p.excerpt || '');
      const tags = (p.tags || []).map(normalize).join(' ');
      const content = normalize(p.content || '');
      const allText = `${title} ${excerpt} ${tags}`;
      let score = 0;
      if (allText.includes(q)) score += 5;
      for (const t of tokens) {
        if (title.includes(t)) score += 3;
        if (allText.includes(t)) score += 1;
        if (content.includes(t)) score += 0.5;
      }
      return { post: p, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, max)
      .map((s) => s.post);
  };

  const handleSend = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setScanningExternal(false);

    const requestedChord = normalizeChordName(userMessage);
    if (requestedChord) {
      const startingSongs = findSongsStartingWithChord(songsCache, requestedChord)
        .slice(0, 12)
        .map((song) => ({ ...song, title: song.title.replace(/\s*\d+$/, '').trim() }));
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: startingSongs.length
          ? `Estas son las canciones del catálogo que comienzan con **${requestedChord}**.`
          : `Aún no hay canciones del catálogo que comiencen con **${requestedChord}**.`,
        songs: startingSongs,
        suggestions: [],
      }]);
      setLoading(false);
      return;
    }

    // Check if we have local results first — if yes, skip scanning animation
    const localMatches = quickLocalSearch(userMessage, songsCache);
    const hasLocalResults = localMatches.length > 0;

    // Only show scanning animation if no local results found
    let scanTimer = null;
    if (!hasLocalResults) {
      scanTimer = setTimeout(() => setScanningExternal(true), 1000);
    }

    try {
      // Find local matches FIRST
      const localMatches2 = quickLocalSearch(userMessage, songsCache);

      // Deduplicate by normalized title+artist
      const seenLocal = new Set();
      const dedupedLocal = localMatches2.filter((s) => {
        const key = `${normalize(s.artist_name)}|${normalize(s.title)}`;
        if (seenLocal.has(key)) return false;
        seenLocal.add(key);
        return true;
      });

      // Sort: with spotify_embed first
      dedupedLocal.sort((a, b) => (b.spotify_embed ? 1 : 0) - (a.spotify_embed ? 1 : 0));

      // If we have local matches, return the strongest result immediately.
      // Artist searches start with three songs; the rest are appended in the
      // next idle window so the user never waits for a long list to render.
      const isChordQuery = /acorde|chord|diagrama|como\s+se\s+toca|rasgueo|ritmo|técnica|teoria|escala/i.test(userMessage);

      if (dedupedLocal.length > 0 && !isChordQuery) {
        const normalizedQuery = normalize(userMessage);
        const cleanSongs = dedupedLocal
          .map((song) => ({ ...song, title: song.title.replace(/\s*\d+$/, '').trim() }))
          .sort((a, b) => {
            const aExact = normalize(a.title) === normalizedQuery ? 1 : 0;
            const bExact = normalize(b.title) === normalizedQuery ? 1 : 0;
            return bExact - aExact || (b.views || 0) - (a.views || 0);
          });
        const isArtistSearch = cleanSongs.some((song) => normalize(song.artist_name) === normalizedQuery);
        const initialSongs = cleanSongs.slice(0, isArtistSearch ? 3 : 1);
        const responseId = `catalog-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setMessages((prev) => [...prev, {
          id: responseId,
          role: 'assistant',
          content: '',
          songs: initialSongs,
          suggestions: [],
        }]);
        const revealRest = () => setMessages((current) => current.map((message) => (
          message.id === responseId ? { ...message, songs: cleanSongs } : message
        )));
        if (cleanSongs.length > initialSongs.length) {
          if ('requestIdleCallback' in window) window.requestIdleCallback(revealRest, { timeout: 700 });
          else window.setTimeout(revealRest, 180);
        }
        if (scanTimer) clearTimeout(scanTimer);
        setScanningExternal(false);
        setLoading(false);
        return;
      }

      // Only the few candidates that need an AI answer fetch their full musical
      // content. The large catalog remains metadata-only.
      const detailedMatches = await Promise.all(
        dedupedLocal.slice(0, 6).map((song) => base44.entities.Song.get(song.id).catch(() => song)),
      );
      const contentForLLM = detailedMatches.map((song) => ({
        id: song.id,
        title: song.title.replace(/\s*\d+$/, '').trim(),
        artist: song.artist_name,
        key: song.original_key,
        capo: song.capo,
        difficulty: song.difficulty,
        has_chords: song.has_chords,
        has_tablature: song.has_tablature,
        content_raw: song.content_raw || '',
        tablature: song.tablature || '',
      }));

      let availablePosts = blogPostsCache;
      if (isChordQuery && availablePosts.length === 0) {
        availablePosts = await base44.entities.BlogPost.filter({ published: true }, '-created_date', 100);
        setBlogPostsCache(availablePosts || []);
      }
      const relevantPosts = findRelevantBlogPosts(userMessage, availablePosts || []);
      const postsForLLM = relevantPosts.map((p) => ({
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

${contentForLLM.length > 0 ? `Canciones encontradas en catálogo:
${JSON.stringify(contentForLLM)}` : 'No se encontraron canciones en el catálogo para esta consulta.'}

${postsForLLM.length > 0 ? `ARTÍCULOS DE CONOCIMIENTO (usa este contenido para responder sobre rasgueos, ritmos, técnicas y arpegios):
${JSON.stringify(postsForLLM)}` : ''}

Mensaje del usuario: "${userMessage}"

IMPORTANTE:
- Si hay canciones arriba, ÚSALAS directamente.
- SIEMPRE formatea acordes/tablatura en bloques de código triple backtick.
- Si la pregunta es sobre rasgueos, ritmos o técnicas, responde usando los ARTÍCULOS DE CONOCIMIENTO. Explica el patrón de rasgueo con símbolos D (abajo) y A (arriba), incluye los acordes y consejos de práctica.
- matched_songs: incluye los IDs de las canciones que encontraste.`,
        add_context_from_internet: false,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            response: { type: 'string', description: 'Respuesta en español con cifrado en bloque de código' },
            matched_songs: {
              type: 'array',
              items: { type: 'object', properties: { song_id: { type: 'string' } } },
            },
            chord_request: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                frets: { type: 'array', items: { type: 'number' } },
              },
            },
            related_songs_for_chord: {
              type: 'array',
              items: { type: 'object', properties: { song_id: { type: 'string' } } },
            },
          },
          required: ['response'],
        },
      });

      const matched = (result.matched_songs || [])
        .map((m) => songsCache.find((s) => s.id === m.song_id))
        .filter(Boolean)
        .map((s) => ({ ...s, title: s.title.replace(/\s*\d+$/, '').trim() }));

      // Deduplicate matched songs by normalized title
      const seenTitles = new Set();
      const dedupedMatched = matched.filter((s) => {
        const key = `${normalize(s.artist_name)}|${normalize(s.title)}`;
        if (seenTitles.has(key)) return false;
        seenTitles.add(key);
        return true;
      });

      // Parse suggestions from response
      let cleanResponse = result.response;
      let suggestions = [];
      const suggMatch = result.response.match(/---SUGERENCIAS---\s*(\[.*?\])/s);
      if (suggMatch) {
        try { suggestions = JSON.parse(suggMatch[1]); } catch {}
        cleanResponse = result.response.replace(/---SUGERENCIAS---\s*(\[.*?\])/s, '').trim();
      }

      // Handle chord diagram request
      const chordRequest = result.chord_request || null;
      const relatedChordSongs = (result.related_songs_for_chord || [])
        .map((m) => songsCache.find((s) => s.id === m.song_id))
        .filter(Boolean)
        .map((s) => ({ ...s, title: s.title.replace(/\s*\d+$/, '').trim() }));

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: cleanResponse,
          songs: chordRequest ? relatedChordSongs : dedupedMatched,
          suggestions,
          chordRequest,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, tuve un problema al procesar tu búsqueda. Inténtalo de nuevo.' },
      ]);
    }

    if (scanTimer) clearTimeout(scanTimer);
    setScanningExternal(false);
    setLoading(false);
  };

  const hasMessages = messages.length > 0;

  const inputBar = (
    <div className="px-4 py-4 bg-white" style={{ borderTop: hasMessages ? '1px solid #E5E7EB' : 'none' }}>
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <div className="flex items-end gap-2 rounded-2xl p-2 transition-colors min-w-0 bg-white" style={{ border: '1px solid #E5E7EB' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe el nombre de una canción o artista..."
            rows={1}
            className="flex-1 min-w-0 w-0 resize-none outline-none py-2 text-sm max-h-32" style={{ backgroundColor: 'transparent', color: '#1F2937' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 shrink-0 text-white rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity" style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)' }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-muted-foreground text-xs text-center mt-2">
          La IA puede equivocarse. Verifica siempre los acordes.
        </p>
      </div>
    </div>
  );

  if (heroMode && !hasMessages) {
    // Hero state: centered layout with background image, input in the middle
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div
          className="flex-1 flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <div className="relative z-10 w-full max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ backgroundColor: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.4)', color: '#F97316' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Asistente IA activo
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold mb-3" style={{ color: '#1F2937' }}>
              Aprende y practica Guitarra con <span style={{ color: '#F97316' }}>Inteligencia Artificial</span>
            </h1>
            <p className="text-sm lg:text-base mb-8" style={{ color: '#4B5563' }}>
              Pregunta por acordes, tablaturas, tonos, canciones o técnica.
            </p>
            {/* Input bar centered */}
            <div className="flex items-end gap-2 rounded-2xl p-2 min-w-0" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 6px 18px rgba(15,23,42,0.08)' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder="Escribe el nombre de una canción o artista..."
                rows={1}
                className="flex-1 min-w-0 w-0 resize-none outline-none py-2 text-sm max-h-32"
                style={{ backgroundColor: 'transparent', color: '#1F2937' }}
              />
              <button onClick={() => handleSend()} disabled={!input.trim() || loading}
                className="p-2.5 shrink-0 text-white rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity"
                style={{ backgroundColor: '#F97316' }}>
                <Send className="w-5 h-5" />
              </button>
            </div>
            {/* Quick suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors hover:border-orange-400"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#4B5563' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inner = (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 bg-g-page">
        <div className="max-w-3xl mx-auto w-full min-w-0 space-y-6">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} onSuggestionClick={handleSend} />
          ))}
          {loading && (
            <div className="flex flex-col gap-2 pl-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce-dot" style={{ animationDelay: '200ms' }} />
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce-dot" style={{ animationDelay: '400ms' }} />
              </div>
              {scanningExternal && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
                  Buscando en el catálogo...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {inputBar}
    </>
  );

  if (embedded || heroMode) {
    return <div className="flex flex-col flex-1 overflow-hidden">{inner}</div>;
  }

  return (
    <div className="flex flex-col bg-g-page" style={{ height: 'calc(100vh - 64px)' }}>
      {inner}
    </div>
  );
}
