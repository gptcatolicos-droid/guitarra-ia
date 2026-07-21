import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SpotifyPlayer({ song, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const title = song?.title?.replace(/\s*\d+$/, '').trim() || '';
  const artist = song?.artist_name || '';

  useEffect(() => {
    if (!song) return;
    setData(null);
    setLoading(true);
    base44.functions.invoke('spotifySearch', { artist, title })
      .then((res) => { if (res?.data) setData(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [song?.id]);

  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  const youtubeMusicUrl = `https://music.youtube.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`;

  if (!song) return null;

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl flex items-center justify-center py-8 gap-2">
        <div className="w-4 h-4 border-2 border-border border-t-orange-500 rounded-full animate-spin" />
        <span className="text-muted-foreground text-xs">Buscando en Spotify...</span>
      </div>
    );
  }

  // If we have a track_id, show the embedded player
  // If not, show the Spotify search embed as fallback (searches automatically)
  const embedSrc = data?.track_id
    ? `https://open.spotify.com/embed/track/${data.track_id}?utm_source=generator&theme=0`
    : `https://open.spotify.com/embed/search/${encodeURIComponent(`${title} ${artist}`)}?utm_source=generator&theme=0`;

  return (
    <div className={compact ? '' : 'bg-card border border-border rounded-2xl overflow-hidden'}>
      {!compact && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-foreground font-semibold text-sm">Escuchar en Spotify</p>
          <p className="text-muted-foreground text-xs">{data?.track_id ? 'Vista previa (30s)' : 'Busca y reproduce en Spotify'}</p>
        </div>
      )}

      <iframe
        src={embedSrc}
        width="100%"
        height={compact ? 80 : 152}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="border-0"
        title="Spotify"
      />

      <div className="flex gap-2 px-4 pb-4 pt-1">
        <a
          href={data?.track_id ? `https://open.spotify.com/track/${data.track_id}` : spotifySearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1DB954' }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Spotify
        </a>
        <a
          href={youtubeMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#FF0000' }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          YouTube Music
        </a>
      </div>
    </div>
  );
}