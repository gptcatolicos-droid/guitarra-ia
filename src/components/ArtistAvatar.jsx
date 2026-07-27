import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Artist is the single source of truth for its image. Keeping this lookup
// cached by artist means cards never need to duplicate an image in every Song.
const imageCache = new Map();
const pendingLookups = new Map();

function keysFor(songOrArtist = {}) {
  return [
    songOrArtist.artist_id && `id:${songOrArtist.artist_id}`,
    songOrArtist.id && `id:${songOrArtist.id}`,
    songOrArtist.artist_slug && `slug:${songOrArtist.artist_slug}`,
    songOrArtist.slug && `slug:${songOrArtist.slug}`,
  ].filter(Boolean);
}

async function findArtistImage(songOrArtist) {
  const keys = keysFor(songOrArtist);
  const cached = keys.map((key) => imageCache.get(key)).find((value) => value !== undefined);
  if (cached !== undefined) return cached;

  const primaryKey = keys[0];
  if (!primaryKey) return null;
  if (pendingLookups.has(primaryKey)) return pendingLookups.get(primaryKey);

  const lookup = (async () => {
    let artist = null;
    if (songOrArtist.artist_id) {
      try { artist = await base44.entities.Artist.get(songOrArtist.artist_id); } catch {}
    }
    if (!artist && songOrArtist.id && songOrArtist.name) artist = songOrArtist;
    if (!artist && (songOrArtist.artist_slug || songOrArtist.slug)) {
      const slug = songOrArtist.artist_slug || songOrArtist.slug;
      const rows = await base44.entities.Artist.filter({ slug }, '-created_date', 1);
      artist = rows?.[0] || null;
    }

    const imageUrl = artist?.image_url || null;
    [...keys, ...keysFor(artist || {})].forEach((key) => imageCache.set(key, imageUrl));
    return imageUrl;
  })().catch(() => {
    keys.forEach((key) => imageCache.set(key, null));
    return null;
  }).finally(() => pendingLookups.delete(primaryKey));

  pendingLookups.set(primaryKey, lookup);
  return lookup;
}

export function invalidateArtistImage(artist = {}) {
  keysFor(artist).forEach((key) => imageCache.delete(key));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('guitarraia:artist-image-updated', { detail: artist }));
  }
}

export function useArtistImage(songOrArtist) {
  const identity = useMemo(() => keysFor(songOrArtist).join('|'), [songOrArtist?.artist_id, songOrArtist?.id, songOrArtist?.artist_slug, songOrArtist?.slug]);
  const suppliedImage = songOrArtist?.image_url || null;
  const [imageUrl, setImageUrl] = useState(suppliedImage);

  useEffect(() => {
    let active = true;
    if (suppliedImage) {
      setImageUrl(suppliedImage);
      return () => { active = false; };
    }
    setImageUrl(null);
    findArtistImage(songOrArtist).then((url) => { if (active) setImageUrl(url); });
    return () => { active = false; };
  }, [identity, suppliedImage]);

  useEffect(() => {
    const onUpdated = (event) => {
      const updatedKeys = new Set(keysFor(event.detail));
      if (!keysFor(songOrArtist).some((key) => updatedKeys.has(key))) return;
      findArtistImage(songOrArtist).then(setImageUrl);
    };
    window.addEventListener('guitarraia:artist-image-updated', onUpdated);
    return () => window.removeEventListener('guitarraia:artist-image-updated', onUpdated);
  }, [identity]);

  return imageUrl;
}

export default function ArtistAvatar({ song, artist, className = 'w-10 h-10', imageClassName = '', title }) {
  const source = artist || song || {};
  const imageUrl = useArtistImage(source);
  const [failedUrl, setFailedUrl] = useState(null);
  const name = source.name || source.artist_name || 'Artista';
  const initial = name.trim().charAt(0).toUpperCase() || 'A';

  if (imageUrl && imageUrl !== failedUrl) {
    return <img src={imageUrl} alt={name} title={title || name} className={`${className} rounded-full object-cover shrink-0 ${imageClassName}`} onError={() => setFailedUrl(imageUrl)} />;
  }

  return (
    <div title={title || name} className={`${className} rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${imageClassName}`}
      style={{ backgroundColor: 'rgba(255,114,0,0.12)', color: '#F97316', border: '1px solid rgba(255,114,0,0.22)' }}>
      {initial}
    </div>
  );
}
