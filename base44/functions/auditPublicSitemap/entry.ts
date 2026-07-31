import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

const CANONICAL = 'https://guitarraia.com';
const SITEMAP_URL = `${CANONICAL}/sitemap.xml`;
const ROBOTS_URL = `${CANONICAL}/robots.txt`;

function analyzeSitemap(text: string, status: number, contentType: string) {
  const locs = [...text.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => match[1].trim());
  const unique = new Set(locs);
  const invalidUrls = locs.filter((loc) => !loc.startsWith(`${CANONICAL}/`));
  const privateUrls = locs.filter((loc) => /\/(admin|buscar|chat|login|registro|favoritos|historial)(?:[/?#]|$)/.test(loc));
  const isHtml = /<!doctype html|<html|<div id="root"/i.test(text);
  const hasXmlDeclaration = /^\s*<\?xml/i.test(text);
  const hasUrlset = /<urlset\b/i.test(text);
  const hasSitemapIndex = /<sitemapindex\b/i.test(text);
  const isValid = status === 200
    && hasXmlDeclaration
    && (hasUrlset || hasSitemapIndex)
    && locs.length > 0
    && !isHtml
    && invalidUrls.length === 0
    && privateUrls.length === 0;

  return {
    isValid,
    isHtml,
    hasXmlDeclaration,
    hasUrlset,
    hasSitemapIndex,
    locCount: locs.length,
    duplicateCount: locs.length - unique.size,
    invalidUrls: invalidUrls.slice(0, 20),
    invalidUrlCount: invalidUrls.length,
    privateUrls: privateUrls.slice(0, 20),
    privateUrlCount: privateUrls.length,
    contentType,
    firstUrl: locs[0] || '—',
    lastUrl: locs.at(-1) || '—',
  };
}

async function fetchPublic(url: string) {
  const response = await fetch(`${url}?audit=${Date.now()}`, {
    headers: {
      Accept: 'application/xml,text/plain;q=0.9,*/*;q=0.1',
      'User-Agent': 'GuitarraIA-Sitemap-Auditor/1.0',
    },
    redirect: 'follow',
  });
  return {
    status: response.status,
    finalUrl: response.url,
    contentType: response.headers.get('content-type') || 'sin cabecera',
    text: await response.text(),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [sitemap, robots] = await Promise.all([
      fetchPublic(SITEMAP_URL),
      fetchPublic(ROBOTS_URL),
    ]);

    return Response.json({
      ...analyzeSitemap(sitemap.text, sitemap.status, sitemap.contentType),
      status: sitemap.status,
      finalUrl: sitemap.finalUrl,
      robotsStatus: robots.status,
      robotsFinalUrl: robots.finalUrl,
      robotsHasSitemap: robots.text.includes(`Sitemap: ${SITEMAP_URL}`),
      auditedAt: new Date().toISOString(),
      canonical: CANONICAL,
    });
  } catch (error) {
    return Response.json({
      error: (error as Error).message || 'No fue posible auditar el sitemap público.',
    }, { status: 500 });
  }
});
