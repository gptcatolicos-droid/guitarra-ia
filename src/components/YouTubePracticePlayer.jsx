import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, PlayCircle, Youtube } from 'lucide-react';
import { extractChordsFromContent } from '@/lib/musicTheory';

const normalize = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

function getYouTubePracticeForSong(song) {
  const title = normalize(song?.title);
  const artist = normalize(song?.artist_name);

  if (!title.includes('silent lucidity') || !artist.includes('queensryche')) return null;

  return {
    videoId: 'jhat-xUQ6dw',
    title: 'Silent Lucidity — Queensrÿche',
    sections: [
      { time: 0, label: 'Intro' },
      { time: 31, label: 'Verso' },
      { time: 73, label: 'Coro' },
      { time: 123, label: 'Verso' },
      { time: 181, label: 'Puente' },
      { time: 228, label: 'Coro final' },
    ],
  };
}

let iframeApiPromise;

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise((resolve, reject) => {
    const existingHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      existingHandler?.();
      resolve(window.YT);
    };

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('No se pudo cargar YouTube.'));
    document.head.appendChild(script);
  });

  return iframeApiPromise;
}

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * Official YouTube player with a small, section-level practice guide.
 * It does not download, alter, or analyse YouTube audio.
 */
export default function YouTubePracticePlayer({ song }) {
  const practice = getYouTubePracticeForSong(song);
  const targetRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState('');

  const songChords = useMemo(
    () => extractChordsFromContent(song?.content_raw || '').slice(0, 8),
    [song?.content_raw],
  );

  const activeSection = useMemo(() => {
    if (!practice) return null;
    return practice.sections.reduce(
      (current, section) => (section.time <= currentTime ? section : current),
      practice.sections[0],
    );
  }, [currentTime, practice]);

  useEffect(() => {
    if (!practice || !targetRef.current) return undefined;
    let disposed = false;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (disposed || !targetRef.current) return;
        playerRef.current = new YT.Player(targetRef.current, {
          videoId: practice.videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: () => setIsReady(true),
            onStateChange: (event) => {
              const playing = event.data === YT.PlayerState.PLAYING;
              setIsPlaying(playing);
              if (!playing) setCurrentTime(playerRef.current?.getCurrentTime?.() || 0);
            },
            onError: () => setError('YouTube no permite reproducir este video aquí o en tu región.'),
          },
        });
      })
      .catch((loadError) => setError(loadError.message || 'No se pudo cargar YouTube.'));

    return () => {
      disposed = true;
      window.clearInterval(timerRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [practice]);

  useEffect(() => {
    window.clearInterval(timerRef.current);
    if (!isPlaying) return undefined;
    timerRef.current = window.setInterval(() => {
      setCurrentTime(playerRef.current?.getCurrentTime?.() || 0);
    }, 350);
    return () => window.clearInterval(timerRef.current);
  }, [isPlaying]);

  if (!practice) return null;

  const seekToSection = (section) => {
    if (!isReady || !playerRef.current) return;
    playerRef.current.seekTo(section.time, true);
    playerRef.current.playVideo();
    setCurrentTime(section.time);
  };

  return (
    <section
      className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm"
      style={{ borderColor: '#FED7AA' }}
      aria-labelledby="youtube-practice-title"
    >
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#EA580C' }}>
            <Youtube className="h-5 w-5" /> Práctica guiada
          </div>
          <h2 id="youtube-practice-title" className="mt-1 text-xl font-bold" style={{ color: '#1F2937' }}>
            Practicar con YouTube
          </h2>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>
            Video oficial con una guía de secciones para esta prueba.
          </p>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${practice.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold"
          style={{ color: '#EA580C' }}
        >
          Abrir en YouTube <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="px-5 pt-4">
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <div ref={targetRef} className="h-full w-full" title={practice.title} />
        </div>
        {error && <p className="mt-3 text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>}
      </div>

      <div className="border-t px-5 py-5" style={{ borderColor: '#FFEDD5' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: '#374151' }}>
            Sección actual: <span style={{ color: '#EA580C' }}>{activeSection?.label || 'Intro'}</span>
          </p>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: '#FFF7ED', color: '#C2410C' }}>
            {formatTime(currentTime)} · guía piloto
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {practice.sections.map((section) => {
            const isActive = section.label === activeSection?.label;
            return (
              <button
                key={`${section.label}-${section.time}`}
                type="button"
                onClick={() => seekToSection(section)}
                disabled={!isReady}
                className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={isActive
                  ? { background: '#F97316', borderColor: '#F97316', color: '#fff' }
                  : { background: '#fff', borderColor: '#FDBA74', color: '#C2410C' }}
              >
                <PlayCircle className="h-3.5 w-3.5" /> {section.label} · {formatTime(section.time)}
              </button>
            );
          })}
        </div>
        {songChords.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Acordes de la canción</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {songChords.map((chord) => (
                <span key={chord} className="rounded-lg px-2.5 py-1 text-sm font-bold" style={{ background: '#FFF7ED', color: '#EA580C' }}>
                  {chord}
                </span>
              ))}
            </div>
          </div>
        )}
        <p className="mt-4 text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
          Esta prueba sincroniza secciones, no cambios de acorde individuales. El video y sus controles son los oficiales de YouTube.
        </p>
      </div>
    </section>
  );
}
