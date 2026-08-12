import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function HeroSearchChat() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (text) => {
    const q = (text || query).trim();
    if (!q) return;
    navigate(`/chat?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="w-full min-w-0">
      <div className="hero-search flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl p-2 mb-4"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Busca una canción, artista o acorde"
          className="w-full min-w-0 flex-1 py-3 px-3 text-sm outline-none"
          style={{ backgroundColor: 'transparent', color: '#1F2937', WebkitTextFillColor: '#1F2937', caretColor: '#F97316', opacity: 1 }}
        />
        <button
          onClick={() => handleSearch()}
          disabled={!query.trim()}
          className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-11 px-5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
          style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)', color: '#fff', boxShadow: '0 6px 18px rgba(15,23,42,0.08)' }}
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
      </div>

    </div>
  );
}
