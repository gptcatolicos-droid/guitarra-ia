import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ImagePlus, Loader2, Save, Trash2 } from 'lucide-react';
import { Image } from '@/components/ui/image';

const EMPTY = { title: '', slug: '', description: '', image_urls: [], seo_title: '', seo_meta_description: '', seo_alt_text: '', published: true };
const slugify = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

export default function InfographicsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const results = await base44.entities.Infographic.list('-created_date', 100);
    setItems(results);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const updateTitle = (title) => setForm((current) => ({
    ...current,
    title,
    slug: current.slug || slugify(title),
    seo_title: current.seo_title || `${title} | Infografía de guitarra | GuitarraIA`,
    seo_meta_description: current.seo_meta_description || `Descubre ${title} en esta infografía para guitarristas de GuitarraIA.`,
    seo_alt_text: current.seo_alt_text || `Infografía: ${title}`,
  }));

  const uploadSlides = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 10 - form.image_urls.length);
    if (!files.length) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setForm((current) => ({ ...current, image_urls: [...current.image_urls, ...urls] }));
    setUploading(false);
    event.target.value = '';
  };

  const save = async () => {
    if (!form.title || !form.slug || !form.image_urls.length) return;
    setSaving(true);
    await base44.entities.Infographic.create(form);
    setForm(EMPTY);
    setSaving(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar esta infografía?')) return;
    await base44.entities.Infographic.delete(id);
    load();
  };

  return <div className="space-y-6">
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div><h2 className="text-lg font-bold text-foreground">Nueva infografía</h2><p className="text-sm text-muted-foreground mt-1">Sube una imagen o un carrusel de hasta 10 diapositivas. El SEO se completa automáticamente y puedes ajustarlo.</p></div>
      <input value={form.title} onChange={(e) => updateTitle(e.target.value)} placeholder="Título de la infografía" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
      <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="URL: origen-de-la-guitarra-fender" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción breve" rows={2} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary resize-none" />
      <div className="grid gap-3 md:grid-cols-3">
        <input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="Título SEO" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
        <input value={form.seo_meta_description} onChange={(e) => setForm({ ...form, seo_meta_description: e.target.value })} placeholder="Meta descripción" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
        <input value={form.seo_alt_text} onChange={(e) => setForm({ ...form, seo_alt_text: e.target.value })} placeholder="Texto alternativo" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
      </div>
      <label className="flex items-center justify-center gap-2 min-h-28 border border-dashed border-border rounded-xl cursor-pointer text-sm text-muted-foreground hover:border-primary">
        {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />} {uploading ? 'Subiendo…' : `Subir diapositivas (${form.image_urls.length}/10)`}
        <input type="file" accept="image/*" multiple onChange={uploadSlides} className="hidden" disabled={uploading || form.image_urls.length >= 10} />
      </label>
      {form.image_urls.length > 0 && <div className="grid grid-cols-5 gap-2">{form.image_urls.map((url, index) => <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-border"><Image src={url} alt={`Diapositiva ${index + 1}`} className="w-full h-full" /><button onClick={() => setForm({ ...form, image_urls: form.image_urls.filter((_, i) => i !== index) })} className="absolute top-1 right-1 rounded bg-black/70 p-1"><Trash2 className="w-3 h-3 text-white" /></button></div>)}</div>}
      <button onClick={save} disabled={saving || !form.title || !form.image_urls.length} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40"><Save className="w-4 h-4" />{saving ? 'Guardando…' : 'Publicar infografía'}</button>
    </div>
    <div className="space-y-2">{loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : items.map((item) => <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"><span className="text-sm text-muted-foreground">{item.image_urls?.length || 0} slides</span><a href={`/infografias/${item.slug}`} target="_blank" rel="noreferrer" className="flex-1 font-semibold text-sm text-foreground">{item.title}</a><button onClick={() => remove(item.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button></div>)}</div>
  </div>;
}