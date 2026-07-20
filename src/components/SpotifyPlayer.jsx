import { useState, useEffect } from 'react';
import { Music, ExternalLink, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SpotifyPlayer({ song }) {
  const [spotifyId, setSpotifyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const title = song?.title?.replace(/\s*\d+$/, '').trim() || '';
  const artist = song?.artist_name || '';

  useEffect(() => {
    if (!song || dismissed) return;
    setSpotifyId(null);
    setLoading(true);

    // Use LLM to find Spotify track ID
    base44.integrations.Core.InvokeLLM({
      prompt: `Find the Spotify track ID for the song "${title}" by "${artist}".
      
Return ONLY a JSON with the spotify_track_id (the 22-character Spotify track ID string, not the full URL).
If you cannot find it with certainty, return {"spotify_track_id": null}.
Do NOT guess or invent IDs. Only return real, verified Spotify track IDs.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          spotify_track_id: { type: 'string' },
        },
        required: [],
      },
    })
      .then((res) => {
        if (res?.spotify_track_id && res.spotify_track_id.length > 10) {
          setSpotifyId(res.spotify_track_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [song?.id]);

  if (dismissed) return null;
  if (!song) return null;

  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  const youtubeMusicUrl = `https://music.youtube.com/search?q=${encodeURIComponent(`${title} ${artist}`)}`;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-orange-500" />
          <span className="text-foreground font-semibold text-sm">Vista previa musical</span>
        </div>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Spotify embed */}
      {loading && (
        <div className="flex items-center justify-center py-8 gap-2">
          <div className="w-4 h-4 border-2 border-border border-t-orange-500 rounded-full animate-spin" />
          <span className="text-muted-foreground text-xs">Buscando preview...</span>
        </div>
      )}

      {!loading && spotifyId && (
        <iframe
          src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="border-0"
          title="Spotify preview"
        />
      )}

      {!loading && !spotifyId && (
        <div className="px-4 py-4 text-center">
          <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-muted-foreground text-xs mb-1">Vista previa de 30 segundos</p>
          <p className="text-muted-foreground text-xs">La reproducción completa se realiza en la plataforma externa.</p>
        </div>
      )}

      {/* External links */}
      <div className="flex gap-2 px-4 pb-4 pt-2">
        <a
          href={spotifySearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: '#1DB954' }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Spotify
        </a>
        <a
          href={youtubeMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: '#FF0000' }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          YouTube Music
        </a>
      </div>
    </div>
  );
}