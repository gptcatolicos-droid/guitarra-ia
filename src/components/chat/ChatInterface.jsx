import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage';

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

export default function ChatInterface({ embedded }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy Guitarra IA, tu asistente musical de guitarraia.com. Puedo ayudarte a encontrar acordes, tablaturas y cifrados, y también mostrarte el diagrama de cualquier acorde. ¿Qué quieres tocar hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanningExternal, setScanningExternal] = useState(false);
  const [songsCache, setSongsCache] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    base44.entities.Song.list('-created_date', 2000)
      .then(setSongsCache)
      .catch(() => {});
  }, []);

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

    // Check if we have local results first — if yes, skip scanning animation
    const localMatches = quickLocalSearch(userMessage, songsCache);
    const hasLocalResults = localMatches.length > 0;

    // Only show scanning animation if no local results found
    let scanTimer = null;
    if (!hasLocalResults) {
      scanTimer = setTimeout(() => setScanningExternal(true), 1000);
    }

    try {
      const versionGroups = groupVersions(songsCache);

      // Build catalog — include grouped version info, clean titles
      const catalog = Object.values(versionGroups).map((versions) => {
        const primary = versions[0];
        return {
          id: primary.id,
          title: primary.title.replace(/\s*\d+$/, '').trim(),
          artist: primary.artist_name,
          key: primary.original_key,
          capo: primary.capo,
          difficulty: primary.difficulty,
          has_chords: versions.some((v) => v.has_chords),
          has_tablature: versions.some((v) => v.has_tablature),
          content_raw: primary.content_raw || '',
          tablature: primary.tablature || '',
          version_count: versions.length,
          all_ids: versions.map((v) => v.id),
        };
      });

      // Step 1: find local matches FIRST using the same tokenized search
      const localMatches2 = quickLocalSearch(userMessage, songsCache);

      // Deduplicate by normalized title+artist, pick one with content
      const seenLocal = new Set();
      const dedupedLocal = localMatches2.filter((s) => {
        const key = `${normalize(s.artist_name)}|${normalize(s.title)}`;
        if (seenLocal.has(key)) return false;
        seenLocal.add(key);
        return true;
      });

      // Build content to inject — only for matched songs (not full catalog)
      const contentForLLM = dedupedLocal.slice(0, 5).map((s) => ({
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

      // Only send catalog metadata (no content) for index — keep prompt small
      const catalogIndex = Object.values(versionGroups).map((versions) => {
        const p = versions[0];
        return {
          id: p.id,
          title: p.title.replace(/\s*\d+$/, '').trim(),
          artist: p.artist_name,
          has_chords: versions.some((v) => v.has_chords),
          has_tablature: versions.some((v) => v.has_tablature),
        };
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

Catálogo (solo metadatos, para identificar canciones):
${JSON.stringify(catalogIndex)}

${contentForLLM.length > 0 ? `Contenido completo de canciones que coinciden con la búsqueda:
${JSON.stringify(contentForLLM)}` : ''}

Mensaje del usuario: "${userMessage}"

IMPORTANTE:
- Si hay contenido de canciones arriba, ÚSALO para mostrar los acordes/tablatura formateados.
- SIEMPRE formatea acordes/tablatura dentro de bloques de código con triple backtick.
- No muestres IDs, números de versión ni códigos en los títulos.
- matched_songs debe tener SOLO los IDs de canciones realmente encontradas.`,
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

  const inner = (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
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
          {messages.length === 1 && !loading && (
            <div className="pt-2">
              <p className="text-muted-foreground text-sm mb-3">Sugerencias:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="px-4 py-2 bg-card border border-border rounded-full text-sm text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-card border border-border rounded-2xl p-2 focus-within:border-primary transition-colors">
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
              className="flex-1 bg-transparent text-foreground placeholder-muted-foreground resize-none outline-none py-2 text-sm max-h-32"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 text-white rounded-xl hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity bg-gradient-brand"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-muted-foreground text-xs text-center mt-2">
            La IA puede equivocarse. Verifica siempre los acordes.
          </p>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <div className="flex flex-col flex-1 overflow-hidden">{inner}</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      {inner}
    </div>
  );
}