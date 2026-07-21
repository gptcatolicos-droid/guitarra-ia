import { useState, useEffect } from 'react';
import { Sparkles, Music, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SpotifyPlayer from '@/components/SpotifyPlayer';

// Fallback hardcoded song if no hero songs configured
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
  // Get first few lines of content for preview
  const previewLines = (song.content_raw || song.tablature || '').split('\n').slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg w-full">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
          <Music className="w-5 h-5 text-white" />
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
      <div className="bg-muted rounded-xl m-4 p-3 font-mono text-xs text-muted-foreground leading-relaxed max-h-28 overflow-hidden">
        {previewLines.map((line, i) => (
          <p key={i} className={line.startsWith('[') ? 'text-primary font-semibold' : ''}>
            {line || '\u00a0'}
          </p>
        ))}
      </div>
      <SpotifyPlayer song={song} compact={false} />
      {/* View buttons */}
      <div className="flex gap-2 px-4 pb-4">
        {song.has_chords && (
          <Link to={`/${song.artist_slug}/${song.slug}/acordes`} className="flex-1 text-center py-2 rounded-xl text-xs font-semibold text-white bg-gradient-brand hover:opacity-90 transition-opacity">
            Ver Acordes
          </Link>
        )}
        {song.has_tablature && (
          <Link to={`/${song.artist_slug}/${song.slug}/tablatura`} className="flex-1 text-center py-2 rounded-xl text-xs font-semibold text-white bg-gradient-brand hover:opacity-90 transition-opacity">
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

  // Auto-advance carousel
  useEffect(() => {
    if (songs.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % songs.length), 5000);
    return () => clearInterval(t);
  }, [songs.length]);

  const prev = () => setIdx((i) => (i - 1 + songs.length) % songs.length);
  const next = () => setIdx((i) => (i + 1) % songs.length);

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-center py-12 px-6 lg:px-8">
      {/* Left */}
      <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Asistente Musical con IA
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
          Encuentra acordes,{' '}
          <span className="text-gradient-brand">tablaturas</span>{' '}
          de Canciones al instante{' '}
          <span className="text-gradient-brand">con IA.</span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-10">
          Tu asistente inteligente para aprender cualquier canción en guitarra.
          Preciso, rápido y hecho para músicos.
        </p>
        <button
          onClick={onChatOpen}
          className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-lg bg-gradient-brand hover:opacity-90 transition-opacity shadow-xl shadow-orange-500/20"
        >
          <Sparkles className="w-5 h-5" />
          Buscar Acordes IA
        </button>
      </div>

      {/* Right — carousel */}
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
            {/* Dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {songs.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === idx ? 'bg-primary' : 'bg-border'}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}