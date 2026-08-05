import fs from 'node:fs';

const dropZone = `import { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileText, RotateCcw, Trash2, Download } from 'lucide-react';

const MAX_FILES = 200;
const MAX_BYTES = 2 * 1024 * 1024;
const CONCURRENCY = 4;

export default function FileDropZone({ label, type, color, onProcess }) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [notice, setNotice] = useState('');
  const inputRef = useRef();

  const addFiles = useCallback((newFiles) => {
    const incoming = Array.from(newFiles || []);
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name.toLowerCase()));
      const available = Math.max(0, MAX_FILES - prev.length);
      const accepted = [];
      let rejected = 0;
      for (const file of incoming) {
        if (!/\\.(txt|md)$/i.test(file.name) || file.size > MAX_BYTES || existing.has(file.name.toLowerCase())) { rejected++; continue; }
        if (accepted.length >= available) { rejected++; continue; }
        existing.add(file.name.toLowerCase());
        accepted.push({ file, name:file.name, size:file.size, status:'pending', result:null });
      }
      setNotice(rejected ? \\`Se omitieron \\${rejected} archivos por formato, tamaño, duplicado o límite de \\${MAX_FILES}.\\` : '');
      return [...prev, ...accepted];
    });
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const processOne = async (item) => {
    setFiles(prev => prev.map(f => f.name === item.name ? {...f,status:'processing'} : f));
    try {
      const content = (await item.file.text()).replace(/^\\uFEFF/, '').trim();
      if (content.length < 20) throw new Error('Archivo vacío o demasiado corto');
      const result = await onProcess(content, item.name, type);
      const status = result?.skipped ? 'skipped' : 'done';
      setFiles(prev => prev.map(f => f.name === item.name ? {...f,status,result} : f));
    } catch (error) {
      setFiles(prev => prev.map(f => f.name === item.name ? {...f,status:'error',result:error?.message || 'Error desconocido'} : f));
    }
  };

  const processAll = async () => {
    const queue = files.filter(f => f.status === 'pending' || f.status === 'retry');
    if (!queue.length || processing) return;
    setProcessing(true);
    let cursor = 0;
    const worker = async () => { while (cursor < queue.length) { const item = queue[cursor++]; await processOne(item); } };
    await Promise.all(Array.from({length:Math.min(CONCURRENCY, queue.length)}, worker));
    setProcessing(false);
  };

  const counts = useMemo(() => files.reduce((a,f)=>{a[f.status]=(a[f.status]||0)+1;return a;},{}),[files]);
  const completed = (counts.done||0)+(counts.skipped||0)+(counts.error||0);
  const progress = files.length ? Math.round(completed/files.length*100) : 0;
  const retryErrors = () => setFiles(prev => prev.map(f => f.status === 'error' ? {...f,status:'retry'} : f));
  const clearFinished = () => setFiles(prev => prev.filter(f => !['done','skipped','error'].includes(f.status)));
  const removeFile = name => setFiles(prev => prev.filter(f => f.name !== name));
  const exportReport = () => {
    const rows=['archivo,estado,artista,titulo,detalle',...files.map(f=>[f.name,f.status,f.result?.artist||'',f.result?.title||'',typeof f.result==='string'?f.result:(f.result?.message||'')].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(','))];
    const blob=new Blob([rows.join('\\n')],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=\\`reporte-importacion-\\${type}.csv\\`; a.click(); URL.revokeObjectURL(a.href);
  };

  return <div className="flex flex-col gap-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-foreground font-semibold text-lg flex items-center gap-2"><span className={\\`w-2.5 h-2.5 rounded-full \\${color}\\`}/>{label}</h2><span className="text-xs text-muted-foreground">Máximo {MAX_FILES} archivos · 2 MB c/u</span></div>
    <div onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files)}} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onClick={()=>inputRef.current?.click()} className={\\`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all \\${dragging?'border-primary bg-primary/10':'border-border hover:border-primary/50 bg-card'}\\`}>
      <input ref={inputRef} type="file" multiple accept=".txt,.md,text/plain,text/markdown" className="hidden" onChange={e=>addFiles(e.target.files)}/><Upload className={\\`w-8 h-8 mx-auto mb-3 \\${dragging?'text-primary':'text-muted-foreground'}\\`}/><p className="text-foreground font-medium">Arrastra un bloque de archivos .txt</p><p className="text-muted-foreground text-sm mt-1">o haz clic para seleccionar hasta {MAX_FILES}</p>
    </div>
    {notice && <p className="text-xs text-amber-600">{notice}</p>}
    {files.length>0 && <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-3 border-b border-border"><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{files.length} cargados</span><span className="text-green-600">{counts.done||0} importados</span><span className="text-blue-600">{counts.skipped||0} duplicados omitidos</span><span className="text-red-600">{counts.error||0} errores</span></div><div className="h-1.5 bg-secondary rounded-full mt-3 overflow-hidden"><div className="h-full bg-primary transition-all" style={{width:progress+'%'}}/></div></div>
      <div className="max-h-80 overflow-y-auto divide-y divide-border">{files.map(f=><div key={f.name} className="flex items-center gap-3 px-4 py-2.5"><FileText className="w-4 h-4 text-muted-foreground shrink-0"/><div className="min-w-0 flex-1"><p className="text-sm text-foreground truncate">{f.name}</p>{f.result?.artist&&<p className="text-[11px] text-muted-foreground truncate">{f.result.artist} · {f.result.title}</p>}</div>{['pending','retry'].includes(f.status)&&<button onClick={()=>removeFile(f.name)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4"/></button>}{f.status==='processing'&&<Loader2 className="w-4 h-4 text-primary animate-spin"/>}{f.status==='done'&&<CheckCircle className="w-4 h-4 text-green-600"/>}{f.status==='skipped'&&<span className="text-[11px] font-medium text-blue-600">Duplicado</span>}{f.status==='error'&&<span title={String(f.result)} className="flex items-center gap-1 text-red-600 text-xs"><AlertCircle className="w-4 h-4"/>Error</span>}</div>)}</div>
      <div className="p-3 border-t border-border bg-secondary/30 flex flex-wrap gap-2"><button onClick={processAll} disabled={processing||!(counts.pending||counts.retry)} className="flex-1 min-w-48 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm disabled:opacity-40 flex items-center justify-center gap-2">{processing?<Loader2 className="w-4 h-4 animate-spin"/>:<Upload className="w-4 h-4"/>}{processing?'Procesando lote...':\\`Importar \\${(counts.pending||0)+(counts.retry||0)} archivos\\`}</button>{counts.error>0&&<button onClick={retryErrors} className="px-3 py-2 border border-border rounded-lg text-sm flex items-center gap-1"><RotateCcw className="w-4 h-4"/>Reintentar</button>}<button onClick={exportReport} className="px-3 py-2 border border-border rounded-lg text-sm flex items-center gap-1"><Download className="w-4 h-4"/>Reporte</button><button onClick={clearFinished} className="px-3 py-2 border border-border rounded-lg text-sm flex items-center gap-1"><Trash2 className="w-4 h-4"/>Limpiar</button></div>
    </div>}
  </div>;
}`;

fs.writeFileSync('src/components/admin/FileDropZone.jsx', dropZone);

const adminPath='src/pages/AdminPage.jsx';
let admin=fs.readFileSync(adminPath,'utf8');
admin=admin.replace(
`  if (existing && existing.length > 0) {
    await base44.entities.Song.update(existing[0].id, data);
    return { ...data, id: existing[0].id, updated: true };
  }`,
`  if (existing && existing.length > 0) {
    return { ...existing[0], skipped: true, updated: false };
  }`
);
admin=admin.replace(
`    loadStats();
    return { title: parsed.title, artist: parsed.artistName, updated: song.updated };`,
`    if (!song.skipped) {
      setAllSongsList(previous => [...previous, song]);
      setStats(previous => ({ ...previous, songs: previous.songs + 1 }));
    }
    return { title: parsed.title, artist: parsed.artistName, updated: song.updated, skipped: Boolean(song.skipped), message: song.skipped ? 'Ya existía en el catálogo' : 'Importada correctamente' };`
);
admin=admin.replace('o haz clic para seleccionar — ilimitados','o haz clic para seleccionar hasta 200');
fs.writeFileSync(adminPath,admin);
console.log('Bulk importer improvements installed.');
