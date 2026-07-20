import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { Music, Users, FileText, Trash2, Edit2, X, Sparkles, Save } from 'lucide-react';
import FileDropZone from '@/components/admin/FileDropZone';
import { parseFileContent } from '@/lib/fileParser';
import { useAuth } from '@/lib/AuthContext';

const ADMIN_EMAIL = 'danipalacio@gmail.com';

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'unknown';
}

async function upsertArtist(artistName, artistSlug) {
  const existing = await base44.entities.Artist.filter({ slug: artistSlug });
  if (existing && existing.length > 0) return existing[0];
  return base44.entities.Artist.create({
    name: artistName,
    slug: artistSlug,
    normalized_name: artistName.toLowerCase(),
    is_demo: false,
  });
}

async function upsertSong(parsed) {
  const existing = await base44.entities.Song.filter({
    slug: parsed.slug,
    artist_slug: parsed.artistSlug,
  });
  const data = {
    title: parsed.title,
    slug: parsed.slug,
    artist_name: parsed.artistName,
    artist_slug: parsed.artistSlug,
    original_key: parsed.originalKey,
    capo: parsed.capo,
    tuning: parsed.tuning,
    difficulty: parsed.difficulty,
    language: 'Español',
    has_chords: parsed.hasChords,
    has_tablature: parsed.hasTablature,
    content_raw: parsed.contentRaw,
    tablature: parsed.tablature,
    chords_used: parsed.chordsUsed,
    status: 'published',
    is_demo: false,
    views: 0,
  };
  if (existing && existing.length > 0) {
    await base44.entities.Song.update(existing[0].id, data);
    return { ...data, id: existing[0].id, updated: true };
  }
  const created = await base44.entities.Song.create(data);
  return { ...created, updated: false };
}

