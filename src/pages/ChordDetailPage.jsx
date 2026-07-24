import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Music2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import ChordDiagram from '@/components/ChordDiagram';
import ChordSoundToggle from '@/components/audio/ChordSoundToggle';
import { getChordDiagram } from '@/lib/musicTheory';
import { extractChordNames, findSongsStartingWithChord, normalizeChordName } from '@/lib/chordSearch';

export default function ChordDetailPage() {
  const { chord: chordParam } = useParams();
  const chord = normalizeChordName(decodeURIComponent(chordParam || ''));
  const [songs, setSongs] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    if (!chord) return;
    Promise.all([
      base44.entities.Song.list('-views', 2000),
      base44.entities.BlogPost.filter({ published: true }, '-created_date', 200),
    ]).then(([catalog, posts]) => {
      setSongs(findSongsStartingWithChord(catalog || [], chord).slice(0, 12));
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
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold mb-4" style={{ color: '#1F2937' }}>
                <Music2 className="w-5 h-5" style={{ color: '#F97316' }} /> Canciones que comienzan con {chord}
              </h2>
              <div className="space-y-2">
                {songs.length ? songs.map((song) => (
                  <Link key={song.id} to={`/${song.artist_slug}/${song.slug}`} className="block rounded-xl px-4 py-3 bg-white shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
                    <p className="font-semibold" style={{ color: '#1F2937' }}>{song.title.replace(/\s*\d+$/, '').trim()}</p>
                    <p className="text-sm" style={{ color: '#6B7280' }}>{song.artist_name}</p>
                  </Link>
                )) : <p className="text-sm" style={{ color: '#6B7280' }}>Aún no hay canciones del catálogo que inicien con este acorde.</p>}
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