import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send } from 'lucide-react';
import ChatMessage from './ChatMessage';

const SYSTEM_PROMPT = `Eres Tablaturas IA, un asistente musical especializado en acordes, cifrados y tablaturas para guitarristas.

Tienes acceso al catálogo interno de la plataforma. Cuando el usuario busca una canción:

1. CONSOLIDACIÓN DE VERSIONES: Si hay múltiples archivos del mismo título/artista (ej: con números 01, 02, 03), trátelas como versiones alternativas. Compara y entrega UNA versión consolidada y limpia, organizada por secciones (Intro, Verso, Pre-coro, Coro, Puente, Final). No menciones nombres de archivos, versiones ni fuentes. NUNCA muestres el mismo tipo de contenido (acordes O tablatura) más de una vez para la misma canción.

2. FUENTES EXTERNAS: Si la canción no está en el catálogo interno, búscala en estas plataformas: Ultimate Guitar (ultimate-guitar.com), Songsterr (songsterr.com), Chordify (chordify.net), E-Chords (e-chords.com), GuitarTabs (guitartabs.cc), 911tabs (911tabs.com), AZChords (azchords.com), LaCuerda (lacuerda.net), CifraClub (cifraclub.com), AcordesWeb (acordesweb.com). Indica de manera natural que encontraste el contenido externamente: "No encontré '[canción]' en nuestro catálogo interno, pero he buscado la versión más precisa y consistente en fuentes externas como [fuente] para que puedas tocarla."

3. REGLAS:
   - Nunca inventes acordes, letras ni secciones que no tengas.
   - Si hay desacuerdos entre versiones, usa la más consistente.
   - Responde en español. Puedes mostrar canciones en cualquier idioma.
   - No muestres rutas, IDs, números de versión ni datos técnicos.
   - Si no encuentras nada en ningún lado, dilo claramente.

4. FORMATO DE RESPUESTA para cifrados:
   Muestra el contenido estructurado por secciones con los acordes sobre la letra:
   
   [Intro]
   Am  F  C  G
   
   [Verso]
   Am              F
   Letra de la canción...

5. CALIDAD: Prioriza versiones con estructura clara, acordes coherentes y secciones bien definidas.`;

const SUGGESTIONS = [
  'Canciones de Juanes',
  'Acordes de La camisa negra',
  'Tablatura de Wonderwall',
  'Canciones fáciles para principiantes',
];

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
    base44.entities.Song.list('-created_date', 1000)
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
    const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\d+$/, '').trim();
    const groups = {};
    for (const s of songs) {
      const key = `${normalize(s.artist_name)}|${normalize(s.title)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    }
    return groups;
  };

  const handleSend = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setScanningExternal(false);

    // Show scanning animation after 2s if still loading
    const scanTimer = setTimeout(() => setScanningExternal(true), 2000);

    try {
      const versionGroups = groupVersions(songsCache);

      // Build catalog — include grouped version info
      const catalog = Object.values(versionGroups).map((versions) => {
        const primary = versions[0];
        return {
          id: primary.id,
          title: primary.title.replace(/\s*\d+$/, '').trim(),
          artist: primary.artist_name,
          key: primary.original_key,
          capo: primary.capo,
          difficulty: primary.difficulty,
          has_chords: versions.some(v => v.has_chords),
          has_tablature: versions.some(v => v.has_tablature),
          version_count: versions.length,
          all_ids: versions.map(v => v.id),
        };
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}

Catálogo interno (JSON):
${JSON.stringify(catalog)}

Mensaje del usuario: "${userMessage}"

Responde en español. 
- Si el usuario pide una canción específica y está en el catálogo, incluye su contenido completo (acordes/tablatura) en el campo "song_content" para mostrarlo al usuario.
- Incluye matched_songs con los IDs exactos de canciones encontradas.
- Si buscas en fuentes externas, explícalo de forma natural en la respuesta.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            response: { type: 'string', description: 'Respuesta natural del asistente en español' },
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
        .filter(Boolean);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.response, songs: matched },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, tuve un problema al procesar tu búsqueda. Inténtalo de nuevo.' },
      ]);
    }
    clearTimeout(scanTimer);
    setScanningExternal(false);
    setLoading(false);
  };

  const inner = (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {loading && (
            <div className="flex flex-col gap-2 pl-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
                <div className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full animate-bounce-dot" style={{ animationDelay: '200ms' }} />
                <div className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full animate-bounce-dot" style={{ animationDelay: '400ms' }} />
              </div>
              {scanningExternal && (
                <div className="flex items-center gap-2 text-xs text-[#a7afb8] animate-pulse">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#ff7a00] animate-ping" />
                  Escaneando fuentes externas: Ultimate Guitar, CifraClub, AcordesWeb...
                </div>
              )}
            </div>
          )}
          {messages.length === 1 && !loading && (
            <div className="pt-2">
              <p className="text-[#a7afb8] text-sm mb-3">Sugerencias:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="px-4 py-2 bg-[#20242a] border border-[#2b3138] rounded-full text-sm text-white hover:border-[#ff7a00] hover:text-[#ff7a00] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#2b3138] px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-[#20242a] border border-[#2b3138] rounded-2xl p-2 focus-within:border-[#ff7a00] transition-colors">
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
              className="flex-1 bg-transparent text-white placeholder-[#a7afb8] resize-none outline-none py-2 text-sm max-h-32"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-[#ff7a00] text-white rounded-xl hover:bg-[#e66e00] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[#a7afb8] text-xs text-center mt-2">
            La información puede contener errores. Verifica siempre las notas por tu cuenta.
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