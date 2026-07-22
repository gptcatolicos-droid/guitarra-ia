import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { artist_name } = await req.json();
    if (!artist_name) return Response.json({ error: 'artist_name required' }, { status: 400 });

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
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) return Response.json({ image_url: null });

    // Search artist
    const q = encodeURIComponent(artist_name);
    const res = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=artist&limit=1`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const data = await res.json();
    const artist = data?.artists?.items?.[0];
    if (!artist) return Response.json({ image_url: null });

    const image_url = artist.images?.[0]?.url || null;
    const spotify_id = artist.id;
    const followers = artist.followers?.total || 0;

    return Response.json({ image_url, spotify_id, followers, name: artist.name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});