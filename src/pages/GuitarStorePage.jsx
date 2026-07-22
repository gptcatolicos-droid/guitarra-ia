import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { ShoppingBag, ExternalLink, Star } from 'lucide-react';

const CATEGORIES = ['Todas', 'Guitarras', 'Amplificadores', 'Accesorios', 'Cuerdas', 'Efectos', 'Libros'];

export default function GuitarStorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Todas');

  useSEO({
    title: 'Guitar Store - Productos de Guitarra | Guitarra IA',
    description: 'Encuentra las mejores guitarras, amplificadores, cuerdas y accesorios en nuestra tienda. Recomendaciones seleccionadas para guitarristas en guitarraia.com.',
    canonical: '/tienda',
  });

  useEffect(() => {
    base44.entities.AmazonProduct.list('sort_order', 200)
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = category === 'Todas' ? products : products.filter(p => p.category === category);
  const featured = filtered.filter(p => p.is_featured);
  const rest = filtered.filter(p => !p.is_featured);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0D0E' }}>
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="w-6 h-6" style={{ color: '#FF7200' }} />
          <h1 className="text-2xl font-bold" style={{ color: '#F4F4F2' }}>
            Guitar <span style={{ color: '#FF7200' }}>Store</span>
          </h1>
        </div>
        <p className="text-sm" style={{ color: '#747B7F' }}>Productos seleccionados para guitarristas. Los enlaces son de afiliado.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
            style={category === cat
              ? { backgroundColor: '#FF7200', color: '#fff' }
              : { backgroundColor: '#181B1D', border: '1px solid #303538', color: '#A7ACAE' }}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ border: '1px dashed #303538' }}>
          <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: '#303538' }} />
          <p style={{ color: '#747B7F' }}>No hay productos en esta categoría aún.</p>
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-yellow-500" />
                <h2 className="text-foreground font-semibold">Destacados</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rest.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-center mt-10" style={{ color: '#555B5E' }}>
        Los enlaces de esta página son enlaces de afiliado de Amazon. Al comprar a través de ellos ayudas a mantener Guitarra IA gratuito.
      </p>
    </div>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div className="overflow-hidden rounded-xl flex flex-col transition-all"
      style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,114,0,0.45)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#272C2F'; }}
    >
      {product.image_url ? (
        <div className="aspect-square bg-white flex items-center justify-center p-4">
          <img src={product.image_url} alt={product.title} className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: '#121516' }}>
          <ShoppingBag className="w-12 h-12" style={{ color: '#303538' }} />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <span className="text-xs font-semibold mb-1" style={{ color: '#FF7200' }}>{product.category}</span>
        )}
        <h3 className="text-sm font-bold leading-snug mb-2 flex-1" style={{ color: '#F4F4F2' }}>{product.title}</h3>
        {product.description && (
          <p className="text-xs mb-3 line-clamp-3" style={{ color: '#747B7F' }}>{product.description}</p>
        )}
        {product.price && (
          <p className="font-bold text-lg mb-3" style={{ color: '#F4F4F2' }}>{product.price}</p>
        )}
        <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#FF9900' }}>
          <ExternalLink className="w-4 h-4" />
          Comprar en Amazon
        </a>
      </div>
    </div>
  );
}