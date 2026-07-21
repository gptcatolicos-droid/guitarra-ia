import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Music, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

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

function SongCard({ song }) {
  const displayTitle = cleanTitle(song.title);
  const hasChords = song.has_chords;
  const hasTab = song.has_tablature;
  const [artistImg, setArtistImg] = useState(null);

  useEffect(() => {
    if (!song?.artist_name) return;
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

      {/* Metadata */}
      {(song.original_key || song.capo > 0 || song.difficulty) && (
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground border-b border-border">
          {song.original_key && <span>🎵 Tonalidad: <strong className="text-foreground">{song.original_key}</strong></span>}
          {song.capo > 0 && <span>🎸 Capo: <strong className="text-foreground">{song.capo}</strong></span>}
          {song.difficulty && <span>⭐ <strong className="text-foreground">{song.difficulty}</strong></span>}
        </div>
      )}

      {/* Action buttons — same gradient as home CTA */}
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

  const displayContent = !isUser && message.songs && message.songs.length > 0
    ? stripMusicBlocks(message.content)
    : message.content;

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

        {/* Song cards */}
        {message.songs && message.songs.length > 0 && (
          <div className="mt-1 w-full">
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