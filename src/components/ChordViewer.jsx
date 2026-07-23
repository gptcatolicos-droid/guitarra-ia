import { useState, useEffect, useRef } from 'react';
import {
  transposeContent,
  extractChordsFromContent,
  parseSections,
  isChordLine,
  getChordDiagram,
  calculateTransposeSemitones,
} from '@/lib/musicTheory';
import ChordDiagram from '@/components/ChordDiagram';
import TransposeControls from '@/components/TransposeControls';
import { Download } from 'lucide-react';

const SITE_URL = 'www.guitarraia.com';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function printChords(title, artist, text) {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>${escapeHtml(title)} - ${escapeHtml(artist)}</title>
    <style>
      body { font-family: monospace; font-size: 13px; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      h2 { font-size: 14px; font-weight: normal; color: #555; margin-bottom: 16px; }
      pre { white-space: pre; line-height: 1.7; }
      .footer { margin-top: 24px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 8px; }
    </style></head><body>
    <h1>${escapeHtml(title)}</h1><h2>${escapeHtml(artist)}</h2>
    <pre>${escapeHtml(text)}</pre>
    <div class="footer">${escapeHtml(SITE_URL)}</div>
    </body></html>`);
  win.document.close();
  win.print();
}

function downloadChordsTxt(title, artist, text) {
  const content = `${title}\n${artist}\n\n${text}\n\n${SITE_URL}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${artist} - ${title}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ChordViewer({ song, transposeKey }) {
  const title = song.title?.replace(/\s*\d+$/, '').trim() || '';
  const artist = song.artist_name || '';
  const [semitones, setSemitones] = useState(0);
  const [fontSize, setFontSize] = useState(14);
  const [autoScroll, setAutoScroll] = useState(false);
  const [showDiagrams, setShowDiagrams] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (transposeKey && song.original_key) {
      setSemitones(calculateTransposeSemitones(song.original_key, transposeKey));
    } else {
      setSemitones(0);
    }
  }, [transposeKey, song.original_key]);

  useEffect(() => {
    if (!autoScroll) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += 0.8;
      }
    }, 50);
    return () => clearInterval(interval);
  }, [autoScroll]);

  if (!song.content_raw) {
    return (
      <p className="text-[#a7afb8] text-center py-12">
        No hay acordes disponibles para esta canción.
      </p>
    );
  }

  const content = transposeContent(song.content_raw, semitones);
  const sections = parseSections(content);
  const usedChords = extractChordsFromContent(content);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => downloadChordsTxt(title, artist, song.content_raw)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Descargar
        </button>
        <button
          onClick={() => printChords(title, artist, song.content_raw)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          🖨️ Imprimir
        </button>
      </div>
      <TransposeControls
        semitones={semitones}
        onTranspose={setSemitones}
        fontSize={fontSize}
        onFontSize={setFontSize}
        autoScroll={autoScroll}
        onAutoScroll={setAutoScroll}
        showDiagrams={showDiagrams}
        onShowDiagrams={setShowDiagrams}
      />

      {showDiagrams && usedChords.length > 0 && (
        <div className="mb-6 bg-[#1a1d21] border border-[#2b3138] rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3 text-sm">Acordes principales</h3>
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
              {usedChords.map((chord) => (
                <ChordDiagram
                  key={chord}
                  chordName={chord}
                  diagram={getChordDiagram(chord)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="chord-viewer-wrap bg-[#1a1d21] border border-[#2b3138] rounded-xl overflow-hidden">
        <div
          ref={scrollRef}
          className="chord-viewer-scroll p-4"
          style={{ maxHeight: '70vh', overflowX: 'auto', overflowY: 'auto' }}
        >
          {sections.map((section, i) => (
            <div key={i} className="mb-5">
              <div className="text-[#ff7a00] font-bold text-sm mb-1">
                [{section.name}]
              </div>
              <pre
                className="chord-pre font-mono"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.7, margin: 0, whiteSpace: 'pre' }}
              >
                {section.lines.map((line, j) => (
                  <div
                    key={j}
                    className={
                      isChordLine(line)
                        ? 'text-[#ff7a00]'
                        : line.trim()
                        ? 'text-[#f3f4f6]'
                        : 'text-[#2b3138]'
                    }
                  >
                    {line || '\u00A0'}
                  </div>
                ))}
              </pre>
            </div>
          ))}
          <div className="mt-4 text-[#555] text-xs font-mono border-t border-[#2b3138] pt-3">{SITE_URL}</div>
        </div>
      </div>
    </div>
  );
}