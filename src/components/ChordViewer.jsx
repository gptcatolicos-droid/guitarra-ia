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
import ChordSoundToggle from '@/components/audio/ChordSoundToggle';
import MobileChordSheet from '@/components/MobileChordSheet';
import TransposeControls from '@/components/TransposeControls';
import { useIsMobile } from '@/hooks/use-mobile';
import { Download, Printer, MoveHorizontal, AlignLeft } from 'lucide-react';

const SITE_URL = 'www.guitarraia.com';

function printChords(title, artist, text) {
  const win = window.open('', '_blank');
  if (!win) return;
  const doc = win.document;

  const style = doc.createElement('style');
  style.textContent =
    'body { font-family: monospace; font-size: 13px; padding: 24px; color: #111; }' +
    'h1 { font-size: 18px; margin-bottom: 4px; }' +
    'h2 { font-size: 14px; font-weight: normal; color: #555; margin-bottom: 16px; }' +
    'pre { white-space: pre; line-height: 1.7; }' +
    '.footer { margin-top: 24px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 8px; }';
  doc.head.appendChild(style);
  doc.title = `${title} - ${artist}`;

  const h1 = doc.createElement('h1');
  h1.textContent = title;
  const h2 = doc.createElement('h2');
  h2.textContent = artist;
  const pre = doc.createElement('pre');
  pre.textContent = text;
  const footer = doc.createElement('div');
  footer.className = 'footer';
  footer.textContent = SITE_URL;

  doc.body.append(h1, h2, pre, footer);
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

// Split a chord line + lyric line into attached { chord, lyric } segments,
// so the adaptable view can wrap without absolute positioning.
function pairLineToSegments(chordLine, lyricLine) {
  const segments = [];
  const chordRe = /\S+/g;
  const positions = [];
  let m;
  while ((m = chordRe.exec(chordLine)) !== null) {
    positions.push({ chord: m[0], index: m.index });
  }
  if (positions.length === 0) {
    return [{ chord: '', lyric: lyricLine }];
  }
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].index;
    const end = i + 1 < positions.length ? positions[i + 1].index : lyricLine.length;
    const lyric = lyricLine.slice(start, end).trim();
    segments.push({ chord: positions[i].chord, lyric });
  }
  // Preserve any lyric text before the first chord
  if (positions[0].index > 0) {
    segments.unshift({ chord: '', lyric: lyricLine.slice(0, positions[0].index).trim() });
  }
  return segments;
}

// Build adaptable rows: pair a chord line with the lyric line that follows it.
function buildAdaptableRows(lines) {
  const rows = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isChordLine(line) && line.trim()) {
      const next = lines[i + 1];
      if (next !== undefined && !isChordLine(next)) {
        rows.push({ type: 'pair', segments: pairLineToSegments(line, next) });
        i++;
      } else {
        rows.push({ type: 'chords', segments: pairLineToSegments(line, '') });
      }
    } else if (line.trim()) {
      rows.push({ type: 'lyric', text: line });
    } else {
      rows.push({ type: 'space' });
    }
  }
  return rows;
}

