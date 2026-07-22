import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import { useSEO } from '@/lib/seo';

function cleanTitle(t) {
  return (t || '').replace(/\s*\d+$/, '').trim();
}

export default function TopSongsPage() {
  useSEO({ title: 'Canciones | Guitarra IA', canonical: 'https://www.guitarraia.com/canciones' });
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Song.list('-views', 100)
      .then(s => setSongs(s || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0D0E' }}>
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#F4F4F2' }}>
            Todas las <span style={{ color: '#FF7200' }}>canciones</span>
          </h1>
          <p className="text-sm" style={{ color: '#747B7F' }}>El catálogo completo de acordes y tablaturas.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#303538', borderTopColor: '#FF7200' }} />
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed #303538' }}>
            <p style={{ color: '#747B7F' }}>No hay canciones aún.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {songs.map((song, i) => (
              <Link key={song.id} to={`/${song.artist_slug}/${song.slug}`}
                className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
                style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#444A4E'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; }}
              >
                <span className="text-sm font-bold w-5 text-right shrink-0" style={{ color: '#303538' }}>{i + 1}</span>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#121516', border: '1px solid #272C2F' }}>
                  <Music className="w-4 h-4" style={{ color: '#444A4E' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#F4F4F2' }}>{cleanTitle(song.title)}</p>
                  <p className="text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {song.has_chords && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,114,0,0.12)', color: '#FF7200' }}>
                      Acordes
                    </span>
                  )}
                  {song.has_tablature && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(79,158,216,0.12)', color: '#4F9ED8' }}>
                      Tab
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}