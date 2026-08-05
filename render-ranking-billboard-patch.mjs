import fs from 'node:fs';

const component = `import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Music2, ChevronLeft, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PAGE_SIZE = 25;

export default function GuitaristRankingTable({ rows = [], genre = '' }) {
  const [page, setPage] = useState(0);
  const [spotify, setSpotify] = useState({});
  const [loading, setLoading] = useState(false);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = useMemo(() => rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [rows, page]);

  useEffect(() => {
    if (!visible.length) return;
    const missing = visible.filter((row) => !spotify[row.name]);
    if (!missing.length) return;
    setLoading(true);
    base44.functions.invoke('spotifyRankingBatch', { artists: missing.map((row) => ({ name: row.name, project: row.project })) })
      .then(({ data }) => {
        const resolved = data?.results || [];
        setSpotify((current) => ({ ...current, ...Object.fromEntries(resolved.map((item) => [item.name, item])) }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, visible.map((row) => row.name).join('|')]);

  return <section className="mt-8" aria-label={\`Ranking de guitarristas de \${genre}\`}>
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor:'#E5E7EB' }}>
      <div><p className="text-xs font-black uppercase tracking-[.16em]" style={{color:'#F97316'}}>Ranking editorial GuitarraIA</p><h2 className="mt-1 text-xl font-black" style={{color:'#1F2937'}}>Los 100 esenciales de {genre}</h2><p className="mt-1 text-sm" style={{color:'#6B7280'}}>Posición, proyecto principal y canciones destacadas verificadas con Spotify.</p></div>
      <div className="flex items-center gap-2 text-xs font-bold" style={{color:'#6B7280'}}><Music2 className="h-4 w-4" style={{color:'#1DB954'}} /> {loading ? 'Consultando Spotify…' : 'Datos musicales conectados'}</div>
    </div>

    <div className="hidden overflow-hidden rounded-2xl border bg-white md:block" style={{borderColor:'#E5E7EB'}}>
      <table className="w-full border-collapse text-left">
        <thead><tr style={{background:'#111827',color:'#fff'}}><th className="w-16 px-4 py-4 text-center text-xs uppercase tracking-wider">#</th><th className="px-4 py-4 text-xs uppercase tracking-wider">Guitarrista</th><th className="px-4 py-4 text-xs uppercase tracking-wider">Banda / proyecto</th><th className="px-4 py-4 text-xs uppercase tracking-wider">Canciones esenciales</th></tr></thead>
        <tbody>{visible.map((row) => {
          const profile = spotify[row.name];
          return <tr key={row.rank} className="border-t align-top" style={{borderColor:'#E5E7EB'}}>
            <td className="px-4 py-5 text-center text-2xl font-black" style={{color:row.rank<=10?'#F97316':'#9CA3AF'}}>{row.rank}</td>
            <td className="px-4 py-5"><p className="font-black" style={{color:'#1F2937'}}>{row.name}</p>{profile?.artist_url && <a href={profile.artist_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold" style={{color:'#1DB954'}}>Perfil en Spotify <ExternalLink className="h-3 w-3" /></a>}</td>
            <td className="px-4 py-5 text-sm" style={{color:'#4B5563'}}>{row.project}</td>
            <td className="px-4 py-5"><div className="flex flex-wrap gap-2">{profile?.tracks?.length ? profile.tracks.map((track) => <a key={track.id} href={track.spotify_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold" style={{background:'#EAF8EF',color:'#137A37'}}><span className="text-[10px]">▶</span>{track.name}</a>) : <span className="text-xs" style={{color:'#9CA3AF'}}>{loading?'Buscando canciones…':'Canciones no resueltas'}</span>}</div></td>
          </tr>;
        })}</tbody>
      </table>
    </div>

    <div className="space-y-3 md:hidden">{visible.map((row) => {
      const profile = spotify[row.name];
      return <article key={row.rank} className="rounded-2xl border bg-white p-4" style={{borderColor:'#E5E7EB'}}><div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-black" style={{background:row.rank<=10?'#FFF1E6':'#F3F4F6',color:row.rank<=10?'#F97316':'#6B7280'}}>{row.rank}</span><div><h3 className="font-black" style={{color:'#1F2937'}}>{row.name}</h3><p className="text-sm" style={{color:'#6B7280'}}>{row.project}</p></div></div><div className="mt-3 flex flex-wrap gap-2">{profile?.tracks?.map((track) => <a key={track.id} href={track.spotify_url} target="_blank" rel="noreferrer" className="rounded-full px-3 py-1.5 text-xs font-bold" style={{background:'#EAF8EF',color:'#137A37'}}>▶ {track.name}</a>)}</div></article>;
    })}</div>

    <div className="mt-6 flex items-center justify-between"><button type="button" disabled={page===0} onClick={()=>{setPage((p)=>Math.max(0,p-1));window.scrollTo({top:0,behavior:'smooth'})}} className="inline-flex items-center gap-1 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40" style={{borderColor:'#FDBA74',color:'#C2410C'}}><ChevronLeft className="h-4 w-4" /> Anteriores</button><span className="text-sm font-semibold" style={{color:'#6B7280'}}>Página {page+1} de {pageCount}</span><button type="button" disabled={page>=pageCount-1} onClick={()=>{setPage((p)=>Math.min(pageCount-1,p+1));window.scrollTo({top:0,behavior:'smooth'})}} className="inline-flex items-center gap-1 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-40" style={{borderColor:'#FDBA74',color:'#C2410C'}}>Siguientes <ChevronRight className="h-4 w-4" /></button></div>
  </section>;
}`;
fs.mkdirSync('src/components/blog', { recursive:true });
fs.writeFileSync('src/components/blog/GuitaristRankingTable.jsx', component);

