import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import ReactMarkdown from 'react-markdown';
import { Clock, ChevronLeft, BookOpen, Music2, Disc3, ListMusic, Sparkles } from 'lucide-react';
import { extractChordNames } from '@/lib/chordSearch';
import ArtistAvatar from '@/components/ArtistAvatar';

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

const BIO_SECTIONS = [
  'Historia y trayectoria',
  'Sonido e influencia',
  'Integrantes o formación',
  'Álbumes y canciones clave',
  'Para tocar en guitarra',
];

// Some first-generation BIOs stored escaped line breaks. Normalizing them at
// read time repairs existing posts as well as future ones, without changing
// the original editorial record in the database.
function normalizeEditorialMarkdown(value = '') {
  let normalized = String(value);
  // Legacy rows may have been JSON-escaped more than once (\\n or \\\\n).
  // Repeating is intentional: it removes every stored escape layer before
  // ReactMarkdown receives the article.
  for (let pass = 0; pass < 4 && /\\r?\\n/.test(normalized); pass += 1) {
    normalized = normalized.replace(/\\r?\\n/g, '\n');
  }
  normalized = normalized.replace(/\r\n/g, '\n').trim();
  return normalized.split('\n').map((line) => {
    const compact = line.trim().replace(/:$/, '');
    const section = BIO_SECTIONS.find((heading) => compact.toLowerCase() === heading.toLowerCase());
    return section ? `## ${section}` : line;
  }).join('\n');
}

