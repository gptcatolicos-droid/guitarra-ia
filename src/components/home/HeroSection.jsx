import { Link } from 'react-router-dom';
import { Sparkles, Music } from 'lucide-react';

export default function HeroSection({ onChatFocus }) {
  return (
    <div className="grid lg:grid-cols-2 gap-8 items-center py-8 px-6 lg:px-8">
      {/* Left */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Asistente Musical con IA
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
          Encuentra acordes,{' '}
          <span className="text-gradient-brand">tablaturas y versiones</span>{' '}
          al instante con{' '}
          <span className="text-gradient-brand">IA</span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-8">
          Tu asistente inteligente para aprender cualquier canción en guitarra.
          Preciso, rápido y hecho para músicos.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onChatFocus}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm bg-gradient-brand hover:opacity-90 transition-opacity shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            Pregúntale a la IA
          </button>
          <Link
            to="/buscar"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-foreground font-semibold text-sm bg-card border border-border hover:border-orange-300 dark:hover:border-orange-500/50 transition-colors"
          >
            <Music className="w-4 h-4" />
            Explorar canciones
          </Link>
        </div>
      </div>

      {/* Right — example card */}
      <div className="hidden lg:block">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm">La Camisa Negra</p>
              <p className="text-muted-foreground text-xs">Juanes · Tonalidad: Am · Capo: 0</p>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 font-mono text-xs text-muted-foreground leading-relaxed mb-3">
            <p className="text-orange-500 font-semibold">[Intro]</p>
            <p>Am  F  C  G</p>
            <p className="text-orange-500 font-semibold mt-2">[Verso]</p>
            <p><span className="text-orange-500">Am</span>              <span className="text-orange-500">F</span></p>
            <p>Tengo la camisa negra...</p>
            <p><span className="text-orange-500">C</span>              <span className="text-orange-500">G</span></p>
            <p>porque negra tengo el alma...</p>
          </div>
          <div className="flex gap-2">
            {['Am', 'F', 'C', 'G'].map(c => (
              <div key={c} className="flex-1 bg-background border border-border rounded-lg py-2 text-center">
                <p className="text-orange-500 font-bold text-xs">{c}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-orange-50 dark:bg-orange-500/10 rounded-lg p-2">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span>Generado por Tablaturas IA · Dificultad: Fácil</span>
          </div>
        </div>
      </div>
    </div>
  );
}