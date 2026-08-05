import { useEffect, useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_NAV_VISIBILITY } from '@/lib/navigationVisibility';

const OPTIONS = [
  ['home', 'Inicio'],
  ['tuner', 'Afinador IA'],
  ['practice', 'Practicar con IA'],
  ['unplugged', 'Unplugged'],
  ['chords', 'Acordes'],
  ['blog', 'Blog'],
  ['infographics', 'Infografías'],
  ['store', 'Guitar Store'],
  ['chat', 'Chat IA'],
];

export default function NavigationMenuManager() {
  const [recordId, setRecordId] = useState(null);
  const [visibility, setVisibility] = useState(DEFAULT_NAV_VISIBILITY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    base44.entities.NavigationSettings.list('-updated_date', 1)
      .then((rows) => {
        if (rows?.[0]) {
          setRecordId(rows[0].id);
          setVisibility({ ...DEFAULT_NAV_VISIBILITY, ...(rows[0].visibility || {}) });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setVisibility((current) => ({ ...current, [key]: !current[key] }));

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      if (recordId) {
        await base44.entities.NavigationSettings.update(recordId, { visibility });
      } else {
        const created = await base44.entities.NavigationSettings.create({ visibility });
        setRecordId(created.id);
      }
      setMessage('Menú actualizado. Los cambios se verán al recargar el sitio.');
    } catch (error) {
      setMessage(error.message || 'No fue posible guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="bg-card border border-border rounded-xl p-6">Cargando menú…</div>;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Menú de navegación</h2>
        <p className="text-sm text-muted-foreground mt-1">Activa u oculta opciones del menú lateral y de la navegación móvil.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OPTIONS.map(([key, label]) => {
          const enabled = visibility[key] !== false;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-left"
            >
              <div>
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{enabled ? 'Visible en el sitio' : 'Oculto del menú'}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${enabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {enabled ? 'Activo' : 'Oculto'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? 'Guardando…' : 'Guardar menú'}
        </button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}
