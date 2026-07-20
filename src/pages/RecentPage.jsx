import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function RecentPage() {
  const [recents, setRecents] = useState([]);

  useSEO({
    title: 'Recientes | Tablaturas AI',
    description: 'Canciones vistas recientemente.',
    canonical: '/recientes',
  });

  useEffect(() => {
    setRecents(JSON.parse(localStorage.getItem('recents') || '[]'));
  }, []);

  if (recents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] lg:h-screen p-8">
        <Clock className="w-12 h-12 text-[#2b3138] mb-4" />
        <p className="text-[#a7afb8]">No has visto canciones recientemente.</p>
        <Link to="/" className="mt-4 text-[#ff7a00] hover:underline">
          Buscar canciones
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Recientes</h1>
      <div className="space-y-2">
        {recents.map((r) => (
          <Link
            key={r.id}
            to={`/${r.artist_slug}/${r.slug}`}
            className="block bg-[#20242a] border border-[#2b3138] rounded-xl p-4 hover:border-[#ff7a00] transition-colors"
          >
            <span className="text-white font-medium">{r.title}</span>
            <span className="text-[#a7afb8] text-sm ml-2">{r.artist_name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}