import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const SITE_URL = 'https://www.guitarraia.com';

const STATIC_URLS = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/buscar', changefreq: 'weekly', priority: '0.7' },
  { loc: '/acordes', changefreq: 'weekly', priority: '0.8' },
  { loc: '/artistas', changefreq: 'weekly', priority: '0.8' },
  { loc: '/canciones', changefreq: 'weekly', priority: '0.8' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.7' },
  { loc: '/infografias', changefreq: 'weekly', priority: '0.7' },
  { loc: '/tienda', changefreq: 'monthly', priority: '0.5' },
  { loc: '/chat', changefreq: 'monthly', priority: '0.6' },
];

function escapeXml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${escapeXml(SITE_URL + loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);

    // robots.txt
    if (url.searchParams.get('robots') === '1') {
      const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
      return new Response(robots, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    const base44 = createClientFromRequest(req);

    // Fetch published songs (paginate up to 5000)
    const songs = await base44.asServiceRole.entities.Song.filter(
      { status: 'published' }, '-views', 5000
    );

    // Fetch artists
    const artists = await base44.asServiceRole.entities.Artist.list('-created_date', 2000);

    // Fetch blog posts
    const posts = await base44.asServiceRole.entities.BlogPost.filter(
      { published: true }, '-created_date', 500
    );

    // Fetch published infographics
    const infographics = await base44.asServiceRole.entities.Infographic.filter(
      { published: true }, '-created_date', 500
    );

    const entries = [];

    // Static pages
    for (const s of STATIC_URLS) {
      entries.push(urlEntry(s));
    }

    // Artist pages
    for (const a of artists) {
      if (!a.slug) continue;
      entries.push(urlEntry({
        loc: `/${a.slug}`,
        lastmod: a.updated_date ? a.updated_date.split('T')[0] : undefined,
        changefreq: 'weekly',
        priority: a.is_featured ? '0.9' : '0.7',
      }));
    }

    // Song pages
    for (const s of songs) {
      if (!s.artist_slug || !s.slug) continue;
      const lastmod = s.seo_updated_at
        ? s.seo_updated_at.split('T')[0]
        : s.updated_date
        ? s.updated_date.split('T')[0]
        : undefined;
      entries.push(urlEntry({
        loc: `/${s.artist_slug}/${s.slug}`,
        lastmod,
        changefreq: 'monthly',
        priority: s.is_trending ? '0.9' : s.views > 100 ? '0.8' : '0.6',
      }));
    }

    // Blog posts
    for (const p of posts) {
      if (!p.slug) continue;
      entries.push(urlEntry({
        loc: `/blog/${p.slug}`,
        lastmod: p.updated_date ? p.updated_date.split('T')[0] : undefined,
        changefreq: 'monthly',
        priority: '0.6',
      }));
    }

    // Infographic pages
    for (const infographic of infographics) {
      if (!infographic.slug) continue;
      entries.push(urlEntry({
        loc: `/infografias/${infographic.slug}`,
        lastmod: infographic.updated_date ? infographic.updated_date.split('T')[0] : undefined,
        changefreq: 'monthly',
        priority: '0.7',
      }));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Url-Count': String(entries.length),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});