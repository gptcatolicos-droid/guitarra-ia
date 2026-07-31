import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { BookOpen, Clock, ChevronRight, Search } from 'lucide-react';

const CATEGORIES = ['Todas', 'Acordes', 'Ritmos', 'Técnica', 'Guitarras', 'Cuerdas', 'Canciones', 'Teoría', 'Ejercicios', 'Compra y Equipamiento'];

const CAT_COLORS = {
  'Acordes': { bg: 'rgba(255,114,0,0.12)', color: '#FF7200' },
  'Ritmos': { bg: 'rgba(216,166,42,0.12)', color: '#D8A62A' },
  'Técnica': { bg: 'rgba(79,158,216,0.12)', color: '#4F9ED8' },
  'Guitarras': { bg: 'rgba(128,90,200,0.12)', color: '#9B6FD4' },
  'Cuerdas': { bg: 'rgba(89,184,121,0.12)', color: '#59B879' },
  'Canciones': { bg: 'rgba(224,100,100,0.12)', color: '#E06464' },
  'Teoría': { bg: 'rgba(79,158,216,0.12)', color: '#4F9ED8' },
  'Ejercicios': { bg: 'rgba(217,90,50,0.12)', color: '#D95A32' },
  'Compra y Equipamiento': { bg: 'rgba(89,184,121,0.12)', color: '#59B879' },
};

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Todas');
  const [search, setSearch] = useState('');

  useSEO({
    title: 'Blog de Guitarra — Guías, Acordes, Técnicas | Guitarra IA',
    description: 'Aprende guitarra con guías completas: acordes, ritmos, técnicas, tipos de guitarras y canciones recomendadas en guitarraia.com.',
    canonical: 'https://guitarraia.com/blog',
  });

  useEffect(() => {
    base44.entities.BlogPost.filter({ published: true }, '-created_date', 200)
      .then(setPosts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter(p => {
    const matchCat = category === 'Todas' || p.category === category;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8F9FB' }}>
      <div className="blog-page">

        {/* Header */}
        <div className="blog-page-header mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6" style={{ color: '#FF7200' }} />
            <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: '#1F2937' }}>
              Blog de <span style={{ color: '#F97316' }}>Guitarra</span>
            </h1>
          </div>
          <p className="text-sm" style={{ color: '#6B7280' }}>Guías, técnicas, acordes y todo lo que necesitas para aprender guitarra.</p>
        </div>

        {/* Search */}
        <div className="blog-search relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar artículos..."
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#1F2937' }}
            onFocus={e => { e.target.style.borderColor = '#F97316'; }}
            onBlur={e => { e.target.style.borderColor = '#E5E7EB'; }}
          />
        </div>

        {/* Categories */}
        <div className="blog-filters flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => {
            const active = category === cat;
            return (
              <button key={cat} onClick={() => setCategory(cat)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                style={active
                  ? { backgroundColor: '#F97316', color: '#fff' }
                  : { backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', color: '#6B7280' }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: '#F97316' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ border: '1px dashed #D1D5DB' }}>
            <p style={{ color: '#6B7280' }}>No se encontraron artículos.</p>
          </div>
        ) : (
          <div className="blog-grid">
            {filtered.map(post => {
              const cc = CAT_COLORS[post.category] || { bg: 'rgba(255,114,0,0.12)', color: '#FF7200' };
              return (
                <Link key={post.id} to={`/blog/${post.slug}`}
                  className="blog-card"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#FDBA74'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: cc.bg, color: cc.color }}>
                      {post.category}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: '#6B7280' }}>
                      <Clock className="w-3 h-3" />{post.reading_time_min || 5} min
                    </span>
                  </div>
                  <h2 className="blog-card-title" style={{ color: '#1F2937' }}>{post.title}</h2>
                  {post.excerpt && <p className="blog-card-description" style={{ color: '#6B7280' }}>{post.excerpt}</p>}
                  <div className="flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: '#F97316' }}>
                    Leer artículo <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}