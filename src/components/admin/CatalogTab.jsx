import { useState, useMemo, useEffect } from 'react';
import { Edit2, Trash2, CheckSquare, Square, Search, X } from 'lucide-react';
import ArtistSelect from '@/components/admin/catalog/ArtistSelect';
import { resolveSpotifyStatus, hasValidEmbed } from '@/components/admin/catalog/spotifyStatus';

const CONTENT_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'chords', label: 'Con acordes' },
  { value: 'tab', label: 'Con tablatura' },
];

const SPOTIFY_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'with', label: 'Con embed' },
  { value: 'without', label: 'Sin embed' },
  { value: 'review', label: 'Revisión' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'published', label: 'Publicadas' },
  { value: 'unpublished', label: 'Despublicadas' },
];

const PAGE_SIZES = [25, 50, 100];

function isPublished(song) {
  return song.status !== 'draft' && song.status !== 'unpublished';
}

export default function CatalogTab({ allSongsList, onEdit, onDelete, onBulkDelete, onBulkStatus, deletingId }) {
  const [search, setSearch] = useState('');
  const [artistSlug, setArtistSlug] = useState('');
  const [contentFilter, setContentFilter] = useState('all');
  const [spotifyFilter, setSpotifyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const artists = useMemo(() => {
    const map = new Map();
    allSongsList.forEach((s) => {
      if (!map.has(s.artist_slug)) map.set(s.artist_slug, { name: s.artist_name, slug: s.artist_slug, count: 0 });
      map.get(s.artist_slug).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSongsList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSongsList.filter((song) => {
      const matchText =
        !q ||
        song.title.toLowerCase().includes(q) ||
        song.artist_name.toLowerCase().includes(q) ||
        (song.id && song.id.toLowerCase().includes(q));
      const matchArtist = !artistSlug || song.artist_slug === artistSlug;
      const matchContent =
        contentFilter === 'all' ||
        (contentFilter === 'chords' && song.has_chords) ||
        (contentFilter === 'tab' && song.has_tablature);
      const matchSpotify =
        spotifyFilter === 'all' ||
        (spotifyFilter === 'with' && hasValidEmbed(song)) ||
        (spotifyFilter === 'without' && !hasValidEmbed(song)) ||
        (spotifyFilter === 'review' && song.spotify_match_status === 'review_required');
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && isPublished(song)) ||
        (statusFilter === 'unpublished' && !isPublished(song));
      return matchText && matchArtist && matchContent && matchSpotify && matchStatus;
    });
  }, [allSongsList, search, artistSlug, contentFilter, spotifyFilter, statusFilter]);

  // Reset to first page whenever filters change.
  useEffect(() => { setPage(1); }, [search, artistSlug, contentFilter, spotifyFilter, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const activeChips = [
    artistSlug && { key: 'artist', label: `Artista: ${artists.find((a) => a.slug === artistSlug)?.name || ''}`, clear: () => setArtistSlug('') },
    contentFilter !== 'all' && { key: 'content', label: CONTENT_FILTERS.find((f) => f.value === contentFilter)?.label, clear: () => setContentFilter('all') },
    spotifyFilter !== 'all' && { key: 'spotify', label: `Spotify: ${SPOTIFY_FILTERS.find((f) => f.value === spotifyFilter)?.label}`, clear: () => setSpotifyFilter('all') },
    statusFilter !== 'all' && { key: 'status', label: STATUS_FILTERS.find((f) => f.value === statusFilter)?.label, clear: () => setStatusFilter('all') },
    search.trim() && { key: 'search', label: `"${search.trim()}"`, clear: () => setSearch('') },
  ].filter(Boolean);

  const clearAll = () => {
    setSearch(''); setArtistSlug(''); setContentFilter('all'); setSpotifyFilter('all'); setStatusFilter('all');
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allPageSelected = pageItems.length > 0 && pageItems.every((s) => selected.has(s.id));
  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageItems.forEach((s) => next.delete(s.id));
      else pageItems.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const runBulk = async (action) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (action === 'delete') {
      if (!confirm(`¿Eliminar permanentemente ${ids.length} canción(es)? Esta acción no se puede deshacer.`)) return;
      setBulkBusy(true);
      await onBulkDelete(ids);
    } else if (onBulkStatus) {
      setBulkBusy(true);
      await onBulkStatus(ids, action);
    }
    setSelected(new Set());
    setBulkBusy(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Search + filters */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por canción, artista o ID"
            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <ArtistSelect artists={artists} value={artistSlug} onChange={setArtistSlug} />
          <select value={contentFilter} onChange={(e) => setContentFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
            {CONTENT_FILTERS.map((f) => <option key={f.value} value={f.value}>Contenido: {f.label}</option>)}
          </select>
          <select value={spotifyFilter} onChange={(e) => setSpotifyFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
            {SPOTIFY_FILTERS.map((f) => <option key={f.value} value={f.value}>Spotify: {f.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary">
            {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>Estado: {f.label}</option>)}
          </select>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeChips.map((chip) => (
              <button key={chip.key} onClick={chip.clear}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-secondary text-muted-foreground hover:text-foreground border border-border transition-colors">
                {chip.label} <X className="w-3 h-3" />
              </button>
            ))}
            <button onClick={clearAll} className="px-2.5 py-1 rounded-full text-xs font-medium text-primary hover:underline">
              Limpiar filtros
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {filtered.length} de {allSongsList.length} canciones ·{' '}
          {allSongsList.filter(hasValidEmbed).length} con embed Spotify
        </p>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border bg-primary/5">
          <span className="text-xs font-medium text-foreground mr-1">{selected.size} seleccionada(s):</span>
          <BulkBtn disabled={bulkBusy} onClick={() => runBulk('spotify')}>Buscar embed</BulkBtn>
          <BulkBtn disabled={bulkBusy} onClick={() => runBulk('retry')}>Reintentar</BulkBtn>
          <BulkBtn disabled={bulkBusy} onClick={() => runBulk('review')}>Marcar revisión</BulkBtn>
          <BulkBtn disabled={bulkBusy} onClick={() => runBulk('publish')}>Publicar</BulkBtn>
          <BulkBtn disabled={bulkBusy} onClick={() => runBulk('unpublish')}>Despublicar</BulkBtn>
          <button onClick={() => runBulk('delete')} disabled={bulkBusy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-40 transition-opacity">
            {bulkBusy ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Eliminar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="w-10 px-3 py-2.5">
                <button onClick={togglePage} title="Seleccionar página">
                  {allPageSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              <th className="text-left px-2 py-2.5 font-medium">Canción</th>
              <th className="text-left px-2 py-2.5 font-medium hidden sm:table-cell">Artista</th>
              <th className="text-left px-2 py-2.5 font-medium hidden md:table-cell">Contenido</th>
              <th className="text-left px-2 py-2.5 font-medium">Spotify</th>
              <th className="text-left px-2 py-2.5 font-medium hidden lg:table-cell">Estado</th>
              <th className="w-20 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {pageItems.map((song) => {
              const isChecked = selected.has(song.id);
              const st = resolveSpotifyStatus(song);
              const pub = isPublished(song);
              return (
                <tr key={song.id} className={`border-b border-border/60 hover:bg-secondary/30 ${isChecked ? 'bg-primary/5' : ''}`}>
                  <td className="px-3 py-2.5 align-middle">
                    <button onClick={() => toggleOne(song.id)}>
                      {isChecked ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="px-2 py-2.5 min-w-0">
                    <p className="text-foreground font-medium truncate max-w-[220px]">{song.title}</p>
                    <p className="text-muted-foreground text-xs sm:hidden truncate max-w-[220px]">{song.artist_name}</p>
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground hidden sm:table-cell">
                    <span className="truncate block max-w-[160px]">{song.artist_name}</span>
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground text-xs hidden md:table-cell whitespace-nowrap">
                    {song.has_chords ? 'Acordes' : ''}
                    {song.has_chords && song.has_tablature ? ' + ' : ''}
                    {song.has_tablature ? 'Tab' : ''}
                    {!song.has_chords && !song.has_tablature ? '—' : ''}
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 hidden lg:table-cell">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={pub ? { backgroundColor: 'rgba(89,184,121,0.15)', color: '#59B879' } : { backgroundColor: 'rgba(116,123,127,0.15)', color: '#747B7F' }}>
                      {pub ? 'Publicada' : 'Oculta'}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => onEdit(song)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors" title="Editar">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(song.id)} disabled={deletingId === song.id}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40" title="Eliminar">
                        {deletingId === song.id
                          ? <div className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-10">No hay canciones que coincidan.</p>
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mostrar</span>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-foreground outline-none focus:border-primary">
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {pageStart + 1}–{Math.min(pageStart + pageSize, filtered.length)} de {filtered.length}
            </span>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded-lg text-xs bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
              Anterior
            </button>
            <span className="text-xs text-foreground">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1 rounded-lg text-xs bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BulkBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground hover:bg-card border border-border disabled:opacity-40 transition-colors">
      {children}
    </button>
  );
}