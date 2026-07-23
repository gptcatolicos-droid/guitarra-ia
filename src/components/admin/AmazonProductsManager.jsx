import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, X, Save, Star, Link as LinkIcon, Loader2, ShoppingBag } from 'lucide-react';

const CATEGORIES = ['Guitarras', 'Amplificadores', 'Accesorios', 'Cuerdas', 'Efectos', 'Libros'];
const EMPTY = { title: '', description: '', image_url: '', price: '', affiliate_url: '', category: 'Guitarras', is_featured: false, sort_order: 0 };

async function fetchAmazonProduct(url) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Analiza este producto de Amazon y extrae su información: ${url}

Instrucciones CRÍTICAS:
- title: nombre completo del producto tal como aparece en Amazon (no lo acortes)
- price: precio ACTUAL en formato "$XX.XX" o "COP XX.XXX". Busca el precio principal de venta (no el precio tachado).
- image_url: URL directa de la imagen principal del producto (debe terminar en .jpg o .png, desde images-amazon.com o similar). Si no puedes obtenerla exacta, devuelve null.
- description: resumen de 1-2 líneas sobre el producto, enfocado en guitarristas

Si no puedes obtener algún dato con certeza, devuelve null para ese campo. NO inventes datos.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'string' },
        image_url: { type: 'string' },
      },
    },
  });
  return result;
}

export default function AmazonProductsManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => {
    setLoading(true);
    base44.entities.AmazonProduct.list('sort_order', 500)
      .then(setProducts).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY); setEditing('new'); };
  const openEdit = (p) => { setForm({ ...p }); setEditing(p); };
  const closeForm = () => setEditing(null);

  const handleFetchFromUrl = async () => {
    if (!form.affiliate_url) return;
    setFetching(true);
    try {
      const data = await fetchAmazonProduct(form.affiliate_url);
      setForm(f => ({
        ...f,
        title: data.title || f.title,
        description: data.description || f.description,
        price: data.price || f.price,
        image_url: data.image_url || f.image_url,
      }));
    } catch (e) {
      alert('No se pudo obtener info del producto. Rellena los campos manualmente.');
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    if (!form.affiliate_url) return alert('La URL de Amazon es obligatoria.');
    setSaving(true);
    if (editing === 'new') {
      await base44.entities.AmazonProduct.create(form);
    } else {
      await base44.entities.AmazonProduct.update(editing.id, form);
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await base44.entities.AmazonProduct.delete(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,153,0,0.12) 0%, rgba(255,153,0,0.04) 100%)',
          border: '2px solid rgba(255,153,0,0.3)',
        }}
      >
        <ShoppingBag className="w-8 h-8 shrink-0" style={{ color: '#FF9900' }} />
        <div className="flex-1">
          <p className="font-bold" style={{ color: '#F4F4F2' }}>Guitar Store</p>
          <p className="text-xs mt-0.5" style={{ color: '#747B7F' }}>
            Pega una URL de Amazon y la IA extrae automáticamente imagen, título, precio y descripción.
          </p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: '#FF9900', color: '#fff' }}>
          <Plus className="w-4 h-4" /> Agregar producto
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{products.length} productos en la tienda</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No hay productos. Agrega el primero pegando una URL de Amazon.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              {p.image_url
                ? <img src={p.image_url} alt={p.title} className="w-12 h-12 object-contain rounded-lg bg-white p-1 shrink-0" />
                : <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0"><ShoppingBag className="w-5 h-5 text-muted-foreground" /></div>
              }
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {p.is_featured && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />}
                  <p className="text-foreground text-sm font-semibold truncate">{p.title}</p>
                </div>
                <p className="text-muted-foreground text-xs truncate">{p.category}{p.price ? ` · ${p.price}` : ''}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="p-1.5 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal form */}
      {editing !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-foreground font-bold">{editing === 'new' ? 'Nuevo producto Amazon' : 'Editar producto'}</h3>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-4">

              {/* URL Amazon — primary field with auto-fetch */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wide">URL de Amazon *</label>
                <div className="flex gap-2">
                  <input
                    value={form.affiliate_url}
                    onChange={e => setForm(f => ({ ...f, affiliate_url: e.target.value }))}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary font-mono"
                    placeholder="https://www.amazon.com/dp/B00..."
                  />
                  <button
                    onClick={handleFetchFromUrl}
                    disabled={fetching || !form.affiliate_url}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40 shrink-0"
                    style={{ backgroundColor: '#FF9900', color: '#fff' }}
                  >
                    {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                    {fetching ? 'Buscando...' : 'Obtener info'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pega la URL y pulsa "Obtener info" para auto-completar.</p>
              </div>

              {/* Preview if image_url */}
              {form.image_url && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <img src={form.image_url} alt="preview" className="w-16 h-16 object-contain rounded-lg bg-white p-1 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground line-clamp-2">{form.title}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: '#FF9900' }}>{form.price}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Título</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="Nombre del producto" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Precio</label>
                  <input value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="$299.99" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Categoría</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL imagen</label>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                  placeholder="https://..." />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none"
                  placeholder="Descripción breve..." />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="accent-primary" />
                  <span className="text-sm text-foreground">Producto destacado</span>
                </label>
                <div className="flex items-center gap-2 ml-auto">
                  <label className="text-xs text-muted-foreground">Orden:</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                    className="w-16 bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-border">
              <button onClick={closeForm} className="flex-1 py-2 rounded-xl text-sm text-muted-foreground border border-border hover:text-foreground">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}