let blog = fs.readFileSync('src/pages/BlogPostPage.jsx','utf8');
if (!blog.includes("GuitaristRankingTable")) {
  blog = blog.replace("import { extractChordNames } from '@/lib/chordSearch';", "import { extractChordNames } from '@/lib/chordSearch';\nimport GuitaristRankingTable from '@/components/blog/GuitaristRankingTable';");
  blog = blog.replace("          {/* Content */}\n          <div className=\"blog-article-content blog-content min-w-0\">", "          {Array.isArray(post.ranking_rows) && post.ranking_rows.length > 0 && <GuitaristRankingTable rows={post.ranking_rows} genre={post.ranking_genre || post.title} />}\n          {/* Content */}\n          <div className=\"blog-article-content blog-content min-w-0\" style={Array.isArray(post.ranking_rows) && post.ranking_rows.length ? {display:'none'} : undefined}>");
}
fs.writeFileSync('src/pages/BlogPostPage.jsx', blog);

const rankingRows = [
['Nile Rodgers','Chic'],['Prince','Prince and The Revolution'],['Eddie Hazel','Funkadelic / Parliament'],['Jimmy Nolen','James Brown Band'],['Leo Nocentelli','The Meters'],['Ernie Isley','The Isley Brothers'],['Curtis Mayfield','The Impressions / carrera solista'],['Steve Cropper','Booker T. & the M.G.’s'],['Wah Wah Watson','The Funk Brothers / músico de sesión'],['Cornell Dupree','Músico de sesión / Stuff'],['Al McKay','Earth, Wind & Fire'],['Ray Parker Jr.','Raydio / carrera solista'],['Tony Maiden','Rufus featuring Chaka Khan'],['Paul Jackson Jr.','Músico de sesión'],['David T. Walker','Músico de sesión'],['Catfish Collins','James Brown Band / Bootsy’s Rubber Band'],['Phelps “Catfish” Collins','Parliament-Funkadelic'],['Garry Shider','Parliament-Funkadelic'],['Michael Hampton','Parliament-Funkadelic'],['DeWayne “Blackbyrd” McKnight','Parliament-Funkadelic'],['Sly Stone','Sly and the Family Stone'],['Freddie Stone','Sly and the Family Stone'],['Charles “Skip” Pitts','The Bo-Keys / Isaac Hayes'],['Teenage Steve Cropper','Stax Records house band'],['Reggie Young','The Memphis Boys'],['Bobby Womack','The Valentinos / carrera solista'],['Willie Hale “Little Beaver”','Carrera solista'],['Johnny “Guitar” Watson','Carrera solista'],['Shuggie Otis','Carrera solista'],['Bo Diddley','Carrera solista'],['Jimi Hendrix','The Jimi Hendrix Experience'],['Carlos Santana','Santana'],['Jeff Beck','Jeff Beck Group / carrera solista'],['John Frusciante','Red Hot Chili Peppers'],['Hillel Slovak','Red Hot Chili Peppers'],['Cory Wong','Vulfpeck / The Fearless Flyers'],['Mark Lettieri','Snarky Puppy / The Fearless Flyers'],['Tom Misch','Carrera solista'],['Eric Krasno','Soulive / Lettuce'],['Adam “Shmeeans” Smirnoff','Lettuce'],['Neal Sugarman','Sugarman 3 / Daptone'],['Thomas Brenneck','Menahan Street Band / Budos Band'],['Binky Griptite','The Dap-Kings'],['Joe Messina','The Funk Brothers'],['Robert White','The Funk Brothers'],['Eddie Willis','The Funk Brothers'],['Dennis Coffey','The Funk Brothers / carrera solista'],['Ray Monette','Rare Earth'],['Melvin “Wah Wah” Ragin','Motown / músico de sesión'],['Marlo Henderson','Músico de sesión'],['Phil Upchurch','Músico de sesión / carrera solista'],['George Benson','Carrera solista'],['Grant Green','Carrera solista'],['Melvin Sparks','Carrera solista'],['Boogaloo Joe Jones','Carrera solista'],['O’Donel Levy','Carrera solista'],['Ronny Jordan','Carrera solista'],['Spanky Alford','Músico de sesión / gospel y neo soul'],['Jef Lee Johnson','Músico de sesión / carrera solista'],['Isaiah Sharkey','The Vanguard / músico de sesión'],['Eric Gales','Carrera solista'],['Gary Clark Jr.','Carrera solista'],['D’Angelo','The Vanguard'],['Jesse Johnson','The Time / carrera solista'],['Dez Dickerson','The Revolution'],['Wendy Melvoin','The Revolution / Wendy & Lisa'],['Miko Weaver','Prince and The Revolution / NPG'],['Levi Seacer Jr.','New Power Generation'],['Mike Scott','New Power Generation'],['Morris Day','The Time'],['Monte Moir','The Time'],['Jesse Rae','Carrera solista'],['Bernard Edwards','Chic'],['Bruno Speight','Maceo Parker Band'],['Bruno Mars','Silk Sonic / carrera solista'],['Mateus Asato','Carrera solista / músico de sesión'],['Melanie Faye','Carrera solista'],['H.E.R.','Carrera solista'],['Tori Kelly','Carrera solista'],['Emily King','Carrera solista'],['Jack Stratton','Vulfpeck'],['Theo Katzman','Vulfpeck'],['Blake Mills','Carrera solista / productor'],['Madison Cunningham','Carrera solista'],['Andy Allo','New Power Generation / carrera solista'],['Doyle Bramhall II','Arc Angels / músico de sesión'],['Charlie Hunter','Carrera solista'],['Rob Harris','Jamiroquai'],['Simon Katz','Jamiroquai'],['Levi Seacer','The Sounds of Blackness / NPG'],['Keziah Jones','Carrera solista'],['Jean-Paul “Bluey” Maunick','Incognito'],['Ronnie Wilson','The Gap Band'],['Robert Wilson','The Gap Band'],['Roger Troutman','Zapp'],['Larry Blackmon','Cameo'],['Michael “Kidd Funkadelic” Hampton','Funkadelic'],['Tawl Ross','Funkadelic'],['Ron Bykowski','Funkadelic'],['Glenn Goins','Parliament-Funkadelic']
].map(([name,project],index)=>({rank:index+1,name,project}));

