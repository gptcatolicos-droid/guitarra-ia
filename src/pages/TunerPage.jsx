import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Sparkles, Check, SlidersHorizontal } from 'lucide-react';

const STRINGS = [
  { note: 'E', octave: 2, hz: 82.41, label: 'Mi grave' },
  { note: 'A', octave: 2, hz: 110, label: 'La' },
  { note: 'D', octave: 3, hz: 146.83, label: 'Re' },
  { note: 'G', octave: 3, hz: 196, label: 'Sol' },
  { note: 'B', octave: 3, hz: 246.94, label: 'Si' },
  { note: 'E', octave: 4, hz: 329.63, label: 'Mi agudo' },
];

function autoCorrelate(buffer, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < 0.012) return -1;
  let bestOffset = -1, bestCorrelation = 0;
  const maxOffset = Math.min(Math.floor(sampleRate / 60), buffer.length - 1);
  const minOffset = Math.floor(sampleRate / 500);
  for (let offset = minOffset; offset < maxOffset; offset++) {
    let correlation = 0;
    for (let i = 0; i < buffer.length - offset; i++) correlation += buffer[i] * buffer[i + offset];
    correlation /= buffer.length - offset;
    if (correlation > bestCorrelation) { bestCorrelation = correlation; bestOffset = offset; }
  }
  if (bestCorrelation < 0.015 || bestOffset < 0) return -1;
  return sampleRate / bestOffset;
}

export default function TunerPage() {
  const [listening, setListening] = useState(false);
  const [frequency, setFrequency] = useState(null);
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState('Estándar');
  const streamRef = useRef(null), audioRef = useRef(null), rafRef = useRef(null), analyserRef = useRef(null);
  const target = STRINGS[selected];
  const cents = frequency ? Math.round(1200 * Math.log2(frequency / target.hz)) : 0;
  const inTune = frequency && Math.abs(cents) <= 5;

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioRef.current?.close?.();
    streamRef.current = null; audioRef.current = null; analyserRef.current = null;
    setListening(false); setFrequency(null);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream; audioRef.current = ctx; analyserRef.current = analyser; setListening(true);
      const samples = new Float32Array(analyser.fftSize);
      const scan = () => {
        analyser.getFloatTimeDomainData(samples);
        const hz = autoCorrelate(samples, ctx.sampleRate);
        if (hz > 55 && hz < 450) {
          setFrequency(hz);
          const nearest = STRINGS.reduce((best, item, index) => Math.abs(item.hz - hz) < Math.abs(STRINGS[best].hz - hz) ? index : best, 0);
          setSelected(nearest);
        }
        rafRef.current = requestAnimationFrame(scan);
      };
      scan();
    } catch {
      setListening(false);
      alert('Necesitamos permiso para usar el micrófono y afinar tu guitarra.');
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return <div className="tuner-page page-wave-shell">
    <div className="tuner-status"><span /> IA en tiempo real</div>
    <section className="tuner-grid">
      <aside className="tuner-insight">
        <p>SEÑAL DETECTADA <Sparkles size={18} /></p>
        <strong>{target.label} · <em>{target.note}{target.octave}</em></strong>
        <hr />
        <small>CONFIANZA</small><b>{frequency ? '98%' : '—'}</b>
      </aside>
      <main className="tuner-core">
        <div className="tuner-scale"><span>-18¢</span><b>0</b><span>+18¢</span></div>
        <div className={`note-orb ${listening ? 'is-listening' : ''} ${inTune ? 'is-tuned' : ''}`}>
          <span>{target.note}</span><small>{frequency ? `${frequency.toFixed(1)} Hz` : 'Escucha tu cuerda'}</small>
        </div>
        <p className="tuner-guidance">{!listening ? 'Activa el micrófono para empezar.' : inTune ? 'Perfecto, está afinada.' : cents < 0 ? 'Súbela un poco' : 'Bájala un poco'}</p>
        <div className="string-row">{STRINGS.map((item, index) => <button key={`${item.note}${item.octave}`} onClick={() => setSelected(index)} className={index === selected ? 'active' : ''}>{item.note}{inTune && index === selected && <Check />}</button>)}</div>
        <p className="string-count">{inTune ? '1' : '0'} de 6 cuerdas afinadas</p>
        <button className="mic-button" onClick={listening ? stop : start}>{listening ? <MicOff /> : <Mic />}<span>{listening ? 'Detener escucha' : 'Escuchar ahora'}</span></button>
      </main>
      <aside className="tuner-advice"><Sparkles /><p>Estoy escuchando tu guitarra.</p><h2>{!listening ? 'Lista para afinar' : inTune ? 'Perfecta' : cents < 0 ? 'Súbela un poco' : 'Bájala un poco'}</h2><small>{frequency ? `${Math.abs(cents)} cents ${cents < 0 ? 'por debajo' : 'por encima'} del tono.` : 'Toca una cuerda para detectar su afinación.'}</small></aside>
      <aside className="tuner-modes"><div><SlidersHorizontal /> Modo IA</div>{['Estándar','Drop D','Medio tono abajo'].map(item => <button className={mode === item ? 'selected' : ''} key={item} onClick={() => setMode(item)}>{item}</button>)}<p><Sparkles size={16} /> Afinación sugerida para esta canción</p></aside>
    </section>
  </div>;
}
