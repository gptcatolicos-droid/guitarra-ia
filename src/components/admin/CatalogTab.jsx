import { useState, useMemo } from 'react';
import { Edit2, Trash2, CheckSquare, Square } from 'lucide-react';

export default function CatalogTab({ allSongsList, onEdit, onDelete, onBulkDelete, deletingId }) {
  const [search, setSearch] = useState('');
  const [filterEmbed, setFilterEmbed] = useState('all'); // 'all' | 'with' | 'without'
  const [selected, setSelected] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filtered = useMemo(() => allSongsList.filter((song) => {
    const q = search.toLowerCase();
    const matchText =
      !q ||
      song.title.toLowerCase().includes(q) ||
      song.artist_name.toLowerCase().includes(q);
    const matchEmbed =
      filterEmbed === 'all' ||
      (filterEmbed === 'with' && !!song.spotify_embed) ||
      (filterEmbed === 'without' && !song.spotify_embed);
    return matchText && matchEmbed;
  }), [allSongsList, search, filterEmbed]);

  // Distinct artists among the filtered songs
  const artistsInView = useMemo(() => {
    const map = new Map();
    filtered.forEach((s) => {
      if (!map.has(s.artist_slug)) map.set(s.artist_slug, { name: s.artist_name, slug: s.artist_slug, count: 0 });
      map.get(s.artist_slug).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  };

  const selectArtist = (slug) => {
    const ids = filtered.filter((s) => s.artist_slug === slug).map((s) => s.id);
    setSelected(new Set(ids));
  };

  const runBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`¿Eliminar permanentemente ${ids.length} canción(es)? Esta acción no se puede deshacer.`)) return;
    setBulkDeleting(true);
    await onBulkDelete(ids);
    setSelected(new Set());
    setBulkDeleting(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border space-y-3">
        <h2 className="text-foreground font-semibold">Canciones en el catálogo</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o artista..."
            className="flex-1 min-w-[180px] bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
          />
          <div className="flex gap-1">
            {[
              { value: 'all', label: 'Todas' },
              { value: 'with', label: '🟢 Con embed' },
              { value: 'without', label: '⚪ Sin embed' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterEmbed(opt.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filterEmbed === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick-select por artista */}
        {artistsInView.length > 1 && (
          <div className="flex gap-1.5 flex-wrap items-center">
            <span className="text-xs text-muted-foreground mr-1">Seleccionar artista:</span>
            {artistsInView.slice(0, 20).map((a) => (
              <button
                key={a.slug}
                onClick={() => selectArtist(a.slug)}
                className="px-2.5 py-1 rounded-md text-xs bg-secondary text-muted-foreground hover:text-foreground hover:bg-card border border-border transition-colors"
                title={`Seleccionar las ${a.count} canciones de ${a.name}`}
              >
                {a.name} <span className="opacity-60">({a.count})</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            {filtered.length} de {allSongsList.length} canciones ·{' '}
            {allSongsList.filter((s) => s.spotify_embed).length} con embed Spotify
          </p>
          {selected.size > 0 && (
            <button
              onClick={runBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {bulkDeleting ? (
                <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Eliminando...</>
              ) : (
                <><Trash2 className="w-3.5 h-3.5" /> Eliminar {selected.size} seleccionada(s)</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Select-all header */}
      {filtered.length > 0 && (
        <button
          onClick={toggleAll}
          className="w-full flex items-center gap-2 px-4 py-2.5 border-b border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
        >
          {allFilteredSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
          {allFilteredSelected ? 'Deseleccionar todas' : `Seleccionar todas las visibles (${filtered.length})`}
        </button>
      )}

      <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
        {filtered.map((song) => {
          const isChecked = selected.has(song.id);
          return (
            <div key={song.id} className={`flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/30 ${isChecked ? 'bg-primary/5' : ''}`}>
              <div className="min-w-0 flex items-center gap-2.5">
                <button onClick={() => toggleOne(song.id)} className="shrink-0" title="Seleccionar">
                  {isChecked ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                </button>
                {/* Spotify embed indicator */}
                <span
                  title={song.spotify_embed ? 'Tiene embed de Spotify' : 'Sin embed de Spotify'}
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${song.spotify_embed ? 'bg-green-500' : 'bg-border'}`}
                />
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{song.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {song.artist_name} ·{' '}
                    {song.has_chords ? 'Acordes' : ''}
                    {song.has_chords && song.has_tablature ? ' + ' : ''}
                    {song.has_tablature ? 'Tab' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onEdit(song)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="Editar cifrado"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(song.id)}
                  disabled={deletingId === song.id}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                  title="Eliminar canción"
                >
                  {deletingId === song.id ? (
                    <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No hay canciones que coincidan.</p>
        )}
      </div>
    </div>
  );
}