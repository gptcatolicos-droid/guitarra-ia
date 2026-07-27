import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { ChevronLeft, Guitar, Headphones, Music2 } from 'lucide-react';
import ArtistAvatar from '@/components/ArtistAvatar';
import SpotifyEmbed from '@/components/SpotifyEmbed';

function cleanTitle(title = '') {
  return title.replace(/\s*\d+$/, '').trim();
}

function spotifySource(song) {
  if (song.spotify_embed || song.spotify_embed_url) return song.spotify_embed || song.spotify_embed_url;
  if (song.spotify_match_status === 'matched' && song.spotify_track_id) {
    return `https://open.spotify.com/embed/track/${song.spotify_track_id}`;
  }
  return null;
}

function UnpluggedTrack({ song, index }) {
  const source = spotifySource(song);

  return (
    <article className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <span className="text-sm font-bold w-6 text-right" style={{ color: '#CBD5E1' }}>{String(index + 1).padStart(2, '0')}</span>
        <ArtistAvatar song={song} className="w-11 h-11" imageClassName="border border-orange-100" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold truncate" style={{ color: '#1F2937' }}>{cleanTitle(song.title)}</h2>
          <p className="text-sm truncate" style={{ color: '#6B7280' }}>{song.artist_name}</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ color: '#C2410C', backgroundColor: '#FFF1E0' }}>
          <Guitar className="w-3.5 h-3.5" /> Unplugged
        </span>
      </div>

      {source ? (
        <div className="spotify-embed-wrapper">
          <SpotifyEmbed source={source} height={152} title={`Spotify: ${cleanTitle(song.title)}`} />
        </div>
      ) : (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl px-3 py-3 text-sm" style={{ color: '#6B7280', backgroundColor: '#F8FAFC' }}>
          <Music2 className="w-4 h-4" /> El reproductor de Spotify está pendiente para esta canción.
        </div>
      )}

      <div className="flex justify-end p-3">
        <Link to={`/${song.artist_slug}/${song.slug}`} className="min-h-11 inline-flex items-center justify-center rounded-lg px-4 text-xs font-bold text-white transition-opacity hover:opacity-85" style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)' }}>
          Ver acordes
        </Link>
      </div>
    </article>
  );
}

export default function UnpluggedPage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Unplugged — Canciones acústicas para guitarra | GuitarraIA',
    description: 'Una selección Unplugged de canciones para tocar en guitarra, con reproductor oficial de Spotify, acordes y tablaturas.',
    canonical: 'https://www.guitarraia.com/unplugged',
  });

  useEffect(() => {
    base44.entities.Song.filter({ is_unplugged: true }, '-views', 100)
      .then((items) => setSongs((items || []).filter((song) => Boolean(spotifySource(song)))))
      .catch(() => setSongs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen px-4 py-8 lg:px-8 lg:py-12" style={{ backgroundColor: '#F8F9FB' }}>
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-sm mb-7" style={{ color: '#6B7280' }}>
          <ChevronLeft className="w-4 h-4" /> Volver al inicio
        </Link>

        <section className="relative overflow-hidden rounded-3xl px-6 py-9 sm:px-9 sm:py-12 mb-8" style={{ background: 'linear-gradient(135deg, #FFF7F1 0%, #FFFFFF 58%, #FFF1E0 100%)', border: '1px solid #FED7AA', boxShadow: '0 18px 40px rgba(249,115,22,0.10)' }}>
          <div className="absolute -right-14 -top-16 w-56 h-56 rounded-full" style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.20) 0%, rgba(251,146,60,0) 70%)' }} />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold mb-4" style={{ color: '#C2410C', backgroundColor: '#FFFFFF', border: '1px solid #FED7AA' }}>
              <Headphones className="w-3.5 h-3.5" /> PLAYLIST GUITARRAIA
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" style={{ color: '#1F2937' }}>
              Un<span style={{ color: '#F97316' }}>plugged</span>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed max-w-xl" style={{ color: '#4B5563' }}>
              Canciones elegidas para volver a la esencia: guitarra, voz, acordes y arreglos que se disfrutan tocando cerca.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#F97316' }}>La selección</p>
              <h2 className="text-2xl font-bold mt-1" style={{ color: '#1F2937' }}>Toca sin adornos</h2>
            </div>
            {!loading && <span className="text-sm font-medium" style={{ color: '#6B7280' }}>{songs.length} {songs.length === 1 ? 'canción' : 'canciones'}</span>}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#FED7AA', borderTopColor: '#F97316' }} /></div>
          ) : songs.length ? (
            <div className="space-y-4">{songs.map((song, index) => <UnpluggedTrack key={song.id} song={song} index={index} />)}</div>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px dashed #CBD5E1' }}>
              <Guitar className="w-7 h-7 mx-auto mb-3" style={{ color: '#F97316' }} />
              <p className="font-semibold" style={{ color: '#1F2937' }}>La lista Unplugged está afinándose.</p>
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Pronto añadiremos canciones seleccionadas para tocar en guitarra.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
