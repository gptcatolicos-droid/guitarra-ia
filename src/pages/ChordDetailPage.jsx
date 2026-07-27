import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Music2, CheckCircle2, Headphones, CirclePlay } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import ChordDiagram from '@/components/ChordDiagram';
import ChordSoundToggle from '@/components/audio/ChordSoundToggle';
import { getChordDiagram } from '@/lib/musicTheory';
import { extractChordNames, findSongsStartingWithChord, normalizeChordName } from '@/lib/chordSearch';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import ArtistAvatar from '@/components/ArtistAvatar';

function hasConfirmedSpotifyPlayer(song) {
  return Boolean(song.spotify_embed || song.spotify_embed_url || (song.spotify_match_status === 'matched' && song.spotify_track_id));
}

function ChordStudySongCard({ song }) {
  const title = song.title.replace(/\s*\d+$/, '').trim();
  return (
    <article className="overflow-hidden rounded-2xl bg-white" style={{ border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}>
      <div className="flex items-center gap-3 p-3">
        <ArtistAvatar song={song} className="w-11 h-11" imageClassName="border border-orange-100" />
        <div className="min-w-0 flex-1"><p className="text-sm font-bold truncate" style={{ color: '#1F2937' }}>{title}</p><p className="text-xs" style={{ color: '#6B7280' }}>{song.artist_name}</p></div>
        <Link to={`/${song.artist_slug}/${song.slug}`} className="shrink-0 text-xs font-bold px-3 py-2 rounded-lg" style={{ color: '#F97316', border: '1px solid #FDBA74' }}>Ver acordes</Link>
      </div>
      <SpotifyPlayer song={song} compact />
    </article>
  );
}

export default function ChordDetailPage() {
  const { chord: chordParam } = useParams();
  const chord = normalizeChordName(decodeURIComponent(chordParam || ''));
  const [songs, setSongs] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    if (!chord) return;
    Promise.all([
      base44.entities.Song.list('-views', 5000),
      base44.entities.BlogPost.filter({ published: true }, '-created_date', 200),
    ]).then(([catalog, posts]) => {
      setSongs(findSongsStartingWithChord(catalog || [], chord).filter(hasConfirmedSpotifyPlayer).slice(0, 5));
      const matching = (posts || []).filter((post) => {
        const text = `${post.title} ${(post.tags || []).join(' ')} ${post.content || ''}`;
        return extractChordNames(text).includes(chord);
      });
      setArticles((matching.length ? matching : (posts || []).filter((post) => post.category === 'Acordes')).slice(0, 3));
    });
  }, [chord]);

  useSEO({
    title: chord ? `Acorde ${chord} en guitarra | Guitarra IA` : 'Acorde no encontrado | Guitarra IA',
    description: chord ? `Aprende a tocar el acorde ${chord}: diagrama, canciones para practicar y artículos relacionados.` : '',
    canonical: `/acordes/${encodeURIComponent(chord || '')}`,
  });

  if (!chord) {
    return <div className="px-4 py-20 text-center bg-g-page" style={{ color: '#6B7280' }}>Acorde no encontrado.</div>;
  }

  return (
    <div className="min-h-screen bg-g-page">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
        <Link to="/acordes" className="inline-flex items-center gap-1 text-sm mb-7" style={{ color: '#6B7280' }}>
          <ArrowLeft className="w-4 h-4" /> Biblioteca de acordes
        </Link>
        <div className="grid md:grid-cols-[300px_minmax(0,1fr)] gap-8 items-start">
          <section className="rounded-2xl p-6 text-center bg-white shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
            <p className="text-sm mb-2" style={{ color: '#F97316' }}>Acorde de guitarra</p>
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#1F2937' }}>{chord}</h1>
            <div className="flex justify-center mb-4">
              <ChordDiagram chordName={chord} diagram={getChordDiagram(chord)} />
            </div>
            <div className="flex justify-center">
              <ChordSoundToggle />
            </div>
          </section>
          <div className="space-y-8">
            <section className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #FFF7F1 0%, #FFFFFF 100%)', border: '1px solid #FED7AA' }}>
              <div className="flex items-center gap-2 mb-3"><CirclePlay className="w-5 h-5" style={{ color: '#F97316' }} /><h2 className="text-lg font-bold" style={{ color: '#1F2937' }}>Guía para estudiar {chord}</h2></div>
              <ol className="grid sm:grid-cols-3 gap-3">
                <li className="rounded-xl p-3 bg-white" style={{ border: '1px solid #FDE7D8' }}><CheckCircle2 className="w-4 h-4 mb-2" style={{ color: '#F97316' }} /><p className="text-sm font-semibold" style={{ color: '#1F2937' }}>1. Mira la postura</p><p className="text-xs mt-1" style={{ color: '#6B7280' }}>Revisa cuerdas abiertas, apagadas y la posición de cada dedo.</p></li>
                <li className="rounded-xl p-3 bg-white" style={{ border: '1px solid #FDE7D8' }}><Headphones className="w-4 h-4 mb-2" style={{ color: '#F97316' }} /><p className="text-sm font-semibold" style={{ color: '#1F2937' }}>2. Escucha el acorde</p><p className="text-xs mt-1" style={{ color: '#6B7280' }}>Usa el botón Sonido y compara el tono antes de tocar.</p></li>
                <li className="rounded-xl p-3 bg-white" style={{ border: '1px solid #FDE7D8' }}><Music2 className="w-4 h-4 mb-2" style={{ color: '#F97316' }} /><p className="text-sm font-semibold" style={{ color: '#1F2937' }}>3. Practica en una canción</p><p className="text-xs mt-1" style={{ color: '#6B7280' }}>Escucha el player y toca las canciones que comienzan con {chord}.</p></li>
              </ol>
            </section>
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: '#1F2937' }}>
                <Music2 className="w-5 h-5" style={{ color: '#F97316' }} /> Practica {chord} con estas canciones
              </h2>
              <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Máximo cinco canciones del catálogo que comienzan con {chord} y tienen player Spotify confirmado.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {songs.length ? songs.map((song) => <ChordStudySongCard key={song.id} song={song} />) : <p className="text-sm" style={{ color: '#6B7280' }}>Aún no hay canciones que comiencen con {chord} y tengan player Spotify confirmado.</p>}
              </div>
            </section>
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: '#1F2937' }}>
                <BookOpen className="w-5 h-5" style={{ color: '#F97316' }} /> Aprende más en el blog
              </h2>
              {articles.length ? <div className="grid gap-3 sm:grid-cols-3">
                {articles.map((article) => <Link key={article.id} to={`/blog/${article.slug}`} className="rounded-xl p-4 text-sm font-semibold bg-white shadow-sm" style={{ border: '1px solid #E5E7EB', color: '#1F2937' }}>{article.title}</Link>)}
              </div> : <Link to="/blog" className="text-sm font-semibold" style={{ color: '#F97316' }}>Explorar artículos para aprender guitarra</Link>}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