function SongEditor({ song, onClose, onSaved }) {
  const [content, setContent] = useState(song.content_raw || song.tablature || '');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const handleSave = async () => {
    setSaving(true);
    const isTab = song.has_tablature && !song.has_chords;
    await base44.entities.Song.update(song.id, isTab ? { tablature: content } : { content_raw: content });
    setSaving(false);
    onSaved();
    onClose();
  };

  const handleAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres un experto en cifrados y tablaturas de guitarra.
      
Canción: "${song.title}" de ${song.artist_name}
Contenido actual del cifrado:
---
${content}
---

Instrucción del editor: ${aiPrompt}

Devuelve SOLO el cifrado completo corregido/mejorado, sin explicaciones adicionales. Mantén el mismo formato con acordes sobre la letra y secciones entre corchetes [Intro], [Verso], [Coro], etc.`,
      model: 'claude_sonnet_4_6',
    });
    setContent(result);
    setAiLoading(false);
    setAiPrompt('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1d21] border border-[#2b3138] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2b3138]">
          <div>
            <h2 className="text-white font-bold text-lg">{song.title}</h2>
            <p className="text-[#a7afb8] text-sm">{song.artist_name}</p>
          </div>
          <button onClick={onClose} className="text-[#a7afb8] hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI assistant */}
        <div className="p-4 border-b border-[#2b3138] bg-[#20242a]">
          <p className="text-xs text-[#a7afb8] mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#ff7a00]" /> Asistente IA
          </p>
          <div className="flex gap-2">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAI()}
              placeholder='Ej: "Agrega la segunda estrofa que falta" o "Corrige los acordes del coro"'
              className="flex-1 bg-[#111315] border border-[#2b3138] rounded-lg px-3 py-2 text-sm text-white placeholder-[#a7afb8] outline-none focus:border-[#ff7a00]"
            />
            <button
              onClick={handleAI}
              disabled={aiLoading || !aiPrompt.trim()}
              className="px-4 py-2 bg-[#ff7a00] text-white rounded-lg text-sm font-medium hover:bg-[#e66e00] disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
            >
              {aiLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Mejorar con IA</>
              )}
            </button>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-[#111315] text-white font-mono text-sm p-4 resize-none outline-none min-h-0"
          spellCheck={false}
        />

        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#2b3138]">
          <button onClick={onClose} className="px-4 py-2 text-[#a7afb8] hover:text-white text-sm">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[#ff7a00] text-white rounded-lg text-sm font-medium hover:bg-[#e66e00] disabled:opacity-40 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState({ songs: 0, artists: 0 });
  const [loading, setLoading] = useState(true);
  const [allSongsList, setAllSongsList] = useState([]);
  const [editingSong, setEditingSong] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useAuth();

  useSEO({ title: 'Admin - Importar archivos | Tablaturas AI' });

  const loadStats = async () => {
    try {
      const [songs, artists] = await Promise.all([
        base44.entities.Song.list('-created_date', 5000),
        base44.entities.Artist.list('-created_date', 5000),
      ]);
      setAllSongsList(songs || []);
      setStats({ songs: songs.length, artists: artists.length });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const processFile = async (content, fileName, contentType) => {
    const parsed = parseFileContent(content, fileName, contentType);
    if (!parsed.title || parsed.title.length < 2) throw new Error('No se pudo detectar el título');
    if (!parsed.artistSlug) throw new Error('No se pudo detectar el artista');
    await upsertArtist(parsed.artistName, parsed.artistSlug);
    const song = await upsertSong(parsed);
    loadStats();
    return { title: parsed.title, artist: parsed.artistName, updated: song.updated };
  };

  const handleDelete = async (songId) => {
    if (!confirm('¿Eliminar esta canción permanentemente?')) return;
    setDeletingId(songId);
    await base44.entities.Song.delete(songId);
    setDeletingId(null);
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#2b3138] border-t-[#ff7a00] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[#a7afb8]">Página no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8">
      {editingSong && (
        <SongEditor
          song={editingSong}
          onClose={() => setEditingSong(null)}
          onSaved={loadStats}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
        <p className="text-[#a7afb8] text-sm mt-1">
          Importa, edita y elimina archivos del catálogo.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-[#20242a] border border-[#2b3138] rounded-xl p-5">
          <Music className="w-5 h-5 text-[#ff7a00] mb-2" />
          <p className="text-3xl font-bold text-white">{stats.songs}</p>
          <p className="text-[#a7afb8] text-sm mt-1">Canciones</p>
        </div>
        <div className="bg-[#20242a] border border-[#2b3138] rounded-xl p-5">
          <Users className="w-5 h-5 text-[#ff7a00] mb-2" />
          <p className="text-3xl font-bold text-white">{stats.artists}</p>
          <p className="text-[#a7afb8] text-sm mt-1">Artistas</p>
        </div>
        <div className="bg-[#20242a] border border-[#2b3138] rounded-xl p-5">
          <FileText className="w-5 h-5 text-[#ff7a00] mb-2" />
          <p className="text-3xl font-bold text-white">{stats.songs}</p>
          <p className="text-[#a7afb8] text-sm mt-1">Total archivos</p>
        </div>
      </div>

      {/* Upload zones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <FileDropZone label="Cifrados" type="cifrado" color="bg-blue-500" onProcess={processFile} />
        <FileDropZone label="Tablaturas" type="tablatura" color="bg-purple-500" onProcess={processFile} />
      </div>

      {/* Song list with edit/delete */}
      <div className="bg-[#1a1d21] border border-[#2b3138] rounded-xl overflow-hidden mb-8">
        <div className="p-4 border-b border-[#2b3138]">
          <h2 className="text-white font-semibold">Canciones en el catálogo</h2>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-[#2b3138]">
          {allSongsList.map((song) => (
            <div key={song.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{song.title}</p>
                <p className="text-[#a7afb8] text-xs">{song.artist_name} · {song.has_chords ? 'Acordes' : ''}{song.has_chords && song.has_tablature ? ' + ' : ''}{song.has_tablature ? 'Tab' : ''}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setEditingSong(song)}
                  className="p-2 text-[#a7afb8] hover:text-[#ff7a00] transition-colors"
                  title="Editar cifrado"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(song.id)}
                  disabled={deletingId === song.id}
                  className="p-2 text-[#a7afb8] hover:text-red-400 transition-colors disabled:opacity-40"
                  title="Eliminar canción"
                >
                  {deletingId === song.id
                    ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          ))}
          {allSongsList.length === 0 && (
            <p className="text-[#a7afb8] text-sm text-center py-8">No hay canciones en el catálogo.</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-[#1a1d21] border border-[#2b3138] rounded-xl p-5">
        <p className="text-white font-semibold mb-2 text-sm">📋 Formato recomendado para los archivos .txt</p>
        <pre className="text-[#a7afb8] text-xs leading-relaxed font-mono whitespace-pre">{`Título: La Camisa Negra
Artista: Juanes
Tonalidad: Am
Capo: 3
Afinación: Estándar

[Intro]
Am  F  C  G

[Verso]
Am                F
Tengo la camisa negra...`}</pre>
        <p className="text-[#a7afb8] text-xs mt-3">
          Formato de nombre recomendado: <code className="text-[#ff7a00]">Juanes - La Camisa Negra.txt</code>
        </p>
      </div>
    </div>
  );
}