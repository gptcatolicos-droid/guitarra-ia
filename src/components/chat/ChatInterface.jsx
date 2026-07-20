import { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Paperclip } from 'lucide-react';
import ChatMessage from './ChatMessage';

const SYSTEM_PROMPT = `Eres Tablaturas IA, un asistente musical especializado en encontrar canciones, artistas, acordes, cifrados y tablaturas dentro del catálogo autorizado de la plataforma.

Tu fuente de verdad es exclusivamente la información recuperada desde la base de datos y los documentos indexados.

Reglas obligatorias:
1. Nunca inventes acordes, letras, tablaturas, riffs, solos, afinaciones o versiones.
2. Solamente muestra contenido recuperado de la base autorizada.
3. Si no hay resultados, dilo claramente: "No encontré esa canción en el catálogo disponible."
4. Si el usuario busca un artista, muestra sus canciones disponibles.
5. Si busca una canción, muestra la ficha con título, artista, tonalidad, capo, afinación, dificultad y recursos disponibles.
6. Responde en español, sé directo, claro y útil.
7. No reveles rutas internas, credenciales ni datos administrativos.
8. No muestres enlaces de Google Drive al usuario.

Cuando encuentres una canción, indica: título, artista, tonalidad, capo, afinación, dificultad y recursos disponibles (acordes/tablatura).
Si hay varias coincidencias, preséntalas como una lista numerada.
Detecta errores ortográficos y sugiere la canción correcta.`;

const SUGGESTIONS = [
  'Canciones de Juanes',
  'Acordes de La camisa negra',
  'Tablatura de A Dios le pido',
  'Canciones fáciles',
];

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente de tablaturas. Puedo ayudarte a encontrar tablaturas, acordes, rasgueos y mucho más. ¿Qué canción quieres tocar hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [songsCache, setSongsCache] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    base44.entities.Song.list('-created_date', 500)
      .then(setSongsCache)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (text) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const catalog = songsCache.map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist_name,
        key: s.original_key,
        capo: s.capo,
        difficulty: s.difficulty,
        has_chords: s.has_chords,
        has_tablature: s.has_tablature,
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `${SYSTEM_PROMPT}\n\nCatálogo disponible (JSON):\n${JSON.stringify(catalog)}\n\nMensaje del usuario: "${userMessage}"\n\nResponde en español. Si encuentras canciones que coincidan, inclúyelas en matched_songs con su song_id exacto del catálogo. Si no hay coincidencias, deja matched_songs vacío.`,
        response_json_schema: {
          type: 'object',
          properties: {
            response: {
              type: 'string',
              description: 'Respuesta natural del asistente en español',
            },
            matched_songs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  song_id: { type: 'string' },
                },
              },
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
        {
          role: 'assistant',
          content:
            'Lo siento, tuve un problema al procesar tu búsqueda. Inténtalo de nuevo.',
        },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 pl-2">
              <div className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
              <div className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full animate-bounce-dot" style={{ animationDelay: '200ms' }} />
              <div className="w-2.5 h-2.5 bg-[#ff7a00] rounded-full animate-bounce-dot" style={{ animationDelay: '400ms' }} />
            </div>
          )}
          {messages.length === 1 && !loading && (
            <div className="pt-4">
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
            <button className="p-2 text-[#a7afb8] hover:text-white">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu mensaje..."
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
    </div>
  );
}