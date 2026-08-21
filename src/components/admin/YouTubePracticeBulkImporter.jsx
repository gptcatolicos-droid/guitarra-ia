import { useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Download, FileAudio, FileSpreadsheet, Loader2, PlayCircle, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { uploadAndQueueYouTubePractice } from '@/lib/youtubePracticeUpload';

const MAX_ROWS = 500;
const AUDIO_PATTERN = /\.(mp3|wav|m4a|aac|ogg)$/i;

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function parseDelimited(text) {
  const source = String(text || '').replace(/^\uFEFF/, '');
  const firstLine = source.split(/\r?\n/, 1)[0] || '';
  const delimiter = [';', ',', '\t'].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(cell.trim()); cell = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = '';
    } else {
      cell += character;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) throw new Error('El CSV no contiene canciones.');

  const aliases = {
    artista: 'artist', artist: 'artist',
    cancion: 'title', canción: 'title', titulo: 'title', título: 'title', title: 'title', song: 'title',
    youtube: 'youtubeUrl', youtube_url: 'youtubeUrl', video: 'youtubeUrl', video_url: 'youtubeUrl', enlace_youtube: 'youtubeUrl',
    audio: 'audioFile', audio_file: 'audioFile', archivo_audio: 'audioFile', mp3: 'audioFile',
    idioma: 'language', language: 'language', dificultad: 'difficulty', difficulty: 'difficulty', tonalidad: 'originalKey', tono: 'originalKey', key: 'originalKey',
  };
  const headers = rows.shift().map((header) => aliases[normalize(header).replace(/\s+/g, '_')] || '');
  if (!headers.includes('artist') || !headers.includes('title') || !headers.includes('youtubeUrl')) {
    throw new Error('El CSV debe incluir las columnas artista, canción y youtube_url.');
  }

  if (rows.length > MAX_ROWS) throw new Error(`El máximo es ${MAX_ROWS} canciones por lote.`);
  return rows.map((values, index) => {
    const record = { rowNumber: index + 2 };
    headers.forEach((header, column) => { if (header) record[header] = values[column] || ''; });
    return record;
  }).filter((rowItem) => rowItem.artist || rowItem.title || rowItem.youtubeUrl);
}

function audioCandidates(row) {
  return [row.audioFile, `${row.artist} - ${row.title}`, row.title].filter(Boolean).map(normalize);
}

