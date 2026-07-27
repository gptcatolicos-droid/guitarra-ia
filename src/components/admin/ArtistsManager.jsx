import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, RefreshCw, Star, StarOff, Image, Search, Edit2, X, Save, Music2, Users, Disc3, ExternalLink } from 'lucide-react';
import { invalidateArtistImage } from '@/components/ArtistAvatar';
import ArtistBioManager from '@/components/admin/ArtistBioManager';

export default function ArtistsManager() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingImage, setFetchingImage] = useState({});
  const [editingArtist, setEditingArtist] = useState(null);
  const [editSpotifyUrl, setEditSpotifyUrl] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [loadingSpotifyProfile, setLoadingSpotifyProfile] = useState(false);

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
      const res = await base44.functions.invoke('spotifyArtist', { artist_name: artist.name });
      const image_url = res?.data?.image_url;
      if (image_url) {
        await base44.entities.Artist.update(artist.id, { image_url });
        setArtists(prev => prev.map(a => a.id === artist.id ? { ...a, image_url } : a));
        invalidateArtistImage({ id: artist.id, slug: artist.slug });
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
    setEditImageUrl(artist.image_url || '');
  };

  const openSpotifyProfile = async (artist) => {
    setSpotifyProfile({ artist, profile: null, error: null });
    setLoadingSpotifyProfile(true);
    try {
      const res = await base44.functions.invoke('spotifyArtist', {
        artist_name: artist.name,
        spotify_url: artist.spotify_artist_url || undefined,
        include_profile: true,
      });
      const data = res?.data;
      if (!data?.spotify_id) throw new Error('No se encontró una ficha de Spotify para este artista.');
      setSpotifyProfile({ artist: { ...artist, image_url: artist.image_url || data.image_url }, profile: data.profile, error: null });
    } catch (error) {
      setSpotifyProfile({ artist, profile: null, error: error?.message || 'No se pudo consultar Spotify.' });
    } finally {
      setLoadingSpotifyProfile(false);
    }
  };

  const saveEdit = async () => {
    if (!editingArtist) return;
    setSavingEdit(true);
    const directImageUrl = editImageUrl.trim();
    const updates = { spotify_artist_url: editSpotifyUrl.trim() || null };

    // A pasted Spotify image is an explicit editorial choice. If it is empty,
    // a Spotify profile URL can resolve the official image instead.
    if (directImageUrl) {
      updates.image_url = directImageUrl;
    } else if (editSpotifyUrl) {
      try {
        const res = await base44.functions.invoke('spotifyArtist', { artist_name: editingArtist.name, spotify_url: editSpotifyUrl });
        if (res?.data?.image_url) updates.image_url = res.data.image_url;
      } catch {}
    }

    await base44.entities.Artist.update(editingArtist.id, updates);
    setArtists(prev => prev.map(a => a.id === editingArtist.id ? { ...a, ...updates } : a));
    invalidateArtistImage({ id: editingArtist.id, slug: editingArtist.slug });
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

      <ArtistBioManager />

      {spotifyProfile && (
        <SpotifyProfileModal
          artist={spotifyProfile.artist}
          profile={spotifyProfile.profile}
          loading={loadingSpotifyProfile}
          error={spotifyProfile.error}
          onClose={() => setSpotifyProfile(null)}
        />
      )}

      {/* Artist identity modal */}
      {editingArtist && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-md" style={{ backgroundColor: '#181B1D', border: '1px solid #303538' }}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #272C2F' }}>
              <p className="font-bold text-sm" style={{ color: '#F4F4F2' }}>Editar artista: {editingArtist.name}</p>
              <button onClick={() => setEditingArtist(null)}><X className="w-5 h-5" style={{ color: '#747B7F' }} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#A7ACAE' }}>URL directa de imagen (Spotify)</label>
                <input
                  value={editImageUrl}
                  onChange={e => setEditImageUrl(e.target.value)}
                  placeholder="https://i.scdn.co/image/..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#121516', border: '1px solid #303538', color: '#F4F4F2' }}
                />
                <p className="text-xs mt-1" style={{ color: '#555B5E' }}>Es la imagen oficial que verán todas las canciones de este artista.</p>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: '#A7ACAE' }}>URL del artista en Spotify</label>
                <input
                  value={editSpotifyUrl}
                  onChange={e => setEditSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#121516', border: '1px solid #303538', color: '#F4F4F2' }}
                />
                <p className="text-xs mt-1" style={{ color: '#555B5E' }}>Si no pegas una imagen directa, usaremos esta URL para obtenerla desde Spotify.</p>
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
              <ArtistRow key={artist.id} artist={artist} onToggle={toggleFeatured} onDelete={deleteArtist} onFetchImage={fetchAndSaveImage} fetching={!!fetchingImage[artist.id]} onEdit={openEdit} onSpotifyProfile={openSpotifyProfile} />
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
            <ArtistRow key={artist.id} artist={artist} onToggle={toggleFeatured} onDelete={deleteArtist} onFetchImage={fetchAndSaveImage} fetching={!!fetchingImage[artist.id]} onEdit={openEdit} onSpotifyProfile={openSpotifyProfile} />
          ))}
          {rest.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">Todos los artistas están destacados.</p>}
        </div>
      </div>
    </div>
  );
}

