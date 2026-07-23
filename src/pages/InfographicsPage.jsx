import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image as ImageIcon } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useSEO } from '@/lib/seo';

export default function InfographicsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useSEO({ title: 'Infografías de guitarra | GuitarraIA', description: 'Infografías sobre guitarras, marcas y cultura musical para guitarristas.', canonical: '/infografias' });
  useEffect(() => { base44.entities.Infographic.filter({ published: true }, '-created_date', 100).then(setItems).finally(() => setLoading(false)); }, []);
  return <div className="min-h-screen bg-page"><div className="mobile-page-container max-w-6xl py-10"><div className="mb-8"><p className="text-primary text-sm font-bold">GUÍAS VISUALES</p><h1 className="text-3xl font-bold text-foreground mt-1">Infografías de guitarra</h1></div>{loading ? <div className="w-7 h-7 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" /> : items.length ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{items.map((item) => <Link key={item.id} to={`/infografias/${item.slug}`} className="rounded-2xl overflow-hidden bg-card border border-border hover:border-primary transition-colors"><div className="aspect-[4/5] bg-secondary"><Image src={item.image_urls?.[0]} alt={item.seo_alt_text || item.title} className="w-full h-full" /></div><div className="p-4"><h2 className="font-bold text-foreground">{item.title}</h2><p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p></div></Link>)}</div> : <div className="text-center py-20 text-muted-foreground"><ImageIcon className="w-10 h-10 mx-auto mb-3" />Aún no hay infografías publicadas.</div>}</div></div>;
}