function downloadTemplate() {
  const content = '\uFEFFartista,cancion,youtube_url,audio_file,idioma,dificultad,tonalidad\nSoda Stereo,De Música Ligera,https://www.youtube.com/watch?v=XXXXXXXXXXX,Soda Stereo - De Música Ligera.mp3,Español,Intermedia,Em\n';
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'plantilla-practicas-youtube.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function YouTubePracticeBulkImporter({ onCompleted }) {
  const [rows, setRows] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [createMissing, setCreateMissing] = useState(true);
  const stopped = useRef(false);

  const audioIndex = useMemo(() => {
    const index = new Map();
    audioFiles.forEach((file) => {
      index.set(normalize(file.name), file);
      if (file.webkitRelativePath) index.set(normalize(file.webkitRelativePath.split('/').pop()), file);
    });
    return index;
  }, [audioFiles]);

  const matchAudio = (row) => audioCandidates(row).map((key) => audioIndex.get(key)).find(Boolean) || null;
  const matchedAudioCount = rows.filter((row) => matchAudio(row)).length;

  const handleCsv = async (file) => {
    setError(''); setResults([]);
    if (!file) return;
    try {
      const parsed = parseDelimited(await file.text());
      if (parsed.length > MAX_ROWS) throw new Error(`El máximo es ${MAX_ROWS} canciones por lote.`);
      setRows(parsed);
    } catch (parseError) {
      setRows([]);
      setError(parseError.message || 'No se pudo leer el CSV.');
    }
  };

  const processBatch = async () => {
    if (!rows.length || processing) return;
    stopped.current = false;
    setProcessing(true); setError(''); setResults([]);
    try {
      const response = await base44.functions.invoke('bulkUpsertYouTubePractice', {
        createMissing,
        rows: rows.map((row) => ({
          artist: row.artist,
          title: row.title,
          youtubeUrl: row.youtubeUrl,
          audioFile: row.audioFile,
          language: row.language,
          difficulty: row.difficulty,
          originalKey: row.originalKey,
        })),
      });
      const prepared = response?.data?.results || [];
      const nextResults = prepared.map((item) => ({ ...item, stage: item.error ? 'error' : 'prepared' }));
      setResults(nextResults);

      for (let index = 0; index < prepared.length; index += 1) {
        if (stopped.current) break;
        const item = prepared[index];
        if (!item.songId || item.error) continue;
        const file = matchAudio(rows[item.index]);
        if (!file) {
          setResults((current) => current.map((result) => result.index === item.index ? { ...result, stage: 'awaiting_audio', detail: 'Enlace guardado; falta seleccionar el audio.' } : result));
          continue;
        }
        setResults((current) => current.map((result) => result.index === item.index ? { ...result, stage: 'uploading', detail: `Subiendo ${file.name}` } : result));
        try {
          await uploadAndQueueYouTubePractice(base44, item.songId, file, { autoPublish: true });
          setResults((current) => current.map((result) => result.index === item.index ? { ...result, stage: 'queued', detail: 'Audio enviado a ChordMini; se publicará al terminar.' } : result));
        } catch (uploadError) {
          setResults((current) => current.map((result) => result.index === item.index ? { ...result, stage: 'error', error: uploadError.message || 'No se pudo procesar el audio.' } : result));
        }
      }
      onCompleted?.();
    } catch (batchError) {
      setError(batchError?.data?.error || batchError?.response?.data?.error || batchError.message || 'No se pudo preparar el lote.');
    } finally {
      setProcessing(false);
    }
  };

  const counts = results.reduce((summary, item) => ({ ...summary, [item.stage]: (summary[item.stage] || 0) + 1 }), {});

  return (
    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground"><PlayCircle className="h-5 w-5 text-primary" /> Carga masiva de prácticas con YouTube</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Carga hasta 500 enlaces con un CSV. Si seleccionas los audios indicados, se subirán en orden, ChordMini detectará los acordes y cada práctica se publicará automáticamente al terminar.</p>
        </div>
        <button type="button" onClick={downloadTemplate} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:border-primary"><Download className="h-4 w-4" /> Descargar plantilla</button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/20 p-5 text-center hover:border-primary">
          <FileSpreadsheet className="mb-2 h-7 w-7 text-primary" />
          <b className="text-sm text-foreground">1. Seleccionar CSV</b>
          <span className="mt-1 text-xs text-muted-foreground">artista, canción, youtube_url y audio_file</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => handleCsv(event.target.files?.[0])} />
        </label>
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/20 p-5 text-center hover:border-primary">
          <FileAudio className="mb-2 h-7 w-7 text-primary" />
          <b className="text-sm text-foreground">2. Seleccionar audios</b>
          <span className="mt-1 text-xs text-muted-foreground">Puedes escoger todos los MP3/WAV del lote de una vez</span>
          <input type="file" multiple accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/ogg,.mp3,.wav,.m4a,.aac,.ogg" className="hidden" onChange={(event) => setAudioFiles(Array.from(event.target.files || []).filter((file) => AUDIO_PATTERN.test(file.name)))} />
        </label>
      </div>

      {rows.length > 0 && <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4 text-sm text-foreground"><b>{rows.length} canciones leídas</b><span className="mx-2 text-muted-foreground">·</span><span>{matchedAudioCount} audios asociados</span><span className="mx-2 text-muted-foreground">·</span><span>{rows.length - matchedAudioCount} quedarán esperando audio</span></div>}
      <label className="mt-4 flex items-start gap-2 text-sm text-foreground"><input type="checkbox" checked={createMissing} onChange={(event) => setCreateMissing(event.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span><b>Crear canciones que aún no existan</b><small className="block text-xs text-muted-foreground">Se crean como prácticas sin cifrado; ChordMini obtiene los acordes del audio.</small></span></label>
      {error && <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" disabled={!rows.length || processing} onClick={processBatch} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-40">{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {processing ? 'Procesando lote…' : `Procesar ${rows.length || 0} canciones`}</button>
        {processing && <button type="button" onClick={() => { stopped.current = true; }} className="min-h-11 rounded-xl border border-border px-4 text-sm font-medium text-foreground">Detener después del audio actual</button>}
      </div>

      {results.length > 0 && <div className="mt-5 overflow-hidden rounded-xl border border-border"><div className="flex flex-wrap gap-3 border-b border-border bg-secondary/30 p-3 text-xs text-muted-foreground"><span>{counts.queued || 0} en análisis</span><span>{counts.awaiting_audio || 0} esperando audio</span><span className="text-red-600">{counts.error || 0} errores</span></div><div className="max-h-80 divide-y divide-border overflow-y-auto">{results.map((item) => <div key={`${item.index}-${item.songId || 'error'}`} className="flex items-start gap-3 px-4 py-3">{item.stage === 'queued' ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : item.stage === 'uploading' ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" /> : item.stage === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" /> : <FileAudio className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}<div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{item.title} · {item.artist}</p><p className={`text-xs ${item.stage === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>{item.error || item.detail || (item.status === 'created' ? 'Canción creada' : 'Enlace actualizado')}</p></div></div>)}</div></div>}
    </section>
  );
}
