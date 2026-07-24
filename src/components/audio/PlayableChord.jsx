import { useState, useRef, useCallback } from 'react';
import { useChordSound } from '@/lib/audio/useChordSound';

// PlayableChord — reusable wrapper that makes any chord clickable/tappable to
// hear it. Wraps arbitrary children (a diagram, a chord token, etc.).
//
// - No autoplay: audio unlocks on the user's tap/click/Enter/Space.
// - Mobile-safe: distinguishes a real tap from a scroll (pointer move cancels).
// - Accessible: role=button, keyboard, aria-label, aria-pressed while playing.
// - Visual feedback that does not rely on color alone (ring + scale + icon).
export default function PlayableChord({
  chord,
  capo = 0,
  mode,
  children,
  className = '',
  ariaLabelPrefix = 'Reproducir acorde',
  disabled = false,
}) {
  const { settings, play } = useChordSound();
  const [playing, setPlaying] = useState(false);
  const [unrecognized, setUnrecognized] = useState(false);
  const pointerStart = useRef(null);
  const moved = useRef(false);
  const timerRef = useRef(null);

  const trigger = useCallback(async () => {
    if (disabled || !chord) return;
    const res = await play(chord, { capo, mode });
    if (res.recognized) {
      setUnrecognized(false);
      setPlaying(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setPlaying(false), 900);
    } else {
      // Never guess / play a different chord — just flag it briefly.
      setUnrecognized(true);
      setTimeout(() => setUnrecognized(false), 600);
    }
  }, [chord, capo, mode, play, disabled]);

  // Pointer handling: only fire on a clean tap (no significant movement = not a scroll).
  const onPointerDown = (e) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
  };
  const onPointerMove = (e) => {
    if (!pointerStart.current) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    if (dx > 10 || dy > 10) moved.current = true;
  };
  const onPointerUp = () => {
    if (!moved.current) trigger();
    pointerStart.current = null;
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      trigger();
    }
  };

  if (!settings.enabled) {
    // Sound off globally — render children plainly, no interactivity.
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${ariaLabelPrefix} ${chord}`}
      aria-pressed={playing}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      className={`relative inline-flex items-center justify-center rounded-lg cursor-pointer select-none transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00] ${
        playing ? 'scale-105' : ''
      } ${className}`}
      style={{ minWidth: 44, minHeight: 44, touchAction: 'pan-y' }}
    >
      {children}
      {/* Playing ring — visual state independent of color (adds scale + ring + label) */}
      {playing && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-[#ff7a00] animate-pulse"
        />
      )}
      {unrecognized && (
        <span className="pointer-events-none absolute -top-1 -right-1 text-[9px] px-1 rounded bg-[#3a4048] text-[#a7afb8]">
          ?
        </span>
      )}
    </div>
  );
}