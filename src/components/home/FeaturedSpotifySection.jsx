import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import SpotifyEmbed from '@/components/SpotifyEmbed';

// Extract clean iframe src from spotify_embed field
function extractSpotifySrc(embed) {
  if (!embed) return null;
  const match = embed.match(/src="([^"]+)"/);
  const url = match ? match[1] : embed;
  try { const u = new URL(url); return u.origin + u.pathname; } catch { return url.split('?')[0]; }
}

function FeaturedCard({ song }) {
  const title = song.title.replace(/\s*\d+$/, '').trim();
  const spotifySrc = extractSpotifySrc(song.spotify_embed);

  return (
    <div className="spotify-card bg-card border border-border flex flex-col">
      {/* Spotify embed */}
      {spotifySrc ? (
        <div className="spotify-embed-wrapper">
          <SpotifyEmbed source={spotifySrc} height={152} title={`Spotify: ${title}`} />
        </div>
      ) : (
        <div className="h-[152px] bg-gradient-brand flex items-center justify-center">
          <Music className="w-8 h-8 text-white/60" />
        </div>
      )}

      {/* Info + buttons */}
      <div className="p-3 flex flex-col gap-2">
        <div>
          <p className="text-foreground font-bold text-sm break-words">{title}</p>
          <p className="text-muted-foreground text-xs break-words">{song.artist_name}</p>
        </div>
        <div className="flex gap-2">
          {song.has_chords && (
            <Link
              to={`/${song.artist_slug}/${song.slug}/acordes`}
              className="flex-1 text-center py-2 rounded-xl text-xs font-semibold text-white bg-gradient-brand hover:opacity-90 transition-opacity"
            >
              Acordes
            </Link>
          )}
          {song.has_tablature && (
            <Link
              to={`/${song.artist_slug}/${song.slug}/tablatura`}
              className="flex-1 text-center py-2 rounded-xl text-xs font-semibold text-white bg-gradient-brand hover:opacity-90 transition-opacity"
            >
              Tablatura
            </Link>
          )}
          {!song.has_chords && !song.has_tablature && (
            <Link
              to={`/${song.artist_slug}/${song.slug}`}
              className="flex-1 text-center py-2 rounded-xl text-xs font-semibold text-white bg-gradient-brand hover:opacity-90 transition-opacity"
            >
              Ver canción
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FeaturedSpotifySection({ songs }) {
  // Only show songs with spotify_embed and is_trending
  const featured = (songs || []).filter((s) => s.spotify_embed && s.is_trending).slice(0, 4);
  if (featured.length === 0) return null;

  return (
    <div className="px-6 lg:px-8 pb-6">
      <div className="flex items-center gap-2 mb-4">
        {/* Spotify green dot */}
        <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
        <h2 className="text-foreground font-bold text-lg">Destacadas en Spotify</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {featured.map((song) => (
          <FeaturedCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}
