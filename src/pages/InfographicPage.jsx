import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Sparkles, Music } from 'lucide-react';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import { useSEO } from '@/lib/seo';
import { Image } from '@/components/ui/image';

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function InfographicPage() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    base44.entities.Infographic.filter({ slug, published: true }, '-created_date', 1).then((results) => setItem(results[0] || null));
    // Random recommended songs (with chords) — never the same order
    base44.entities.Song.filter({ has_chords: true, status: 'published' }, '-views', 60).then((pool) => {
      setSongs(shuffle(pool).slice(0, 2));
    });
  }, [slug]);

  useSEO({
    title: item?.seo_title || item?.title,
    description: item?.seo_meta_description || item?.description,
    image: item?.image_urls?.[0],
    canonical: `/infografias/${slug}`,
    jsonLd: item ? { '@context': 'https://schema.org', '@type': 'ImageObject', name: item.title, description: item.seo_meta_description || item.description, contentUrl: item.image_urls?.[0] } : null,
  });

  if (!item) return <div className="min-h-screen bg-page flex items-center justify-center text-muted-foreground">Cargando infografía…</div>;

  return (
    <div className="min-h-screen bg-page">
      <div className="mobile-page-container max-w-4xl py-8">
        <Link to="/infografias" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"><ArrowLeft className="w-4 h-4" /> Infografías</Link>
        <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{item.title}</h1>
        {item.description && <p className="mt-3 text-lg text-muted-foreground">{item.description}</p>}

        <div className="mt-8 space-y-6">
          {item.image_urls.map((url, index) => (
            <figure key={url} className="rounded-2xl overflow-hidden bg-card border border-border">
              <Image
                src={url}
                alt={`${item.seo_alt_text || item.title} — diapositiva ${index + 1}`}
                className="w-full h-auto block"
                fittingType="fit"
              />
            </figure>
          ))}
        </div>

        <section className="mt-10 pt-8 border-t border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Canciones recomendadas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {songs.map((song) => (
              <div key={song.id} className="rounded-2xl p-4 bg-card border border-border flex flex-col">
                <Link to={`/${song.artist_slug}/${song.slug}`} className="font-bold text-foreground hover:text-primary">{song.title}</Link>
                <p className="text-sm text-muted-foreground mt-1 mb-3">{song.artist_name}</p>
                <SpotifyPlayer song={song} />
                <Link
                  to={`/${song.artist_slug}/${song.slug}`}
                  className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm transition-opacity hover:opacity-90"
                >
                  <Music className="w-4 h-4" /> Ver acordes
                </Link>
              </div>
            ))}
          </div>
        </section>

        <Link to="/chat" className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"><Sparkles className="w-4 h-4" />Preguntar a GuitarraIA</Link>
      </div>
    </div>
  );
}