import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, PauseCircle, PlayCircle, Youtube } from 'lucide-react';
import { getYouTubeVideoId, isYouTubePracticePilot } from '@/lib/youtubePractice';

const PILOT_GUIDE = {
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

const SECTION_NAMES = /^(?:\[?\s*)?(intro|verso|coro|pre[-\s]?coro|puente|solo|outro|interludio|estrofa)(?:\s*\]?)?\s*[:\-–—]?\s*/i;
const CHORD_TOKEN = '[A-G](?:#|b)?(?:(?:maj|min|m|M|sus|add|dim|aug)?\\d*)?(?:\\/[A-G](?:#|b)?)?';
const CHORD_GLOBAL = new RegExp('\\b(' + CHORD_TOKEN + ')\\b', 'g');
const CHORD_EXACT = new RegExp('^' + CHORD_TOKEN + '$');

function labelCase(value = '') {
  const clean = String(value).trim().replace(/\s+/g, ' ');
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : 'Sección';
}

function chordTokens(line = '') {
  return [...String(line).matchAll(CHORD_GLOBAL)].map((match) => match[1]).filter((token) => CHORD_EXACT.test(token));
}

function getCifradoSequence(song) {
  const raw = String(song?.content_raw || song?.tablature || '');
  const sequence = [];
  const sectionLabels = [];
  raw.split(/\r?\n/).forEach((line) => {
    const sectionMatch = line.match(SECTION_NAMES);
    const withoutSection = sectionMatch ? line.slice(sectionMatch[0].length) : line;
    const tokens = chordTokens(withoutSection);
    if (!tokens.length) return;

    const lettersOnly = withoutSection
      .replace(CHORD_GLOBAL, '')
      .replace(/[\s\d()[\]{}:;|,./xX*+\-–—]/g, '');

    // Un cifrado contiene líneas enteras de acordes; esta regla evita extraer
    // letras sueltas de las estrofas y toma el orden original del cifrado.
    const chordLine = Boolean(sectionMatch) || lettersOnly.length <= Math.max(1, Math.floor(withoutSection.length * 0.18));
    if (!chordLine) return;

    if (sectionMatch) sectionLabels.push(labelCase(sectionMatch[1]));
    tokens.forEach((chord) => sequence.push(chord));
  });

  const deduped = sequence.filter((chord, index) => index === 0 || chord !== sequence[index - 1]);
  return {
    sequence: deduped.length ? deduped : (song?.original_key ? [song.original_key] : []),
    sectionLabels: [...new Set(sectionLabels)],
  };
}

function secondsFrom(value = '') {
  const bits = String(value).trim().split(':').map(Number);
  if (bits.some(Number.isNaN)) return null;
  if (bits.length === 1) return bits[0];
  if (bits.length === 2) return (bits[0] * 60) + bits[1];
  return null;
}

function parsePracticeMap(value = '') {
  const cues = [];
  const sections = [];
  String(value || '').split(/\r?\n|,/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    // Formato: 0:00 [Intro] D  |  0:04 G  |  1:13 [Coro] D
    const match = line.match(new RegExp('^(\\d+(?::\\d{1,2})?)\\s*(?:[-=|:]?\\s*)?(?:\\[([^\\]]+)\\]\\s*)?(' + CHORD_TOKEN + ')\\s*$', 'i'));
    if (!match) return;
    const time = secondsFrom(match[1]);
    if (time === null || time < 0) return;
    const cue = { time, chord: match[3] };
    cues.push(cue);
    if (match[2]) sections.push({ time, label: labelCase(match[2]) });
  });
  cues.sort((a, b) => a.time - b.time);
  sections.sort((a, b) => a.time - b.time);
  return { cues, sections };
}

