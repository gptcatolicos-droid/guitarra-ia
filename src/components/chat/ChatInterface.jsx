import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage';

const SYSTEM_PROMPT = `Eres Tablaturas IA, un asistente musical especializado en acordes, cifrados y tablaturas para guitarristas.

Tienes acceso al catálogo interno de la plataforma. Cuando el usuario busca una canción:

1. CONSOLIDACIÓN DE VERSIONES: Si hay múltiples archivos del mismo título/artista, trátelas como versiones alternativas. Compara y entrega UNA versión consolidada y limpia, organizada por secciones (Intro, Verso, Pre-coro, Coro, Puente, Final). No menciones nombres de archivos, versiones ni fuentes. NUNCA muestres el mismo tipo de contenido más de una vez.

2. FUENTES EXTERNAS: Si la canción no está en el catálogo interno, búscala en Ultimate Guitar, CifraClub, AcordesWeb, LaCuerda, Chordify, Songsterr. Indica de manera natural que la encontraste externamente.

3. REGLAS:
   - NUNCA inventes acordes. Si no tienes información real, dilo claramente.
   - Responde en español. Puedes mostrar canciones en cualquier idioma.
   - No muestres rutas, IDs, números de versión ni datos técnicos.
   - Si no encuentras nada, dilo claramente.

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

6. SUGERENCIAS POST-RESPUESTA: Al final de CADA respuesta donde mostraste acordes o tablatura de un artista, incluye una sección corta con 2-3 sugerencias de otras canciones populares del mismo artista que el usuario podría querer ver. Usa este formato exacto al final:

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
        '¡Hola! Soy tu asistente de tablaturas. Puedo ayudarte a encontrar tablaturas, acordes y cifrados. ¿Qué canción quieres tocar hoy?',
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

  // Quick local search to detect if question is about a specific song/artist in DB
  const quickLocalSearch = (query, songs) => {
    const q = normalize(query);
    return songs.filter((s) => {
      const title = normalize(s.title);
      const artist = normalize(s.artist_name);
      return title.includes(q) || artist.includes(q) || q.includes(title) || q.includes(artist);
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

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

Catálogo interno (JSON):
${JSON.stringify(catalog.map((c) => ({
  id: c.id, title: c.title, artist: c.artist, key: c.key,
  capo: c.capo, difficulty: c.difficulty,
  has_chords: c.has_chords, has_tablature: c.has_tablature,
})))}

Mensaje del usuario: "${userMessage}"

IMPORTANTE:
- Si hay canciones en el catálogo que coincidan, responde usando el contenido del catálogo.
- SIEMPRE formatea los acordes/tablatura dentro de bloques de código con triple backtick.
- No muestres IDs, números de versión, ni códigos en los títulos de las canciones.
- Los matched_songs deben tener SOLO los IDs de canciones realmente encontradas en el catálogo.
- Si buscas en fuentes externas, sé breve en la explicación y muestra el contenido formateado correctamente.`,
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
          },
          required: ['response'],
        },
      });

      const matched = (result.matched_songs || [])
        .map((m) => songsCache.find((s) => s.id === m.song_id))
        .filter(Boolean)
        .map((s) => ({
          ...s,
          title: s.title.replace(/\s*\d+$/, '').trim(),
        }));

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

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: cleanResponse, songs: dedupedMatched, suggestions },
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
                  Escaneando fuentes externas: Ultimate Guitar, CifraClub, AcordesWeb...
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