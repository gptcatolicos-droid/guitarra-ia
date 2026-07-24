import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function decodeHtml(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function getMeta(html, property) {
  const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}

function looksBlocked(html, title) {
  const t = (title || '').toLowerCase();
  return !html || html.length < 2000 || t.includes('documento no encontrado') || t.includes('page not found') || /captcha|api-services-support|robot check|to discuss automated access/i.test(html);
}

// Try to scrape Amazon directly. Amazon frequently serves an anti-bot page to
// server requests, so this can legitimately return empty fields.
async function scrapeAmazon(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
      },
    });
    const html = await response.text();
    const title = getMeta(html, 'og:title') || (html.match(/<title>([^<]+)<\/title>/i)?.[1] || '');
    if (looksBlocked(html, title)) return null;

    const imageUrl = getMeta(html, 'og:image');
    const price = html.match(/<span[^>]+class=["'][^"']*a-price-whole[^"']*["'][^>]*>([^<]+)</i)?.[1]?.trim();
    const fraction = html.match(/<span[^>]+class=["'][^"']*a-price-fraction[^"']*["'][^>]*>([^<]+)</i)?.[1]?.trim();
    const description = getMeta(html, 'og:description');

    const result = {
      title: decodeHtml(title),
      image_url: imageUrl || '',
      price: price ? `$${price}${fraction ? `.${fraction}` : ''}` : '',
      description: description || '',
    };
    // Only trust the scrape if it actually got the key fields.
    if (result.title && result.image_url && result.price) return result;
    return { ...result, _partial: true };
  } catch (_) {
    return null;
  }
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

    const scraped = await scrapeAmazon(parsedUrl.toString());
    // Full scrape succeeded → return it directly.
    if (scraped && !scraped._partial) {
      return Response.json({ ...scraped, source: 'scrape' });
    }

    // Scrape blocked or incomplete → use AI with internet context to read the page.
    let ai = {};
    try {
      ai = await base44.integrations.Core.InvokeLLM({
        prompt: `Visita esta página de producto de Amazon y extrae sus datos reales: ${parsedUrl.toString()}
Devuelve el título completo del producto, el precio actual con símbolo de moneda tal como aparece, la URL directa de la imagen principal del producto (debe terminar en .jpg/.png/.webp y ser accesible públicamente, normalmente del dominio media-amazon.com o images-amazon.com), y una descripción corta (1-2 frases) útil para guitarristas. No inventes ningún dato: si no encuentras un campo, déjalo vacío.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            price: { type: 'string' },
            image_url: { type: 'string' },
            description: { type: 'string' },
          },
        },
      });
    } catch (_) {
      ai = {};
    }

    // Merge: prefer any partial scrape value, fall back to AI per field.
    const merged = {
      title: (scraped?.title || ai.title || '').trim(),
      price: (scraped?.price || ai.price || '').trim(),
      image_url: (scraped?.image_url || ai.image_url || '').trim(),
      description: (scraped?.description || ai.description || '').trim(),
      source: scraped?._partial ? 'scrape+ai' : 'ai',
    };

    return Response.json(merged);
  } catch (error) {
    return Response.json({ error: error.message || 'No se pudo obtener el producto.' }, { status: 500 });
  }
});