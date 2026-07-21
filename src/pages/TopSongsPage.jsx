import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import { useSEO } from '@/lib/seo';

function cleanTitle(t) {
  return (t || '').replace(/\s*\d+$/, '').trim();
}

export default function TopSongsPage() {
  useSEO({ title: 'Canciones destacadas | Tablaturas AI', canonical: '/canciones' });
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try trending first, fallback to most-viewed
    base44.entities.Song.filter({ is_trending: true }, '-views', 10)
      .then(trending => {
        if (trending && trending.length > 0) {
          setSongs(trending.slice(0, 10));
          setLoading(false);
        } else {
          base44.entities.Song.list('-views', 10).then(songs => {
            setSongs(songs || []);
            setLoading(false);
          });
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
          Canciones <span className="text-gradient-brand">Destacadas</span>
        </h1>
        <p className="text-muted-foreground text-sm">Las 10 canciones más populares del catálogo.</p>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground">No hay canciones destacadas aún. Márcalas desde el Admin → Tendencias.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {songs.map((song, i) => (
            <Link
              key={song.id}
              to={`/${song.artist_slug}/${song.slug}`}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl px-4 py-3.5 hover:border-orange-400 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground font-semibold truncate group-hover:text-orange-500 transition-colors">
                  {cleanTitle(song.title)}
                </p>
                <p className="text-muted-foreground text-xs">{song.artist_name}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {song.has_chords && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded font-medium">Acordes</span>
                )}
                {song.has_tablature && (
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs rounded font-medium">Tab</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}