import { useState, useEffect } from 'react';
import { Sparkles, Music, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SpotifyPlayer from '@/components/SpotifyPlayer';

const DEFAULT_SONG = {
  id: 'hero-default',
  title: 'La Camisa Negra',
  artist_name: 'Juanes',
  artist_slug: 'juanes',
  slug: 'la-camisa-negra',
  original_key: 'Am',
  capo: 0,
  has_chords: true,
  content_raw: '[Intro]\nAm  F  C  G\n\n[Verso]\nAm              F\nTengo la camisa negra...',
};

function SongCard({ song }) {
  const title = song.title.replace(/\s*-\s*\d+\s*-\s*[a-f0-9]+\s*$/i, '').replace(/\s*\d+$/, '').replace(/[-_]/g, ' ').trim();
  const previewLines = (song.content_raw || song.tablature || '').split('\n').slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg w-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #B89245, #D4AF37, #F59A23)' }}
        >
          <Music className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-foreground font-bold text-sm truncate">{title}</p>
          <p className="text-muted-foreground text-xs">
            {song.artist_name}
            {song.original_key ? ` · Tonalidad: ${song.original_key}` : ''}
            {song.capo ? ` · Capo: ${song.capo}` : ''}
          </p>
        </div>
      </div>
      {/* Content preview */}
      <div className="bg-secondary rounded-xl m-3 p-3 font-mono text-xs text-muted-foreground leading-relaxed max-h-28 overflow-hidden">
        {previewLines.map((line, i) => (
          <p key={i} className={line.startsWith('[') ? 'font-semibold' : ''}
            style={line.startsWith('[') ? { color: '#D4AF37' } : {}}>
            {line || '\u00a0'}
          </p>
        ))}
      </div>
      <SpotifyPlayer song={song} compact={false} />
      {/* CTA buttons */}
      <div className="flex gap-2 px-3 pb-3">
        {song.has_chords && (
          <Link
            to={`/${song.artist_slug}/${song.slug}/acordes`}
            className="flex-1 text-center py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #B89245, #D4AF37, #F59A23)' }}
          >
            Ver Acordes
          </Link>
        )}
        {song.has_tablature && (
          <Link
            to={`/${song.artist_slug}/${song.slug}/tablatura`}
            className="flex-1 text-center py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #B89245, #D4AF37, #F59A23)' }}
          >
            Ver Tablatura
          </Link>
        )}
      </div>
    </div>
  );
}

export default function HeroSection({ onChatOpen, heroSongs = [] }) {
  const [idx, setIdx] = useState(0);
  const songs = heroSongs.length > 0 ? heroSongs : [DEFAULT_SONG];

  useEffect(() => {
    if (songs.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % songs.length), 5000);
    return () => clearInterval(t);
  }, [songs.length]);

  const prev = () => setIdx((i) => (i - 1 + songs.length) % songs.length);
  const next = () => setIdx((i) => (i + 1) % songs.length);

  return (
    <div className="grid lg:grid-cols-2 gap-10 items-center py-14 px-6 lg:px-8 border-b border-border">
      {/* Left — copy */}
      <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6 tracking-wide"
          style={{
            color: '#B89245',
            border: '1px solid rgba(212,175,55,0.42)',
            background: 'rgba(212,175,55,0.08)',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Asistente Musical con IA
        </div>

        {/* Headline — Playfair Display */}
        <h1 className="font-display text-5xl lg:text-6xl font-bold text-foreground leading-[0.98] tracking-tight mb-5" style={{ letterSpacing: '-0.04em' }}>
          Encuentra{' '}
          <span className="text-gradient-brand">acordes,</span>
          <br />
          tablaturas y canciones
          <br />
          al instante{' '}
          <span className="text-gradient-brand">con IA.</span>
        </h1>

        <p className="text-muted-foreground text-lg leading-relaxed mb-10 max-w-lg">
          Tu asistente inteligente para aprender cualquier canción en guitarra.
          Preciso, rápido y hecho para músicos.
        </p>

        <button
          onClick={onChatOpen}
          className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #B89245 0%, #D4AF37 45%, #F59A23 100%)',
            boxShadow: '0 12px 32px rgba(212,175,55,0.28)',
          }}
        >
          <Sparkles className="w-5 h-5" />
          Buscar Acordes IA
        </button>
      </div>

      {/* Right — song card carousel */}
      <div className="hidden lg:block relative">
        <SongCard song={songs[idx]} />
        {songs.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button onClick={next} className="absolute right-[-16px] top-1/2 -translate-y-1/2 w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:bg-secondary transition-colors">
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
            <div className="flex justify-center gap-1.5 mt-3">
              {songs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ background: i === idx ? '#D4AF37' : 'hsl(var(--border))' }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}