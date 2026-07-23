import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function decodeHtml(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function getMeta(html, property) {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { url } = await req.json();
    const parsedUrl = new URL(url);
    if (!/(^|\.)amazon\./i.test(parsedUrl.hostname)) {
      return Response.json({ error: 'La URL debe ser de Amazon.' }, { status: 400 });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GuitarraIA/1.0)',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
      },
    });
    const html = await response.text();
    const title = getMeta(html, 'og:title') || (html.match(/<title>([^<]+)<\/title>/i)?.[1] || '');
    const imageUrl = getMeta(html, 'og:image');
    const price = html.match(/<span[^>]+class=["'][^"']*a-price-whole[^"']*["'][^>]*>([^<]+)</i)?.[1]?.trim();
    const fraction = html.match(/<span[^>]+class=["'][^"']*a-price-fraction[^"']*["'][^>]*>([^<]+)</i)?.[1]?.trim();
    const description = getMeta(html, 'og:description');

    return Response.json({
      title: decodeHtml(title),
      image_url: imageUrl,
      price: price ? `$${price}${fraction ? `.${fraction}` : ''}` : '',
      description,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'No se pudo obtener el producto.' }, { status: 500 });
  }
});