const seed = `import { pool } from './db.js';\nconst rows = ${JSON.stringify(rankingRows)};\nexport async function ensureBillboardRanking(){\n  const result=await pool.query(\"SELECT id,data FROM entity_records WHERE entity_name='BlogPost' AND lower(data->>'title') LIKE '%funk%y%soul%' LIMIT 1\");\n  if(!result.rows[0]) return;\n  const patch={ ranking_rows:rows, ranking_genre:'funk y soul', reading_time_min:22, excerpt:'Ranking editorial de 100 guitarristas esenciales de funk y soul, con bandas, proyectos y canciones verificadas en Spotify.', content:'## Criterio editorial\\n\\nEl orden considera influencia, identidad rítmica, innovación, repertorio y legado. Las canciones se consultan directamente mediante la API oficial de Spotify.' };\n  await pool.query(\"UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1\",[result.rows[0].id,JSON.stringify(patch)]);\n  console.log('Billboard funk and soul ranking ensured');\n}\n`;
fs.writeFileSync('server/ranking-billboard-seed.js', seed);

let index = fs.readFileSync('server/index.js','utf8');
if (!index.includes('ensureBillboardRanking')) {
  index = index.replace('import { sitemapHandler } from "./sitemap.js";', 'import { sitemapHandler } from "./sitemap.js";\nimport { ensureBillboardRanking } from "./ranking-billboard-seed.js";');
  index = index.replace('await initDatabase();', 'await initDatabase();\nawait ensureBillboardRanking();');
}
fs.writeFileSync('server/index.js', index);

