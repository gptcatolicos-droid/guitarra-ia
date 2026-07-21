import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

function cleanTitle(title) {
  return (title || '')
    .replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '')
    .replace(/\s*\d+$/, '')
    .trim();
}

// Strip chord/tablature code blocks from the response text
function stripMusicBlocks(content) {
  // Remove triple-backtick code blocks that contain chords/tabs
  return content.replace(/```[\s\S]*?```/g, '').trim();
}

function SongCard({ song }) {
  const displayTitle = cleanTitle(song.title);
  const hasChords = song.has_chords;
  const hasTab = song.has_tablature;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mt-3">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center shrink-0">
          <Music className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground font-bold text-sm truncate">{displayTitle}</p>
          <p className="text-muted-foreground text-xs truncate">{song.artist_name}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-muted-foreground border-b border-border">
        {song.original_key && <span>🎵 Tonalidad: <strong className="text-foreground">{song.original_key}</strong></span>}
        {song.capo > 0 && <span>🎸 Capo: <strong className="text-foreground">{song.capo}</strong></span>}
        {song.difficulty && <span>⭐ <strong className="text-foreground">{song.difficulty}</strong></span>}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 p-3">
        {hasChords && (
          <Link
            to={`/${song.artist_slug}/${song.slug}/acordes`}
            className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
          >
            Ver Acordes
          </Link>
        )}
        {hasTab && (
          <Link
            to={`/${song.artist_slug}/${song.slug}/tablatura`}
            className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white transition-colors"
          >
            Ver Tablatura
          </Link>
        )}
        {!hasChords && !hasTab && (
          <Link
            to={`/${song.artist_slug}/${song.slug}`}
            className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold bg-secondary text-foreground hover:bg-border transition-colors"
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

  // For assistant messages, strip music code blocks (shown as cards instead)
  const displayContent = !isUser && message.songs && message.songs.length > 0
    ? stripMusicBlocks(message.content)
    : message.content;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Only show bubble if there's text content */}
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
                    pre: () => null, // suppress code blocks — shown as cards
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