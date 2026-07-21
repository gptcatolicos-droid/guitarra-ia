import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { artist, title } = await req.json();
    if (!artist || !title) return Response.json({ error: 'artist and title required' }, { status: 400 });

    const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
    const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

    // Get access token via Client Credentials
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
    if (!accessToken) return Response.json({ track_id: null });

    const headers = { 'Authorization': `Bearer ${accessToken}` };

    // Search for track
    const q = encodeURIComponent(`track:${title} artist:${artist}`);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=1&market=ES`, { headers });
    const searchData = await searchRes.json();
    const track = searchData?.tracks?.items?.[0];

    if (!track) return Response.json({ track_id: null });

    const artistId = track.artists?.[0]?.id;
    let artist_image = null;

    // Fetch artist image
    if (artistId) {
      const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers });
      const artistData = await artistRes.json();
      artist_image = artistData?.images?.[0]?.url || null;
    }

    return Response.json({
      track_id: track.id,
      name: track.name,
      artist: track.artists?.[0]?.name,
      album: track.album?.name,
      album_image: track.album?.images?.[0]?.url || null,
      artist_image,
      preview_url: track.preview_url,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});