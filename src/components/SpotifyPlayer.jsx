import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SpotifyPlayer({ song, compact = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const title = song?.title?.replace(/\s*\d+$/, '').trim() || '';
  const artist = song?.artist_name || '';

  useEffect(() => {
    // If song has a manual embed code, skip the API call
    if (!song || song.spotify_embed) return;
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

  // Priority: manual embed > auto track_id > search fallback
  const extractSrcFromEmbed = (embedCode) => {
    const match = embedCode?.match(/src="([^"]+)"/);
    return match ? match[1] : null;
  };

  // Extract just the track/episode/playlist ID from a full Spotify embed URL
  const normalizeSpotifyUrl = (url) => {
    if (!url) return null;
    // Remove query params that can cause 404
    try {
      const u = new URL(url);
      return u.origin + u.pathname;
    } catch {
      return url.split('?')[0];
    }
  };

  const rawManualSrc = song.spotify_embed ? extractSrcFromEmbed(song.spotify_embed) || song.spotify_embed : null;
  const manualSrc = normalizeSpotifyUrl(rawManualSrc);
  const autoSrc = data?.track_id ? `https://open.spotify.com/embed/track/${data.track_id}` : null;
  // Only embed a CONFIRMED track. The embed/search URL returns 404, so we never use it.
  const embedSrc = manualSrc || autoSrc;

  return (
    <div className={compact ? 'spotify-card' : 'spotify-card bg-card border border-border'}>
      {!compact && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-foreground font-semibold text-sm">Escuchar en Spotify</p>
          <p className="text-muted-foreground text-xs">{embedSrc ? 'Vista previa (30s)' : 'Busca y reproduce en Spotify'}</p>
        </div>
      )}

      {embedSrc && (
        <div className="spotify-embed-wrapper">
          <iframe
            src={embedSrc}
            width="100%"
            height={compact ? 80 : 152}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify"
          />
        </div>
      )}

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 px-4 pb-4 pt-1">
        <a
          href={data?.track_id ? `https://open.spotify.com/track/${data.track_id}` : spotifySearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 min-h-11 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#1DB954' }}
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          Spotify
        </a>
        <a
          href={youtubeMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 min-h-11 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#FF0000' }}
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">YouTube Music</span>
        </a>
      </div>
    </div>
  );
}