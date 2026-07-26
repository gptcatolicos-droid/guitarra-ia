import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, Mic, MicOff, ShieldCheck, SlidersHorizontal, Sparkles, Volume2 } from 'lucide-react';

const TUNINGS = {
  'Estándar': [
    { note: 'E', octave: 2, hz: 82.41, label: 'Mi grave' },
    { note: 'A', octave: 2, hz: 110, label: 'La' },
    { note: 'D', octave: 3, hz: 146.83, label: 'Re' },
    { note: 'G', octave: 3, hz: 196, label: 'Sol' },
    { note: 'B', octave: 3, hz: 246.94, label: 'Si' },
    { note: 'E', octave: 4, hz: 329.63, label: 'Mi agudo' },
  ],
  'Drop D': [
    { note: 'D', octave: 2, hz: 73.42, label: 'Re grave' },
    { note: 'A', octave: 2, hz: 110, label: 'La' },
    { note: 'D', octave: 3, hz: 146.83, label: 'Re' },
    { note: 'G', octave: 3, hz: 196, label: 'Sol' },
    { note: 'B', octave: 3, hz: 246.94, label: 'Si' },
    { note: 'E', octave: 4, hz: 329.63, label: 'Mi agudo' },
  ],
  'Medio tono abajo': [
    { note: 'E♭', octave: 2, hz: 77.78, label: 'Mi bemol grave' },
    { note: 'A♭', octave: 2, hz: 103.83, label: 'La bemol' },
    { note: 'D♭', octave: 3, hz: 138.59, label: 'Re bemol' },
    { note: 'G♭', octave: 3, hz: 185, label: 'Sol bemol' },
    { note: 'B♭', octave: 3, hz: 233.08, label: 'Si bemol' },
    { note: 'E♭', octave: 4, hz: 311.13, label: 'Mi bemol agudo' },
  ],
};

function detectPitch(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.0035) return { frequency: -1, confidence: 0, rms };

  // YIN's normalized difference method finds the first credible period instead
  // of simply the strongest harmonic. This makes low guitar strings and phone
  // microphones substantially more reliable than a plain peak correlation.
  const minPeriod = Math.floor(sampleRate / 440);
  const maxPeriod = Math.min(Math.floor(sampleRate / 60), Math.floor(buffer.length / 2) - 2);
  const difference = new Float32Array(maxPeriod + 1);
  const normalized = new Float32Array(maxPeriod + 1);
  const sampleCount = buffer.length - maxPeriod;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let sum = 0;
    for (let index = 0; index < sampleCount; index++) {
      const delta = buffer[index] - buffer[index + period];
      sum += delta * delta;
    }
    difference[period] = sum;
  }

  let runningSum = 0;
  normalized[0] = 1;
  for (let period = 1; period <= maxPeriod; period++) {
    runningSum += difference[period];
    normalized[period] = runningSum ? (difference[period] * period) / runningSum : 1;
  }

  const threshold = 0.13;
  let bestPeriod = -1;
  let bestValue = 1;
  for (let period = minPeriod; period <= maxPeriod; period++) {
    if (normalized[period] < bestValue) {
      bestValue = normalized[period];
      bestPeriod = period;
    }
    if (normalized[period] < threshold) {
      while (period + 1 <= maxPeriod && normalized[period + 1] < normalized[period]) period += 1;
      bestPeriod = period;
      bestValue = normalized[period];
      break;
    }
  }
  if (bestPeriod < 0 || bestValue > 0.28) return { frequency: -1, confidence: 0, rms };

  const before = normalized[bestPeriod - 1] ?? bestValue;
  const after = normalized[bestPeriod + 1] ?? bestValue;
  const denominator = before - (2 * bestValue) + after;
  const adjustment = Math.abs(denominator) > 1e-8 ? 0.5 * (before - after) / denominator : 0;
  const frequency = sampleRate / (bestPeriod + adjustment);
  return { frequency, confidence: Math.max(0, Math.min(1, 1 - bestValue)), rms };
}