function getPracticeForSong(song) {
  const videoId = song?.youtube_video_id || getYouTubeVideoId(song?.youtube_embed);
  const fromCifrado = getCifradoSequence(song);
  const savedMap = parsePracticeMap(song?.youtube_practice_map);

  if (videoId) {
    if (savedMap.cues.length) {
      return {
        videoId,
        title: song?.title || 'Práctica con YouTube',
        chordCues: savedMap.cues,
        sections: savedMap.sections.length ? savedMap.sections : [{ time: 0, label: fromCifrado.sectionLabels[0] || 'Inicio' }],
        sequence: fromCifrado.sequence,
        hasTimingMap: true,
      };
    }

    // La antigua canción piloto puede conservar su guía ya revisada. Ninguna
    // otra canción hereda esta estructura ni sus acordes.
    if (isYouTubePracticePilot(song)) {
      return { ...PILOT_GUIDE, videoId, title: song?.title || PILOT_GUIDE.title, sequence: PILOT_GUIDE.chordCues.map((cue) => cue.chord), hasTimingMap: true };
    }

    return {
      videoId,
      title: song?.title || 'Práctica con YouTube',
      chordCues: fromCifrado.sequence.length ? [{ time: 0, chord: fromCifrado.sequence[0] }] : [],
      sections: [{ time: 0, label: fromCifrado.sectionLabels[0] || 'Cifrado' }],
      sequence: fromCifrado.sequence,
      hasTimingMap: false,
    };
  }

  return isYouTubePracticePilot(song)
    ? { ...PILOT_GUIDE, sequence: PILOT_GUIDE.chordCues.map((cue) => cue.chord), hasTimingMap: true }
    : null;
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
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) return;
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
  const practice = useMemo(() => getPracticeForSong(song), [song?.title, song?.artist_name, song?.content_raw, song?.tablature, song?.original_key, song?.youtube_video_id, song?.youtube_embed, song?.youtube_practice_map]);
  const targetRef = useRef(null);
  const playerRef = useRef(null);
  const timerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState('');

  const activeSection = useMemo(() => practice?.sections.reduce((current, section) => (section.time <= currentTime ? section : current), practice.sections[0]), [currentTime, practice]);
  const activeCue = useMemo(() => practice?.chordCues.reduce((current, cue) => (cue.time <= currentTime ? cue : current), practice.chordCues[0]), [currentTime, practice]);
  const nextChords = useMemo(() => {
    if (!practice?.sequence?.length) return [];
    if (!practice.hasTimingMap) return practice.sequence.slice(1, 5);
    const activeIndex = practice.chordCues.findIndex((cue) => cue === activeCue);
    return practice.chordCues.slice(activeIndex + 1, activeIndex + 5);
  }, [activeCue, practice]);

  useEffect(() => {
    if (!practice || !targetRef.current) return undefined;
    let disposed = false;
    setIsReady(false);
    setError('');
    loadYouTubeIframeApi()
      .then((YT) => {
        if (disposed || !targetRef.current) return;
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
  const pausePractice = () => playerRef.current?.pauseVideo();

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm" style={{ borderColor: '#FED7AA' }} aria-labelledby="youtube-practice-title">
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#EA580C' }}><Youtube className="h-5 w-5" /> Práctica guiada</div>
          <h2 id="youtube-practice-title" className="mt-1 text-xl font-bold" style={{ color: '#1F2937' }}>Practicar con IA · YouTube</h2>
          <p className="mt-1 text-sm" style={{ color: '#6B7280' }}>Video oficial y acordes leídos desde el cifrado de esta canción.</p>
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

      <div className="border-t px-5 py-6" style={{ borderColor: '#FFEDD5' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: '#374151' }}>Sección actual: <span style={{ color: '#EA580C' }}>{activeSection?.label || 'Cifrado'}</span></p>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: '#FFF7ED', color: '#C2410C' }}>
            {practice.hasTimingMap ? `${formatTime(currentTime)} · sincronizada` : 'Secuencia del cifrado'}
          </span>
        </div>

        {!practice.hasTimingMap && (
          <p className="mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed" style={{ borderColor: '#FED7AA', background: '#FFF7ED', color: '#9A3412' }}>
            Los acordes de esta práctica salen del cifrado real de “{song.title}”. Aún no hay un mapa de segundos guardado, por eso la página no inventa cambios de acorde.
          </p>
        )}

        {practice.hasTimingMap && (
          <div className="mt-3 flex flex-wrap gap-2">
            {practice.sections.map((section) => {
              const isActive = section.label === activeSection?.label;
              return <button key={`${section.label}-${section.time}`} type="button" onClick={() => startPractice(section.time)} disabled={!isReady || Boolean(error)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50" style={isActive ? { background: '#F97316', borderColor: '#F97316', color: '#fff' } : { background: '#fff', borderColor: '#FDBA74', color: '#C2410C' }}><PlayCircle className="h-3.5 w-3.5" /> {section.label} · {formatTime(section.time)}</button>;
            })}
          </div>
        )}

        <div className="mt-6 rounded-3xl border px-5 py-7 text-center" style={{ borderColor: '#FED7AA', background: '#FFFDFB' }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#9CA3AF' }}>Acorde ahora</p>
          <div className="mt-4 flex justify-center">
            <div className="flex h-40 min-w-52 items-center justify-center rounded-3xl px-8 text-7xl font-black shadow-lg" style={{ color: '#fff', background: 'linear-gradient(135deg, #FB923C, #F97316)' }}>
              {activeCue?.chord || song?.original_key || '—'}
            </div>
          </div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: '#9CA3AF' }}>{practice.hasTimingMap ? 'Próximos cambios' : 'Siguiente en el cifrado'}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {nextChords.map((item, index) => {
              const cue = typeof item === 'string' ? { chord: item } : item;
              return <span key={`${cue.time ?? index}-${cue.chord}`} className="rounded-xl border px-3 py-2 text-sm font-bold" style={{ borderColor: '#FDBA74', color: '#C2410C' }}>{cue.chord} {practice.hasTimingMap && <small className="font-medium opacity-70">{formatTime(cue.time)}</small>}</span>;
            })}
          </div>
        </div>
        <p className="mt-4 text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
          {practice.hasTimingMap ? 'Sincronización basada en el mapa de tiempos guardado para esta canción.' : 'Para sincronizar esta canción por segundos, añade su mapa de tiempos desde el editor del administrador.'}
        </p>
      </div>
    </section>
  );
}

