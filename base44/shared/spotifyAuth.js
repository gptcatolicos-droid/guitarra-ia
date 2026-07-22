// Shared Spotify token cache — reused across functions
let cachedToken = null;
let tokenExpiresAt = 0;

export async function getSpotifyToken() {
  const now = Date.now();
  // Reuse if valid with 5-minute buffer
  if (cachedToken && now < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

export async function spotifyFetch(url, retried = false) {
  const token = await getSpotifyToken();
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (res.status === 401 && !retried) {
    cachedToken = null; // force refresh
    return spotifyFetch(url, true);
  }

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10);
    await new Promise(r => setTimeout(r, retryAfter * 1000));
    return spotifyFetch(url, retried);
  }

  return res;
}