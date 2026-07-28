import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, PauseCircle, PlayCircle, Youtube } from 'lucide-react';

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
      { time: 0, label: 'Intro' }, { time: 31, label: 'Verso' },
      { time: 73, label: 'Coro' }, { time: 123, label: 'Verso' },
      { time: 181, label: 'Puente' }, { time: 228, label: 'Coro final' },
    ],
    chordCues: [
      { time: 0, chord: 'G' }, { time: 7, chord: 'G9' }, { time: 14, chord: 'Em' },
      { time: 21, chord: 'Em7/B' }, { time: 27, chord: 'C' }, { time: 31, chord: 'C9' },
      { time: 36, chord: 'Am' }, { time: 42, chord: 'Am9' }, { time: 48, chord: 'G' },
      { time: 55, chord: 'G9' }, { time: 62, chord: 'Em' }, { time: 69, chord: 'C' },
      { time: 74, chord: 'G' }, { time: 81, chord: 'D' }, { time: 88, chord: 'Em' },
      { time: 95, chord: 'C' },
    ],
  };
}

let iframeApiPromise;

function loadYouTubeIframeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise((resolve, reject) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.();
      resolve(window.YT);
    };

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('No se pudo cargar el reproductor de YouTube.'));
    document.head.appendChild(script);
  });

  return iframeApiPromise;
}

const formatTime = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export default function YouTubePracticePlayer({ song }) {
  // Important: this must remain stable while currentTime changes. Otherwise the
  // YouTube instance is destroyed on every tick and playback can never start.
  const practice = useMemo(
    () => getYouTubePracticeForSong(song),
    [song?.title, song?.artist_name],
  );
  const targetRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState('');

  const activeSection = useMemo(() => {
    if (!practice) return null;
    return practice.sections.reduce(
      (current, section) => (section.time <= currentTime ? section : current),
      practice.sections[0],
    );
  }, [currentTime, practice]);

  const activeCue = useMemo(() => {
    if (!practice) return null;
    return practice.chordCues.reduce(
      (current, cue) => (cue.time <= currentTime ? cue : current),
      practice.chordCues[0],
    );
  }, [currentTime, practice]);

  const upcomingCues = useMemo(() => {
    if (!practice || !activeCue) return [];
    const activeIndex = practice.chordCues.findIndex((cue) => cue === activeCue);
    return practice.chordCues.slice(activeIndex + 1, activeIndex + 5);
  }, [activeCue, practice]);

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
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              const iframe = playerRef.current?.getIframe?.();
              iframe?.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
              iframe?.setAttribute('allowfullscreen', 'true');
              setCurrentTime(playerRef.current?.getCurrentTime?.() || 0);
              setIsReady(true);
            },
            onStateChange: (event) => {
              const playing = event.data === YT.PlayerState.PLAYING;
              setIsPlaying(playing);
              setCurrentTime(playerRef.current?.getCurrentTime?.() || 0);
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
    }, 250);
    return () => window.clearInterval(timerRef.current);
  }, [isPlaying]);

  if (!practice) return null;

  const startPractice = (startAt = currentTime) => {
    if (!isReady || !playerRef.current) return;
    playerRef.current.seekTo(startAt, true);
    playerRef.current.playVideo();
    setCurrentTime(startAt);
  };

  const pausePractice = () => playerRef.current?.pauseVideo();

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm" style={{ borderColor: '#FED7AA' }} aria-labelledby="youtube-practice-title">
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#EA580C' }}><Youtube className="h-5 w-5" /> Práctica guiada</div>
          <h2 id="youtube-practice-title" className="mt-1 text-xl font-bold" style={{ color: '#1F2937' }}>Practicar con YouTube</h2>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Video oficial con cambios de acordes para esta prueba.</p>
        </div>
        <a href={`https://www.youtube.com/watch?v=${practice.videoId}`} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold" style={{ color: '#EA580C' }}>
          Abrir en YouTube <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="px-5 pt-4">
        <div className="aspect-video overflow-hidden rounded-2xl bg-black"><div ref={targetRef} className="h-full w-full" title={practice.title} /></div>
        {error && <p className="mt-3 text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => (isPlaying ? pausePractice() : startPractice())} disabled={!isReady || Boolean(error)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50" style={{ background: '#F97316' }}>
            {isPlaying ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            {isPlaying ? 'Pausar práctica' : (isReady ? 'Iniciar práctica' : 'Cargando video...')}
          </button>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>El reproductor y sus controles son los oficiales de YouTube.</p>
        </div>
      </div>

      <div className="border-t px-5 py-5" style={{ borderColor: '#FFEDD5' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: '#374151' }}>Sección actual: <span style={{ color: '#EA580C' }}>{activeSection?.label || 'Intro'}</span></p>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: '#FFF7ED', color: '#C2410C' }}>{formatTime(currentTime)} · guía piloto</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {practice.sections.map((section) => {
            const isActive = section.label === activeSection?.label;
            return <button key={`${section.label}-${section.time}`} type="button" onClick={() => startPractice(section.time)} disabled={!isReady || Boolean(error)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50" style={isActive ? { background: '#F97316', borderColor: '#F97316', color: '#fff' } : { background: '#fff', borderColor: '#FDBA74', color: '#C2410C' }}><PlayCircle className="h-3.5 w-3.5" /> {section.label} · {formatTime(section.time)}</button>;
          })}
        </div>
        <div className="mt-5 grid gap-3 rounded-2xl border p-4 sm:grid-cols-[minmax(150px,0.7fr)_1fr]" style={{ borderColor: '#FED7AA', background: '#FFFDFB' }}>
          <div><p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Acorde ahora</p><div className="mt-2 inline-flex min-w-24 items-center justify-center rounded-xl px-5 py-3 text-3xl font-black" style={{ color: '#fff', background: '#F97316' }}>{activeCue?.chord || '—'}</div></div>
          <div><p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>Próximos cambios</p><div className="mt-2 flex flex-wrap gap-2">{upcomingCues.map((cue) => <span key={`${cue.time}-${cue.chord}`} className="rounded-lg border px-2.5 py-1.5 text-sm font-bold" style={{ borderColor: '#FDBA74', color: '#C2410C' }}>{cue.chord} <small className="font-medium opacity-70">{formatTime(cue.time)}</small></span>)}</div></div>
        </div>
        <p className="mt-4 text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>Mapa de acordes de demostración: sirve para validar la experiencia antes de automatizar y revisar el mapa de cada canción.</p>
      </div>
    </section>
  );
}
