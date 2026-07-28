import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { Music, Users, FileText, X, Sparkles, Save, Palette, Type, LogOut } from 'lucide-react';
import FileDropZone from '@/components/admin/FileDropZone';
import { parseFileContent } from '@/lib/fileParser';
import { useAuth } from '@/lib/AuthContext';
import AdminStats from '@/components/admin/AdminStats';
import TrendingManager from '@/components/admin/TrendingManager';
import HeroBannerManager from '@/components/admin/HeroBannerManager';
import AmazonProductsManager from '@/components/admin/AmazonProductsManager';
import CatalogTab from '@/components/admin/CatalogTab';
import ArtistsManager from '@/components/admin/ArtistsManager';
import SpotifySyncAdmin from '@/components/admin/SpotifySyncAdmin';
import SongCreatorForm from '@/components/admin/SongCreatorForm';
import SeoManager from '@/components/admin/SeoManager';
import SitemapPanel from '@/components/admin/SitemapPanel';
import FacebookPostManager from '@/components/admin/FacebookPostManager';
import InfographicsManager from '@/components/admin/InfographicsManager';
import SongFlagsRepair from '@/components/admin/SongFlagsRepair';
import { invalidateArtistImage } from '@/components/ArtistAvatar';
import { getYouTubeVideoId } from '@/lib/youtubePractice';

const THEME_COLORS = [
  { label: 'Naranja', value: '28 100% 50%' },
  { label: 'Azul', value: '217 91% 60%' },
  { label: 'Verde', value: '142 76% 36%' },
  { label: 'Violeta', value: '262 83% 58%' },
  { label: 'Rosa', value: '330 81% 60%' },
  { label: 'Rojo', value: '0 84% 60%' },
];

const FONT_OPTIONS = [
  { label: 'Montserrat', value: "'Montserrat', ui-sans-serif, system-ui, sans-serif" },
  { label: 'Inter', value: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { label: 'Poppins', value: "'Poppins', ui-sans-serif, system-ui, sans-serif" },
  { label: 'Roboto', value: "'Roboto', ui-sans-serif, system-ui, sans-serif" },
  { label: 'System', value: "ui-sans-serif, system-ui, sans-serif" },
];

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

  // Create artist first
  const created = await base44.entities.Artist.create({
    name: artistName,
    slug: artistSlug,
    normalized_name: artistName.toLowerCase(),
    is_demo: false,
  });

  // Auto-fetch Spotify image in background
  try {
    const res = await base44.functions.invoke('spotifyArtist', { artist_name: artistName });
    if (res?.data?.image_url) {
      await base44.entities.Artist.update(created.id, { image_url: res.data.image_url });
    }
  } catch {}

  return created;
}

