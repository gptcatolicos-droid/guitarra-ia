import ReactMarkdown from 'react-markdown';
import { Music } from 'lucide-react';
import SongCard from './SongCard';

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

function stripMusicBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, '').trim();
}

export default function ChatMessage({ message, onSuggestionClick }) {
  const isUser = message.role === 'user';

  const displayContent = !isUser && message.songs && message.songs.length > 0 && !message.content
    ? ''
    : (!isUser && message.songs && message.songs.length > 0
      ? stripMusicBlocks(message.content)
      : message.content);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`${isUser ? 'max-w-[80%] items-end' : 'w-full items-start'} flex flex-col gap-2`}>
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

        {/* Song cards — full width, one per row */}
        {message.songs && message.songs.length > 0 && (
          <div className="w-full space-y-3">
            {message.chordRequest && (
              <p className="text-xs text-muted-foreground">Canciones con este acorde:</p>
            )}
            {message.songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="w-full">
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