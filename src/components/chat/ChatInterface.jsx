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

const HERO_BG = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/2fe719569_foto.png';

export default function ChatInterface({ embedded, heroMode }) {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanningExternal, setScanningExternal] = useState(false);
  const [songsCache, setSongsCache] = useState([]);
  const scrollRef = useRef(null);
  const autoQueryFired = useRef(false);

  useEffect(() => {
    base44.entities.Song.list('-created_date', 2000)
      .then(setSongsCache)
      .catch(() => {});
  }, []);

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

  // Group songs by normalized title+artist to detect multiple versions
  const groupVersions = (songs) => {
    const groups = {};
    for (const s of songs) {
      const key = `${normalize(s.artist_name)}|${normalize(s.title)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return groups;
  };

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

      // Build content for LLM — ONLY matched songs, max 6
      const contentForLLM = dedupedLocal.slice(0, 6).map((s) => ({
        id: s.id,
        title: s.title.replace(/\s*\d+$/, '').trim(),
        artist: s.artist_name,
        key: s.original_key,
        capo: s.capo,
        difficulty: s.difficulty,
        has_chords: s.has_chords,
        has_tablature: s.has_tablature,
        content_raw: s.content_raw || '',
        tablature: s.tablature || '',
      }));

      // If we have local matches, return them directly without LLM for catalog queries
      const isChordQuery = /acorde|chord|diagrama|como\s+se\s+toca|rasgueo|ritmo|técnica|teoria|escala/i.test(userMessage);
      
      if (dedupedLocal.length > 0 && !isChordQuery) {
        // Direct response: show cards without LLM call
        const cleanSongs = dedupedLocal.map(s => ({ ...s, title: s.title.replace(/\s*\d+$/, '').trim() }));
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '',
            songs: cleanSongs,
            suggestions: [],
          },
        ]);
        if (scanTimer) clearTimeout(scanTimer);
        setScanningExternal(false);
        setLoading(false);
        return;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

${contentForLLM.length > 0 ? `Canciones encontradas en catálogo:
${JSON.stringify(contentForLLM)}` : 'No se encontraron canciones en el catálogo para esta consulta.'}

Mensaje del usuario: "${userMessage}"

IMPORTANTE:
- Si hay canciones arriba, ÚSALAS directamente.
- SIEMPRE formatea acordes/tablatura en bloques de código triple backtick.
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
    <div className="px-4 py-4" style={{ borderTop: hasMessages ? '1px solid #272C2F' : 'none', backgroundColor: '#0E1112' }}>
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <div className="flex items-end gap-2 rounded-2xl p-2 transition-colors min-w-0" style={{ backgroundColor: '#171A1C', border: '1px solid #303538' }}>
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
            className="flex-1 min-w-0 w-0 resize-none outline-none py-2 text-sm max-h-32" style={{ backgroundColor: 'transparent', color: '#F4F4F2' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-2.5 shrink-0 text-white rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity" style={{ backgroundColor: '#FF7200' }}
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
          style={{ backgroundColor: '#0B0D0E' }}
        >
          <div className="absolute inset-0 z-0"
            style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0 z-0" style={{ backgroundColor: 'rgba(11,13,14,0.82)' }} />
          <div className="relative z-10 w-full max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ backgroundColor: 'rgba(255,114,0,0.18)', border: '1px solid rgba(255,114,0,0.4)', color: '#FF7200' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Asistente IA activo
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold mb-3" style={{ color: '#F4F4F2' }}>
              Tu profe de guitarra con <span style={{ color: '#FF7200' }}>inteligencia artificial</span>
            </h1>
            <p className="text-sm lg:text-base mb-8" style={{ color: '#A7ACAE' }}>
              Pregunta por acordes, tablaturas, tonos, canciones o técnica.
            </p>
            {/* Input bar centered */}
            <div className="flex items-end gap-2 rounded-2xl p-2 min-w-0" style={{ backgroundColor: '#171A1C', border: '1px solid #444A4E' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                placeholder="Escribe el nombre de una canción o artista..."
                rows={1}
                className="flex-1 min-w-0 w-0 resize-none outline-none py-2 text-sm max-h-32"
                style={{ backgroundColor: 'transparent', color: '#F4F4F2' }}
              />
              <button onClick={() => handleSend()} disabled={!input.trim() || loading}
                className="p-2.5 shrink-0 text-white rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity"
                style={{ backgroundColor: '#FF7200' }}>
                <Send className="w-5 h-5" />
              </button>
            </div>
            {/* Quick suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSend(s)}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors hover:border-orange-500/50"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid #303538', color: '#A7ACAE' }}>
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ backgroundColor: '#0B0D0E' }}>
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
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)', backgroundColor: '#0B0D0E' }}>
      {inner}
    </div>
  );
}