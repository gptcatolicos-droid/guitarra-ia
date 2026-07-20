import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function TablatureViewer({ song }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!song.tablature) {
    return (
      <p className="text-[#a7afb8] text-center py-12">
        No hay tablatura disponible para esta canción.
      </p>
    );
  }

  return (
    <div
      className={`bg-[#1a1d21] border border-[#2b3138] rounded-xl overflow-hidden ${
        fullscreen ? 'fixed inset-4 z-50' : ''
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2b3138]">
        <span className="text-[#a7afb8] text-xs">
          Afinación: {song.tuning || 'Estándar (E A D G B e)'}
          {song.capo ? ` · Capo: ${song.capo}` : ''}
        </span>
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="text-[#a7afb8] hover:text-white"
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre
          className="font-mono text-sm text-[#f3f4f6] whitespace-pre leading-relaxed"
          style={{ minWidth: '400px' }}
        >
          {song.tablature}
        </pre>
      </div>
    </div>
  );
}