function artistSlugFromPost(post) {
  const taggedArtist = (post.tags || []).find((tag) => tag.startsWith('artista:'));
  return taggedArtist ? taggedArtist.slice('artista:'.length) : null;
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const preview = searchParams.get('preview') === '1';
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [artistSongs, setArtistSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      if (preview) {
        try {
          const user = await base44.auth.me();
          if (user?.role !== 'admin') return;
        } catch { return; }
      }
      const results = await base44.entities.BlogPost.filter(preview ? { slug } : { slug, published: true });
      if (results?.length > 0) {
        const p = results[0];
        setPost(p);
        const artistSlug = artistSlugFromPost(p);
        if (artistSlug) {
          base44.entities.Song.filter({ artist_slug: artistSlug }, '-views', 6)
            .then(setArtistSongs)
            .catch(() => setArtistSongs([]));
        } else {
          setArtistSongs([]);
        }
        base44.entities.BlogPost.filter({ category: p.category, published: true }, '-created_date', 5)
          .then(rel => setRelated(rel.filter(r => r.id !== p.id).slice(0, 3)))
          .catch(() => {});
      }
    };
    loadPost().catch(() => {}).finally(() => setLoading(false));
  }, [slug, preview]);

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
      <div className="flex justify-center py-24" style={{ backgroundColor: '#F8F9FB' }}>
        <div className="w-7 h-7 border-2 rounded-full animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: '#F97316' }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center" style={{ backgroundColor: '#F8F9FB' }}>
        <p style={{ color: '#6B7280' }}>Artículo no encontrado.</p>
        <Link to="/blog" className="mt-4 inline-block" style={{ color: '#F97316' }}>← Volver al blog</Link>
      </div>
    );
  }

  const cc = CAT_COLORS[post.category] || { bg: 'rgba(255,114,0,0.12)', color: '#FF7200' };
  const practiceChords = extractChordNames(`${post.title} ${(post.tags || []).join(' ')} ${post.content || ''}`).slice(0, 8);
  const chordLinks = practiceChords.length ? practiceChords : ['C', 'G', 'Am', 'F'];
  const editorialContent = normalizeEditorialMarkdown(post.content);
  const isArtistBio = Boolean(artistSlugFromPost(post));

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#F8F9FB' }}>
      <div className="blog-article min-w-0">

        <nav aria-label="Migas de pan">
        <Link to="/blog" className="flex items-center gap-1.5 text-sm mb-6 transition-colors" style={{ color: '#6B7280' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#F97316'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; }}
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
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight mb-3 break-words" style={{ color: '#1F2937', overflowWrap: 'anywhere' }}>
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="text-[17px] leading-relaxed mb-4 break-words" style={{ color: '#4B5563', overflowWrap: 'anywhere' }}>{post.excerpt}</p>
            )}
            <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
              <Clock className="w-3.5 h-3.5" />
              <span>{post.reading_time_min || 5} minutos de lectura</span>
              <span>·</span>
              <span>guitarraia.com</span>
            </div>
          </header>

          {isArtistBio && (
            <aside className="rounded-2xl p-5 mb-8" style={{ background: 'linear-gradient(135deg, #FFF7F1 0%, #FFFFFF 100%)', border: '1px solid #FED7AA' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: '#F97316' }} />
                <p className="text-sm font-bold" style={{ color: '#1F2937' }}>En esta BIO</p>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm" style={{ color: '#4B5563' }}>
                {BIO_SECTIONS.map((section) => <li key={section} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#F97316' }} />{section}</li>)}
              </ul>
            </aside>
          )}

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
                strong: ({ children }) => <strong className="font-semibold" style={{ color: '#1F2937' }}>{children}</strong>,
                code: ({ children, className }) => className?.includes('language-')
                  ? <code className="font-mono" style={{ color: '#F97316', fontFamily: '"IBM Plex Mono", monospace' }}>{children}</code>
                  : <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ backgroundColor: '#F3F4F6', color: '#F97316', fontFamily: '"IBM Plex Mono", monospace' }}>{children}</code>,
                pre: ({ children }) => <pre className="blog-code-block">{children}</pre>,
                blockquote: ({ children }) => (
                  <blockquote className="pl-4 italic mb-4" style={{ borderLeft: '3px solid #F97316', color: '#4B5563' }}>{children}</blockquote>
                ),
                table: ({ children }) => (
                  <div className="blog-table-wrapper">
                    <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="text-left px-3 py-2 text-xs font-bold uppercase" style={{ color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 text-sm" style={{ color: '#4B5563', borderBottom: '1px solid #F3F4F6' }}>{children}</td>,
                a: ({ href, children }) => <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noreferrer' : undefined} className="font-semibold underline underline-offset-4" style={{ color: '#F97316' }}>{children}</a>,
              }}
            >
              {editorialContent}
            </ReactMarkdown>
          </div>
        </article>

        {isArtistBio && (
          <section className="mt-8 rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 8px 24px rgba(15,23,42,0.05)' }}>
            <div className="flex items-center gap-2 mb-1">
              <ListMusic className="w-5 h-5" style={{ color: '#F97316' }} />
              <h2 className="text-base font-bold" style={{ color: '#1F2937' }}>Canciones para tocar en GuitarraIA</h2>
            </div>
            <p className="text-sm mb-4" style={{ color: '#6B7280' }}>Abre una canción del catálogo para practicar sus acordes o tablatura.</p>
            {artistSongs.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {artistSongs.map((song) => (
                  <Link key={song.id} to={`/${song.artist_slug}/${song.slug}`} className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:border-orange-300" style={{ border: '1px solid #E5E7EB' }}>
                    <ArtistAvatar song={song} className="w-10 h-10" imageClassName="border border-orange-100" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1F2937' }}>{song.title.replace(/\s*\d+$/, '').trim()}</p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>{song.difficulty || 'Acordes y tablatura'}</p>
                    </div>
                    <Disc3 className="w-4 h-4 shrink-0" style={{ color: '#F97316' }} />
                  </Link>
                ))}
              </div>
            ) : <p className="text-sm" style={{ color: '#6B7280' }}>Pronto agregaremos canciones de este artista al catálogo.</p>}
          </section>
        )}

        <section className="mt-8 rounded-2xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <h2 className="flex items-center gap-2 text-base font-bold mb-2" style={{ color: '#1F2937' }}>
            <Music2 className="w-4 h-4" style={{ color: '#F97316' }} /> Acordes para practicar
          </h2>
          <p className="text-sm mb-4" style={{ color: '#4B5563' }}>Abre un acorde para ver su posición, canciones y material de estudio.</p>
          <div className="flex flex-wrap gap-2">
            {chordLinks.map((chord) => (
              <Link key={chord} to={`/acordes/${encodeURIComponent(chord)}`} className="px-3 py-1.5 rounded-lg text-sm font-bold" style={{ color: '#F97316', border: '1px solid rgba(249,115,22,0.4)' }}>
                {chord}
              </Link>
            ))}
          </div>
        </section>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
            {post.tags.map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#6B7280', border: '1px solid #E5E7EB' }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Related */}
        {related.length > 0 && (
          <div className="blog-related-posts mt-10">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#1F2937' }}>
              <BookOpen className="w-4 h-4" style={{ color: '#F97316' }} /> Artículos relacionados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.slug}`}
                  className="p-4 rounded-xl transition-all"
                  style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#F97316'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                >
                  <span className="text-[10px] font-bold uppercase" style={{ color: '#6B7280' }}>{r.category}</span>
                  <p className="text-sm font-semibold mt-1 leading-snug" style={{ color: '#1F2937' }}>{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
