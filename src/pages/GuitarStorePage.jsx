import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ShoppingBag, ExternalLink, Star } from 'lucide-react';

const CATEGORIES = ['Todas', 'Guitarras', 'Amplificadores', 'Accesorios', 'Cuerdas', 'Efectos', 'Libros'];

export default function GuitarStorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Todas');

  useEffect(() => {
    base44.entities.AmazonProduct.list('sort_order', 200)
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = category === 'Todas' ? products : products.filter(p => p.category === category);
  const featured = filtered.filter(p => p.is_featured);
  const rest = filtered.filter(p => !p.is_featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingBag className="w-6 h-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              Guitar <span className="text-orange-500">Store</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500">Productos seleccionados para guitarristas. Los enlaces son de afiliado de Amazon.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                category === cat
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-400 hover:text-orange-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-gray-200">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">No hay productos en esta categoría aún.</p>
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <h2 className="text-gray-800 font-bold text-lg">Destacados</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featured.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </div>
            )}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rest.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </>
        )}

        <p className="text-xs text-center mt-12 text-gray-400">
          Los enlaces de esta página son enlaces de afiliado de Amazon. Al comprar a través de ellos ayudas a mantener Guitarra IA gratuito.
        </p>
      </div>
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div className="overflow-hidden rounded-2xl flex flex-col border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all bg-white">
      {product.image_url ? (
        <div className="aspect-square bg-gray-50 flex items-center justify-center p-6">
          <img src={product.image_url} alt={product.title} className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="aspect-square flex items-center justify-center bg-gray-50">
          <ShoppingBag className="w-12 h-12 text-gray-300" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        {product.category && (
          <span className="text-xs font-bold text-orange-500 mb-1 uppercase tracking-wide">{product.category}</span>
        )}
        <h3 className="text-sm font-bold leading-snug mb-2 flex-1 text-gray-900">{product.title}</h3>
        {product.description && (
          <p className="text-xs mb-3 line-clamp-3 text-gray-500">{product.description}</p>
        )}
        {product.price && (
          <p className="font-bold text-xl mb-3 text-gray-900">{product.price}</p>
        )}
        <a href={product.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#FF9900' }}>
          <ExternalLink className="w-4 h-4" />
          Comprar en Amazon
        </a>
      </div>
    </div>
  );
}