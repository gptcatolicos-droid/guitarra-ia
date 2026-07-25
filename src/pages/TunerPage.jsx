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

function autoCorrelate(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.009) return -1;

  // Normalized difference autocorrelation: stable enough for the low E string
  // while avoiding false positives from room noise and guitar harmonics.
  const maxOffset = Math.min(Math.floor(sampleRate / 65), buffer.length - 2);
  const minOffset = Math.floor(sampleRate / 420);
  const correlations = [];
  let bestOffset = -1;
  let bestCorrelation = 0;
  for (let offset = minOffset; offset < maxOffset; offset++) {
    let difference = 0;
    for (let i = 0; i < buffer.length - offset; i++) {
      difference += Math.abs(buffer[i] - buffer[i + offset]);
    }
    const correlation = 1 - difference / (2 * (buffer.length - offset));
    correlations[offset] = correlation;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }
  if (bestCorrelation < 0.72 || bestOffset < 0) return -1;

  const before = correlations[bestOffset - 1] || bestCorrelation;
  const after = correlations[bestOffset + 1] || bestCorrelation;
  const denominator = 2 * (2 * bestCorrelation - before - after);
  const offsetAdjustment = denominator ? (after - before) / denominator : 0;
  return sampleRate / (bestOffset + offsetAdjustment);
}

export default function TunerPage() {
  const [listening, setListening] = useState(false);
  const [frequency, setFrequency] = useState(null);
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState('Estándar');
  const [error, setError] = useState('');
  const [tunedStrings, setTunedStrings] = useState(() => new Set());
  const streamRef = useRef(null), audioRef = useRef(null), rafRef = useRef(null), analyserRef = useRef(null);
  const filteredFrequencyRef = useRef(null);
  const referenceToneStopRef = useRef(null);
  const strings = useMemo(() => TUNINGS[mode], [mode]);
  const target = strings[selected];
  const cents = frequency ? Math.round(1200 * Math.log2(frequency / target.hz)) : 0;
  const inTune = frequency && Math.abs(cents) <= 5;

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioRef.current?.close?.();
    streamRef.current = null; audioRef.current = null; analyserRef.current = null;
    filteredFrequencyRef.current = null;
    setListening(false); setFrequency(null);
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite usar el micrófono. Prueba desde una conexión segura (HTTPS) o un navegador actualizado.');
      return;
    }
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      await ctx.resume();
      const analyser = ctx.createAnalyser(); analyser.fftSize = 4096;
      ctx.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream; audioRef.current = ctx; analyserRef.current = analyser; setListening(true);
      const samples = new Float32Array(analyser.fftSize);
      const scan = () => {
        analyser.getFloatTimeDomainData(samples);
        const hz = autoCorrelate(samples, ctx.sampleRate);
        if (hz > 55 && hz < 450) {
          const filteredHz = filteredFrequencyRef.current
            ? filteredFrequencyRef.current * 0.72 + hz * 0.28
            : hz;
          filteredFrequencyRef.current = filteredHz;
          setFrequency(filteredHz);
          const nearest = strings.reduce((best, item, index) => Math.abs(item.hz - filteredHz) < Math.abs(strings[best].hz - filteredHz) ? index : best, 0);
          setSelected(nearest);
          const detectedCents = Math.round(1200 * Math.log2(filteredHz / strings[nearest].hz));
          if (Math.abs(detectedCents) <= 5) {
            setTunedStrings(previous => new Set(previous).add(nearest));
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
  }, [strings]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setSelected(0);
    setFrequency(null);
    setTunedStrings(new Set());
    filteredFrequencyRef.current = null;
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
      const masterGain = context.createGain();
      const harmonicGain = context.createGain();
      const now = context.currentTime;

      // Triangle keeps the real fundamental while the octave harmonic makes
      // low E audible on phone and laptop speakers with little bass response.
      primary.type = 'triangle';
      primary.frequency.setValueAtTime(string.hz, now);
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(string.hz * 2, now);
      harmonicGain.gain.setValueAtTime(0.32, now);
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.14, now + 0.04);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.85);

      primary.connect(masterGain);
      harmonic.connect(harmonicGain).connect(masterGain);
      masterGain.connect(context.destination);
      primary.start(now);
      harmonic.start(now);
      primary.stop(now + 1.9);
      harmonic.stop(now + 1.9);

      const stopTone = () => {
        try { primary.stop(); } catch {}
        try { harmonic.stop(); } catch {}
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
        : cents < 0 ? 'Súbela un poco' : 'Bájala un poco';

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
      <aside className="tuner-advice"><Sparkles /><p>ESTADO DE AFINACIÓN</p><h2>{guidance}</h2><small>{frequency ? `${Math.abs(cents)} cents ${cents < 0 ? 'por debajo' : 'por encima'} del tono objetivo.` : 'Toca una cuerda para detectar su afinación.'}</small></aside>
      <aside className="tuner-modes"><div><SlidersHorizontal /> Modo de afinación</div>{Object.keys(TUNINGS).map(item => <button className={mode === item ? 'selected' : ''} key={item} onClick={() => changeMode(item)}>{item}</button>)}<p><ShieldCheck size={16} /> Audio procesado de forma local</p></aside>
    </section>
  </div>;
}
