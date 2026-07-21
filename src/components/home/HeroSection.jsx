import { Sparkles, Music } from 'lucide-react';
import SpotifyPlayer from '@/components/SpotifyPlayer';

const FEATURED_SONG = {
  id: 'hero-featured',
  title: 'La Camisa Negra',
  artist_name: 'Juanes',
  artist_slug: 'juanes',
  slug: 'la-camisa-negra',
};

export default function HeroSection({ onChatOpen }) {
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
          Buscar Tablaturas con IA
        </button>
      </div>

      {/* Right — example card with Spotify player */}
      <div className="hidden lg:block">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-foreground font-bold text-sm">La Camisa Negra</p>
              <p className="text-muted-foreground text-xs">Juanes · Tonalidad: Am · Capo: 0</p>
            </div>
          </div>
          <div className="bg-muted rounded-xl m-4 p-3 font-mono text-xs text-muted-foreground leading-relaxed">
            <p className="text-orange-500 font-semibold">[Intro]</p>
            <p>Am  F  C  G</p>
            <p className="text-orange-500 font-semibold mt-2">[Verso]</p>
            <p><span className="text-orange-500">Am</span>{'              '}<span className="text-orange-500">F</span></p>
            <p>Tengo la camisa negra...</p>
          </div>
          <SpotifyPlayer song={FEATURED_SONG} compact={false} />
        </div>
      </div>
    </div>
  );
}