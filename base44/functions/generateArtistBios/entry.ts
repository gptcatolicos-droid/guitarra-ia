import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const BIO_PREFIX = 'biografia-de-';

function bioSlug(artistSlug: string) {
  return `${BIO_PREFIX}${artistSlug}`;
}

function cleanSongTitle(value: string) {
  return (value || '')
    .replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '')
    .replace(/\s*\d+$/, '')
    .trim();
}

function bioPrompt(artist: any, catalogSongs: any[]) {
  const catalogTitles = Array.from(new Set(catalogSongs.map((song) => cleanSongTitle(song.title)).filter(Boolean))).slice(0, 12);
  return `Eres el editor musical de GuitarraIA. Investiga y redacta una biografía editorial ORIGINAL en español sobre ${artist.name}.

No uses Spotify como fuente ni menciones Spotify. No copies textos de otras páginas. No incluyas letras de canciones. Solo afirma datos que puedas verificar con alta confianza; si un dato (fecha, miembro, álbum o hecho) no es verificable, omítelo. No inventes integrantes, álbumes, premios, fechas, cifras ni éxitos.

El artículo es para guitarristas y debe tener 650 a 1.000 palabras. Usa Markdown y estas secciones cuando existan datos comprobables:
## Historia y trayectoria
## Sonido e influencia
## Integrantes o formación
## Álbumes y canciones clave
## Para tocar en guitarra

El catálogo propio de GuitarraIA contiene estas canciones del artista: ${catalogTitles.length ? catalogTitles.join(', ') : 'sin canciones todavía'}. Puedes mencionarlas únicamente como canciones disponibles en GuitarraIA; no las presentes como éxitos universales salvo que puedas verificarlo.

Devuelve únicamente un JSON con este formato:
- title: "${artist.name}: biografía, trayectoria y canciones para guitarra"
- excerpt: resumen editorial verificable de máximo 260 caracteres
- content: artículo Markdown completo
- biographyShort: máximo 280 caracteres
- description: máximo 900 caracteres
- tags: 4 a 8 etiquetas, incluyendo "artista" y "biografia"
- readingTime: número entero entre 4 y 8
- qualityScore: 0 a 100
- warnings: lista de datos que no se pudieron confirmar
`;
}

async function loadAllArtists(base44: any) {
  const artists: any[] = [];
  const pageSize = 500;
  for (let page = 0; page < 10; page += 1) {
    const batch = await base44.asServiceRole.entities.Artist.list('name', pageSize, page * pageSize);
    artists.push(...(batch || []));
    if (!batch || batch.length < pageSize) break;
  }
  return artists.filter((artist) => artist.name && artist.slug && !artist.is_demo);
}

async function loadBioPosts(base44: any) {
  const posts: any[] = [];
  const pageSize = 500;
  for (let page = 0; page < 10; page += 1) {
    const batch = await base44.asServiceRole.entities.BlogPost.list('-created_date', pageSize, page * pageSize);
    posts.push(...(batch || []));
    if (!batch || batch.length < pageSize) break;
  }
  return posts.filter((post) => post.slug?.startsWith(BIO_PREFIX));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { action = 'status', batchSize = 5, postIds = [] } = await req.json().catch(() => ({}));
    const [artists, bioPosts] = await Promise.all([loadAllArtists(base44), loadBioPosts(base44)]);
    const postsBySlug = new Map(bioPosts.map((post) => [post.slug, post]));

    if (action === 'status') {
      const draft = bioPosts.filter((post) => !post.published).length;
      const published = bioPosts.filter((post) => post.published).length;
      return Response.json({
        totalArtists: artists.length,
        generated: bioPosts.length,
        drafts: draft,
        published,
        pending: artists.filter((artist) => !postsBySlug.has(bioSlug(artist.slug))).length,
        recent: bioPosts.slice(0, 10).map((post) => ({ id: post.id, slug: post.slug, title: post.title, published: post.published })),
      });
    }

    if (action === 'publish') {
      const allowed = new Set(postIds);
      const posts = bioPosts.filter((post) => allowed.has(post.id) && !post.published);
      await Promise.all(posts.map((post) => base44.asServiceRole.entities.BlogPost.update(post.id, { published: true })));
      return Response.json({ success: true, published: posts.length });
    }

    if (action !== 'generate') return Response.json({ error: 'Invalid action' }, { status: 400 });

    // Prioritize artists with the most catalog material, then work through all.
    const allSongs = await base44.asServiceRole.entities.Song.list('-views', 5000);
    const songsByArtist = new Map<string, any[]>();
    for (const song of allSongs || []) {
      if (!song.artist_slug) continue;
      const bucket = songsByArtist.get(song.artist_slug) || [];
      bucket.push(song);
      songsByArtist.set(song.artist_slug, bucket);
    }

    const pendingArtists = artists
      .filter((artist) => !postsBySlug.has(bioSlug(artist.slug)))
      .sort((a, b) => (songsByArtist.get(b.slug)?.length || 0) - (songsByArtist.get(a.slug)?.length || 0))
      .slice(0, Math.min(Math.max(Number(batchSize) || 5, 1), 10));

    const results: any[] = [];
    for (const artist of pendingArtists) {
      try {
        const generated = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: bioPrompt(artist, songsByArtist.get(artist.slug) || []),
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              excerpt: { type: 'string' },
              content: { type: 'string' },
              biographyShort: { type: 'string' },
              description: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              readingTime: { type: 'number' },
              qualityScore: { type: 'number' },
              warnings: { type: 'array', items: { type: 'string' } },
            },
            required: ['title', 'excerpt', 'content', 'qualityScore'],
          },
        });

        if (!generated.content || Number(generated.qualityScore || 0) < 55) {
          results.push({ artist: artist.name, status: 'review_required', warnings: generated.warnings || ['La respuesta no alcanzó la calidad mínima.'] });
          continue;
        }

        const post = await base44.asServiceRole.entities.BlogPost.create({
          slug: bioSlug(artist.slug),
          title: generated.title?.trim() || `${artist.name}: biografía y trayectoria`,
          excerpt: generated.excerpt?.trim() || generated.biographyShort?.trim() || '',
          content: generated.content.trim(),
          category: 'Canciones',
          tags: Array.from(new Set(['artista', 'biografia', `artista:${artist.slug}`, ...(generated.tags || [])])).slice(0, 10),
          reading_time_min: Math.min(Math.max(Math.round(generated.readingTime || 5), 3), 10),
          // Explicitly draft-only: an editor decides when it becomes public.
          published: false,
        });

        await base44.asServiceRole.entities.Artist.update(artist.id, {
          biography_short: (generated.biographyShort || generated.excerpt || '').slice(0, 280),
          description: (generated.description || generated.excerpt || '').slice(0, 1000),
        });
        results.push({ artist: artist.name, status: 'draft_created', postId: post.id, warnings: generated.warnings || [] });
      } catch (error) {
        results.push({ artist: artist.name, status: 'error', error: error.message || 'No se pudo generar la BIO.' });
      }
    }

    return Response.json({
      success: true,
      processed: pendingArtists.length,
      remaining: Math.max(artists.filter((artist) => !postsBySlug.has(bioSlug(artist.slug))).length - pendingArtists.length, 0),
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'No se pudo procesar las BIOs.' }, { status: 500 });
  }
});
