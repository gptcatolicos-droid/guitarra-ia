import { Link } from 'react-router-dom';

export default function SongResultCard({ song }) {
  return (
    <Link
      to={`/${song.artist_slug}/${song.slug}`}
      className="block bg-[#20242a] border border-[#2b3138] rounded-xl p-4 hover:border-[#ff7a00] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-white font-semibold truncate">{song.title}</h4>
          <p className="text-[#a7afb8] text-sm truncate">{song.artist_name}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-[#a7afb8]">
            {song.original_key && <span>Tonalidad: {song.original_key}</span>}
            {song.difficulty && <span>· {song.difficulty}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {song.has_chords && (
            <span className="px-2 py-0.5 bg-[#ff7a00]/10 text-[#ff7a00] text-xs rounded text-center">
              Acordes
            </span>
          )}
          {song.has_tablature && (
            <span className="px-2 py-0.5 bg-[#ff7a00]/10 text-[#ff7a00] text-xs rounded text-center">
              Tablatura
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}