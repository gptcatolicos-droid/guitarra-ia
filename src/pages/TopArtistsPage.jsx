import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Sparkles, ChevronRight } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function TopArtistsPage() {
  useSEO({ title: 'Artistas | Guitarra IA', canonical: 'https://www.guitarraia.com/artistas' });
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only show artists marked as featured (top 10), sorted by sort_order or created_date
    base44.entities.Artist.filter({ is_demo: false }, '-created_date', 10)
      .then(a => { setArtists(a || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0D0E' }}>
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F4F4F2' }}>
            Artistas en <span style={{ color: '#FF7200' }}>catálogo</span>
          </h1>
          <p className="text-sm" style={{ color: '#747B7F' }}>
            Explora los artistas disponibles. ¿No encuentras el tuyo? Pregúntale a la IA.
          </p>
        </div>

        {/* IA CTA Banner */}
        <div
          className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,114,0,0.12) 0%, rgba(255,114,0,0.04) 100%)',
            border: '1px solid rgba(255,114,0,0.25)',
          }}
        >
          <Sparkles className="w-8 h-8 shrink-0" style={{ color: '#FF7200' }} />
          <div className="flex-1">
            <p className="text-sm font-bold mb-0.5" style={{ color: '#F4F4F2' }}>¿Buscas un artista específico?</p>
            <p className="text-xs" style={{ color: '#A7ACAE' }}>
              Pídele a GuitarraIA los acordes de cualquier canción de tu artista favorito.
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-opacity hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: '#FF7200', color: '#fff' }}
          >
            Pregunta a GuitarraIA
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#303538', borderTopColor: '#FF7200' }} />
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed #303538' }}>
            <p style={{ color: '#747B7F' }}>No hay artistas aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {artists.map((artist) => (
              <Link key={artist.slug || artist.id} to={`/${artist.slug}`}
                className="flex items-center gap-3 p-4 rounded-xl transition-all"
                style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,114,0,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; }}
              >
                {artist.image_url ? (
                  <img src={artist.image_url} alt={artist.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                    style={{ border: '1px solid #303538' }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: 'rgba(255,114,0,0.12)', border: '1px solid rgba(255,114,0,0.2)' }}>
                    <span className="text-sm font-bold" style={{ color: '#FF7200' }}>
                      {(artist.name || artist.slug || '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: '#F4F4F2' }}>{artist.name || artist.slug}</p>
                  <p className="text-xs" style={{ color: '#747B7F' }}>Ver canciones</p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#444A4E' }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}