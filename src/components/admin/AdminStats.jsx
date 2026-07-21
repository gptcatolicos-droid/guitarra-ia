import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Music, Eye, TrendingUp, Users } from 'lucide-react';

export default function AdminStats({ allSongs }) {
  const [topViewed, setTopViewed] = useState([]);
  const [topArtists, setTopArtists] = useState([]);

  useEffect(() => {
    if (!allSongs || allSongs.length === 0) return;

    // Top songs by views
    const sorted = [...allSongs].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
    setTopViewed(sorted);

    // Top artists by total views
    const artistMap = {};
    for (const s of allSongs) {
      if (!artistMap[s.artist_name]) artistMap[s.artist_name] = { name: s.artist_name, views: 0, songs: 0 };
      artistMap[s.artist_name].views += s.views || 0;
      artistMap[s.artist_name].songs++;
    }
    const artistsSorted = Object.values(artistMap).sort((a, b) => b.views - a.views).slice(0, 10);
    setTopArtists(artistsSorted);
  }, [allSongs]);

  const totalViews = allSongs.reduce((acc, s) => acc + (s.views || 0), 0);
  const totalChords = allSongs.filter(s => s.has_chords).length;
  const totalTabs = allSongs.filter(s => s.has_tablature).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <Eye className="w-4 h-4 text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Vistas totales</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <Music className="w-4 h-4 text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalChords}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Con Acordes</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <TrendingUp className="w-4 h-4 text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalTabs}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Con Tablatura</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <Users className="w-4 h-4 text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-foreground">{topArtists.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Artistas activos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top songs by views */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-foreground font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" /> Canciones más vistas
            </h3>
          </div>
          <div className="divide-y divide-border">
            {topViewed.map((song, i) => (
              <div key={song.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{song.title.replace(/\s*\d+$/, '').trim()}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist_name}</p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  {(song.views || 0).toLocaleString()}
                </div>
              </div>
            ))}
            {topViewed.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-6">Sin datos aún</p>
            )}
          </div>
        </div>

        {/* Top artists */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-foreground font-semibold text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" /> Artistas más buscados
            </h3>
          </div>
          <div className="divide-y divide-border">
            {topArtists.map((artist, i) => (
              <div key={artist.name} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">{artist.songs} canciones</p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  {artist.views.toLocaleString()}
                </div>
              </div>
            ))}
            {topArtists.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-6">Sin datos aún</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}