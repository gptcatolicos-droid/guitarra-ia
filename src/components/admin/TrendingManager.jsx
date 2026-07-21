import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Star, StarOff, Search } from 'lucide-react';

export default function TrendingManager({ allSongs, onRefresh }) {
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(null);

  const filtered = allSongs.filter(s => {
    const q = query.toLowerCase();
    return !q || s.title.toLowerCase().includes(q) || s.artist_name.toLowerCase().includes(q);
  });

  const toggleTrending = async (song) => {
    setSaving(song.id);
    await base44.entities.Song.update(song.id, { is_trending: !song.is_trending });
    setSaving(null);
    if (onRefresh) onRefresh();
  };

  const trendingCount = allSongs.filter(s => s.is_trending).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{trendingCount}</span> canciones marcadas como tendencia
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar canción o artista..."
          className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-orange-500 transition-colors"
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto divide-y divide-border">
          {filtered.slice(0, 100).map(song => (
            <div key={song.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/30">
              <div className="flex items-center gap-3 min-w-0">
                {song.is_trending && <TrendingUp className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{song.title.replace(/\s*\d+$/, '').trim()}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist_name}</p>
                </div>
              </div>
              <button
                onClick={() => toggleTrending(song)}
                disabled={saving === song.id}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  song.is_trending
                    ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {saving === song.id ? (
                  <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : song.is_trending ? (
                  <><StarOff className="w-3 h-3" /> Quitar</>
                ) : (
                  <><Star className="w-3 h-3" /> Tendencia</>
                )}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Sin resultados</p>
          )}
        </div>
      </div>
    </div>
  );
}