async function upsertSong(parsed, artist) {
  const existing = await base44.entities.Song.filter({
    slug: parsed.slug,
    artist_slug: parsed.artistSlug,
  });
  const data = {
    title: parsed.title,
    slug: parsed.slug,
    artist_name: artist?.name || parsed.artistName,
    artist_slug: artist?.slug || parsed.artistSlug,
    ...(artist?.id ? { artist_id: artist.id } : {}),
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

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m','Am','A#m','Bm'];

function SongEditor({ song, onClose, onSaved }) {
  const [title, setTitle] = useState(song.title || '');
  const [originalKey, setOriginalKey] = useState(song.original_key || '');
  const [content, setContent] = useState(song.content_raw || song.tablature || '');
  const [spotifyEmbed, setSpotifyEmbed] = useState(song.spotify_embed || '');
  const [youtubeUrl, setYoutubeUrl] = useState(song.youtube_embed || (song.youtube_video_id ? `https://www.youtube.com/watch?v=${song.youtube_video_id}` : ''));
  const [analysisStatus, setAnalysisStatus] = useState(song.youtube_analysis_status || 'not_requested');
  const [artistRecord, setArtistRecord] = useState(null);
  const [artistImageUrl, setArtistImageUrl] = useState('');
  const [artistSpotifyUrl, setArtistSpotifyUrl] = useState('');
  const [isUnplugged, setIsUnplugged] = useState(Boolean(song.is_unplugged));
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  // Always reflect the freshest saved data (the in-memory list may be stale).
  useEffect(() => {
    let active = true;
    base44.entities.Song.filter({ id: song.id }).then((rows) => {
      const fresh = rows?.[0];
      if (active && fresh) {
        setTitle(fresh.title || '');
        setOriginalKey(fresh.original_key || '');
        setContent(fresh.content_raw || fresh.tablature || '');
        setSpotifyEmbed(fresh.spotify_embed || '');
        setYoutubeUrl(fresh.youtube_embed || (fresh.youtube_video_id ? `https://www.youtube.com/watch?v=${fresh.youtube_video_id}` : ''));
        setAnalysisStatus(fresh.youtube_analysis_status || 'not_requested');
        setIsUnplugged(Boolean(fresh.is_unplugged));
      }
    });
    return () => { active = false; };
  }, [song.id]);

  useEffect(() => {
    let active = true;
    const loadArtist = async () => {
      let artist = null;
      if (song.artist_id) {
        try { artist = await base44.entities.Artist.get(song.artist_id); } catch {}
      }
      if (!artist && song.artist_slug) {
        const rows = await base44.entities.Artist.filter({ slug: song.artist_slug }, '-created_date', 1);
        artist = rows?.[0] || null;
      }
      if (active) {
        setArtistRecord(artist);
        setArtistImageUrl(artist?.image_url || '');
        setArtistSpotifyUrl(artist?.spotify_artist_url || '');
      }
    };
    loadArtist().catch(() => {});
    return () => { active = false; };
  }, [song.id, song.artist_id, song.artist_slug]);

  const handleSave = async () => {
    setSaving(true);
    const isTab = song.has_tablature && !song.has_chords;
    const trimmedYoutubeUrl = youtubeUrl.trim();
    const youtubeVideoId = getYouTubeVideoId(trimmedYoutubeUrl);
    if (trimmedYoutubeUrl && !youtubeVideoId) {
      setSaving(false);
      alert('Pega un enlace válido de YouTube, por ejemplo https://www.youtube.com/watch?v=...');
      return;
    }

    // Some legacy imports predate Artist.artist_id. Do not make an editor
    // lose the ability to set an image because of that missing link: create
    // or reuse the central artist identity on save, then repair the song.
    let resolvedArtist = artistRecord;
    if (!resolvedArtist) {
      try {
        resolvedArtist = await upsertArtist(song.artist_name, song.artist_slug || slugify(song.artist_name));
        setArtistRecord(resolvedArtist);
      } catch (error) {
        setSaving(false);
        alert(error?.message || 'No se pudo crear el perfil del artista. Intenta guardar nuevamente.');
        return;
      }
    }

    // Build update payload
    const youtubeChanged = trimmedYoutubeUrl !== (song.youtube_embed || (song.youtube_video_id ? `https://www.youtube.com/watch?v=${song.youtube_video_id}` : ''));
    const updateData = {
      title,
      original_key: originalKey || null,
      ...(isTab ? { tablature: content } : { content_raw: content }),
      spotify_embed: spotifyEmbed || null,
      youtube_embed: trimmedYoutubeUrl || null,
      youtube_video_id: youtubeVideoId || null,
      ...(youtubeChanged ? {
        youtube_practice_enabled: false,
        youtube_practice_map: null,
        youtube_analysis_status: youtubeVideoId ? 'queued' : 'not_requested',
        youtube_analysis_error: null,
      } : {}),
      // A pasted player is an editorial decision. Protect it from all future
      // automatic syncs until an administrator deliberately replaces it.
      spotify_manual_lock: Boolean(spotifyEmbed),
      ...(spotifyEmbed ? {
        spotify_match_status: 'matched',
        spotify_match_method: 'manual',
      } : {}),
      artist_id: resolvedArtist.id,
      artist_name: resolvedArtist.name,
      artist_slug: resolvedArtist.slug,
      is_unplugged: isUnplugged,
    };
    await base44.entities.Song.update(song.id, updateData);

    if (youtubeVideoId && youtubeChanged) {
      try {
        await base44.functions.invoke('requestYouTubePracticeAnalysis', { songId: song.id });
        setAnalysisStatus('queued');
      } catch (error) {
        alert(error?.response?.data?.error || 'La canción se guardó, pero no se pudo iniciar el análisis de YouTube.');
      }
    }

    // Artist images are deliberately kept on Artist, not copied into Song.
    // This one update is reflected by every song/card for this artist.
    if (resolvedArtist && (
      artistImageUrl.trim() !== (resolvedArtist.image_url || '') ||
      artistSpotifyUrl.trim() !== (resolvedArtist.spotify_artist_url || '')
    )) {
      const artistUpdate = {
        image_url: artistImageUrl.trim() || null,
        spotify_artist_url: artistSpotifyUrl.trim() || null,
      };
      await base44.entities.Artist.update(resolvedArtist.id, artistUpdate);
      invalidateArtistImage({ id: resolvedArtist.id, slug: resolvedArtist.slug });
    }

    // If spotify_embed was set, sync it to other parts of the same song (same base title + artist)
    if (spotifyEmbed) {
      const baseName = song.title.replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '').replace(/\s*\d+$/, '').trim();
      const siblings = await base44.entities.Song.filter({ artist_slug: song.artist_slug });
      const toSync = siblings.filter((s) => {
        if (s.id === song.id) return false;
        const sBase = s.title.replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '').replace(/\s*\d+$/, '').trim();
        return sBase.toLowerCase() === baseName.toLowerCase();
      });
      await Promise.all(toSync.map((s) => base44.entities.Song.update(s.id, {
        spotify_embed: spotifyEmbed,
        spotify_match_status: 'matched',
        spotify_match_method: 'manual',
        spotify_manual_lock: true,
      })));
    }

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
      <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex-1 min-w-0 mr-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-foreground font-bold text-lg bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none w-full"
              placeholder="Título de la canción"
            />
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground text-sm">{song.artist_name}</p>
              <select
                value={originalKey}
                onChange={e => setOriginalKey(e.target.value)}
                className="text-xs bg-transparent border border-border rounded px-2 py-0.5 text-foreground outline-none focus:border-primary"
              >
                <option value="">Sin tonalidad</option>
                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Asistente IA
          </p>
          <div className="flex gap-2">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAI()}
              placeholder='Ej: "Agrega la segunda estrofa que falta" o "Corrige los acordes del coro"'
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            />
            <button
              onClick={handleAI}
              disabled={aiLoading || !aiPrompt.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center gap-2 whitespace-nowrap"
            >
              {aiLoading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Mejorar con IA</>
              )}
            </button>
          </div>
        </div>

        {/* Spotify embed manual */}
        <div className="px-4 py-3 border-b border-border bg-secondary/20">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">🎵 Código embed de Spotify (opcional)</p>
          <input
            value={spotifyEmbed}
            onChange={(e) => setSpotifyEmbed(e.target.value)}
            placeholder='Pega aquí el iframe de Spotify: <iframe src="https://open.spotify.com/embed/track/...">'
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary font-mono"
          />
          <p className="text-xs text-muted-foreground mt-1">En Spotify → compartir canción → Insertar → copia el código iframe.</p>
        </div>

        {/* Practice video — a normal YouTube link is enough */}
        <div className="px-4 py-3 border-b border-border bg-red-50/30">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">▶ Video para Práctica IA + YouTube (opcional)</p>
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="Pega el enlace: https://www.youtube.com/watch?v=..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-red-500"
          />
          <p className="text-xs text-muted-foreground mt-1">Solo pega la URL. Al guardar, GuitarraIA analiza el video de forma privada y sincroniza los acordes del cifrado sin que tengas que crear un mapa manual.</p>
          {youtubeUrl && <p className="mt-2 text-xs font-medium text-red-600">Estado de práctica: {analysisStatus === 'ready' ? 'lista para publicar' : analysisStatus === 'error' ? 'requiere reintento' : 'analizando automáticamente'}</p>}
        </div>

        <div className="px-4 py-3 border-b border-border bg-secondary/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Imagen de {song.artist_name} (URL Spotify)</p>
            <input
              value={artistImageUrl}
              onChange={(e) => setArtistImageUrl(e.target.value)}
              placeholder="https://i.scdn.co/image/..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-medium">Perfil de artista en Spotify</p>
            <input
              value={artistSpotifyUrl}
              onChange={(e) => setArtistSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary"
            />
          </div>
          {!artistRecord && <p className="text-xs text-amber-600 sm:col-span-2">Esta canción aún no tiene un perfil de artista. Puedes pegar la imagen: al guardar se creará o vinculará automáticamente.</p>}
          <p className="text-xs text-muted-foreground sm:col-span-2">Guardar aquí actualiza la identidad del artista para todas sus canciones; no se duplica la imagen en el catálogo.</p>
        </div>

        <label className="mx-4 my-3 flex items-center gap-2 text-sm text-foreground cursor-pointer">
          <input type="checkbox" checked={isUnplugged} onChange={(event) => setIsUnplugged(event.target.checked)} className="accent-primary w-4 h-4" />
          Incluir en la landing Unplugged
        </label>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 bg-background text-foreground font-mono text-sm p-4 resize-none outline-none min-h-0"
          spellCheck={false}
        />

        <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeSettings() {
  const [activeColor, setActiveColor] = useState(() => {
    return localStorage.getItem('themeColor') || '28 100% 50%';
  });
  const [activeFont, setActiveFont] = useState(() => {
    return localStorage.getItem('themeFont') || "'Montserrat', ui-sans-serif, system-ui, sans-serif";
  });

  const applyColor = (value) => {
    document.documentElement.style.setProperty('--primary', value);
    document.documentElement.style.setProperty('--accent', value);
    document.documentElement.style.setProperty('--ring', value);
    localStorage.setItem('themeColor', value);
    setActiveColor(value);
  };

  const applyFont = (value) => {
    document.documentElement.style.setProperty('--font-heading', value);
    document.documentElement.style.setProperty('--font-body', value);
    document.documentElement.style.setProperty('--font-display', value);
    localStorage.setItem('themeFont', value);
    setActiveFont(value);
  };

  const colorDots = {
    '28 100% 50%': '#ff7a00',
    '217 91% 60%': '#4f8ef7',
    '142 76% 36%': '#1e8a45',
    '262 83% 58%': '#7c3aed',
    '330 81% 60%': '#e6458b',
    '0 84% 60%': '#e63946',
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="text-foreground font-semibold">Color del tema</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {THEME_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => applyColor(c.value)}
              title={c.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                activeColor === c.value
                  ? 'border-foreground scale-105'
                  : 'border-border hover:border-foreground/50'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full inline-block"
                style={{ background: colorDots[c.value] }}
              />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-5 h-5 text-primary" />
          <h3 className="text-foreground font-semibold">Fuente</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => applyFont(f.value)}
              className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                activeFont === f.value
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border text-foreground hover:border-primary/50'
              }`}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
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
  const [tab, setTab] = useState('catalog');
  const { user, logout } = useAuth();

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

  // Apply saved theme settings on mount
  useEffect(() => {
    const savedColor = localStorage.getItem('themeColor');
    const savedFont = localStorage.getItem('themeFont');
    if (savedColor) {
      document.documentElement.style.setProperty('--primary', savedColor);
      document.documentElement.style.setProperty('--accent', savedColor);
      document.documentElement.style.setProperty('--ring', savedColor);
    }
    if (savedFont) {
      document.documentElement.style.setProperty('--font-heading', savedFont);
      document.documentElement.style.setProperty('--font-body', savedFont);
      document.documentElement.style.setProperty('--font-display', savedFont);
    }
  }, []);

  const processFile = async (content, fileName, contentType) => {
    const parsed = parseFileContent(content, fileName, contentType);
    if (!parsed.title || parsed.title.length < 2) throw new Error('No se pudo detectar el título');
    if (!parsed.artistSlug) throw new Error('No se pudo detectar el artista');
    const artist = await upsertArtist(parsed.artistName, parsed.artistSlug);
    const song = await upsertSong(parsed, artist);
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

  const handleBulkDelete = async (songIds) => {
    for (const id of songIds) {
      await base44.entities.Song.delete(id);
    }
    loadStats();
  };

  const handleBulkStatus = async (songIds, action) => {
    if (action === 'publish' || action === 'unpublish') {
      const status = action === 'publish' ? 'published' : 'unpublished';
      await Promise.all(songIds.map((id) => base44.entities.Song.update(id, { status })));
    } else if (action === 'review') {
      await Promise.all(songIds.map((id) => base44.entities.Song.update(id, { spotify_match_status: 'review_required' })));
    } else if (action === 'spotify' || action === 'retry' || action === 'verify_spotify') {
      // Sequential to respect Spotify API limits; skips embeds that already exist server-side.
      for (const id of songIds) {
        try {
          await base44.functions.invoke('syncSpotifyForSong', {
            songId: id,
            revalidate: action === 'verify_spotify',
          });
        } catch {}
      }
    }
    loadStats();
  };

  const handleToggleEasyPick = async (song) => {
    await base44.entities.Song.update(song.id, { is_easy_pick: !song.is_easy_pick });
    setAllSongsList((previous) => previous.map((item) => item.id === song.id ? { ...item, is_easy_pick: !song.is_easy_pick } : item));
  };

  const handleToggleUnplugged = async (song) => {
    await base44.entities.Song.update(song.id, { is_unplugged: !song.is_unplugged });
    setAllSongsList((previous) => previous.map((item) => item.id === song.id ? { ...item, is_unplugged: !song.is_unplugged } : item));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // AdminRoute already guards this page (auth + platform admin role).
  // This is a defensive fallback in case it is ever rendered unguarded.
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Página no encontrada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-g-page">
    <div className="max-w-6xl mx-auto p-4 lg:p-8">
      {editingSong && (
        <SongEditor
          song={editingSong}
          onClose={() => setEditingSong(null)}
          onSaved={loadStats}
        />
      )}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Importa, edita y personaliza el catálogo.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Sesión: {user.email}
            {user.admin_role ? ` · ${user.admin_role}` : ''}
          </p>
        </div>
        <button
          onClick={() => logout(true)}
          className="flex items-center gap-2 shrink-0 px-3 min-h-11 rounded-lg bg-secondary text-muted-foreground hover:text-foreground border border-border text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <Music className="w-5 h-5 text-primary mb-2" />
          <p className="text-3xl font-bold text-foreground">{stats.songs}</p>
          <p className="text-muted-foreground text-sm mt-1">Canciones</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <Users className="w-5 h-5 text-primary mb-2" />
          <p className="text-3xl font-bold text-foreground">{stats.artists}</p>
          <p className="text-muted-foreground text-sm mt-1">Artistas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <FileText className="w-5 h-5 text-primary mb-2" />
          <p className="text-3xl font-bold text-foreground">{stats.songs}</p>
          <p className="text-muted-foreground text-sm mt-1">Total archivos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-6">
        {[
          { id: 'new-song', label: '+ Canción' }, { id: 'catalog', label: 'Catálogo' }, { id: 'artists', label: 'Artistas' },
          { id: 'import', label: 'Importar' }, { id: 'hero', label: 'Hero Banner' }, { id: 'trending', label: 'Tendencias' },
          { id: 'store', label: 'Guitar Store' }, { id: 'infographics', label: 'Infografías' }, { id: 'spotify', label: 'Spotify Sync' },
          { id: 'seo', label: 'SEO' }, { id: 'sitemap', label: 'Sitemap' }, { id: 'stats', label: 'Estadísticas' },
          { id: 'facebook', label: 'Facebook' }, { id: 'repair', label: 'Reparar canciones' }, { id: 'theme', label: 'Tema' },
        ].map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`min-h-11 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-card text-foreground border border-border shadow-sm' : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-card'}`}>{t.label}</button>)}
      </div>

      {tab === 'new-song' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-foreground font-semibold text-lg mb-1">Nueva canción</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Crea una canción manualmente. El artista se reutilizará si ya existe, o se creará automáticamente. El Spotify sync se ejecutará en segundo plano.
          </p>
          <SongCreatorForm onCreated={loadStats} />
        </div>
      )}

      {tab === 'import' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <FileDropZone label="Cifrados" type="cifrado" color="bg-blue-500" onProcess={processFile} />
            <FileDropZone label="Tablaturas" type="tablatura" color="bg-purple-500" onProcess={processFile} />
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-foreground font-semibold mb-2 text-sm">📋 Formato recomendado para los archivos .txt</p>
            <pre className="text-muted-foreground text-xs leading-relaxed font-mono whitespace-pre">{`Título: La Camisa Negra
Artista: Juanes
Tonalidad: Am
Capo: 3
Afinación: Estándar

[Intro]
Am  F  C  G

[Verso]
Am                F
Tengo la camisa negra...`}</pre>
            <p className="text-muted-foreground text-xs mt-3">
              Formato de nombre recomendado: <code className="text-primary">Juanes - La Camisa Negra.txt</code>
            </p>
          </div>
        </>
      )}

      {tab === 'artists' && <ArtistsManager />}

      {tab === 'catalog' && (
        <CatalogTab
          allSongsList={allSongsList}
          onEdit={setEditingSong}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onBulkStatus={handleBulkStatus}
          onToggleEasyPick={handleToggleEasyPick}
          onToggleUnplugged={handleToggleUnplugged}
          deletingId={deletingId}
        />
      )}

      {tab === 'hero' && (
        <HeroBannerManager allSongs={allSongsList} onRefresh={loadStats} />
      )}

      {tab === 'trending' && (
        <TrendingManager allSongs={allSongsList} onRefresh={loadStats} />
      )}

      {tab === 'store' && (
        <AmazonProductsManager />
      )}

      {tab === 'infographics' && <InfographicsManager />}

      {tab === 'spotify' && (
        <SpotifySyncAdmin allSongs={allSongsList} onRefresh={loadStats} />
      )}

      {tab === 'seo' && (
        <SeoManager allSongs={allSongsList} onRefresh={loadStats} />
      )}

      {tab === 'sitemap' && (
        <SitemapPanel />
      )}

      {tab === 'stats' && (
        <AdminStats allSongs={allSongsList} />
      )}

      {tab === 'facebook' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <FacebookPostManager />
        </div>
      )}

      {tab === 'repair' && <SongFlagsRepair allSongsList={allSongsList} onCompleted={loadStats} />}

      {tab === 'theme' && <ThemeSettings />}
    </div>
    </div>
  );
}
