import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useSEO } from '@/lib/seo';
import ArtistAvatar from '@/components/ArtistAvatar';

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(76,154,42,0.12)', color: '#4C9A2A' },
  'Intermedia': { bg: 'rgba(183,121,31,0.12)', color: '#B7791F' },
  'Avanzada': { bg: 'rgba(194,65,12,0.12)', color: '#C2410C' },
};

function getSpotifyEmbedUrl(raw) {
  if (!raw) return null;
  const match = raw.match(/track\/([A-Za-z0-9]+)/);
  if (match) return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`;
  return null;
}

function cleanTitle(t) {
  return (t || '').replace(/\s*\d+$/, '').trim();
}

export default function TopSongsPage() {
  useSEO({ title: 'Canciones | Guitarra IA', canonical: 'https://www.guitarraia.com/canciones' });
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Song.list('-views', 200)
      .then(all => {
        // Show songs with spotify embed first, then rest
        const withEmbed = (all || []).filter(s => s.spotify_embed);
        const withoutEmbed = (all || []).filter(s => !s.spotify_embed);
        setSongs([...withEmbed, ...withoutEmbed]);
      })
      .finally(() => setLoading(false));
  }, []);

  const withEmbed = songs.filter(s => s.spotify_embed);
  const withoutEmbed = songs.filter(s => !s.spotify_embed);

  return (
    <div className="min-h-screen bg-g-page">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#1F2937' }}>
            Todas las <span style={{ color: '#F97316' }}>canciones</span>
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>El catálogo completo de acordes y tablaturas.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: '#F97316' }} />
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed #D1D5DB' }}>
            <p style={{ color: '#6B7280' }}>No hay canciones aún.</p>
          </div>
        ) : (
          <>
            {/* Grid with Spotify embed */}
            {withEmbed.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-semibold mb-4" style={{ color: '#1F2937' }}>Con reproductor Spotify</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {withEmbed.map(song => {
                    const diff = DIFF_COLORS[song.difficulty];
                    const embedUrl = getSpotifyEmbedUrl(song.spotify_embed);
                    return (
                      <div key={song.id} className="flex flex-col rounded-xl overflow-hidden bg-white shadow-sm"
                        style={{ border: '1px solid #E5E7EB' }}>
                        <iframe src={embedUrl} width="100%" height="152" frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy" style={{ display: 'block', borderRadius: '10px 10px 0 0' }} />
                        <div className="p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-2">
                            <ArtistAvatar song={song} className="w-8 h-8" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold line-clamp-1 mb-0.5" style={{ color: '#1F2937' }}>{cleanTitle(song.title)}</p>
                              <p className="text-xs" style={{ color: '#6B7280' }}>{song.artist_name}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {diff && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: diff.bg, color: diff.color }}>{song.difficulty}</span>}
                            <Link to={`/${song.artist_slug}/${song.slug}`}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-80"
                              style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)' }}>
                              Ver acordes
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List without embed */}
            {withoutEmbed.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#1F2937' }}>Más canciones</p>
                <div className="space-y-1.5">
                  {withoutEmbed.map((song, i) => {
                    const diff = DIFF_COLORS[song.difficulty];
                    return (
                      <div key={song.id} className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white shadow-sm"
                        style={{ border: '1px solid #E5E7EB' }}>
                        <span className="text-sm font-bold w-5 text-right shrink-0" style={{ color: '#D1D5DB' }}>{i + 1}</span>
                        <ArtistAvatar song={song} className="w-9 h-9" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#1F2937' }}>{cleanTitle(song.title)}</p>
                          <p className="text-xs" style={{ color: '#6B7280' }}>{song.artist_name}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {diff && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full hidden sm:inline" style={{ backgroundColor: diff.bg, color: diff.color }}>{song.difficulty}</span>}
                          <Link to={`/${song.artist_slug}/${song.slug}`}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-opacity hover:opacity-80"
                            style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)' }}>
                            Ver acordes
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
