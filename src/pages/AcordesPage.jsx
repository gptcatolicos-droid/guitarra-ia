import { useState, useMemo } from 'react';
import { useSEO } from '@/lib/seo';

// ─── Chord data (from ChatGPT design) ────────────────────────────────────────
const ROOTS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const RL = {"C":"C","C#":"C♯","D":"D","D#":"D♯","E":"E","F":"F","F#":"F♯","G":"G","G#":"G♯","A":"A","A#":"A♯","B":"B"};
const QL = {major:"Mayor",minor:"Menor","7":"Séptima",maj7:"Mayor 7",m7:"Menor 7",sus2:"Suspendido 2",sus4:"Suspendido 4",dim:"Disminuido",aug:"Aumentado","6":"Sexta",m6:"Menor 6",add9:"Add9","9":"Novena",m9:"Menor 9","7sus4":"7 sus4"};
const SUF = {major:"",minor:"m","7":"7",maj7:"maj7",m7:"m7",sus2:"sus2",sus4:"sus4",dim:"dim",aug:"aug","6":"6",m6:"m6",add9:"add9","9":"9",m9:"m9","7sus4":"7sus4"};
const ORDER = ["major","minor","7","maj7","m7","sus2","sus4","dim","aug","6","m6","add9","9","m9","7sus4"];

const E_shapes = {
  major:[0,2,2,1,0,0],minor:[0,2,2,0,0,0],"7":[0,2,0,1,0,0],maj7:[0,2,1,1,0,0],m7:[0,2,0,0,0,0],
  sus2:[0,2,4,4,0,0],sus4:[0,2,2,2,0,0],"6":[0,2,2,1,2,0],m6:[0,2,2,0,2,0],add9:[0,2,2,1,0,2],"9":[0,2,0,1,2,2],m9:[0,2,0,0,0,2],"7sus4":[0,2,0,2,0,0]
};
const A_shapes = {
  major:[-1,0,2,2,2,0],minor:[-1,0,2,2,1,0],"7":[-1,0,2,0,2,0],maj7:[-1,0,2,1,2,0],m7:[-1,0,2,0,1,0],
  sus2:[-1,0,2,2,0,0],sus4:[-1,0,2,2,3,0],"6":[-1,0,2,2,2,2],m6:[-1,0,2,2,1,2],add9:[-1,0,2,2,0,0],"9":[-1,0,2,0,2,2],m9:[-1,0,2,0,0,0],"7sus4":[-1,0,2,0,3,0]
};
const EF = {E:0,F:1,"F#":2,G:3,"G#":4,A:5,"A#":6,B:7,C:8,"C#":9,D:10,"D#":11};
const AF = {A:0,"A#":1,B:2,C:3,"C#":4,D:5,"D#":6,E:7,F:8,"F#":9,G:10,"G#":11};
const SPECIAL = {
  dim:{C:[-1,3,4,2,4,-1],"C#":[-1,4,5,3,5,-1],D:[-1,5,6,4,6,-1],"D#":[-1,6,7,5,7,-1],E:[-1,7,8,6,8,-1],F:[-1,8,9,7,9,-1],"F#":[-1,9,10,8,10,-1],G:[-1,10,11,9,11,-1],"G#":[-1,11,12,10,12,-1],A:[-1,0,1,2,1,-1],"A#":[-1,1,2,3,2,-1],B:[-1,2,3,4,3,-1]},
  aug:{C:[-1,3,2,1,1,-1],"C#":[-1,4,3,2,2,-1],D:[-1,5,4,3,3,-1],"D#":[-1,6,5,4,4,-1],E:[0,3,2,1,1,0],F:[1,4,3,2,2,1],"F#":[2,5,4,3,3,2],G:[3,6,5,4,4,3],"G#":[4,7,6,5,5,4],A:[-1,0,3,2,2,1],"A#":[-1,1,4,3,3,2],B:[-1,2,5,4,4,3]}
};

const shift = (shape, n) => shape.map(v => v < 0 ? -1 : v + n);
function position(root, quality) {
  if (SPECIAL[quality]) return SPECIAL[quality][root];
  const ef = EF[root], af = AF[root], hasA = !!A_shapes[quality], hasE = !!E_shapes[quality];
  return hasA && (!hasE || af <= ef) ? shift(A_shapes[quality], af) : shift(E_shapes[quality], ef);
}
const CHORDS = ROOTS.flatMap(root =>
  ORDER.map(quality => ({ root, quality, name: RL[root] + SUF[quality], frets: position(root, quality) }))
);

function windowFor(frets) {
  const p = frets.filter(x => x > 0);
  if (!p.length) return { start: 1, nut: true };
  const min = Math.min(...p), max = Math.max(...p);
  return max <= 5 ? { start: 1, nut: true } : { start: min, nut: false };
}
function calcFingers(frets) {
  const u = [...new Set(frets.filter(x => x > 0))].sort((a, b) => a - b);
  const m = new Map(u.slice(0, 4).map((f, i) => [f, i + 1]));
  return frets.map(f => f > 0 ? (m.get(f) || 4) : "");
}

