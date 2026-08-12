import { ExternalLink } from 'lucide-react';
import SpotifyEmbed from '@/components/SpotifyEmbed';

export default function SpotifyPlayer({ song, compact = false }) {
  const title = song?.title?.replace(/\s*\d+$/, '').trim() || '';
  const artist = song?.artist_name || '';

  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  const youtubeMusicUrl = `https://music.youtube.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`;

  if (!song) return null;

  // Accept every stored Spotify representation used by imported songs:
  // iframe HTML (single or double quotes), normal track URLs, embed URLs, or a
  // confirmed track id. SpotifyEmbed normalizes all URL variants safely.
  const storedEmbed = song.spotify_embed || song.spotify_embed_url || null;
  const storedTrackId = song.spotify_track_id
    || String(storedEmbed || '').match(/(?:track\/|spotify:track:)([A-Za-z0-9]+)/i)?.[1]
    || null;
  const confirmedTrackSrc = storedTrackId
    ? `https://open.spotify.com/track/${storedTrackId}`
    : null;
  const embedSource = confirmedTrackSrc || storedEmbed;
  const spotifyTrackUrl = storedTrackId ? `https://open.spotify.com/track/${storedTrackId}` : spotifySearchUrl;

  return (
    <div className={compact ? 'spotify-card' : 'spotify-card bg-card border border-border'}>
      {!compact && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-foreground font-semibold text-sm">Escuchar en Spotify</p>
          <p className="text-muted-foreground text-xs">{embedSource ? 'Vista previa (30s)' : 'Busca y reproduce en Spotify'}</p>
        </div>
      )}

      {embedSource && (
        <div className="spotify-embed-wrapper">
          <SpotifyEmbed
            source={embedSource}
            height={compact ? 80 : 152}
            title={`Spotify: ${title}`}
          />
        </div>
      )}

      {!embedSource && (
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
