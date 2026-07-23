import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import ReactMarkdown from 'react-markdown';
import { Clock, ChevronLeft, BookOpen } from 'lucide-react';

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

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BlogPost.filter({ slug })
      .then(results => {
        if (results?.length > 0) {
          const p = results[0];
          setPost(p);
          base44.entities.BlogPost.filter({ category: p.category, published: true }, '-created_date', 5)
            .then(rel => setRelated(rel.filter(r => r.id !== p.id).slice(0, 3)))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useSEO({
    title: post ? `${post.title} | Guitarra IA` : 'Blog | Guitarra IA',
    description: post?.excerpt || 'Artículo de guitarra en guitarraia.com',
    canonical: `https://www.guitarraia.com/blog/${slug}`,
    jsonLd: post ? {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.excerpt,
      url: `https://www.guitarraia.com/blog/${slug}`,
      author: { '@type': 'Organization', name: 'Guitarra IA' },
      publisher: { '@type': 'Organization', name: 'Guitarra IA', url: 'https://www.guitarraia.com' },
      keywords: post.tags ? post.tags.join(', ') : '',
    } : undefined,
  });

  if (loading) {
    return (
      <div className="flex justify-center py-24" style={{ backgroundColor: '#0B0D0E' }}>
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#303538', borderTopColor: '#FF7200' }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ backgroundColor: '#0B0D0E' }}>
        <p style={{ color: '#747B7F' }}>Artículo no encontrado.</p>
        <Link to="/blog" className="mt-4 inline-block" style={{ color: '#FF7200' }}>← Volver al blog</Link>
      </div>
    );
  }

  const cc = CAT_COLORS[post.category] || { bg: 'rgba(255,114,0,0.12)', color: '#FF7200' };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#0B0D0E' }}>
      <div className="blog-article min-w-0">

        <nav aria-label="Migas de pan">
        <Link to="/blog" className="flex items-center gap-1.5 text-sm mb-6 transition-colors" style={{ color: '#747B7F' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#FF7200'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#747B7F'; }}
        >
          <ChevronLeft className="w-4 h-4" /> Volver al blog
        </Link>
        </nav>

        <article>
          <header className="blog-article-header">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full inline-block mb-3"
              style={{ backgroundColor: cc.bg, color: cc.color }}>
              {post.category}
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight mb-3 break-words" style={{ color: '#F4F4F2', overflowWrap: 'anywhere' }}>
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-[17px] leading-relaxed mb-4 break-words" style={{ color: '#A7ACAE', overflowWrap: 'anywhere' }}>{post.excerpt}</p>
            )}
            <div className="flex items-center gap-2 text-xs" style={{ color: '#747B7F' }}>
              <Clock className="w-3.5 h-3.5" />
              <span>{post.reading_time_min || 5} minutos de lectura</span>
              <span>·</span>
              <span>guitarraia.com</span>
            </div>
          </header>

          {/* Content */}
          <div className="blog-article-content blog-content min-w-0">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h2>{children}</h2>,
                h2: ({ children }) => <h2>{children}</h2>,
                h3: ({ children }) => <h3>{children}</h3>,
                p: ({ children }) => <p>{children}</p>,
                ul: ({ children }) => <ul>{children}</ul>,
                ol: ({ children }) => <ol>{children}</ol>,
                li: ({ children }) => <li>{children}</li>,
                strong: ({ children }) => <strong className="font-semibold" style={{ color: '#F4F4F2' }}>{children}</strong>,
                code: ({ children, className }) => className?.includes('language-')
                  ? <code className="font-mono" style={{ color: '#FF7200', fontFamily: '"IBM Plex Mono", monospace' }}>{children}</code>
                  : <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ backgroundColor: '#121516', color: '#FF7200', fontFamily: '"IBM Plex Mono", monospace' }}>{children}</code>,
                pre: ({ children }) => <pre className="blog-code-block">{children}</pre>,
                blockquote: ({ children }) => (
                  <blockquote className="pl-4 italic mb-4" style={{ borderLeft: '3px solid #FF7200', color: '#A7ACAE' }}>{children}</blockquote>
                ),
                table: ({ children }) => (
                  <div className="blog-table-wrapper">
                    <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="text-left px-3 py-2 text-xs font-bold uppercase" style={{ color: '#747B7F', borderBottom: '1px solid #272C2F' }}>{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 text-sm" style={{ color: '#A7ACAE', borderBottom: '1px solid #1a1d1f' }}>{children}</td>,
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6" style={{ borderTop: '1px solid #272C2F' }}>
            {post.tags.map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#181B1D', color: '#747B7F', border: '1px solid #272C2F' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div className="blog-related-posts mt-10">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#F4F4F2' }}>
              <BookOpen className="w-4 h-4" style={{ color: '#FF7200' }} /> Artículos relacionados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.slug}`}
                  className="p-4 rounded-xl transition-all"
                  style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF7200'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; }}
                >
                  <span className="text-[10px] font-bold uppercase" style={{ color: '#747B7F' }}>{r.category}</span>
                  <p className="text-sm font-semibold mt-1 leading-snug" style={{ color: '#F4F4F2' }}>{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}