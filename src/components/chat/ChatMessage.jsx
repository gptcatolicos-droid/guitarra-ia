import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Chord diagram SVG inline for chat
function ChatChordDiagram({ name, frets }) {
  if (!frets || frets.length !== 6) return null;
  const L = 34, T = 42, SG = 22, FG = 28;
  const p = frets.filter(x => x > 0);
  const nut = !p.length || Math.max(...p) <= 5;
  const start = nut ? 1 : Math.min(...p);
  const fingers = (() => {
    const u = [...new Set(frets.filter(x => x > 0))].sort((a, b) => a - b);
    const m = new Map(u.slice(0, 4).map((f, i) => [f, i + 1]));
    return frets.map(f => f > 0 ? (m.get(f) || 4) : '');
  })();
  return (
    <div className="bg-card border border-border rounded-xl p-3 inline-block mt-2">
      <p className="text-foreground font-bold text-center text-sm mb-1">{name}</p>
      <svg viewBox="0 0 180 220" className="w-32 mx-auto block text-foreground">
        <defs>
          <linearGradient id="cg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop stopColor="#FF6A00" /><stop offset="0.55" stopColor="#FF2D8D" /><stop offset="1" stopColor="#C026FF" />
          </linearGradient>
        </defs>
        {Array.from({length:6},(_,i)=>{const x=L+i*SG;return<line key={i} x1={x} y1={T} x2={x} y2={T+5*FG} stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>;})}
        {Array.from({length:6},(_,i)=>{const y=T+i*FG;return<line key={i} x1={L} y1={y} x2={L+5*SG} y2={y} stroke="currentColor" strokeWidth={i===0&&nut?5:1.5} opacity="0.7"/>;})}
        {!nut&&<text x="3" y={T+20} fill="currentColor" fontSize="11" fontWeight="700" opacity="0.6">{start}fr</text>}
        {frets.map((fret,i)=>{
          const x=L+i*SG;
          if(fret===-1)return<text key={i} x={x} y="24" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="800">×</text>;
          if(fret===0)return<text key={i} x={x} y="24" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="800">○</text>;
          const rel=fret-start+1;const cy=T+(rel-0.5)*FG;
          return<g key={i}><circle cx={x} cy={cy} r="9" fill="url(#cg2)" stroke="white" strokeWidth="2"/><text x={x} y={cy} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="900">{fingers[i]}</text></g>;
        })}
      </svg>
      <p className="text-xs text-muted-foreground text-center font-mono mt-1">{frets.map(x=>x<0?'x':x).join(' · ')}</p>
    </div>
  );
}

function cleanTitle(title) {
  return (title || '')
    .replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '')
    .replace(/\s*\d+$/, '')
    .trim();
}

function stripMusicBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, '').trim();
}

// Extract iframe src from spotify_embed string
function extractSpotifySrc(embed) {
  if (!embed) return null;
  const match = embed.match(/src="([^"]+)"/);
  const url = match ? match[1] : embed;
  try { const u = new URL(url); return u.origin + u.pathname; } catch { return url.split('?')[0]; }
}

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(128,185,64,0.15)', color: '#80B940' },
  'Intermedia': { bg: 'rgba(216,166,42,0.15)', color: '#D8A62A' },
  'Avanzada': { bg: 'rgba(217,90,50,0.15)', color: '#D95A32' },
};

function SongCard({ song }) {
  const displayTitle = cleanTitle(song.title);
  const hasChords = song.has_chords;
  const hasTab = song.has_tablature;
  const spotifySrc = extractSpotifySrc(song.spotify_embed);
  const diff = DIFF_COLORS[song.difficulty];
  const [fetchedSpotifySrc, setFetchedSpotifySrc] = useState(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);

  // If no embed stored, fetch from Spotify API
  useEffect(() => {
    if (spotifySrc || fetchedSpotifySrc || spotifyLoading) return;
    setSpotifyLoading(true);
    base44.functions.invoke('spotifySearch', {
      artist: song.artist_name,
      title: displayTitle,
    })
      .then(res => {
        const trackId = res?.data?.track_id;
        if (trackId) {
          setFetchedSpotifySrc(`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`);
        }
      })
      .catch(() => {})
      .finally(() => setSpotifyLoading(false));
  }, [song.id]);

  const activeSrc = spotifySrc || fetchedSpotifySrc;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
      {/* Spotify embed — full height like trending cards */}
      {activeSrc ? (
        <iframe
          src={activeSrc}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ display: 'block' }}
        />
      ) : (
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #272C2F' }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)' }}>
            <Music className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold truncate" style={{ color: '#F4F4F2' }}>{displayTitle}</p>
            <p className="text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
          </div>
        </div>
      )}

      {/* Bottom row: title + diff badge + buttons */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: '#F4F4F2' }}>{displayTitle}</p>
          <p className="text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {diff && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline"
              style={{ backgroundColor: diff.bg, color: diff.color }}>
              {song.difficulty}
            </span>
          )}
          {hasChords && (
            <Link to={`/${song.artist_slug}/${song.slug}/acordes`}
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#FF7200' }}>
              Ver acordes
            </Link>
          )}
          {hasTab && !hasChords && (
            <Link to={`/${song.artist_slug}/${song.slug}/tablatura`}
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#FF7200' }}>
              Ver tablatura
            </Link>
          )}
          {!hasChords && !hasTab && (
            <Link to={`/${song.artist_slug}/${song.slug}`}
              className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#FF7200' }}>
              Ver canción
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatMessage({ message, onSuggestionClick }) {
  const isUser = message.role === 'user';

  // If it's a direct catalog match (no text content), don't show any text bubble
  const displayContent = !isUser && message.songs && message.songs.length > 0 && !message.content
    ? ''
    : (!isUser && message.songs && message.songs.length > 0
      ? stripMusicBlocks(message.content)
      : message.content);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {displayContent && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-gradient-brand text-white rounded-br-md'
                : 'bg-card text-card-foreground rounded-bl-md border border-border'
            }`}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayContent}</p>
            ) : (
              <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:text-card-foreground prose-strong:text-foreground prose-headings:text-foreground">
                <ReactMarkdown
                  components={{
                    pre: () => null,
                    code: ({ inline, children }) =>
                      inline ? (
                        <code className="bg-muted px-1 rounded text-xs font-mono">{children}</code>
                      ) : null,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Chord diagram */}
        {message.chordRequest && (
          <ChatChordDiagram name={message.chordRequest.name} frets={message.chordRequest.frets} />
        )}

        {/* Song cards — single column, full width, like trending section */}
        {message.songs && message.songs.length > 0 && (
          <div className="mt-1 w-full space-y-3" style={{ minWidth: '280px', maxWidth: '600px' }}>
            {message.chordRequest && (
              <p className="text-xs text-muted-foreground mb-1">Canciones que empiezan con este acorde:</p>
            )}
            {message.songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 w-full">
            <p className="text-xs text-muted-foreground mb-2">¿Quieres ver otra canción?</p>
            <div className="flex flex-wrap gap-2">
              {message.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestionClick && onSuggestionClick(s)}
                  className="px-3 py-1.5 bg-card border border-border rounded-full text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}