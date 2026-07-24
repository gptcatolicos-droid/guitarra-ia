import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);

  useSEO({
    title: 'Favoritos | Tablaturas AI',
    description: 'Tus canciones favoritas con acordes y tablaturas.',
    canonical: '/favoritos',
  });

  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem('favorites') || '[]'));
  }, []);

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] lg:h-screen p-8 bg-g-page">
        <Heart className="w-12 h-12 text-[#E5E7EB] mb-4" />
        <p className="text-[#6B7280]">No tienes canciones favoritas.</p>
        <Link to="/" className="mt-4 text-[#F97316] hover:underline">
          Buscar canciones
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 bg-g-page min-h-screen">
      <h1 className="text-2xl font-bold text-[#1F2937] mb-6">Favoritos</h1>
      <div className="space-y-2">
        {favorites.map((fav) => (
          <Link
            key={fav.id}
            to={`/${fav.artist_slug}/${fav.slug}`}
            className="block bg-white border border-[#E5E7EB] shadow-sm rounded-xl p-4 hover:border-[#FDBA74] transition-colors"
          >
            <span className="text-[#1F2937] font-medium">{fav.title}</span>
            <span className="text-[#6B7280] text-sm ml-2">{fav.artist_name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}