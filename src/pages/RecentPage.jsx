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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] lg:h-screen p-8 bg-g-page">
        <Clock className="w-12 h-12 text-[#E5E7EB] mb-4" />
        <p className="text-[#6B7280]">No has visto canciones recientemente.</p>
        <Link to="/" className="mt-4 text-[#F97316] hover:underline">
          Buscar canciones
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 bg-g-page min-h-screen">
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Recientes</h1>
      <div className="space-y-2">
        {recents.map((r) => (
          <Link
            key={r.id}
            to={`/${r.artist_slug}/${r.slug}`}
            className="block bg-white border border-[#E5E7EB] shadow-sm rounded-xl p-4 hover:border-[#FDBA74] transition-colors"
          >
            <span className="text-[#1F2937] font-medium">{r.title}</span>
            <span className="text-[#6B7280] text-sm ml-2">{r.artist_name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}