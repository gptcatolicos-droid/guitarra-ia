import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Send, Music } from 'lucide-react';

const normalize = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\d+$/, '').trim();

const quickLocalSearch = (query, songs) => {
  const q = normalize(query);
  const tokens = q.split(/\s+/).filter((t) => t.length >= 3);
  return songs.filter((s) => {
    const title = normalize(s.title);
    const artist = normalize(s.artist_name);
    const allText = `${title} ${artist} ${(s.slug || '').replace(/[-_]/g, ' ')} ${(s.artist_slug || '').replace(/[-_]/g, ' ')}`;
    if (allText.includes(q)) return true;
    if (tokens.length > 0 && tokens.every((t) => allText.includes(t))) return true;
    if (tokens.some((t) => t.length >= 4 && allText.includes(t))) return true;
    return false;
  });
};

function extractSpotifySrc(embed) {
  if (!embed) return null;
  const match = embed.match(/src="([^"]+)"/);
  const url = match ? match[1] : embed;
  try { const u = new URL(url); return u.origin + u.pathname; } catch { return url.split('?')[0]; }
}

function SongCard({ song }) {
  const title = (song.title || '').replace(/\s*\d+$/, '').trim();
  const spotifySrc = extractSpotifySrc(song.spotify_embed);
  const hasChords = song.has_chords;
  const hasTab = song.has_tablature;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
      {spotifySrc ? (
        <iframe src={spotifySrc} width="100%" height="152" frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy" style={{ display: 'block' }} />
      ) : (
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #272C2F' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)' }}>
            <Music className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: '#F4F4F2' }}>{title}</p>
            <p className="text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
          </div>
        </div>
      )}
      <div className="p-3 flex gap-2">
        {hasChords && (
          <Link to={`/${song.artist_slug}/${song.slug}/acordes`}
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)' }}>
            Ver Acordes
          </Link>
        )}
        {hasTab && (
          <Link to={`/${song.artist_slug}/${song.slug}/tablatura`}
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)' }}>
            Ver Tablatura
          </Link>
        )}
        {!hasChords && !hasTab && (
          <Link to={`/${song.artist_slug}/${song.slug}`}
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)' }}>
            Ver Canción
          </Link>
        )}
      </div>
    </div>
  );
}

export default function HeroSearchChat({ quickChips }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // null = no search yet
  const [loading, setLoading] = useState(false);
  const [songsCache, setSongsCache] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    base44.entities.Song.list('-created_date', 2000).then(setSongsCache).catch(() => {});
  }, []);

  const handleSearch = async (text) => {
    const q = (text || query).trim();
    if (!q) return;
    setQuery(q);
    setLoading(true);
    setResults(null);

    const matches = quickLocalSearch(q, songsCache);

    // Deduplicate by title+artist
    const seen = new Set();
    const deduped = matches.filter((s) => {
      const key = `${normalize(s.artist_name)}|${normalize(s.title)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort: spotify embed first
    deduped.sort((a, b) => (b.spotify_embed ? 1 : 0) - (a.spotify_embed ? 1 : 0));

    setResults(deduped.slice(0, 9));
    setLoading(false);
  };

  return (
    <div className="w-full">
      {/* Input */}
      <div className="relative mb-4">
        <div className="flex items-center gap-2 rounded-xl p-2"
          style={{ backgroundColor: '#171A1C', border: '1px solid #303538' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Busca canciones, artistas, acordes o géneros…"
            className="flex-1 py-2 px-3 text-sm outline-none"
            style={{ backgroundColor: 'transparent', color: '#F4F4F2', caretColor: '#FF7200' }}
          />
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)', color: '#fff' }}
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4" />}
            Pregunta a GuitarraIA
          </button>
        </div>
      </div>

      {/* Quick chips */}
      {results === null && !loading && (
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {quickChips.map(chip => (
            <button key={chip}
              onClick={() => handleSearch(chip)}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{ backgroundColor: 'rgba(24,27,29,0.85)', border: '1px solid #303538', color: '#A7ACAE' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF7200'; e.currentTarget.style.color = '#FF7200'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#303538'; e.currentTarget.style.color = '#A7ACAE'; }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce-dot" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce-dot" style={{ animationDelay: '400ms' }} />
        </div>
      )}

      {results !== null && !loading && (
        <div className="mt-4 text-left">
          {results.length === 0 ? (
            <div className="py-6 text-center rounded-xl" style={{ border: '1px dashed #303538' }}>
              <p className="text-sm" style={{ color: '#747B7F' }}>
                No encontré resultados. Intenta con otro nombre o{' '}
                <Link to="/chat" className="underline" style={{ color: '#FF7200' }}>pregunta al Chat IA</Link>.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold mb-3 text-left" style={{ color: '#A7ACAE' }}>
                {results.length} resultado{results.length !== 1 ? 's' : ''} para "{query}"
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map(song => <SongCard key={song.id} song={song} />)}
              </div>
              <div className="mt-4 text-center">
                <Link to="/chat"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)', color: '#fff' }}>
                  Ver más en Chat IA
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}