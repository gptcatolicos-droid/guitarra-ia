import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { artist, song, action } = body;

    if (action === 'search') {
      const query = [artist, song].filter(Boolean).join(' ');
      // Songsterr public search API
      const url = `https://www.songsterr.com/a/ra/songs.json?pattern=${encodeURIComponent(query)}&size=10`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.songsterr.com/',
          'Origin': 'https://www.songsterr.com',
        }
      });

      if (!res.ok) {
        // Try alternative endpoint
        const alt = await fetch(`https://www.songsterr.com/a/ra/search.json?pattern=${encodeURIComponent(query)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          }
        });
        if (!alt.ok) return Response.json({ results: [], error: `HTTP ${res.status}` });
        const altData = await alt.json();
        return Response.json({ results: altData || [] });
      }

      const data = await res.json();
      const results = (Array.isArray(data) ? data : []).slice(0, 8).map((s) => ({
        id: s.id,
        title: s.title || '',
        artist: s.artist?.name || '',
        songsterrUrl: `https://www.songsterr.com/a/wsa/tab?songId=${s.id}`,
      }));
      return Response.json({ results });
    }

    return Response.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});