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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingBag className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            Guitar <span className="text-gradient-brand">Store</span>
          </h1>
        </div>
        <p className="text-muted-foreground">Productos seleccionados para guitarristas. Compra en Amazon con los mejores precios.</p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No hay productos en esta categoría aún.</p>
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

      <p className="text-xs text-muted-foreground text-center mt-10">
        Los enlaces de esta página son enlaces de afiliado de Amazon. Al comprar a través de ellos ayudas a mantener Guitarra IA gratuito.
      </p>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-colors flex flex-col">
      {product.image_url ? (
        <div className="aspect-square bg-white flex items-center justify-center p-4">
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className="aspect-square bg-secondary flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <span className="text-xs font-semibold text-primary mb-1">{product.category}</span>
        )}
        <h3 className="text-foreground font-bold text-sm leading-snug mb-2 flex-1">{product.title}</h3>
        {product.description && (
          <p className="text-muted-foreground text-xs mb-3 line-clamp-3">{product.description}</p>
        )}
        {product.price && (
          <p className="text-foreground font-bold text-lg mb-3">{product.price}</p>
        )}
        <a
          href={product.affiliate_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: '#FF9900' }}
        >
          <ExternalLink className="w-4 h-4" />
          Comprar en Amazon
        </a>
      </div>
    </div>
  );
}