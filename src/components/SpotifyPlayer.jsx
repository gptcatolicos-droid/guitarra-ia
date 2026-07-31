import { ExternalLink } from 'lucide-react';

export default function SpotifyPlayer({ song, compact = false }) {
  const title = song?.title?.replace(/\s*\d+$/, '').trim() || '';
  const artist = song?.artist_name || '';

  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  const youtubeMusicUrl = `https://music.youtube.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`;

  if (!song) return null;

  // Only show a stored, confirmed Spotify track. Rendering the first live
  // search result here could make a different song look like a match.
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

  const storedEmbed = song.spotify_embed || song.spotify_embed_url;
  const rawStoredSrc = storedEmbed ? extractSrcFromEmbed(storedEmbed) || storedEmbed : null;
  const storedSrc = normalizeSpotifyUrl(rawStoredSrc);
  const storedTrackId = song.spotify_track_id || storedSrc?.match(/\/track\/([A-Za-z0-9]+)/)?.[1] || null;
  const confirmedTrackSrc = !storedSrc && song.spotify_match_status === 'matched' && storedTrackId
    ? `https://open.spotify.com/embed/track/${storedTrackId}`
    : null;
  const embedSrc = storedSrc || confirmedTrackSrc;
  const spotifyTrackUrl = storedTrackId ? `https://open.spotify.com/track/${storedTrackId}` : spotifySearchUrl;

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

      {!embedSrc && (
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 px-4 pb-4 pt-1">
          <a
            href={spotifyTrackUrl}
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
      )}
    </div>
  );
}