// SVG chord diagram rendered in React
function ChordDiagramSVG({ frets, name }) {
  const L = 34, T = 42, SG = 22, FG = 28;
  const w = windowFor(frets);
  const fn = calcFingers(frets);

  const strings = Array.from({ length: 6 }, (_, i) => ({
    x: L + i * SG,
    fret: frets[i],
    finger: fn[i],
  }));

  return (
    <svg viewBox="0 0 180 220" role="img" aria-label={`Diagrama del acorde ${name}`} className="w-full max-w-[160px] mx-auto block">
      <defs>
        <linearGradient id="chord-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop stopColor="#FF6A00" />
          <stop offset="0.55" stopColor="#FF2D8D" />
          <stop offset="1" stopColor="#C026FF" />
        </linearGradient>
      </defs>
      {/* Vertical strings */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = L + i * SG;
        return <line key={i} x1={x} y1={T} x2={x} y2={T + 5 * FG} stroke="currentColor" strokeWidth="1.5" opacity="0.8" />;
      })}
      {/* Horizontal frets */}
      {Array.from({ length: 6 }, (_, i) => {
        const y = T + i * FG;
        return <line key={i} x1={L} y1={y} x2={L + 5 * SG} y2={y}
          stroke="currentColor" strokeWidth={i === 0 && w.nut ? 5 : 1.5} opacity="0.8" />;
      })}
      {/* Fret number */}
      {!w.nut && <text x="3" y={T + 20} fill="currentColor" fontSize="11" fontWeight="700" opacity="0.6">{w.start}fr</text>}
      {/* Dots */}
      {strings.map(({ x, fret, finger }, i) => {
        if (fret === -1) return <text key={i} x={x} y="24" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="800">×</text>;
        if (fret === 0) return <text key={i} x={x} y="24" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="800">○</text>;
        const rel = fret - w.start + 1;
        const cy = T + (rel - 0.5) * FG;
        return (
          <g key={i}>
            <circle cx={x} cy={cy} r="9" fill="url(#chord-grad)" stroke="white" strokeWidth="2" />
            <text x={x} y={cy} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="900">{finger}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ChordCard({ chord }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden hover:border-orange-400/60 transition-colors">
      {/* Top gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-brand" />
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="text-foreground font-bold text-2xl leading-none">{chord.name}</h2>
        <span className="text-xs font-bold px-2 py-1 rounded-full shrink-0" style={{ color: '#FF2D8D', background: 'rgba(255,45,141,0.1)' }}>
          {QL[chord.quality]}
        </span>
      </div>
      <ChordDiagramSVG frets={chord.frets} name={chord.name} />
      <div className="text-center text-xs text-muted-foreground font-mono mt-1">
        {chord.frets.map(x => x < 0 ? 'x' : x).join(' · ')}
      </div>
    </div>
  );
}

export default function AcordesPage() {
  useSEO({
    title: 'Acordes de Guitarra | Tablaturas AI',
    description: '180 acordes de guitarra con diagramas interactivos. Busca por nota y tipo de acorde.',
    canonical: '/acordes',
  });

  const [search, setSearch] = useState('');
  const [rootFilter, setRootFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return CHORDS.filter(c =>
      (!term || `${c.name} ${c.root} ${QL[c.quality]}`.toLowerCase().includes(term)) &&
      (!rootFilter || c.root === rootFilter) &&
      (!qualityFilter || c.quality === qualityFilter)
    );
  }, [search, rootFilter, qualityFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Biblioteca de <span className="text-gradient-brand">Acordes</span>
        </h1>
        <p className="text-muted-foreground text-sm">180 acordes comunes con diagramas para guitarra. Filtra por nota o tipo.</p>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pb-4 pt-1 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar: C, F#m7, Bbmaj7..."
          className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground outline-none focus:border-orange-500 transition-colors"
        />
        <select
          value={rootFilter}
          onChange={e => setRootFilter(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:border-orange-500 transition-colors"
        >
          <option value="">Todas las notas</option>
          {ROOTS.map(r => <option key={r} value={r}>{RL[r]}</option>)}
        </select>
        <select
          value={qualityFilter}
          onChange={e => setQualityFilter(e.target.value)}
          className="px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground outline-none focus:border-orange-500 transition-colors"
        >
          <option value="">Todos los tipos</option>
          {ORDER.map(q => <option key={q} value={q}>{QL[q]}</option>)}
        </select>
      </div>

      <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
        <span><strong className="text-foreground">{filtered.length}</strong> acordes</span>
        <span>Diagramas SVG interactivos</span>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((chord, i) => <ChordCard key={i} chord={chord} />)}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground">No se encontraron acordes para tu búsqueda.</p>
        </div>
      )}
    </div>
  );
}