import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

const CANONICAL_ORIGIN = 'https://www.guitarraia.com';
const OUTPUT_DIR = resolve('public');

const STATIC_PATHS = [
  '/',
  '/acordes',
  '/artistas',
  '/canciones',
  '/blog',
  '/infografias',
  '/tienda',
  '/acerca',
  '/terminos',
];

const xmlEscape = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const segment = (value) => encodeURIComponent(String(value || '').trim());

const dateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const readInput = async () => {
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of input) {
    if (line.trim()) return JSON.parse(line);
  }
  throw new Error('No se recibieron datos JSON por stdin.');
};

const addUrl = (map, path, lastmod = null) => {
  if (!path || path.includes('/undefined') || path.includes('/null')) return;
  const loc = `${CANONICAL_ORIGIN}${path}`;
  const previous = map.get(loc);
  map.set(loc, previous || lastmod ? { loc, lastmod: previous?.lastmod || lastmod } : { loc });
};

const data = await readInput();
const urls = new Map();

for (const path of STATIC_PATHS) addUrl(urls, path);

for (const artist of data.artists || []) {
  if (artist.slug) addUrl(urls, `/${segment(artist.slug)}`, dateOnly(artist.updated_date));
}

for (const song of data.songs || []) {
  if (song.artist_slug && song.slug) {
    addUrl(
      urls,
      `/${segment(song.artist_slug)}/${segment(song.slug)}`,
      dateOnly(song.seo_updated_at || song.updated_date),
    );
  }
}

for (const post of data.posts || []) {
  if (post.slug) addUrl(urls, `/blog/${segment(post.slug)}`, dateOnly(post.updated_date));
}

for (const infographic of data.infographics || []) {
  if (infographic.slug) {
    addUrl(urls, `/infografias/${segment(infographic.slug)}`, dateOnly(infographic.updated_date));
  }
}

const body = [...urls.values()]
  .map(({ loc, lastmod }) => [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    '  </url>',
  ].filter(Boolean).join('\n'))
  .join('\n');

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  body,
  '</urlset>',
  '',
].join('\n');

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /admin',
  'Disallow: /buscar',
  'Disallow: /chat',
  '',
  `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`,
  '',
].join('\n');

await mkdir(OUTPUT_DIR, { recursive: true });
await Promise.all([
  writeFile(resolve(OUTPUT_DIR, 'sitemap.xml'), sitemap, 'utf8'),
  writeFile(resolve(OUTPUT_DIR, 'robots.txt'), robots, 'utf8'),
]);

process.stdout.write(JSON.stringify({
  urls: urls.size,
  songs: (data.songs || []).length,
  artists: (data.artists || []).length,
  posts: (data.posts || []).length,
  infographics: (data.infographics || []).length,
  output: 'public/sitemap.xml',
}));