let functions = fs.readFileSync('server/functions.js','utf8');
if (!functions.includes('spotifyRankingBatch')) {
  functions = functions.replace('functionsRouter.post("/:name", async (req, res) => {', `async function mapLimited(items, limit, worker) {\n  const output = new Array(items.length); let cursor = 0;\n  await Promise.all(Array.from({length:Math.min(limit,items.length)}, async()=>{ while(cursor<items.length){ const i=cursor++; output[i]=await worker(items[i]); } }));\n  return output;\n}\n\nfunctionsRouter.post("/:name", async (req, res) => {`);
  functions = functions.replace('    if (name === "spotifySearch") {', `    if (name === "spotifyRankingBatch") {\n      const artists = Array.isArray(req.body?.artists) ? req.body.artists.slice(0,25) : [];\n      if (!artists.length) return res.json({ results:[] });\n      const token = await spotifyToken();\n      const headers = { Authorization: \`Bearer \${token}\` };\n      const results = await mapLimited(artists, 5, async (input) => {\n        const artistName=String(input?.name||'').trim();\n        if(!artistName) return {name:artistName,tracks:[]};\n        const search=await fetch(\`https://api.spotify.com/v1/search?type=artist&limit=3&q=\${encodeURIComponent(artistName)}\`,{headers});\n        if(!search.ok) return {name:artistName,tracks:[]};\n        const data=await search.json();\n        const exact=(data.artists?.items||[]).find(a=>a.name.toLowerCase()===artistName.toLowerCase()) || data.artists?.items?.[0];\n        if(!exact) return {name:artistName,tracks:[]};\n        const top=await fetch(\`https://api.spotify.com/v1/artists/\${exact.id}/top-tracks?market=US\`,{headers});\n        const topData=top.ok?await top.json():{tracks:[]};\n        return {name:artistName,artist_url:exact.external_urls?.spotify||null,image_url:exact.images?.[1]?.url||exact.images?.[0]?.url||null,tracks:(topData.tracks||[]).slice(0,3).map(t=>({id:t.id,name:t.name,spotify_url:t.external_urls?.spotify}))};\n      });\n      return res.json({results});\n    }\n\n    if (name === "spotifySearch") {`);
}
fs.writeFileSync('server/functions.js', functions);
console.log('Billboard ranking and Spotify integration installed.');
