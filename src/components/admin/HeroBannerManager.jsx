import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, X, Search } from 'lucide-react';

export default function HeroBannerManager({ allSongs, onRefresh }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(null);

  const heroSongs = allSongs.filter((s) => s.is_hero);
  const filtered = allSongs.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.artist_name.toLowerCase().includes(q)
    );
  }).slice(0, 30);

  const toggle = async (song) => {
    if (!song.is_hero && heroSongs.length >= 3) {
      alert('Máximo 3 canciones en el Hero Banner. Quita una primero.');
      return;
    }
    setLoading(song.id);
    await base44.entities.Song.update(song.id, { is_hero: !song.is_hero });
    await onRefresh();
    setLoading(null);
  };

  return (
    <div className="space-y-4">
      {/* Current hero songs */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          Canciones en el Hero Banner ({heroSongs.length}/3)
        </h3>
        {heroSongs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Ninguna seleccionada. Busca y activa canciones abajo.</p>
        ) : (
          <div className="space-y-2">
            {heroSongs.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                <div>
                  <p className="text-foreground text-sm font-medium">{s.title.replace(/\s*\d+$/, '').trim()}</p>
                  <p className="text-muted-foreground text-xs">{s.artist_name}</p>
                </div>
                <button
                  onClick={() => toggle(s)}
                  disabled={loading === s.id}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search to add */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-foreground font-semibold mb-3">Buscar canción para agregar</h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o artista..."
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filtered.map((s) => (
            <div key={s.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${s.is_hero ? 'bg-primary/10' : 'hover:bg-secondary'} transition-colors`}>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm truncate">{s.title.replace(/\s*\d+$/, '').trim()}</p>
                <p className="text-muted-foreground text-xs truncate">{s.artist_name}</p>
              </div>
              <button
                onClick={() => toggle(s)}
                disabled={loading === s.id}
                className={`ml-3 px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  s.is_hero
                    ? 'bg-primary/20 text-primary hover:bg-destructive/20 hover:text-destructive'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {loading === s.id ? '...' : s.is_hero ? 'Quitar' : 'Agregar'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}