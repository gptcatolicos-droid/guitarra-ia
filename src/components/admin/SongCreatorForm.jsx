import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const DIFFICULTIES = ['Fácil', 'Intermedia', 'Avanzada'];
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
              'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

const EMPTY = {
  title: '',
  artist_name: '',
  original_key: '',
  capo: 0,
  difficulty: 'Intermedia',
  language: 'Español',
  has_chords: true,
  has_tablature: false,
  content_raw: '',
  tablature: '',
};

export default function SongCreatorForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error' | 'duplicate'
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setResult(null);

    try {
      const res = await base44.functions.invoke('createSongWithArtist', {
        ...form,
        capo: Number(form.capo) || 0,
      });
      const data = res.data;
      setResult(data);
      setStatus('success');
      setMessage(`Canción creada. Artista ${data.artistCreated ? 'nuevo creado' : 'reutilizado'}.`);
      setForm(EMPTY);
      onCreated && onCreated();
    } catch (err) {
      const data = err?.response?.data || {};
      if (data.error === 'duplicate') {
        setStatus('duplicate');
        setMessage(data.message || 'Esta canción ya existe en el catálogo.');
      } else {
        setStatus('error');
        setMessage(data.error || err.message || 'Error al crear la canción.');
      }
    }
  };

  const inputCls = 'w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary';
  const labelCls = 'block text-xs text-muted-foreground font-medium mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title */}
        <div>
          <label className={labelCls}>Título *</label>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="La Camisa Negra" required />
        </div>
        {/* Artist */}
        <div>
          <label className={labelCls}>Artista *</label>
          <input className={inputCls} value={form.artist_name} onChange={e => set('artist_name', e.target.value)}
            placeholder="Juanes" required />
        </div>
        {/* Key */}
        <div>
          <label className={labelCls}>Tonalidad</label>
          <select className={inputCls} value={form.original_key} onChange={e => set('original_key', e.target.value)}>
            <option value="">Sin especificar</option>
            {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        {/* Capo */}
        <div>
          <label className={labelCls}>Cejilla (Capo)</label>
          <input type="number" min="0" max="12" className={inputCls} value={form.capo}
            onChange={e => set('capo', e.target.value)} />
        </div>
        {/* Difficulty */}
        <div>
          <label className={labelCls}>Dificultad</label>
          <select className={inputCls} value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {/* Language */}
        <div>
          <label className={labelCls}>Idioma</label>
          <input className={inputCls} value={form.language} onChange={e => set('language', e.target.value)}
            placeholder="Español" />
        </div>
      </div>

      {/* Type checkboxes */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
          <input type="checkbox" checked={form.has_chords} onChange={e => set('has_chords', e.target.checked)}
            className="accent-primary w-4 h-4" />
          Tiene acordes
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
          <input type="checkbox" checked={form.has_tablature} onChange={e => set('has_tablature', e.target.checked)}
            className="accent-primary w-4 h-4" />
          Tiene tablatura
        </label>
      </div>

      {/* Content */}
      {form.has_chords && (
        <div>
          <label className={labelCls}>Acordes (content_raw) *</label>
          <textarea className={`${inputCls} font-mono`} rows={10}
            value={form.content_raw} onChange={e => set('content_raw', e.target.value)}
            placeholder={'[Intro]\nAm  F  C  G\n\n[Verso]\nAm         F\nLetra...'} />
        </div>
      )}
      {form.has_tablature && (
        <div>
          <label className={labelCls}>Tablatura</label>
          <textarea className={`${inputCls} font-mono`} rows={10}
            value={form.tablature} onChange={e => set('tablature', e.target.value)}
            placeholder={'e|--0--2--3--|\nB|--1--3--3--|\n...'} />
        </div>
      )}

      {/* Status message */}
      {status && status !== 'loading' && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
          status === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20'
          : status === 'duplicate' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
          : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {status === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: '#FF7200' }}
      >
        {status === 'loading'
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
          : <><Plus className="w-4 h-4" /> Crear canción</>}
      </button>
    </form>
  );
}