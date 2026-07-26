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

    // Manual search needs several choices. The first result is also returned
    // at the top level for backwards compatibility with existing callers.
    const query = artist ? `track:"${title}" artist:"${artist}"` : title;
    const q = encodeURIComponent(query);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=8&market=ES`, { headers });
    const searchData = await searchRes.json();
    const tracks = searchData?.tracks?.items || [];
    const track = tracks[0];

    if (!track) return Response.json({ track_id: null });

    const artistId = track.artists?.[0]?.id;
    let artist_image = null;

    // Fetch artist image
    if (artistId) {
      const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, { headers });
      const artistData = await artistRes.json();
      artist_image = artistData?.images?.[0]?.url || null;
    }

    const toResult = (item) => ({
      track_id: item.id,
      name: item.name,
      title: item.name,
      artist: item.artists?.[0]?.name,
      artist_name: item.artists?.map((a) => a.name).join(', '),
      album: item.album?.name,
      album_image: item.album?.images?.[0]?.url || null,
      duration_ms: item.duration_ms,
      spotify_url: item.external_urls?.spotify,
    });

    return Response.json({
      track_id: track.id,
      name: track.name,
      artist: track.artists?.[0]?.name,
      album: track.album?.name,
      album_image: track.album?.images?.[0]?.url || null,
      artist_image,
      preview_url: track.preview_url,
      tracks: tracks.map(toResult),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
