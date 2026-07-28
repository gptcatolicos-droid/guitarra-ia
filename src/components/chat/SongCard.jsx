import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ArtistAvatar from '@/components/ArtistAvatar';
import SpotifyEmbed from '@/components/SpotifyEmbed';
import { hasYouTubePractice } from '@/lib/youtubePractice';

const DIFF_COLORS = {
  'Fácil': { bg: 'rgba(128,185,64,0.15)', color: '#80B940' },
  'Intermedia': { bg: 'rgba(216,166,42,0.15)', color: '#D8A62A' },
  'Avanzada': { bg: 'rgba(217,90,50,0.15)', color: '#D95A32' },
};

function cleanTitle(title) {
  return (title || '')
    .replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '')
    .replace(/\s*\d+$/, '')
    .trim();
}

function getSpotifyEmbedUrl(raw) {
  if (!raw) return null;
  const match = raw.match(/track\/([A-Za-z0-9]+)/);
  return match ? `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0` : null;
}

export default function SongCard({ song }) {
  const displayTitle = cleanTitle(song.title);
  const diff = DIFF_COLORS[song.difficulty];
  const hasChords = song.has_chords;
  const hasTab = song.has_tablature;
  const storedTrackId = song.spotify_track_id || (song.spotify_embed || '').match(/track\/([A-Za-z0-9]+)/)?.[1] || null;
  const [embedUrl, setEmbedUrl] = useState(storedTrackId ? getSpotifyEmbedUrl(`track/${storedTrackId}`) : null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (fetched) return;
    if (storedTrackId) {
      setFetched(true);
      return;
    }
    setFetched(true);
    base44.functions.invoke('spotifySearch', { artist: song.artist_name, title: displayTitle })
      .then((res) => {
        const trackId = res?.data?.track_id;
        if (trackId) setEmbedUrl(`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`);
      })
      .catch(() => {});
  }, [song.id]);

  const actionLink = hasChords
    ? `/${song.artist_slug}/${song.slug}/acordes`
    : hasTab
      ? `/${song.artist_slug}/${song.slug}/tablatura`
      : `/${song.artist_slug}/${song.slug}`;
  const actionLabel = hasChords ? 'Ver acordes' : hasTab ? 'Ver tablatura' : 'Ver canción';
  const practiceLink = `/${song.artist_slug}/${song.slug}/practicar`;

  return (
    <div className="song-card spotify-card bg-white shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
      {embedUrl ? (
        <div className="spotify-embed-wrapper">
          <SpotifyEmbed source={embedUrl} height={152} title={`Spotify: ${displayTitle}`} />
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-4 min-w-0" style={{ borderBottom: '1px solid #E5E7EB', minHeight: '72px' }}>
          <ArtistAvatar song={song} className="w-10 h-10" />
          <div className="song-card-info flex-1">
            <p className="song-card-title text-sm font-bold" style={{ color: '#1F2937' }}>{displayTitle}</p>
            <p className="song-card-artist text-xs" style={{ color: '#6B7280' }}>{song.artist_name}</p>
          </div>
        </div>
      )}

      <div className="song-card-content px-3 py-3">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="song-card-info min-w-0">
            <p className="song-card-title text-sm font-semibold" style={{ color: '#1F2937' }}>{displayTitle}</p>
            <p className="song-card-artist text-xs" style={{ color: '#6B7280' }}>{song.artist_name}</p>
          </div>
          <div className="song-card-actions flex flex-wrap items-center gap-2">
            {diff && <span className="hidden rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline" style={{ backgroundColor: diff.bg, color: diff.color }}>{song.difficulty}</span>}
            <Link to={actionLink} className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80" style={{ backgroundColor: '#F97316' }}>
              {actionLabel}
            </Link>
            {hasYouTubePractice(song) && (
              <Link to={practiceLink} className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-center text-xs font-bold text-white transition-opacity hover:opacity-80" style={{ backgroundColor: '#FF0000' }}>
                Practicar con IA - YouTube
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
