import { useEffect, useMemo } from 'react';
import { parseMobileChordSheet } from '@/lib/mobileChordParser';

export default function MobileChordSheet({ content, songId }) {
  const rows = useMemo(() => parseMobileChordSheet(content), [content]);

  useEffect(() => {
    if (rows.some((row) => row.type === 'lyric' && !row.text)) {
      console.warn(`Cifrado móvil requiere revisión manual: ${songId}`);
    }
  }, [rows, songId]);

  return (
    <div className="mobile-chord-sheet">
      {rows.map((row, index) => {
        if (row.type === 'space') return <div key={index} className="mobile-chord-space" />;
        if (row.type === 'section') return <h3 key={index} className="song-section-label">{row.text}</h3>;
        if (row.type === 'info') return <p key={index} className="song-info-line"><strong>{row.label}</strong> {row.value}</p>;
        if (row.type === 'progression') return <div key={index} className="mobile-chord-progression">{row.chords.map((chord, chordIndex) => <span key={`${chord}-${chordIndex}`}>{chord}</span>)}</div>;
        if (row.type === 'lyric') return <p key={index} className="lyric-only-line">{row.text}</p>;
        return (
          <div key={index} className="responsive-chord-line">
            {row.segments.map((segment, segmentIndex) => (
              <span key={`${segment.chord}-${segmentIndex}`} className="mobile-chord-segment">
                <span className="chord-label">{segment.chord}</span>
                <span className="lyric-text">{segment.lyric || '\u00A0'}</span>
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}