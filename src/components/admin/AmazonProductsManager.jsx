import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, X, Save, Star } from 'lucide-react';

const CATEGORIES = ['Guitarras', 'Amplificadores', 'Accesorios', 'Cuerdas', 'Efectos', 'Libros'];
const EMPTY = { title: '', description: '', image_url: '', price: '', affiliate_url: '', category: 'Guitarras', is_featured: false, sort_order: 0 };

export default function AmazonProductsManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | product object
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    if (!form.title || !form.affiliate_url) return alert('Título y URL de afiliado son obligatorios.');
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
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{products.length} productos en la tienda</p>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" /> Agregar producto
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground text-sm">No hay productos. Agrega el primero.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
              {p.image_url && <img src={p.image_url} alt={p.title} className="w-12 h-12 object-contain rounded-lg bg-white p-1 shrink-0" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {p.is_featured && <Star className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                  <p className="text-foreground text-sm font-semibold truncate">{p.title}</p>
                </div>
                <p className="text-muted-foreground text-xs truncate">{p.category} {p.price ? `· ${p.price}` : ''}</p>
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
              <h3 className="text-foreground font-bold">{editing === 'new' ? 'Nuevo producto' : 'Editar producto'}</h3>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Título *</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="Guitarra Fender Player Stratocaster" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL del afiliado Amazon *</label>
                <input value={form.affiliate_url} onChange={e => setForm(f => ({...f, affiliate_url: e.target.value}))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary font-mono" placeholder="https://www.amazon.com/dp/...?tag=tu-tag-20" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">URL imagen del producto</label>
                <input value={form.image_url} onChange={e => setForm(f => ({...f, image_url: e.target.value}))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Precio</label>
                  <input value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" placeholder="$299.99" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Categoría</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none" placeholder="Descripción breve del producto..." />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({...f, is_featured: e.target.checked}))} className="accent-primary" />
                  <span className="text-sm text-foreground">Producto destacado</span>
                </label>
                <div className="flex-1" />
                <label className="text-xs text-muted-foreground">Orden:</label>
                <input type="number" value={form.sort_order} onChange={e => setForm(f => ({...f, sort_order: Number(e.target.value)}))} className="w-16 bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-border">
              <button onClick={closeForm} className="flex-1 py-2 rounded-xl text-sm text-muted-foreground border border-border hover:text-foreground">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 rounded-xl text-sm font-bold text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}