export default function TunerPage() {
  const [listening, setListening] = useState(false);
  const [frequency, setFrequency] = useState(null);
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState('Estándar');
  const [error, setError] = useState('');
  const [tunedStrings, setTunedStrings] = useState(() => new Set());
  const [signalLevel, setSignalLevel] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const streamRef = useRef(null), audioRef = useRef(null), rafRef = useRef(null), analyserRef = useRef(null);
  const filteredFrequencyRef = useRef(null);
  const stringsRef = useRef(TUNINGS['Estándar']);
  const lastReadingRef = useRef(0);
  const noSignalSinceRef = useRef(null);
  const referenceToneStopRef = useRef(null);
  const strings = useMemo(() => TUNINGS[mode], [mode]);
  useEffect(() => { stringsRef.current = strings; }, [strings]);
  const target = strings[selected];
  const cents = frequency ? Math.round(1200 * Math.log2(frequency / target.hz)) : 0;
  const inTune = frequency && Math.abs(cents) <= 5;

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioRef.current?.close?.();
    streamRef.current = null; audioRef.current = null; analyserRef.current = null;
    filteredFrequencyRef.current = null;
    lastReadingRef.current = 0;
    noSignalSinceRef.current = null;
    setListening(false); setFrequency(null);
    setSignalLevel(0); setConfidence(0);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite usar el micrófono. Prueba desde una conexión segura (HTTPS) o un navegador actualizado.');
      return;
    }
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 44100 },
          latency: { ideal: 'interactive' },
          echoCancellation: { ideal: false },
          noiseSuppression: { ideal: false },
          autoGainControl: { ideal: false },
        },
      });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.1;
      analyser.minDecibels = -95;
      analyser.maxDecibels = -10;
      ctx.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream; audioRef.current = ctx; analyserRef.current = analyser; setListening(true);
      const samples = new Float32Array(analyser.fftSize);
      const scan = (timestamp = 0) => {
        analyser.getFloatTimeDomainData(samples);
        // Twenty readings per second feels immediate, while allowing enough
        // samples for stable bass-string detection on mobile processors.
        if (timestamp - lastReadingRef.current < 45) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        lastReadingRef.current = timestamp;
        const reading = detectPitch(samples, ctx.sampleRate);
        setSignalLevel(Math.min(1, reading.rms / 0.055));
        if (reading.frequency > 55 && reading.frequency < 450 && reading.confidence >= 0.62) {
          noSignalSinceRef.current = null;
          setConfidence(reading.confidence);
          const hz = reading.frequency;
          const filteredHz = filteredFrequencyRef.current
            ? filteredFrequencyRef.current * 0.55 + hz * 0.45
            : hz;
          filteredFrequencyRef.current = filteredHz;
          setFrequency(filteredHz);
          const activeStrings = stringsRef.current;
          const nearest = activeStrings.reduce((best, item, index) => Math.abs(item.hz - filteredHz) < Math.abs(activeStrings[best].hz - filteredHz) ? index : best, 0);
          setSelected(nearest);
          const detectedCents = Math.round(1200 * Math.log2(filteredHz / activeStrings[nearest].hz));
          if (Math.abs(detectedCents) <= 5) {
            setTunedStrings(previous => new Set(previous).add(nearest));
          }
        } else {
          setConfidence(0);
          if (!noSignalSinceRef.current) noSignalSinceRef.current = timestamp;
          if (timestamp - noSignalSinceRef.current > 700) {
            filteredFrequencyRef.current = null;
            setFrequency(null);
          }
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      scan();
    } catch (requestError) {
      setListening(false);
      setError(requestError?.name === 'NotAllowedError'
        ? 'No recibimos permiso para el micrófono. Actívalo desde los ajustes del navegador y vuelve a intentarlo.'
        : 'No pudimos iniciar el micrófono. Revisa que no esté siendo usado por otra aplicación.');
    }
  }, []);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setSelected(0);
    setFrequency(null);
    setTunedStrings(new Set());
    filteredFrequencyRef.current = null;
    setSignalLevel(0);
    setConfidence(0);
  };

  const playReferenceTone = useCallback(async (string = target) => {
    referenceToneStopRef.current?.();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setError('Tu navegador no puede generar el tono de referencia.');
      return;
    }
    try {
      setError('');
      const context = new AudioContextClass();
      // Required by Safari/iOS and some Android browsers before sound can leave
      // a newly-created AudioContext, even when the click was user initiated.
      await context.resume();

      const primary = context.createOscillator();
      const harmonic = context.createOscillator();
      const presence = context.createOscillator();
      const masterGain = context.createGain();
      const harmonicGain = context.createGain();
      const presenceGain = context.createGain();
      const compressor = context.createDynamicsCompressor();
      const now = context.currentTime;

      // Triangle keeps the real fundamental while the octave harmonic makes
      // low E audible on phone and laptop speakers with little bass response.
      primary.type = 'triangle';
      primary.frequency.setValueAtTime(string.hz, now);
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(string.hz * 2, now);
      presence.type = 'sine';
      presence.frequency.setValueAtTime(string.hz * 3, now);
      harmonicGain.gain.setValueAtTime(0.48, now);
      presenceGain.gain.setValueAtTime(0.2, now);
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.3, now + 0.035);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.7);
      compressor.threshold.setValueAtTime(-12, now);
      compressor.knee.setValueAtTime(12, now);
      compressor.ratio.setValueAtTime(8, now);
      compressor.attack.setValueAtTime(0.003, now);
      compressor.release.setValueAtTime(0.15, now);

      primary.connect(masterGain);
      harmonic.connect(harmonicGain).connect(masterGain);
      presence.connect(presenceGain).connect(masterGain);
      masterGain.connect(compressor).connect(context.destination);
      primary.start(now);
      harmonic.start(now);
      presence.start(now);
      primary.stop(now + 2.75);
      harmonic.stop(now + 2.75);
      presence.stop(now + 2.75);

      const stopTone = () => {
        try { primary.stop(); } catch {}
        try { harmonic.stop(); } catch {}
        try { presence.stop(); } catch {}
        context.close();
      };
      referenceToneStopRef.current = stopTone;
      primary.onended = () => {
        referenceToneStopRef.current = null;
        context.close();
      };
    } catch {
      setError('No pudimos reproducir el tono. Revisa que el volumen del dispositivo esté activo e inténtalo otra vez.');
    }
  }, [target]);

  useEffect(() => () => referenceToneStopRef.current?.(), []);

  const guidance = !listening
    ? 'Activa el micrófono para empezar.'
    : !frequency
      ? 'Toca una cuerda cerca del micrófono.'
      : inTune
        ? 'Perfecta'
        : cents < 0 ? 'Está baja · súbela' : 'Está alta · bájala';
  const meterPosition = frequency ? Math.max(-50, Math.min(50, cents)) : 0;
  const direction = !frequency ? 'Sin lectura' : inTune ? 'Perfecta' : cents < 0 ? 'Por debajo' : 'Por encima';

  useEffect(() => () => stop(), [stop]);

  return <div className="tuner-page page-wave-shell">
    <div className="tuner-status"><span /> Afinación local en tiempo real</div>
    <header className="tuner-intro">
      <p className="eyebrow">AFINADOR IA</p>
      <h1>Tu guitarra, <em>en su punto.</em></h1>
      <p>Escuchamos solo en tu dispositivo: el audio nunca se envía a servidores.</p>
    </header>
    <section className="tuner-grid">
      <aside className="tuner-insight">
        <p>SEÑAL DETECTADA <Sparkles size={18} /></p>
        <strong>{target.label} · <em>{target.note}{target.octave}</em></strong>
        <hr />
        <small>FRECUENCIA</small><b>{frequency ? `${frequency.toFixed(1)} Hz` : '—'}</b>
      </aside>
      <main className="tuner-core">
        <div className="tuner-scale"><span>-25¢</span><b>0¢</b><span>+25¢</span></div>
        <div className={`tuner-meter ${inTune ? 'perfect' : ''}`} aria-label={frequency ? `${Math.abs(cents)} cents ${cents < 0 ? 'por debajo' : 'por encima'} del tono` : 'Sin lectura de afinación'}>
          <span className="tuner-meter-low">BAJA</span><span className="tuner-meter-high">ALTA</span>
          <i style={{ '--meter-position': `${meterPosition}%` }} />
        </div>
        <div className={`note-orb ${listening ? 'is-listening' : ''} ${inTune ? 'is-tuned' : ''}`}>
          <span>{target.note}</span><small>{target.octave} · {frequency ? `${frequency.toFixed(1)} Hz` : 'Escucha tu cuerda'}</small>
        </div>
        <p className={`tuner-guidance ${inTune ? 'perfect' : ''}`}>{guidance}</p>
        <p className="tuner-cents">{frequency ? `${cents > 0 ? '+' : ''}${cents} cents` : '— cents'}</p>
        <div className="string-row">{strings.map((item, index) => <button key={`${item.note}${item.octave}`} onClick={() => { setSelected(index); playReferenceTone(item); }} className={index === selected ? 'active' : ''} aria-label={`Reproducir tono ${item.label} ${item.note}${item.octave}`}>{item.note}<small>{item.octave}</small>{tunedStrings.has(index) && <Check />}</button>)}</div>
        <p className="string-count">{tunedStrings.size} de 6 cuerdas afinadas</p>
        <div className="tuner-actions">
          <button className="mic-button" onClick={listening ? stop : start}>{listening ? <MicOff /> : <Mic />}<span>{listening ? 'Detener escucha' : 'Escuchar ahora'}</span></button>
          <button className="reference-tone-button" onClick={() => playReferenceTone()}><Volume2 /><span>Reproducir {target.note}{target.octave}</span></button>
        </div>
        {error && <p className="tuner-error" role="alert"><AlertCircle />{error}</p>}
      </main>
      <aside className="tuner-advice"><Sparkles /><p>ESTADO DE AFINACIÓN</p><h2>{guidance}</h2><small>{frequency ? `${direction}: ${Math.abs(cents)} cents ${cents < 0 ? 'por debajo' : 'por encima'} del tono objetivo.` : 'Toca una cuerda, una a la vez, a 10–20 cm del micrófono.'}</small><div className="tuner-signal"><span>SEÑAL</span><i><b style={{ width: `${Math.round(signalLevel * 100)}%` }} /></i><em>{listening ? `${Math.round(confidence * 100)}%` : '—'}</em></div></aside>
      <aside className="tuner-modes"><div><SlidersHorizontal /> Modo de afinación</div>{Object.keys(TUNINGS).map(item => <button className={mode === item ? 'selected' : ''} key={item} onClick={() => changeMode(item)}>{item}</button>)}<p><ShieldCheck size={16} /> Audio procesado de forma local</p></aside>
    </section>
  </div>;
}
