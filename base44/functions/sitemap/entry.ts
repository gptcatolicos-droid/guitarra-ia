import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Canonical domain — ALWAYS https + www, single host, no trailing slash.
const SITE_URL = 'https://www.guitarraia.com';

// Public, indexable static pages. Excludes admin, login, internal search filters, previews.
const STATIC_URLS = [
  { loc: '/', priority: '1.0' },
  { loc: '/acordes', priority: '0.8' },
  { loc: '/artistas', priority: '0.8' },
  { loc: '/canciones', priority: '0.8' },
  { loc: '/blog', priority: '0.7' },
  { loc: '/infografias', priority: '0.7' },
  { loc: '/tienda', priority: '0.5' },
  { loc: '/acerca', priority: '0.5' },
  { loc: '/terminos', priority: '0.3' },
];

function escapeXml(str: string) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function toDate(v?: string) {
  return v ? String(v).split('T')[0] : undefined;
}

function urlEntry({ loc, lastmod, priority }: { loc: string; lastmod?: string; priority?: string }) {
  const abs = escapeXml(SITE_URL + loc);
  return `  <url>
    <loc>${abs}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}${priority ? `\n    <priority>${priority}</priority>` : ''}
  </url>`;
}

function wrapUrlset(entries: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
}

function xmlResponse(xml: string, count: number) {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // No cache: always reflect current published catalog. Invalidation-free.
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Url-Count': String(count),
    },
  });
}

// ---- Data loaders (server-side, service role, no auth, no JS/SPA) ----
async function loadSongs(base44: any) {
  const songs = await base44.asServiceRole.entities.Song.filter({ status: 'published' }, '-views', 5000);
  return (songs || []).filter((s: any) => s.artist_slug && s.slug);
}
async function loadArtists(base44: any) {
  const artists = await base44.asServiceRole.entities.Artist.list('-created_date', 3000);
  return (artists || []).filter((a: any) => a.slug);
}
async function loadPosts(base44: any) {
  const posts = await base44.asServiceRole.entities.BlogPost.filter({ published: true }, '-created_date', 1000);
  return (posts || []).filter((p: any) => p.slug);
}
async function loadInfographics(base44: any) {
  const items = await base44.asServiceRole.entities.Infographic.filter({ published: true }, '-created_date', 1000);
  return (items || []).filter((i: any) => i.slug);
}

// ---- Sub-sitemap builders ----
function buildSongsXml(songs: any[]) {
  const seen = new Set<string>();
  const entries: string[] = [];
  for (const s of songs) {
    const loc = `/${s.artist_slug}/${s.slug}`;
    if (seen.has(loc)) continue;
    seen.add(loc);
    entries.push(urlEntry({
      loc,
      lastmod: toDate(s.seo_updated_at) || toDate(s.updated_date),
      priority: s.is_trending ? '0.9' : s.views > 100 ? '0.8' : '0.6',
    }));
  }
  return wrapUrlset(entries);
}
function buildArtistsXml(artists: any[]) {
  const seen = new Set<string>();
  const entries: string[] = [];
  for (const a of artists) {
    const loc = `/${a.slug}`;
    if (seen.has(loc)) continue;
    seen.add(loc);
    entries.push(urlEntry({ loc, lastmod: toDate(a.updated_date), priority: a.is_featured ? '0.9' : '0.7' }));
  }
  return wrapUrlset(entries);
}
function buildBlogXml(posts: any[], infographics: any[]) {
  const entries: string[] = [];
  for (const p of posts) entries.push(urlEntry({ loc: `/blog/${p.slug}`, lastmod: toDate(p.updated_date), priority: '0.6' }));
  for (const i of infographics) entries.push(urlEntry({ loc: `/infografias/${i.slug}`, lastmod: toDate(i.updated_date), priority: '0.6' }));
  return wrapUrlset(entries);
}
function buildPagesXml() {
  return wrapUrlset(STATIC_URLS.map((s) => urlEntry({ loc: s.loc, lastmod: today(), priority: s.priority })));
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Which resource is requested. Prefer query param (?type=) but also accept a JSON body
    // { type } so the admin panel can invoke sub-sitemaps via base44.functions.invoke.
    let type = (url.searchParams.get('type') || '').toLowerCase();
    let robotsFlag = url.searchParams.get('robots') === '1';
    if (!type && (req.method === 'POST' || req.method === 'PUT')) {
      try {
        const body = await req.clone().json();
        if (body && typeof body.type === 'string') type = body.type.toLowerCase();
        if (body && body.robots) robotsFlag = true;
      } catch (_) { /* no body */ }
    }

    // robots.txt
    if (robotsFlag || type === 'robots') {
      const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
      return new Response(robots, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
    }

    const base44 = createClientFromRequest(req);

    // ---- Sub-sitemaps ----
    if (type === 'pages') {
      const xml = buildPagesXml();
      return xmlResponse(xml, STATIC_URLS.length);
    }
    if (type === 'songs') {
      const songs = await loadSongs(base44);
      const xml = buildSongsXml(songs);
      return xmlResponse(xml, songs.length);
    }
    if (type === 'artists') {
      const artists = await loadArtists(base44);
      const xml = buildArtistsXml(artists);
      return xmlResponse(xml, artists.length);
    }
    if (type === 'blog') {
      const [posts, infographics] = await Promise.all([loadPosts(base44), loadInfographics(base44)]);
      const xml = buildBlogXml(posts, infographics);
      return xmlResponse(xml, posts.length + infographics.length);
    }

    // ---- Default: sitemap index ----
    // A flat "all" mode returns every URL in one urlset (useful for direct validation).
    if (type === 'all') {
      const [songs, artists, posts, infographics] = await Promise.all([
        loadSongs(base44), loadArtists(base44), loadPosts(base44), loadInfographics(base44),
      ]);
      const entries: string[] = [];
      for (const s of STATIC_URLS) entries.push(urlEntry({ loc: s.loc, lastmod: today(), priority: s.priority }));
      for (const a of artists) entries.push(urlEntry({ loc: `/${a.slug}`, lastmod: toDate(a.updated_date), priority: a.is_featured ? '0.9' : '0.7' }));
      const seen = new Set<string>();
      for (const s of songs) {
        const loc = `/${s.artist_slug}/${s.slug}`;
        if (seen.has(loc)) continue; seen.add(loc);
        entries.push(urlEntry({ loc, lastmod: toDate(s.seo_updated_at) || toDate(s.updated_date), priority: s.is_trending ? '0.9' : s.views > 100 ? '0.8' : '0.6' }));
      }
      for (const p of posts) entries.push(urlEntry({ loc: `/blog/${p.slug}`, lastmod: toDate(p.updated_date), priority: '0.6' }));
      for (const i of infographics) entries.push(urlEntry({ loc: `/infografias/${i.slug}`, lastmod: toDate(i.updated_date), priority: '0.6' }));
      return xmlResponse(wrapUrlset(entries), entries.length);
    }

    // Sitemap index pointing at the child sitemaps.
    const base = `${SITE_URL}/sitemap.xml`;
    const lastmod = today();
    const sitemaps = ['pages', 'artists', 'songs', 'blog'].map((t) =>
      `  <sitemap>
    <loc>${escapeXml(`${base}?type=${t}`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
    );
    const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;
    return new Response(indexXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});