import { Link } from 'react-router-dom';

// Strip trailing numbers and ID-like suffixes: "Soda Stereo - 01 - abc123" → "Soda Stereo"
// or "De Música Ligera 01" → "De Música Ligera"
function cleanTitle(title) {
  return (title || '')
    .replace(/\s*-\s*\d+\s*-\s*[a-f0-9]{6,}\s*$/i, '') // "- 01 - abc123ef" at end
    .replace(/\s*\d+$/, '')                               // trailing number
    .trim();
}

export default function SongResultCard({ song }) {
  const displayTitle = cleanTitle(song.title);
  return (
    <Link
      to={`/${song.artist_slug}/${song.slug}`}
      className="block bg-card border border-border rounded-xl p-4 hover:border-primary transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-foreground font-semibold truncate">{displayTitle}</h4>
          <p className="text-muted-foreground text-sm truncate">{song.artist_name}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {song.original_key && <span>Tonalidad: {song.original_key}</span>}
            {song.difficulty && <span>· {song.difficulty}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {song.has_chords && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded text-center">
              Acordes
            </span>
          )}
          {song.has_tablature && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded text-center">
              Tablatura
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}