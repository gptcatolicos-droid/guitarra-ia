import { Link } from 'react-router-dom';
import { TrendingUp, ChevronRight } from 'lucide-react';

// Curated popular songs with covers from Unsplash
const TRENDING = [
  {
    title: 'La Camisa Negra',
    artist: 'Juanes',
    artistSlug: 'juanes',
    slug: 'la-camisa-negra',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop',
  },
  {
    title: 'Hawái',
    artist: 'Maluma',
    artistSlug: 'maluma',
    slug: 'hawai',
    cover: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=80&h=80&fit=crop',
  },
  {
    title: 'Ojitos Color Sol',
    artist: 'Caloncho',
    artistSlug: 'caloncho',
    slug: 'ojitos-color-sol',
    cover: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=80&h=80&fit=crop',
  },
  {
    title: 'Wonderwall',
    artist: 'Oasis',
    artistSlug: 'oasis',
    slug: 'wonderwall',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&h=80&fit=crop',
  },
  {
    title: 'No Me Doy Por Vencido',
    artist: 'Luis Fonsi',
    artistSlug: 'luis-fonsi',
    slug: 'no-me-doy-por-vencido',
    cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=80&h=80&fit=crop',
  },
];

export default function TrendingSection({ songs }) {
  // Use DB songs if available, otherwise show curated list
  const display = (songs && songs.length > 0)
    ? songs.slice(0, 5).map(s => ({
        title: s.title.replace(/\s*\d+$/, '').trim(),
        artist: s.artist_name,
        artistSlug: s.artist_slug,
        slug: s.slug,
        cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop',
      }))
    : TRENDING;

  return (
    <div className="px-6 lg:px-8 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h2 className="text-foreground font-bold text-lg">En tendencia</h2>
        </div>
        <Link to="/buscar" className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
          Ver todo <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {display.map((song, i) => (
          <Link
            key={`${song.artistSlug}-${song.slug}`}
            to={`/${song.artistSlug}/${song.slug}`}
            className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-orange-300 dark:hover:border-orange-500/40 hover:shadow-sm transition-all group"
          >
            <div className="relative shrink-0">
              <img
                src={song.cover}
                alt={song.title}
                className="w-11 h-11 rounded-lg object-cover"
              />
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center">
                <span className="text-white text-[9px] font-bold">{i + 1}</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-foreground font-semibold text-sm truncate group-hover:text-orange-500 transition-colors">{song.title}</p>
              <p className="text-muted-foreground text-xs truncate">{song.artist}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}