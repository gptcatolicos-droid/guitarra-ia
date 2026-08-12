import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { PlayCircle, Sparkles, Youtube, Music2 } from 'lucide-react';
import ArtistAvatar from '@/components/ArtistAvatar';

const PRACTICE_FIELDS = [
  'id', 'title', 'slug', 'artist_name', 'artist_slug', 'artist_image',
  'original_key', 'difficulty', 'youtube_video_id', 'youtube_analysis_updated_at',
];

function cleanTitle(value = '') {
  return String(value).replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '').replace(/\s*\d+$/, '').trim();
}

function PracticeCard({ song }) {
  return (
    <article className="group overflow-hidden rounded-3xl border bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl" style={{ borderColor: '#FED7AA' }}>
      <div className="relative aspect-[16/9] overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' }}>
        {song.youtube_video_id ? (
          <img
            src={`https://i.ytimg.com/vi/${song.youtube_video_id}/hqdefault.jpg`}
            alt={`Práctica de ${cleanTitle(song.title)}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center"><Music2 className="h-12 w-12" style={{ color: '#FDBA74' }} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
          <Youtube className="h-4 w-4" /> Acordes sincronizados
        </span>
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
          <ArtistAvatar song={song} className="h-11 w-11 shrink-0" imageClassName="border-2 border-white" />
          <div className="min-w-0 text-white">
            <h2 className="truncate text-lg font-black">{cleanTitle(song.title)}</h2>
            <p className="truncate text-sm text-white/80">{song.artist_name}</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold">
          {song.original_key && <span className="rounded-full px-2.5 py-1" style={{ background: '#FFF7ED', color: '#C2410C' }}>Tono {song.original_key}</span>}
          {song.difficulty && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">{song.difficulty}</span>}
        </div>
        <Link
          to={`/${song.artist_slug}/${song.slug}/practicar`}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #FB923C, #F97316)', boxShadow: '0 8px 20px rgba(249,115,22,.22)' }}
        >
          <PlayCircle className="h-5 w-5" /> Practicar ahora
        </Link>
      </div>
    </article>
  );
}

export default function PracticePage() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Practicar con IA y YouTube | Guitarra IA',
    description: 'Practica canciones seleccionadas con video de YouTube, acordes y diagramas sincronizados en tiempo real.',
    canonical: 'https://guitarraia.com/practicar',
  });

  useEffect(() => {
    let cancelled = false;
    let idleId;
    const query = { youtube_practice_enabled: true, youtube_analysis_status: 'ready' };

    // Paint the newest practice first. The remaining cards arrive during the
    // next idle window, already sorted from newest to oldest.
    base44.entities.Song.filter(query, '-youtube_analysis_updated_at', 1, 0, PRACTICE_FIELDS)
      .then((rows) => {
        if (cancelled) return;
        setSongs(rows || []);
        setLoading(false);
        const loadRest = () => base44.entities.Song.filter(
          query, '-youtube_analysis_updated_at', 29, 1, PRACTICE_FIELDS,
        ).then((rest) => {
          if (!cancelled) setSongs((current) => [...current, ...(rest || [])]);
        }).catch(() => {});
        idleId = 'requestIdleCallback' in window
          ? window.requestIdleCallback(loadRest, { timeout: 1200 })
          : window.setTimeout(loadRest, 400);
      })
      .catch(() => {
        if (!cancelled) { setSongs([]); setLoading(false); }
      });

    return () => {
      cancelled = true;
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);

  return (
    <main className="min-h-screen px-4 py-8 lg:px-8 lg:py-12" style={{ background: 'linear-gradient(180deg, #FFF7ED 0%, #F8F9FB 36%)' }}>
      <div className="mx-auto max-w-6xl">
        <header className="relative overflow-hidden rounded-[2rem] border px-6 py-10 text-center sm:px-10 lg:py-14" style={{ borderColor: '#FED7AA', background: 'radial-gradient(circle at 15% 15%, #FFEDD5 0, transparent 33%), radial-gradient(circle at 88% 20%, #FDBA74 0, transparent 25%), #FFFFFF' }}>
          <div className="relative z-10 mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em]" style={{ background: '#FFF1E0', color: '#C2410C' }}><Sparkles className="h-4 w-4" /> Práctica inteligente</span>
            <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl" style={{ color: '#1F2937' }}>Toca con el video. Mira el acorde. <span style={{ color: '#F97316' }}>No pierdas el ritmo.</span></h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: '#6B7280' }}>Canciones seleccionadas con acordes y figuras sincronizadas segundo a segundo con YouTube.</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" /></div>
        ) : songs.length > 0 ? (
          <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => <PracticeCard key={song.id} song={song} />)}
          </section>
        ) : (
          <section className="mt-10 rounded-3xl border bg-white px-6 py-16 text-center" style={{ borderColor: '#FED7AA' }}>
            <Music2 className="mx-auto h-12 w-12" style={{ color: '#FDBA74' }} />
            <h2 className="mt-4 text-xl font-bold" style={{ color: '#1F2937' }}>Estamos preparando las primeras prácticas</h2>
            <p className="mt-2 text-sm" style={{ color: '#6B7280' }}>Aquí aparecerán únicamente las canciones revisadas y publicadas por Guitarra IA.</p>
          </section>
        )}
      </div>
    </main>
  );
}
