import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadAndQueueYouTubePractice } from '@/lib/youtubePracticeUpload';

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
  spotify_embed: '',
  youtube_embed: '',
  artist_image_url: '',
  spotify_artist_url: '',
  is_unplugged: false,
  practice_only: false,
};

export default function SongCreatorForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error' | 'duplicate'
  const [message, setMessage] = useState('');
  const [practiceAudio, setPracticeAudio] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    if (practiceAudio && !form.youtube_embed.trim()) {
      setStatus('error');
      setMessage('Pega primero el enlace de YouTube para asociar el audio autorizado.');
      return;
    }

    if (form.practice_only && (!form.youtube_embed.trim() || !practiceAudio)) {
      setStatus('error');
      setMessage('Para crear una canción solo de práctica, agrega el enlace de YouTube y selecciona el MP3 autorizado.');
      return;
    }

    try {
      const creationPayload = {
        ...form,
        capo: Number(form.capo) || 0,
        has_chords: form.practice_only ? false : form.has_chords,
        has_tablature: form.practice_only ? false : form.has_tablature,
        content_raw: form.practice_only ? '' : form.content_raw,
        tablature: form.practice_only ? '' : form.tablature,
      };
      const res = await base44.functions.invoke('createSongWithArtist', creationPayload);
      const data = res.data;
      let practiceQueued = false;
      let practiceWarning = '';
      if (practiceAudio && data.songId) {
        try {
          const analysis = await uploadAndQueueYouTubePractice(base44, data.songId, practiceAudio, {
            autoPublish: form.practice_only,
          });
          practiceQueued = analysis?.status === 'queued';
        } catch (analysisError) {
          practiceWarning = ` La canción fue creada, pero el análisis no se inició: ${analysisError.message}. Puedes reintentarlo desde el editor.`;
        }
      }
      setStatus('success');
      setMessage(`Canción creada. Artista ${data.artistCreated ? 'nuevo creado' : 'reutilizado'}.${practiceWarning || (practiceQueued ? (form.practice_only ? ' El análisis quedó en cola y se publicará automáticamente en Practicar con IA cuando termine.' : ' El análisis de práctica quedó en cola y aparecerá cuando termine.') : form.youtube_embed ? ' El enlace de YouTube quedó guardado; la práctica aparecerá cuando el analizador esté configurado y termine.' : '')}`);
      setForm(EMPTY);
      setPracticeAudio(null);
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
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
          <input type="checkbox" checked={form.has_chords} disabled={form.practice_only}
            onChange={e => set('has_chords', e.target.checked)}
            className="accent-primary w-4 h-4 disabled:opacity-40" />
          Tiene acordes
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
          <input type="checkbox" checked={form.has_tablature} disabled={form.practice_only}
            onChange={e => set('has_tablature', e.target.checked)}
            className="accent-primary w-4 h-4 disabled:opacity-40" />
          Tiene tablatura
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
          <input type="checkbox" checked={form.is_unplugged} onChange={e => set('is_unplugged', e.target.checked)}
            className="accent-primary w-4 h-4" />
          Incluir en Unplugged
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
          <input type="checkbox" checked={form.practice_only}
            onChange={e => setForm(f => ({
              ...f,
              practice_only: e.target.checked,
              ...(e.target.checked ? { has_chords: false, has_tablature: false, content_raw: '', tablature: '' } : {}),
            }))}
            className="accent-primary w-4 h-4" />
          Solo práctica con YouTube
        </label>
      </div>
      {form.practice_only && (
        <p className="text-xs text-primary -mt-3">
          No necesitas cifrado ni tablatura. Agrega el video y el MP3; la práctica se publicará automáticamente al terminar el análisis.
        </p>
      )}

      {/* Spotify Embed */}
      <div>
        <label className={labelCls}>Código embed de Spotify (opcional)</label>
        <input className={`${inputCls} font-mono text-xs`} value={form.spotify_embed}
          onChange={e => set('spotify_embed', e.target.value)}
          placeholder='<iframe src="https://open.spotify.com/embed/track/...">' />
        <p className="text-xs text-muted-foreground mt-1">En Spotify → compartir → Insertar → copia el iframe.</p>
      </div>

      <div>
        <label className={labelCls}>Video de práctica de YouTube {form.practice_only ? '*' : '(opcional)'}</label>
        <input className={`${inputCls} font-mono text-xs`} value={form.youtube_embed}
          onChange={e => set('youtube_embed', e.target.value)}
          placeholder='https://www.youtube.com/watch?v=...' />
        <p className="text-xs text-muted-foreground mt-1">Pega el enlace normal. El botón público aparece solo cuando subas el audio autorizado y termine el análisis.</p>
      </div>

      <div>
        <label className={labelCls}>Audio autorizado para sincronizar {form.practice_only ? '*' : '(opcional)'}</label>
        <input type="file" accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg,.mp3,.wav,.m4a,.aac,.ogg"
          className={`${inputCls} file:mr-3 file:border-0 file:bg-primary/10 file:text-primary file:font-medium file:rounded-md file:px-2 file:py-1`}
          onChange={e => setPracticeAudio(e.target.files?.[0] || null)} />
        <p className="text-xs text-muted-foreground mt-1">Máximo 80 MB. Se sube a un bucket privado, se analiza con ChordMini y se elimina automáticamente; GuitarraIA conserva solo el mapa de acordes y tiempos.</p>
      </div>

      {/* Artist identity — stored once in Artist and used by every song card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border p-4 bg-secondary/20">
        <div>
          <label className={labelCls}>URL de imagen del artista (Spotify)</label>
          <input className={`${inputCls} text-xs`} value={form.artist_image_url}
            onChange={e => set('artist_image_url', e.target.value)}
            placeholder="https://i.scdn.co/image/..." />
          <p className="text-xs text-muted-foreground mt-1">Se mostrará en todas las canciones y resultados de este artista.</p>
        </div>
        <div>
          <label className={labelCls}>URL del perfil de artista en Spotify</label>
          <input className={`${inputCls} text-xs`} value={form.spotify_artist_url}
            onChange={e => set('spotify_artist_url', e.target.value)}
            placeholder="https://open.spotify.com/artist/..." />
          <p className="text-xs text-muted-foreground mt-1">Opcional: si no indicas una imagen, la obtenemos desde este perfil.</p>
        </div>
      </div>

      {/* Content */}
      {form.has_chords && !form.practice_only && (
        <div>
          <label className={labelCls}>Acordes (content_raw)</label>
          <textarea className={`${inputCls} font-mono`} rows={10}
            value={form.content_raw} onChange={e => set('content_raw', e.target.value)}
            placeholder={'[Intro]\nAm  F  C  G\n\n[Verso]\nAm         F\nLetra...'} />
        </div>
      )}
      {form.has_tablature && !form.practice_only && (
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
