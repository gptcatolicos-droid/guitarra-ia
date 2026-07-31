import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, PauseCircle, PlayCircle, Youtube } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChordDiagram from '@/components/ChordDiagram';
import { getChordDiagram } from '@/lib/musicTheory';

// Se mantienen aquí los dos lectores mínimos para que el reproductor nunca
// haga caer la aplicación si el archivo auxiliar todavía no se ha actualizado.
function getYouTubeVideoId(value = '') {
  const text = String(value || '').trim();
  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i);
  return match?.[1] || '';
}

function getYouTubePracticeMap(song) {
  try {
    const rawMap = song?.youtube_practice_map;
    const map = typeof rawMap === 'string' ? JSON.parse(rawMap) : rawMap;
    return Array.isArray(map?.chord_cues) && map.chord_cues.length >= 2 ? map : null;
  } catch {
    return null;
  }
}

function labelCase(value = '') {
  const clean = String(value).trim().replace(/\s+/g, ' ');
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : 'Sección';
}

function getPracticeForSong(song) {
  const videoId = song?.youtube_video_id || getYouTubeVideoId(song?.youtube_embed);
  const map = getYouTubePracticeMap(song);
  if (!videoId || !map) return null;

  const chordCues = map.chord_cues
    .map((cue) => ({ time: Number(cue?.time), chord: String(cue?.chord || '').trim() }))
    .filter((cue) => Number.isFinite(cue.time) && cue.time >= 0 && cue.chord)
    .sort((a, b) => a.time - b.time);
  if (chordCues.length < 2) return null;

  const sections = (Array.isArray(map.sections) ? map.sections : [])
    .map((section) => ({ time: Number(section?.time), label: labelCase(section?.label) }))
    .filter((section) => Number.isFinite(section.time) && section.time >= 0)
    .sort((a, b) => a.time - b.time);

  return {
    videoId,
    title: song?.title || 'Práctica con YouTube',
    chordCues,
    sections: sections.length ? sections : [{ time: 0, label: 'Inicio' }],
    confidence: Number(map.confidence) || null,
  };
}

