import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, RefreshCw, Star, StarOff, Image, Search, Edit2, X, Save } from 'lucide-react';

export default function ArtistsManager() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingImage, setFetchingImage] = useState({});
  const [editingArtist, setEditingArtist] = useState(null);
  const [editSpotifyUrl, setEditSpotifyUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Load all artists in batches of 500
      let all = [];
      let page = 0;
      const PAGE = 500;
      while (true) {
        const batch = await base44.entities.Artist.list('-created_date', PAGE, page * PAGE);
        if (!batch || batch.length === 0) break;
        all = [...all, ...batch];
        if (batch.length < PAGE) break;
        page++;
      }
      setArtists(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fetchAndSaveImage = async (artist) => {
    setFetchingImage(prev => ({ ...prev, [artist.id]: true }));
    try {
      const res = await base44.functions.spotifyArtist({ artist_name: artist.name });
      if (res?.image_url) {
        await base44.entities.Artist.update(artist.id, { image_url: res.image_url });
        setArtists(prev => prev.map(a => a.id === artist.id ? { ...a, image_url: res.image_url } : a));
      }
    } finally {
      setFetchingImage(prev => ({ ...prev, [artist.id]: false }));
    }
  };

  const toggleFeatured = async (artist) => {
    const newVal = !artist.is_featured;
    // Max 10 featured
    const currentFeatured = artists.filter(a => a.is_featured).length;
    if (newVal && currentFeatured >= 10) {
      alert('Solo puedes tener 10 artistas destacados. Quita uno primero.');
      return;
    }
    await base44.entities.Artist.update(artist.id, { is_featured: newVal });
    setArtists(prev => prev.map(a => a.id === artist.id ? { ...a, is_featured: newVal } : a));
  };

  const deleteArtist = async (id) => {
    if (!confirm('¿Eliminar este artista?')) return;
    await base44.entities.Artist.delete(id);
    setArtists(prev => prev.filter(a => a.id !== id));
  };

  const fetchAllMissingImages = async () => {
    const missing = artists.filter(a => !a.image_url);
    for (const artist of missing) {
      await fetchAndSaveImage(artist);
    }
  };

  const openEdit = (artist) => {
    setEditingArtist(artist);
    setEditSpotifyUrl(artist.spotify_artist_url || '');
  };

  const saveEdit = async () => {
    if (!editingArtist) return;
    setSavingEdit(true);
    const updates = { spotify_artist_url: editSpotifyUrl || null };

    // If a spotify artist URL is provided, try to fetch image from it
    if (editSpotifyUrl && !editingArtist.image_url) {
      try {
        const res = await base44.functions.spotifyArtist({ artist_name: editingArtist.name, spotify_url: editSpotifyUrl });
        if (res?.image_url) updates.image_url = res.image_url;
      } catch {}
    }

    await base44.entities.Artist.update(editingArtist.id, updates);
    setArtists(prev => prev.map(a => a.id === editingArtist.id ? { ...a, ...updates } : a));
    setSavingEdit(false);
    setEditingArtist(null);
  };

  const [search, setSearch] = useState('');
  const featured = artists.filter(a => a.is_featured);
  const rest = artists.filter(a => !a.is_featured).filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#303538', borderTopColor: '#FF7200' }} /></div>;

  return (
    <div className="space-y-5">

      {/* Edit Spotify URL modal */}
      {editingArtist && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-md" style={{ backgroundColor: '#181B1D', border: '1px solid #303538' }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #272C2F' }}>
              <p className="font-bold text-sm" style={{ color: '#F4F4F2' }}>Editar artista: {editingArtist.name}</p>
              <button onClick={() => setEditingArtist(null)}><X className="w-5 h-5" style={{ color: '#747B7F' }} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#A7ACAE' }}>URL del artista en Spotify</label>
                <input
                  value={editSpotifyUrl}
                  onChange={e => setEditSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#121516', border: '1px solid #303538', color: '#F4F4F2' }}
                />
                <p className="text-xs mt-1" style={{ color: '#555B5E' }}>Si el artista no tiene imagen, se intentará obtener automáticamente desde Spotify.</p>
              </div>
            </div>
            <div className="flex gap-3 p-4" style={{ borderTop: '1px solid #272C2F' }}>
              <button onClick={() => setEditingArtist(null)}
                className="flex-1 py-2 rounded-xl text-sm" style={{ color: '#747B7F', border: '1px solid #272C2F' }}>
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={savingEdit}
                className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#FF7200' }}>
                <Save className="w-4 h-4" />{savingEdit ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground font-semibold">{artists.length} artistas · <span style={{ color: '#FF7200' }}>{featured.length}/10 destacados</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">Los artistas destacados aparecen en el Home y en /artistas. Máximo 10.</p>
        </div>
        <button
          onClick={fetchAllMissingImages}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255,114,0,0.12)', color: '#FF7200', border: '1px solid rgba(255,114,0,0.3)' }}
        >
          <Image className="w-4 h-4" />
          Obtener imágenes faltantes
        </button>
      </div>

      {/* Featured section */}
      {featured.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold" style={{ color: '#FF7200' }}>⭐ Artistas destacados ({featured.length}/10)</p>
          </div>
          <div className="divide-y divide-border">
            {featured.map(artist => (
              <ArtistRow key={artist.id} artist={artist} onToggle={toggleFeatured} onDelete={deleteArtist} onFetchImage={fetchAndSaveImage} fetching={!!fetchingImage[artist.id]} onEdit={openEdit} />
            ))}
          </div>
        </div>
      )}

      {/* Rest */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">Todos los artistas ({artists.length} total)</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar artista..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: '#121516', border: '1px solid #303538', color: '#F4F4F2' }} />
          </div>
        </div>
        <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
          {rest.map(artist => (
            <ArtistRow key={artist.id} artist={artist} onToggle={toggleFeatured} onDelete={deleteArtist} onFetchImage={fetchAndSaveImage} fetching={!!fetchingImage[artist.id]} onEdit={openEdit} />
          ))}
          {rest.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">Todos los artistas están destacados.</p>}
        </div>
      </div>
    </div>
  );
}

function ArtistRow({ artist, onToggle, onDelete, onFetchImage, fetching, onEdit }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30">
      {/* Avatar */}
      {artist.image_url ? (
        <img src={artist.image_url} alt={artist.name} className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: '1px solid #303538' }} />
      ) : (
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
          style={{ backgroundColor: 'rgba(255,114,0,0.12)', color: '#FF7200', border: '1px solid rgba(255,114,0,0.2)' }}>
          {(artist.name || '?')[0].toUpperCase()}
        </div>
      )}
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{artist.name}</p>
        <p className="text-xs text-muted-foreground">{artist.image_url ? '✓ Imagen OK' : 'Sin imagen'}</p>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {!artist.image_url && (
          <button onClick={() => onFetchImage(artist)} disabled={fetching} title="Obtener imagen de Spotify"
            className="p-2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40">
            {fetching ? <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        )}
        <button onClick={() => onEdit(artist)} title="Editar artista"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onToggle(artist)} title={artist.is_featured ? 'Quitar de destacados' : 'Marcar como destacado'}
          className="p-2 transition-colors"
          style={{ color: artist.is_featured ? '#FF7200' : '#444A4E' }}>
          {artist.is_featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
        </button>
        <button onClick={() => onDelete(artist.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}