import ReactMarkdown from 'react-markdown';
import SongResultCard from './SongResultCard';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-card text-card-foreground rounded-bl-md border border-border'
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-pre:bg-muted prose-pre:text-foreground prose-code:text-foreground prose-headings:text-foreground prose-p:text-card-foreground prose-strong:text-foreground">
              <ReactMarkdown
                components={{
                  pre: ({ children }) => (
                    <pre className="bg-muted rounded-lg p-3 overflow-x-auto font-mono text-xs my-2 whitespace-pre">
                      {children}
                    </pre>
                  ),
                  code: ({ inline, children }) =>
                    inline ? (
                      <code className="bg-muted px-1 rounded text-xs font-mono">{children}</code>
                    ) : (
                      <code>{children}</code>
                    ),
                  p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {message.songs && message.songs.length > 0 && (
          <div className="mt-3 w-full space-y-2">
            {message.songs.map((song) => (
              <SongResultCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}