import fs from 'node:fs';

const componentPath = 'src/components/blog/GuitaristRankingTable.jsx';
if (fs.existsSync(componentPath)) {
  let component = fs.readFileSync(componentPath, 'utf8');
  component = component.replace(
    "  const [loading, setLoading] = useState(false);",
    "  const [loading, setLoading] = useState(false);\n  const [spotifyError, setSpotifyError] = useState('');"
  );
  component = component.replace(
    ".then(({ data }) => {\n        const resolved = data?.results || [];",
    ".then(({ data }) => {\n        if (data?.error) setSpotifyError(data.error); else setSpotifyError('');\n        const resolved = data?.results || [];"
  );
  component = component.replace(
    ".catch(() => {})",
    ".catch((error) => setSpotifyError(error?.message || 'No se pudo consultar Spotify'))"
  );
  component = component.replace(
    "{loading ? 'Consultando Spotify…' : 'Datos musicales conectados'}",
    "{loading ? 'Consultando Spotify…' : spotifyError ? 'Spotify requiere configuración' : 'Datos musicales conectados'}"
  );
  component = component.replaceAll(
    "<span className=\"text-xs\" style={{color:'#9CA3AF'}}>{loading?'Buscando canciones…':'Canciones no resueltas'}</span>",
    "loading ? <span className=\"text-xs\" style={{color:'#9CA3AF'}}>Buscando canciones…</span> : <a href={`https://open.spotify.com/search/${encodeURIComponent(`${row.name} ${row.project || ''}`)}`} target=\"_blank\" rel=\"noreferrer\" className=\"inline-flex items-center gap-1 text-xs font-bold\" style={{color:'#1DB954'}}>Buscar en Spotify <ExternalLink className=\"h-3 w-3\" /></a>"
  );
  component = component.replace(
    "    <div className=\"mt-6 flex items-center justify-between\">",
    "    {spotifyError && <p className=\"mt-4 rounded-xl border px-4 py-3 text-xs\" style={{borderColor:'#FDE68A',background:'#FFFBEB',color:'#92400E'}}>La tabla está activa, pero Render no pudo autenticar la API de Spotify. Verifica SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET.</p>}\n    <div className=\"mt-6 flex items-center justify-between\">"
  );
  fs.writeFileSync(componentPath, component);
}

const seed = `import { pool } from './db.js';

function clean(value='') {
  return String(value).replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').replace(/\\s+/g,' ').trim();
}
function genreFromTitle(title='') {
  const match=String(title).match(/guitarristas(?:\\s+esenciales)?\\s+de\\s+([^:|]+)/i);
  return clean(match?.[1] || title.replace(/top\\s*100|guitarristas|selecci[oó]n editorial/gi,' ')).toLowerCase();
}
function parseRows(content='') {
  const source=String(content || '');
  const candidates=[];
  const patterns=[
    /(?:^|\\n)\\s*(?:\\d+[.)-]?\\s*)?\\*\\*([^*\\n]{2,80})\\*\\*\\s*(?:[—–-]\\s*([^\\n]{2,120}))?/gm,
    /(?:^|\\n)\\s*(?:\\d+[.)-]?\\s*)?([A-ZÁÉÍÓÚÑÜ][^\\n—–]{1,70}?)\\s+[—–]\\s*([^\\n]{2,120})/gm,
    /<strong>([^<]{2,80})<\\/strong>\\s*(?:[—–-]\\s*([^<\\n]{2,120}))?/gi
  ];
  for (const pattern of patterns) {
    let match;
    while ((match=pattern.exec(source))) {
      const name=clean(match[1]).replace(/^#?\\d+\\s*/, '').trim();
      let project=clean(match[2] || '');
      if (!name || /criterio|clasificaci[oó]n|selecci[oó]n|guitarristas esenciales|introducci[oó]n/i.test(name)) continue;
      if (/seleccionado por|influencia|t[eé]cnica|lenguaje musical|legado/i.test(project)) project='';
      candidates.push({name,project});
    }
  }
  const unique=[]; const seen=new Set();
  for (const item of candidates) {
    const key=item.name.toLowerCase();
    if(seen.has(key)) continue;
    seen.add(key); unique.push(item);
    if(unique.length===100) break;
  }
  return unique.map((item,index)=>({rank:index+1,name:item.name,project:item.project || 'Carrera solista / proyectos asociados'}));
}

export async function ensureAllGuitaristRankings(){
  const result=await pool.query(\`SELECT id,data FROM entity_records
    WHERE entity_name='BlogPost'
      AND lower(data->>'title') LIKE '%top 100%guitarristas%'\`);
  let updated=0;
  for(const row of result.rows){
    const data=row.data || {};
    let rows=Array.isArray(data.ranking_rows) ? data.ranking_rows : [];
    if(rows.length < 10) rows=parseRows(data.content || '');
    if(!rows.length) continue;
    rows=rows.slice(0,100).map((item,index)=>({rank:index+1,name:clean(item.name),project:clean(item.project) || 'Carrera solista / proyectos asociados'}));
    const patch={
      ranking_rows:rows,
      ranking_genre:data.ranking_genre || genreFromTitle(data.title),
      reading_time_min:Math.max(Number(data.reading_time_min)||0,18),
      excerpt:data.excerpt || \`Ranking editorial de guitarristas, bandas, proyectos y canciones conectadas con Spotify.\`
    };
    await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1',[row.id,JSON.stringify(patch)]);
    updated++;
  }
  console.log('All guitarist rankings ensured', {found:result.rows.length,updated});
}
`;
fs.writeFileSync('server/all-rankings-seed.js', seed);

let index=fs.readFileSync('server/index.js','utf8');
if(!index.includes('ensureAllGuitaristRankings')){
  index=index.replace('import { ensureBillboardRanking } from "./ranking-billboard-seed.js";', 'import { ensureBillboardRanking } from "./ranking-billboard-seed.js";\nimport { ensureAllGuitaristRankings } from "./all-rankings-seed.js";');
  index=index.replace('await ensureBillboardRanking();', 'await ensureBillboardRanking();\nawait ensureAllGuitaristRankings();');
}
fs.writeFileSync('server/index.js',index);

let functions=fs.readFileSync('server/functions.js','utf8');
functions=functions.replace(
  'if (!id || !secret) throw new Error("Spotify credentials are not configured");',
  'if (!id || !secret) { console.error("Spotify credentials missing", { hasClientId:Boolean(id), hasClientSecret:Boolean(secret) }); throw new Error("Spotify credentials are not configured"); }'
);
functions=functions.replace(
  'if (!response.ok) throw new Error(`Spotify token failed: ${response.status}`);',
  'if (!response.ok) { const detail=await response.text().catch(()=>""); console.error("Spotify token failed", response.status, detail.slice(0,300)); throw new Error(`Spotify token failed: ${response.status}`); }'
);
functions=functions.replace(
  "if(!search.ok) return {name:artistName,tracks:[]};",
  "if(!search.ok) { console.error('Spotify artist search failed', artistName, search.status); return {name:artistName,tracks:[],error:`search_${search.status}`}; }"
);
functions=functions.replace(
  "if(!tracksRes.ok) return {name:artistName,artist_name:exact.name,artist_url:exact.external_urls?.spotify,tracks:[]};",
  "if(!tracksRes.ok) { console.error('Spotify top tracks failed', artistName, tracksRes.status); return {name:artistName,artist_name:exact.name,artist_url:exact.external_urls?.spotify,tracks:[],error:`tracks_${tracksRes.status}`}; }"
);
fs.writeFileSync('server/functions.js',functions);

console.log('All rankings and Spotify diagnostics installed.');