export default function ChordViewer({ song, transposeKey }) {
  const title = song.title?.replace(/\s*\d+$/, '').trim() || '';
  const artist = song.artist_name || '';
  const isMobile = useIsMobile();
  const [semitones, setSemitones] = useState(0);
  const [fontSize, setFontSize] = useState(15);
  const [autoScroll, setAutoScroll] = useState(false);
  const [showDiagrams, setShowDiagrams] = useState(true);
  const [adaptable, setAdaptable] = useState(false);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const scrollRef = useRef(null);

  // The original view is the safe default on every device.
  useEffect(() => {
    setAdaptable(false);
  }, [isMobile]);

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

  useEffect(() => {
    const checkOverflow = () => {
      const sheet = scrollRef.current;
      setHasHorizontalOverflow(Boolean(sheet && sheet.scrollWidth > sheet.clientWidth + 1));
    };
    const frame = requestAnimationFrame(checkOverflow);
    window.addEventListener('resize', checkOverflow);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [song.content_raw, semitones, fontSize, adaptable, isMobile]);

  if (!song.content_raw) {
    return (
      <p className="text-[#9CA3AF] text-center py-12">
        No hay acordes disponibles para esta canción.
      </p>
    );
  }

  const content = transposeContent(song.content_raw, semitones);
  const sections = parseSections(content);
  const usedChords = extractChordsFromContent(content);
  const useAdaptable = !isMobile && adaptable;

  return (
    <div className="song-chord-section song-chord-content w-full min-w-0">
      {/* Action buttons — full width on small screens */}
      <div className="grid grid-cols-2 sm:flex gap-2 mb-3">
        <button
          onClick={() => downloadChordsTxt(title, artist, song.content_raw)}
          className="flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <Download className="w-4 h-4" /> Descargar
        </button>
        <button
          onClick={() => printChords(title, artist, song.content_raw)}
          className="flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {/* The adaptable renderer is intentionally unavailable on mobile until songs have structured musical segments. */}
      {!isMobile && (
        <div className="flex items-center gap-1 mb-3 p-1 rounded-lg w-fit" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <button
            onClick={() => setAdaptable(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={useAdaptable ? { background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)', color: '#fff' } : { color: '#6B7280' }}
          >
            <AlignLeft className="w-3.5 h-3.5" /> Adaptable
          </button>
          <button
            onClick={() => setAdaptable(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
            style={!useAdaptable ? { background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)', color: '#fff' } : { color: '#6B7280' }}
          >
            <MoveHorizontal className="w-3.5 h-3.5" /> Original
          </button>
        </div>
      )}

      <div className="chord-controls">
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
      </div>

      {showDiagrams && usedChords.length > 0 && (
        <div className="chord-diagrams-card mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h3 className="text-[#1F2937] font-semibold text-sm">Acordes principales</h3>
            <ChordSoundToggle compact />
          </div>
          <div className="w-full max-w-full overflow-x-auto pb-1">
            <div className="flex w-max min-w-full justify-center gap-3 px-1">
              {usedChords.map((chord) => (
                <ChordDiagram
                  key={chord}
                  chordName={chord}
                  diagram={getChordDiagram(chord)}
                  capo={song.capo || 0}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {isMobile ? (
        <MobileChordSheet content={content} songId={song.id} />
      ) : (
        <>
          {!useAdaptable && hasHorizontalOverflow && (
            <p className="text-[12px] mb-1.5 flex items-center gap-1.5" style={{ color: '#9CA3AF' }}>
              <MoveHorizontal className="w-3 h-3" /> Desliza horizontalmente para ver el cifrado completo →
            </p>
          )}
          <div className="chord-sheet-card bg-white border border-[#E5E7EB] rounded-2xl w-full min-w-0 shadow-sm">
            {useAdaptable ? (
              <div ref={scrollRef} className="adaptable-chord-sheet" style={{ maxHeight: '70vh' }}>
                {sections.map((section, i) => (
                  <div key={i} className="mb-5">
                    <div className="text-[#C2410C] font-bold text-sm mb-2">[{section.name}]</div>
                    <div className="adaptable-chord-content" style={{ fontSize: `${Math.max(fontSize, 14)}px` }}>
                      {buildAdaptableRows(section.lines).map((row, j) => {
                        if (row.type === 'space') return <div key={j} className="h-3" />;
                        if (row.type === 'lyric') return <div key={j} className="song-lyric-line">{row.text}</div>;
                        return <div key={j} className="song-line">{row.segments.map((seg, k) => <span key={k} className="chord-segment"><span className="chord">{seg.chord || '\u00A0'}</span><span className="lyric">{seg.lyric || '\u00A0'}</span></span>)}</div>;
                      })}
                    </div>
                  </div>
                ))}
                <div className="mt-4 text-[#9CA3AF] text-xs font-mono border-t border-[#E5E7EB] pt-3">{SITE_URL}</div>
              </div>
            ) : (
              <div ref={scrollRef} className="chord-sheet-scroll">
                <pre className="chord-sheet-original" style={{ fontSize: `${fontSize}px` }}>{content}</pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}