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

export default function ChordViewer({ song, transposeKey }) {
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
          <div className="flex flex-wrap gap-3">
            {usedChords.map((chord) => (
              <ChordDiagram
                key={chord}
                chordName={chord}
                diagram={getChordDiagram(chord)}
              />
            ))}
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="bg-[#1a1d21] border border-[#2b3138] rounded-xl p-4 overflow-y-auto"
        style={{ maxHeight: '70vh' }}
      >
        {sections.map((section, i) => (
          <div key={i} className="mb-5">
            <div className="text-[#ff7a00] font-bold text-sm mb-1">
              [{section.name}]
            </div>
            <pre
              className="font-mono whitespace-pre-wrap"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.7, margin: 0 }}
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
      </div>
    </div>
  );
}