import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';

// Dropdown artist selector with an internal search field.
// Replaces the old wall of artist buttons. Shows song count per artist,
// alphabetically sorted, and only renders a capped list at a time.
export default function ArtistSelect({ artists, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? artists.filter((a) => a.name.toLowerCase().includes(q)) : artists;
    return list.slice(0, 60);
  }, [artists, query]);

  const selected = artists.find((a) => a.slug === value);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      >
        <span className="truncate">
          {selected ? `${selected.name} (${selected.count})` : 'Todos los artistas'}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <X
              className="w-4 h-4 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
            />
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar artista..."
              className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-secondary/50"
            >
              <span className="text-foreground">Todos los artistas</span>
              {!value && <Check className="w-4 h-4 text-primary" />}
            </button>
            {filtered.map((a) => (
              <button
                key={a.slug}
                type="button"
                onClick={() => { onChange(a.slug); setOpen(false); setQuery(''); }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-secondary/50"
              >
                <span className="text-foreground truncate">{a.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {a.count}
                  {value === a.slug && <Check className="w-4 h-4 text-primary inline ml-1.5" />}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-muted-foreground text-center">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}