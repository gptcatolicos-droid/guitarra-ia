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

// Tab icon SVG
const TabIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M3 12h18M3 18h18" />
    <rect x="1" y="3" width="22" height="18" rx="2" fill="none" />
    <text x="12" y="15" textAnchor="middle" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">TAB</text>
  </svg>
);

// Chord icon SVG
const ChordIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="6" y1="3" x2="6" y2="21" />
    <line x1="10" y1="3" x2="10" y2="21" />
    <line x1="14" y1="3" x2="14" y2="21" />
    <line x1="18" y1="3" x2="18" y2="21" />
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
    <circle cx="6" cy="7" r="1.5" fill="currentColor" />
    <circle cx="14" cy="12" r="1.5" fill="currentColor" />
    <circle cx="10" cy="17" r="1.5" fill="currentColor" />
    <circle cx="18" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

// Extract iframe src from spotify_embed string
function extractSpotifySrc(embed) {
  if (!embed) return null;
  const match = embed.match(/src="([^"]+)"/);
  const url = match ? match[1] : embed;
  try { const u = new URL(url); return u.origin + u.pathname; } catch { return url.split('?')[0]; }
}

function SongCard({ song }) {
  const displayTitle = cleanTitle(song.title);
  const hasChords = song.has_chords;
  const hasTab = song.has_tablature;
  const spotifySrc = extractSpotifySrc(song.spotify_embed);

  const [artistImg, setArtistImg] = useState(null);

  useEffect(() => {
    if (!song?.artist_name || spotifySrc) return; // skip API if we have embed
    base44.functions.invoke('spotifySearch', { artist: song.artist_name, title: song.title?.replace(/\s*\d+$/, '').trim() || '' })
      .then((res) => {
        if (res?.data?.artist_image) setArtistImg(res.data.artist_image);
        else if (res?.data?.album_image) setArtistImg(res.data.album_image);
      })
      .catch(() => {});
  }, [song?.id]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mt-3">
      {/* Header with artist photo */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
          {artistImg ? (
            <img src={artistImg} alt={song.artist_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-brand flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground font-bold text-sm truncate">{displayTitle}</p>
          <p className="text-muted-foreground text-xs truncate">{song.artist_name}</p>
        </div>
      </div>

      {/* Spotify player embed — only when available */}
      {spotifySrc && (
        <iframe
          src={spotifySrc}
          width="100%"
          height={80}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="border-0 border-b border-border"
          title="Spotify"
        />
      )}

      {/* Metadata */}
      {(song.original_key || song.capo > 0 || song.difficulty) && (
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground border-b border-border">
          {song.original_key && <span>🎵 Tonalidad: <strong className="text-foreground">{song.original_key}</strong></span>}
          {song.capo > 0 && <span>🎸 Capo: <strong className="text-foreground">{song.capo}</strong></span>}
          {song.difficulty && <span>⭐ <strong className="text-foreground">{song.difficulty}</strong></span>}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 p-3">
        {hasChords && (
          <Link
            to={`/${song.artist_slug}/${song.slug}/acordes`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-brand hover:opacity-90 transition-opacity"
          >
            <ChordIcon />
            Ver Acordes
          </Link>
        )}
        {hasTab && (
          <Link
            to={`/${song.artist_slug}/${song.slug}/tablatura`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-brand hover:opacity-90 transition-opacity"
          >
            <TabIcon />
            Ver Tablatura
          </Link>
        )}
        {!hasChords && !hasTab && (
          <Link
            to={`/${song.artist_slug}/${song.slug}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-brand hover:opacity-90 transition-opacity"
          >
            Ver Canción
          </Link>
        )}
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

        {/* Song cards */}
        {message.songs && message.songs.length > 0 && (
          <div className="mt-1 w-full">
            {message.chordRequest && message.songs.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3 mb-1">Canciones que empiezan con este acorde:</p>
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