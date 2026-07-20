import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';

const POPULAR_ARTISTS = [
  { name: 'Juanes', slug: 'juanes', img: 'https://images.unsplash.com/photo-1549834125-82d3c90b9b8c?w=120&h=120&fit=crop&crop=face' },
  { name: 'Carlos Vives', slug: 'carlos-vives', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&h=120&fit=crop&crop=face' },
  { name: 'Shakira', slug: 'shakira', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=120&h=120&fit=crop&crop=face' },
  { name: 'Maluma', slug: 'maluma', img: 'https://images.unsplash.com/photo-1529068755536-a5ade0dcb4e8?w=120&h=120&fit=crop&crop=face' },
  { name: 'Oasis', slug: 'oasis', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop' },
  { name: 'Metallica', slug: 'metallica', img: 'https://images.unsplash.com/photo-1520872024865-3ff2805d8bb3?w=120&h=120&fit=crop' },
];

export default function ArtistsSection({ artists }) {
  const display = (artists && artists.length > 0)
    ? artists.slice(0, 6).map((a, i) => ({
        name: a.name,
        slug: a.slug,
        img: a.image_url || POPULAR_ARTISTS[i % POPULAR_ARTISTS.length]?.img || `https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=120&h=120&fit=crop`,
      }))
    : POPULAR_ARTISTS;

  return (
    <div className="px-6 lg:px-8 pb-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" />
          <h2 className="text-foreground font-bold text-lg">Artistas populares</h2>
        </div>
        <Link to="/buscar?tab=artistas" className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
          Ver todo <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {display.map((artist) => (
          <Link
            key={artist.slug}
            to={`/${artist.slug}`}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-orange-400 transition-colors shadow-sm">
              <img
                src={artist.img}
                alt={artist.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-foreground text-xs font-medium text-center leading-tight group-hover:text-orange-500 transition-colors">
              {artist.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}