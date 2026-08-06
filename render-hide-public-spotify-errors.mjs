import fs from 'node:fs';

const path = 'src/components/blog/GuitaristRankingTable.jsx';
if (!fs.existsSync(path)) {
  console.log('Spotify public-error cleanup skipped: ranking component missing.');
  process.exit(0);
}

let source = fs.readFileSync(path, 'utf8');

source = source.replace(
  "{loading ? 'Consultando Spotify…' : spotifyError ? 'Spotify requiere configuración' : 'Datos musicales conectados'}",
  "{loading ? 'Consultando canciones…' : 'Canciones en Spotify'}"
);

source = source.replace(
  /\s*\{spotifyError && <p className="mt-4 rounded-xl border px-4 py-3 text-xs"[\s\S]*?<\/p>\}/,
  ''
);

fs.writeFileSync(path, source, 'utf8');
console.log('Public Spotify diagnostics removed.');
