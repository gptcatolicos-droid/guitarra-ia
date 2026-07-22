import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';

export default function HeroSearchChat({ quickChips }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (text) => {
    const q = (text || query).trim();
    if (!q) return;
    navigate(`/chat?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 rounded-xl p-2 mb-4"
        style={{ backgroundColor: '#171A1C', border: '1px solid #303538' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Busca canciones, artistas, acordes o géneros…"
          className="flex-1 py-2 px-3 text-sm outline-none"
          style={{ backgroundColor: 'transparent', color: '#F4F4F2', caretColor: '#FF7200' }}
        />
        <button
          onClick={() => handleSearch()}
          disabled={!query.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF7200 0%, #FF8D2A 100%)', color: '#fff' }}
        >
          <Send className="w-4 h-4" />
          Pregunta a GuitarraIA
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
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
    </div>
  );
}