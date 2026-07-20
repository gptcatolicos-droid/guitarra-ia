import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Music, Guitar } from 'lucide-react';

function cleanTitle(title) {
  return (title || '')
    .replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '')
    .replace(/\s*\d+$/, '')
    .trim();
}

function SongCard({ song }) {
  const displayTitle = cleanTitle(song.title);
  return (
    <Link
      to={`/${song.artist_slug}/${song.slug}`}
      className="block bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-colors mt-3"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-foreground font-bold text-sm truncate">{displayTitle}</p>
          <p className="text-muted-foreground text-xs truncate">{song.artist_name}</p>
        </div>
        <div className="ml-auto flex gap-1 shrink-0">
          {song.has_chords && <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">Acordes</span>}
          {song.has_tablature && <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs rounded font-medium">Tab</span>}
        </div>
      </div>
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground">
        {song.original_key && <span>🎵 Tonalidad: <strong className="text-foreground">{song.original_key}</strong></span>}
        {song.capo > 0 && <span>🎸 Capo: <strong className="text-foreground">{song.capo}</strong></span>}
        {song.difficulty && <span>⭐ <strong className="text-foreground">{song.difficulty}</strong></span>}
      </div>
    </Link>
  );
}

export default function ChatMessage({ message, onSuggestionClick }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-gradient-brand text-white rounded-br-md'
              : 'bg-card text-card-foreground rounded-bl-md border border-border'
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:text-card-foreground prose-strong:text-foreground prose-headings:text-foreground">
              <ReactMarkdown
                components={{
                  pre: ({ children }) => (
                    <pre className="bg-muted rounded-xl p-4 overflow-x-auto font-mono text-xs my-3 whitespace-pre border border-border">
                      {children}
                    </pre>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-muted px-1 rounded text-xs font-mono">{children}</code>
                    ) : (
                      <code className="font-mono text-xs">{children}</code>
                    ),
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

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