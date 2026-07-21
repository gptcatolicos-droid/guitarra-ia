import { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function CatalogTab({ allSongsList, onEdit, onDelete, deletingId }) {
  const [search, setSearch] = useState('');
  const [filterEmbed, setFilterEmbed] = useState('all'); // 'all' | 'with' | 'without'

  const filtered = allSongsList.filter((song) => {
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
  });

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
        <p className="text-xs text-muted-foreground">
          {filtered.length} de {allSongsList.length} canciones ·{' '}
          {allSongsList.filter((s) => s.spotify_embed).length} con embed Spotify
        </p>
      </div>

      <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
        {filtered.map((song) => (
          <div key={song.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/30">
            <div className="min-w-0 flex items-center gap-2">
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
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">No hay canciones que coincidan.</p>
        )}
      </div>
    </div>
  );
}