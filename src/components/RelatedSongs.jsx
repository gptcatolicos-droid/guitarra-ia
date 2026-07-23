import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Sparkles, Music2, Users } from 'lucide-react';

export default function RelatedSongs({ song }) {
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!song) return;
    let cancelled = false;

    const load = async () => {
      try {
        // Get songs from same artist first
        const sameArtist = await base44.entities.Song.filter(
          { artist_slug: song.artist_slug },
          '-views',
          10
        );

        // Filter out current song and pick up to 2
        const artistSongs = (sameArtist || [])
          .filter(s => s.id !== song.id)
          .slice(0, 2);

        // If we need more, get trending/popular songs with same chords
        let extra = [];
        if (artistSongs.length < 2 && song.chords_used?.length > 0) {
          const trending = await base44.entities.Song.filter({ is_trending: true }, '-views', 6);
          extra = (trending || []).filter(s => s.id !== song.id && s.artist_slug !== song.artist_slug).slice(0, 2 - artistSongs.length);
        }

        if (!cancelled) {
          setRelated([...artistSongs, ...extra].slice(0, 2));
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [song?.id]);

  if (loading || related.length === 0) return null;

  return (
    <div className="mt-10 pt-6" style={{ borderTop: '1px solid #272C2F' }}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4" style={{ color: '#FF7200' }} />
        <h3 className="text-sm font-bold" style={{ color: '#F4F4F2' }}>La IA te sugiere...</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map(s => {
          const title = s.title.replace(/\s*\d+$/, '').trim();
          const isSameArtist = s.artist_slug === song.artist_slug;
          return (
            <Link
              key={s.id}
              to={`/${s.artist_slug}/${s.slug}`}
              className="flex items-center gap-3 rounded-xl p-3 transition-colors group"
              style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,114,0,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#272C2F'}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(255,114,0,0.1)' }}>
                {isSameArtist
                  ? <Music2 className="w-5 h-5" style={{ color: '#FF7200' }} />
                  : <Users className="w-5 h-5" style={{ color: '#FF7200' }} />
                }
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate group-hover:text-orange-400 transition-colors" style={{ color: '#F4F4F2' }}>{title}</p>
                <p className="text-xs truncate" style={{ color: '#747B7F' }}>{s.artist_name}</p>
                {s.difficulty && (
                  <span className="text-[10px] font-medium" style={{ color: '#A7ACAE' }}>{s.difficulty}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}