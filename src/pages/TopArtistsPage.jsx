import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function TopArtistsPage() {
  useSEO({ title: 'Artistas | Guitarra IA', canonical: 'https://www.guitarraia.com/artistas' });
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Artist.list('-created_date', 100)
      .then(a => {
        if (a?.length) { setArtists(a); setLoading(false); return; }
        base44.entities.Song.list('-views', 500).then(songs => {
          const seen = new Set();
          const unique = [];
          for (const s of (songs || [])) {
            if (!seen.has(s.artist_slug)) {
              seen.add(s.artist_slug);
              unique.push({ name: s.artist_name, slug: s.artist_slug });
            }
          }
          setArtists(unique);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0D0E' }}>
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F4F4F2' }}>
            Todos los <span style={{ color: '#FF7200' }}>artistas</span>
          </h1>
          <p className="text-sm" style={{ color: '#747B7F' }}>Explora el catálogo de artistas.</p>
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
            {artists.map((artist, i) => (
              <Link key={artist.slug || artist.id} to={`/${artist.slug}`}
                className="flex items-center gap-3 p-4 rounded-xl transition-all"
                style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF7200'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'rgba(255,114,0,0.12)', border: '1px solid rgba(255,114,0,0.2)' }}>
                  <span className="text-sm font-bold" style={{ color: '#FF7200' }}>
                    {(artist.name || artist.slug || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: '#F4F4F2' }}>{artist.name || artist.slug}</p>
                  <p className="text-xs flex items-center gap-1" style={{ color: '#747B7F' }}>
                    <Users className="w-3 h-3" /> Ver canciones
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}