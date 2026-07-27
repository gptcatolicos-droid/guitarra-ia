import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user;
    try {
      user = await base44.auth.me();
    } catch (_) {
      user = null;
    }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let payload;
    try {
      payload = await req.json();
    } catch (_) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { artist_name, spotify_url, include_profile = false } = payload || {};
    if (!artist_name && !spotify_url) return Response.json({ error: 'artist_name or spotify_url required' }, { status: 400 });

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    // Get access token
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
      },
      body: 'grant_type=client_credentials',
    });
    if (!tokenRes.ok) return Response.json({ image_url: null, profile: null });
    let tokenData;
    try {
      tokenData = await tokenRes.json();
    } catch (_) {
      return Response.json({ image_url: null, profile: null });
    }
    const accessToken = tokenData.access_token;
    if (!accessToken) return Response.json({ image_url: null, profile: null });

    let artist = null;

    // If a Spotify artist URL/URI is provided, fetch that exact artist
    const idMatch = spotify_url && String(spotify_url).match(/artist[/:]([a-zA-Z0-9]+)/);
    if (idMatch) {
      const byId = await fetch(`https://api.spotify.com/v1/artists/${idMatch[1]}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (byId.ok) {
        try { artist = await byId.json(); } catch (_) { artist = null; }
      }
    }

    // Otherwise search by name
    if (!artist && artist_name) {
      const q = encodeURIComponent(artist_name);
      const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=artist&limit=1`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!res.ok) return Response.json({ image_url: null, profile: null });
      let data;
      try {
        data = await res.json();
      } catch (_) {
        return Response.json({ image_url: null, profile: null });
      }
      artist = data?.artists?.items?.[0] || null;
    }

    if (!artist) return Response.json({ image_url: null, profile: null });

    const image_url = artist.images?.[0]?.url || null;
    const spotify_id = artist.id;
    const followers = artist.followers?.total || 0;

    // Artist metadata is deliberately returned on demand for the admin panel.
    // It is not written into editorial BIOs or sent to the content model.
    let profile = null;
    if (include_profile) {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      const [albumsRes, tracksRes] = await Promise.all([
        fetch(`https://api.spotify.com/v1/artists/${spotify_id}/albums?include_groups=album,single&market=US&limit=12`, { headers }).catch(() => null),
        fetch(`https://api.spotify.com/v1/artists/${spotify_id}/top-tracks?market=US`, { headers }).catch(() => null),
      ]);

      let albumsData = null;
      let tracksData = null;
      try { if (albumsRes?.ok) albumsData = await albumsRes.json(); } catch (_) {}
      try { if (tracksRes?.ok) tracksData = await tracksRes.json(); } catch (_) {}

      const seenAlbums = new Set();
      const albums = (albumsData?.items || []).filter((album) => {
        if (seenAlbums.has(album.id)) return false;
        seenAlbums.add(album.id);
        return true;
      }).slice(0, 10).map((album) => ({
        id: album.id,
        name: album.name,
        type: album.album_type,
        release_date: album.release_date,
        image_url: album.images?.[2]?.url || album.images?.[0]?.url || null,
        spotify_url: album.external_urls?.spotify || null,
      }));
      const top_tracks = (tracksData?.tracks || []).slice(0, 10).map((track) => ({
        id: track.id,
        name: track.name,
        album_name: track.album?.name || null,
        image_url: track.album?.images?.[2]?.url || track.album?.images?.[0]?.url || null,
        spotify_url: track.external_urls?.spotify || null,
      }));

      profile = {
        spotify_url: artist.external_urls?.spotify || null,
        followers,
        popularity: typeof artist.popularity === 'number' ? artist.popularity : null,
        genres: artist.genres || [],
        albums,
        top_tracks,
      };
    }

    return Response.json({ image_url, spotify_id, followers, name: artist.name, profile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