function ArtistRow({ artist, onToggle, onDelete, onFetchImage, fetching, onEdit, onSpotifyProfile }) {
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
        <button onClick={() => onSpotifyProfile(artist)} title="Ver datos de Spotify"
          className="p-2 text-muted-foreground hover:text-green-500 transition-colors">
          <Music2 className="w-4 h-4" />
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

function SpotifyProfileModal({ artist, profile, loading, error, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" style={{ backgroundColor: '#181B1D', border: '1px solid #303538' }}>
        <div className="flex items-center justify-between gap-4 p-4" style={{ borderBottom: '1px solid #272C2F' }}>
          <div className="flex items-center gap-3 min-w-0">
            {artist.image_url ? <img src={artist.image_url} alt="" className="w-11 h-11 rounded-full object-cover" /> : <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(29,185,84,0.16)', color: '#1DB954' }}><Music2 className="w-5 h-5" /></div>}
            <div className="min-w-0"><p className="font-bold truncate" style={{ color: '#F4F4F2' }}>{artist.name}</p><p className="text-xs" style={{ color: '#A7ACAE' }}>Datos consultados en Spotify al abrir esta ficha</p></div>
          </div>
          <button onClick={onClose} className="p-2" style={{ color: '#A7ACAE' }} aria-label="Cerrar"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto p-4 space-y-5">
          {loading && <div className="py-12 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin" style={{ color: '#1DB954' }} /></div>}
          {!loading && error && <p className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(224,100,100,0.12)', color: '#FCA5A5' }}>{error}</p>}
          {!loading && profile && <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Metric icon={<Users className="w-4 h-4" />} label="Seguidores" value={new Intl.NumberFormat('es-CO').format(profile.followers || 0)} />
              <Metric icon={<Music2 className="w-4 h-4" />} label="Popularidad" value={profile.popularity == null ? '—' : `${profile.popularity}/100`} />
              <a href={profile.spotify_url || '#'} target="_blank" rel="noreferrer" className="rounded-xl p-3 flex flex-col justify-between hover:opacity-80" style={{ backgroundColor: '#121516', color: '#1DB954' }}><span className="text-xs font-semibold">Perfil oficial</span><span className="flex items-center gap-1 text-sm font-bold">Abrir Spotify <ExternalLink className="w-3.5 h-3.5" /></span></a>
            </div>
            {profile.genres?.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#747B7F' }}>Géneros</p><div className="flex flex-wrap gap-2">{profile.genres.map((genre) => <span key={genre} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(29,185,84,0.14)', color: '#8FE3AD' }}>{genre}</span>)}</div></div>}
            <SpotifyCollection title="Álbumes y sencillos" items={profile.albums} />
            <SpotifyCollection title="Temas principales" items={profile.top_tracks} tracks />
          </>}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }) {
  return <div className="rounded-xl p-3" style={{ backgroundColor: '#121516' }}><span className="flex items-center gap-1.5 text-xs" style={{ color: '#747B7F' }}>{icon}{label}</span><p className="font-bold mt-2" style={{ color: '#F4F4F2' }}>{value}</p></div>;
}

function SpotifyCollection({ title, items = [], tracks = false }) {
  if (!items.length) return null;
  return <div><p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#747B7F' }}>{title}</p><div className="grid sm:grid-cols-2 gap-2">{items.map((item) => <a key={item.id} href={item.spotify_url || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl hover:opacity-80" style={{ backgroundColor: '#121516' }}>
    {item.image_url ? <img src={item.image_url} alt="" className="w-10 h-10 rounded-md object-cover" /> : <Disc3 className="w-10 h-10 p-2 rounded-md" style={{ color: '#1DB954', backgroundColor: 'rgba(29,185,84,0.12)' }} />}
    <div className="min-w-0"><p className="text-sm font-semibold truncate" style={{ color: '#F4F4F2' }}>{item.name}</p><p className="text-xs truncate" style={{ color: '#747B7F' }}>{tracks ? item.album_name || 'Spotify' : [item.type, item.release_date].filter(Boolean).join(' · ')}</p></div><ExternalLink className="w-3.5 h-3.5 shrink-0 ml-auto" style={{ color: '#1DB954' }} />
  </a>)}</div></div>;
}
