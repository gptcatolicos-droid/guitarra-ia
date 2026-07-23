import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import { useSEO } from '@/lib/seo';

export default function InfographicPage() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [songs, setSongs] = useState([]);
  useEffect(() => {
    base44.entities.Infographic.filter({ slug, published: true }, '-created_date', 1).then((results) => setItem(results[0] || null));
    base44.entities.Song.filter({ is_trending: true }, '-views', 2).then(async (results) => setSongs(results.length ? results : await base44.entities.Song.list('-views', 2)));
  }, [slug]);
  useSEO({ title: item?.seo_title || item?.title, description: item?.seo_meta_description || item?.description, image: item?.image_urls?.[0], canonical: `/infografias/${slug}`, jsonLd: item ? { '@context': 'https://schema.org', '@type': 'ImageObject', name: item.title, description: item.seo_meta_description || item.description, contentUrl: item.image_urls?.[0] } : null });
  if (!item) return <div className="min-h-screen bg-page flex items-center justify-center text-muted-foreground">Cargando infografía…</div>;
  return <div className="min-h-screen bg-page"><div className="max-w-5xl mx-auto px-4 lg:px-8 py-8"><Link to="/infografias" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"><ArrowLeft className="w-4 h-4" /> Infografías</Link><h1 className="text-3xl lg:text-4xl font-bold text-foreground">{item.title}</h1>{item.description && <p className="mt-3 text-lg text-muted-foreground">{item.description}</p>}<div className="mt-8 space-y-6">{item.image_urls.map((url, index) => <figure key={url} className="rounded-2xl overflow-hidden bg-card border border-border"><Image src={url} alt={`${item.seo_alt_text || item.title} — diapositiva ${index + 1}`} fittingType="fit" className="w-full max-h-[1100px]" /></figure>)}</div><section className="mt-10 pt-8 border-t border-border"><h2 className="text-xl font-bold text-foreground mb-4">Canciones recomendadas</h2><div className="grid md:grid-cols-2 gap-4">{songs.map((song) => <div key={song.id} className="rounded-2xl p-4 bg-card border border-border"><Link to={`/${song.artist_slug}/${song.slug}`} className="font-bold text-foreground hover:text-primary">{song.title}</Link><p className="text-sm text-muted-foreground mt-1 mb-3">{song.artist_name}</p><SpotifyPlayer song={song} /></div>)}</div></section><Link to="/chat" className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"><Sparkles className="w-4 h-4" />Preguntar a GuitarraIA</Link></div></div>;
}