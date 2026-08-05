import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DEFAULTS = {
  home: true,
  tuner: true,
  practice: true,
  unplugged: true,
  chords: true,
  blog: true,
  infographics: true,
  store: true,
  chat: true,
};

const ITEMS = [
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

export default function NavigationSettingsManager() {
  const [record, setRecord] = useState(null);
  const [visibility, setVisibility] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.NavigationSettings.list('-updated_date', 1).then((rows) => {
      if (rows?.[0]) {
        setRecord(rows[0]);
        setVisibility({ ...DEFAULTS, ...(rows[0].visibility || {}) });
      }
    }).catch(() => {});
  }, []);

  const toggle = async (key) => {
    const next = { ...visibility, [key]: !visibility[key] };
    setVisibility(next);
    setSaving(true);
    try {
      let saved;
      if (record?.id) saved = await base44.entities.NavigationSettings.update(record.id, { visibility: next });
      else saved = await base44.entities.NavigationSettings.create({ visibility: next });
      setRecord(saved);
      window.dispatchEvent(new CustomEvent('guitarraia:navigation-updated', { detail: next }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-xl font-semibold text-foreground">Menú de navegación</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-5">Activa u oculta opciones del menú lateral y de la navegación móvil.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ITEMS.map(([key, label]) => {
          const enabled = visibility[key] !== false;
          return (
            <button key={key} type="button" disabled={saving} onClick={() => toggle(key)} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-4 text-left disabled:opacity-60">
              <div>
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{enabled ? 'Visible en el sitio' : 'Oculto del menú'}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {enabled ? 'Activo' : 'Oculto'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
