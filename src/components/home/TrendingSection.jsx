import { Link } from 'react-router-dom';
import { TrendingUp, ChevronRight } from 'lucide-react';

const TRENDING = [
  { title: 'La Camisa Negra', artist: 'Juanes', artistSlug: 'juanes', slug: 'la-camisa-negra',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop' },
  { title: 'Hawái', artist: 'Maluma', artistSlug: 'maluma', slug: 'hawai',
    cover: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=80&h=80&fit=crop' },
  { title: 'Ojitos Color Sol', artist: 'Caloncho', artistSlug: 'caloncho', slug: 'ojitos-color-sol',
    cover: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=80&h=80&fit=crop' },
  { title: 'Wonderwall', artist: 'Oasis', artistSlug: 'oasis', slug: 'wonderwall',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&h=80&fit=crop' },
  { title: 'No Me Doy Por Vencido', artist: 'Luis Fonsi', artistSlug: 'luis-fonsi', slug: 'no-me-doy-por-vencido',
    cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=80&h=80&fit=crop' },
];

export default function TrendingSection({ songs }) {
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
    <div className="px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#D4AF37', boxShadow: '0 0 0 4px rgba(212,175,55,0.12)' }} />
          <TrendingUp className="w-4 h-4" style={{ color: '#D4AF37' }} />
          <h2 className="text-foreground font-bold text-lg tracking-tight">En tendencia</h2>
        </div>
        <Link to="/canciones" className="text-sm font-bold flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: '#B89245' }}>
          Ver todo <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {display.map((song, i) => (
          <Link
            key={`${song.artistSlug}-${song.slug}`}
            to={`/${song.artistSlug}/${song.slug}`}
            className="flex items-center gap-3 bg-card border border-border rounded-[13px] p-3 transition-all hover:-translate-y-0.5 group"
            style={{ boxShadow: '0 2px 8px rgba(23,25,29,0.04)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.40)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(23,25,29,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(23,25,29,0.04)'; }}
          >
            <div className="relative shrink-0">
              <img src={song.cover} alt={song.title} className="w-11 h-11 rounded-lg object-cover" />
              <div
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #B89245, #F59A23)' }}
              >
                <span className="text-white text-[9px] font-black">{i + 1}</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-foreground font-semibold text-sm truncate transition-colors group-hover:text-gold-dark" style={{ '--tw-text-opacity': 1 }}>{song.title}</p>
              <p className="text-muted-foreground text-xs truncate">{song.artist}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}