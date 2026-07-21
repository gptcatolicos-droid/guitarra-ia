import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Users, Music } from 'lucide-react';
import { useSEO } from '@/lib/seo';

export default function TopArtistsPage() {
  useSEO({ title: 'Artistas destacados | Tablaturas AI', canonical: '/artistas' });
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get artists from songs marked is_trending, deduplicated by artist
    base44.entities.Song.filter({ is_trending: true }, '-views', 100)
      .then(songs => {
        const seen = new Set();
        const unique = [];
        for (const s of (songs || [])) {
          if (!seen.has(s.artist_slug)) {
            seen.add(s.artist_slug);
            unique.push({ name: s.artist_name, slug: s.artist_slug });
          }
          if (unique.length >= 10) break;
        }
        // If less than 10, fill from most-viewed songs
        if (unique.length < 10) {
          base44.entities.Song.list('-views', 200).then(allSongs => {
            for (const s of (allSongs || [])) {
              if (!seen.has(s.artist_slug)) {
                seen.add(s.artist_slug);
                unique.push({ name: s.artist_name, slug: s.artist_slug });
              }
              if (unique.length >= 10) break;
            }
            setArtists(unique);
            setLoading(false);
          });
        } else {
          setArtists(unique);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-border border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Artistas <span className="text-gradient-brand">Destacados</span>
        </h1>
        <p className="text-muted-foreground text-sm">Los artistas más populares del catálogo.</p>
      </div>

      {artists.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground">No hay artistas destacados aún. Márcalos desde el Admin → Tendencias.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {artists.map((artist, i) => (
            <Link
              key={artist.slug}
              to={`/${artist.slug}`}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-orange-400 transition-colors group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-brand shrink-0">
                <span className="text-white font-bold text-lg">{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground font-semibold truncate group-hover:text-orange-500 transition-colors">{artist.name}</p>
                <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3" /> Ver canciones
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}