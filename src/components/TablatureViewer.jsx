import { useState } from 'react';
import { Maximize2, Minimize2, Download } from 'lucide-react';

const SITE_URL = 'www.tablaturasai.com';

function printContent(title, artist, text) {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${title} - ${artist}</title>
    <style>
      body { font-family: monospace; font-size: 13px; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      h2 { font-size: 14px; font-weight: normal; color: #555; margin-bottom: 16px; }
      pre { white-space: pre; line-height: 1.7; }
      .footer { margin-top: 24px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 8px; }
    </style></head><body>
    <h1>${title}</h1><h2>${artist}</h2>
    <pre>${text}</pre>
    <div class="footer">${SITE_URL}</div>
    </body></html>`);
  win.document.close();
  win.print();
}

function downloadTxt(title, artist, text) {
  const content = `${title}\n${artist}\n\n${text}\n\n${SITE_URL}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${artist} - ${title}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TablatureViewer({ song }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!song.tablature) {
    return (
      <p className="text-[#a7afb8] text-center py-12">
        No hay tablatura disponible para esta canción.
      </p>
    );
  }

  const title = song.title?.replace(/\s*\d+$/, '').trim() || '';
  const artist = song.artist_name || '';

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
        <div className="flex items-center gap-1">
          <button
            onClick={() => downloadTxt(title, artist, song.tablature)}
            className="text-[#a7afb8] hover:text-white p-1"
            title="Descargar .txt"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => printContent(title, artist, song.tablature)}
            className="text-[#a7afb8] hover:text-white p-1 text-xs font-mono"
            title="Imprimir"
          >
            🖨️
          </button>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="text-[#a7afb8] hover:text-white p-1"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        <pre
          className="font-mono text-sm text-[#f3f4f6] whitespace-pre leading-relaxed"
          style={{ minWidth: '400px' }}
        >
          {song.tablature}
        </pre>
        <div className="mt-4 text-[#555] text-xs font-mono">{SITE_URL}</div>
      </div>
    </div>
  );
}