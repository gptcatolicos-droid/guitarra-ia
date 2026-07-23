import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Star, StarOff, Search, Shuffle, GripVertical } from 'lucide-react';

export default function TrendingManager({ allSongs, onRefresh }) {
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(null);
  const [randomMode, setRandomMode] = useState(() => localStorage.getItem('trendingRandom') === 'true');
  const [trendingOrder, setTrendingOrder] = useState([]);
  const [dragging, setDragging] = useState(null);

  const trendingSongs = allSongs.filter(s => s.is_trending);

  useEffect(() => {
    // Maintain an ordered list based on sort_order field or insertion order
    const ordered = [...trendingSongs].sort((a, b) => (a.trending_order || 0) - (b.trending_order || 0));
    setTrendingOrder(ordered.map(s => s.id));
  }, [allSongs]);

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

  const toggleRandom = () => {
    const newVal = !randomMode;
    setRandomMode(newVal);
    localStorage.setItem('trendingRandom', String(newVal));
  };

  const handleDragStart = (id) => setDragging(id);
  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (!dragging || dragging === targetId) return;
    const newOrder = [...trendingOrder];
    const fromIdx = newOrder.indexOf(dragging);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragging);
    setTrendingOrder(newOrder);
  };
  const handleDrop = async () => {
    // Save order to each song's trending_order field
    await Promise.all(trendingOrder.map((id, idx) =>
      base44.entities.Song.update(id, { trending_order: idx })
    ));
    setDragging(null);
    if (onRefresh) onRefresh();
  };

  const trendingCount = trendingSongs.length;

  const orderedTrending = trendingOrder
    .map(id => trendingSongs.find(s => s.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{trendingCount}</span> canciones en tendencia
        </p>
        <button
          onClick={toggleRandom}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            randomMode ? 'text-white' : 'text-muted-foreground border border-border'
          }`}
          style={randomMode ? { backgroundColor: '#FF7200' } : {}}
        >
          <Shuffle className="w-4 h-4" />
          {randomMode ? 'Modo Random activo' : 'Activar random'}
        </button>
      </div>

      {randomMode && (
        <div className="text-xs px-4 py-3 rounded-xl" style={{ backgroundColor: 'rgba(255,114,0,0.1)', border: '1px solid rgba(255,114,0,0.3)', color: '#FF7200' }}>
          🔀 Modo Random activo: las canciones en tendencia se muestran en orden aleatorio cada vez. Desactívalo para usar el orden manual.
        </div>
      )}

      {/* Ordered trending songs with drag-and-drop */}
      {orderedTrending.length > 0 && !randomMode && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-semibold" style={{ color: '#FF7200' }}>Orden de tendencias (arrastra para reordenar)</p>
          </div>
          <div className="divide-y divide-border">
            {orderedTrending.map((song, idx) => (
              <div
                key={song.id}
                draggable
                onDragStart={() => handleDragStart(song.id)}
                onDragOver={(e) => handleDragOver(e, song.id)}
                onDrop={handleDrop}
                className={`flex items-center gap-3 px-4 py-3 cursor-grab ${dragging === song.id ? 'opacity-50' : 'hover:bg-secondary/30'}`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-bold w-5 text-muted-foreground">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{song.title.replace(/\s*\d+$/, '').trim()}</p>
                  <p className="text-xs text-muted-foreground">{song.artist_name}</p>
                </div>
                <button onClick={() => toggleTrending(song)} disabled={saving === song.id}
                  className="px-2 py-1 rounded text-xs text-red-400 hover:bg-red-400/10">Quitar</button>
              </div>
            ))}
          </div>
        </div>
      )}
      

      {/* Search to add more */}
      <p className="text-xs text-muted-foreground font-medium">Agregar canciones a tendencia:</p>
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
        <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
          {filtered.filter(s => !s.is_trending).slice(0, 100).map(song => (
            <div key={song.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{song.title.replace(/\s*\d+$/, '').trim()}</p>
                  <p className="text-xs text-muted-foreground truncate">{song.artist_name}</p>
                </div>
              </div>
              <button
                onClick={() => toggleTrending(song)}
                disabled={saving === song.id}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {saving === song.id ? (
                  <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <><Star className="w-3 h-3" /> Agregar</>
                )}
              </button>
            </div>
          ))}
          {filtered.filter(s => !s.is_trending).length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Sin resultados</p>
          )}
        </div>
      </div>
    </div>
  );
}