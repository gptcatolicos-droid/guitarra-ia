import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { Music, Users, FileText } from 'lucide-react';
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

export default function AdminPage() {
  const [stats, setStats] = useState({ songs: 0, artists: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useSEO({ title: 'Admin - Importar archivos | Tablaturas AI' });

  const loadStats = async () => {
    try {
      const [allSongs, allArtists] = await Promise.all([
        base44.entities.Song.list('-created_date', 5000),
        base44.entities.Artist.list('-created_date', 5000),
      ]);
      setStats({ songs: allSongs.length, artists: allArtists.length });
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
    // Refresh stats after each file
    loadStats();
    return { title: parsed.title, artist: parsed.artistName, updated: song.updated };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#2b3138] border-t-[#ff7a00] rounded-full animate-spin" />
      </div>
    );
  }

  // Only admin email can access — checked after all hooks
  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[#a7afb8]">Página no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
        <p className="text-[#a7afb8] text-sm mt-1">
          Importa archivos .txt directamente a cada categoría del catálogo.
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <FileDropZone
          label="Cifrados"
          type="cifrado"
          color="bg-blue-500"
          onProcess={processFile}
        />
        <FileDropZone
          label="Tablaturas"
          type="tablatura"
          color="bg-purple-500"
          onProcess={processFile}
        />
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-[#1a1d21] border border-[#2b3138] rounded-xl p-5">
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
          Si el archivo no tiene encabezados, el sistema intentará extraer artista y título desde el nombre del archivo.<br />
          Formato de nombre recomendado: <code className="text-[#ff7a00]">Juanes - La Camisa Negra.txt</code>
        </p>
      </div>
    </div>
  );
}