let iframeApiPromise;
function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('YouTube no está disponible.'));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise((resolve, reject) => {
    const onReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      onReady?.();
      resolve(window.YT);
    };

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) {
      existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar el reproductor de YouTube.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('No se pudo cargar el reproductor de YouTube.'));
    document.head.appendChild(script);
  });

  return iframeApiPromise;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export default function YouTubePracticePlayer({ song }) {
  const practice = useMemo(
    () => getPracticeForSong(song),
    [song?.title, song?.youtube_video_id, song?.youtube_embed, song?.youtube_practice_map],
  );
  const targetRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState('');

  const activeSection = useMemo(() => {
    const sections = practice?.sections || [];
    return sections.reduce((current, section) => (section.time <= currentTime ? section : current), sections[0] || null);
  }, [currentTime, practice]);

  const activeCue = useMemo(() => {
    const cues = practice?.chordCues || [];
    return cues.reduce((current, cue) => (cue.time <= currentTime ? cue : current), cues[0] || null);
  }, [currentTime, practice]);

  const nextChords = useMemo(() => {
    const cues = practice?.chordCues || [];
    const activeIndex = cues.findIndex((cue) => cue === activeCue);
    return cues.slice(Math.max(0, activeIndex + 1), Math.max(0, activeIndex + 5));
  }, [activeCue, practice]);

  const activeChordName = activeCue?.chord || song?.original_key || '—';
  const activeChordDiagram = useMemo(() => getChordDiagram(activeChordName), [activeChordName]);

  useEffect(() => {
    if (!practice || !targetRef.current) return undefined;
    let disposed = false;
    setIsReady(false);
    setError('');

    loadYouTubeIframeApi()
      .then((YT) => {
        if (disposed || !targetRef.current || !YT?.Player) return;
        playerRef.current = new YT.Player(targetRef.current, {
          videoId: practice.videoId,
          width: '100%',
          height: '100%',
          playerVars: { playsinline: 1, rel: 0, enablejsapi: 1, origin: window.location.origin },
          events: {
            onReady: () => {
              const iframe = playerRef.current?.getIframe?.();
              iframe?.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
              iframe?.setAttribute('allowfullscreen', 'true');
              setCurrentTime(playerRef.current?.getCurrentTime?.() || 0);
              setIsReady(true);
            },
            onStateChange: (event) => {
              setIsPlaying(event.data === YT.PlayerState.PLAYING);
              setCurrentTime(playerRef.current?.getCurrentTime?.() || 0);
            },
            onError: () => setError('YouTube no permite reproducir este video aquí o en tu región.'),
          },
        });
      })
      .catch((loadError) => !disposed && setError(loadError?.message || 'No se pudo cargar YouTube.'));

    return () => {
      disposed = true;
      window.clearInterval(timerRef.current);
      try { playerRef.current?.destroy?.(); } catch { /* YouTube ya desmontó el iframe. */ }
      playerRef.current = null;
    };
  }, [practice]);

  useEffect(() => {
    window.clearInterval(timerRef.current);
    if (!isPlaying) return undefined;
    timerRef.current = window.setInterval(() => setCurrentTime(playerRef.current?.getCurrentTime?.() || 0), 250);
    return () => window.clearInterval(timerRef.current);
  }, [isPlaying]);

  if (!practice) return null;

  const startPractice = (startAt = currentTime) => {
    if (!isReady || !playerRef.current) return;
    playerRef.current.seekTo(startAt, true);
    playerRef.current.playVideo();
    setCurrentTime(startAt);
  };

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm" style={{ borderColor: '#FED7AA' }} aria-labelledby="youtube-practice-title">
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#EA580C' }}><Youtube className="h-5 w-5" /> Práctica guiada</div>
          <h2 id="youtube-practice-title" className="mt-1 text-xl font-bold" style={{ color: '#1F2937' }}>Practicar con IA · YouTube</h2>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Acordes sincronizados con este video.</p>
        </div>
        <a href={`https://www.youtube.com/watch?v=${practice.videoId}`} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold" style={{ color: '#EA580C' }}>
          Abrir en YouTube <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="px-5 pt-4">
        <div className="aspect-video overflow-hidden rounded-2xl bg-black"><div ref={targetRef} className="h-full w-full" title={practice.title} /></div>
        {error && <p className="mt-3 text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => (isPlaying ? playerRef.current?.pauseVideo() : startPractice())} disabled={!isReady || Boolean(error)} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ background: '#F97316' }}>
            {isPlaying ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            {isPlaying ? 'Pausar práctica' : (isReady ? 'Iniciar práctica' : 'Cargando video...')}
          </button>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>El reproductor y sus controles son los oficiales de YouTube.</p>
        </div>
      </div>

      <div className="border-t px-5 py-6" style={{ borderColor: '#FFEDD5' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: '#374151' }}>Sección actual: <span style={{ color: '#EA580C' }}>{activeSection?.label || 'Inicio'}</span></p>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: '#FFF7ED', color: '#C2410C' }}>{formatTime(currentTime)} · sincronizada</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {practice.sections.map((section) => {
            const isActive = section === activeSection;
            return <button key={`${section.label}-${section.time}`} type="button" onClick={() => startPractice(section.time)} disabled={!isReady || Boolean(error)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50" style={isActive ? { background: '#F97316', borderColor: '#F97316', color: '#fff' } : { background: '#fff', borderColor: '#FDBA74', color: '#C2410C' }}><PlayCircle className="h-3.5 w-3.5" /> {section.label} · {formatTime(section.time)}</button>;
          })}
        </div>
        <div className="mt-4 rounded-3xl border px-3 py-4 text-center sm:mt-6 sm:px-5 sm:py-7" style={{ borderColor: '#FED7AA', background: '#FFFDFB' }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#9CA3AF' }}>Acorde ahora</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChordName}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="mx-auto mt-3 grid max-w-2xl grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] items-stretch gap-2 sm:mt-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:gap-5"
            >
              <div className="flex min-h-36 items-center justify-center rounded-2xl px-3 text-5xl font-black shadow-lg sm:min-h-44 sm:rounded-3xl sm:px-8 sm:text-8xl" style={{ color: '#fff', background: 'linear-gradient(135deg, #FB923C, #F97316)' }}>
                {activeChordName}
              </div>
              <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-2xl border bg-white p-1 shadow-sm sm:min-h-44 sm:rounded-3xl sm:p-5" style={{ borderColor: '#FED7AA' }}>
                <div className="flex h-[136px] w-[106px] items-center justify-center sm:h-[150px] sm:w-[120px]">
                  <div className="scale-[1.28] sm:scale-[1.75]" style={{ transformOrigin: 'center' }}>
                    <ChordDiagram chordName={activeChordName} diagram={activeChordDiagram} capo={song?.capo || 0} playable={false} />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] sm:mt-7" style={{ color: '#9CA3AF' }}>Próximos cambios</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {nextChords.map((cue, index) => <span key={`${cue.time}-${cue.chord}-${index}`} className="rounded-xl border px-3 py-2 text-sm font-bold" style={{ borderColor: '#FDBA74', color: '#C2410C' }}>{cue.chord} <small className="font-medium opacity-70">{formatTime(cue.time)}</small></span>)}
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>Confianza del análisis: {practice.confidence ? `${Math.round(practice.confidence * 100)}%` : 'disponible'}.</p>
      </div>
    </section>
  );
}
