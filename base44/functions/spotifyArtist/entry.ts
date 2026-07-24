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
    const { artist_name, spotify_url } = payload || {};
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
    if (!tokenRes.ok) return Response.json({ image_url: null });
    let tokenData;
    try {
      tokenData = await tokenRes.json();
    } catch (_) {
      return Response.json({ image_url: null });
    }
    const accessToken = tokenData.access_token;
    if (!accessToken) return Response.json({ image_url: null });

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
      if (!res.ok) return Response.json({ image_url: null });
      let data;
      try {
        data = await res.json();
      } catch (_) {
        return Response.json({ image_url: null });
      }
      artist = data?.artists?.items?.[0] || null;
    }

    if (!artist) return Response.json({ image_url: null });

    const image_url = artist.images?.[0]?.url || null;
    const spotify_id = artist.id;
    const followers = artist.followers?.total || 0;

    return Response.json({ image_url, spotify_id, followers, name: artist.name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});