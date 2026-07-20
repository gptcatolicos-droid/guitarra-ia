import { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileText } from 'lucide-react';

export default function FileDropZone({ label, type, color, onProcess }) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState([]); // { name, status: 'pending'|'processing'|'done'|'error', result }
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef();

  const addFiles = useCallback((newFiles) => {
    const txtFiles = Array.from(newFiles).filter(f => f.name.match(/\.(txt|md)$/i));
    if (!txtFiles.length) return;
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const toAdd = txtFiles
        .filter(f => !existing.has(f.name))
        .map(f => ({ file: f, name: f.name, status: 'pending' }));
      return [...prev, ...toAdd];
    });
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const processAll = async () => {
    const pending = files.filter(f => f.status === 'pending');
    if (!pending.length || processing) return;
    setProcessing(true);

    for (const item of pending) {
      setFiles(prev => prev.map(f => f.name === item.name ? { ...f, status: 'processing' } : f));
      try {
        const content = await item.file.text();
        const result = await onProcess(content, item.name, type);
        setFiles(prev => prev.map(f => f.name === item.name ? { ...f, status: 'done', result } : f));
      } catch (e) {
        setFiles(prev => prev.map(f => f.name === item.name ? { ...f, status: 'error', result: e.message } : f));
      }
    }
    setProcessing(false);
  };

  const pending = files.filter(f => f.status === 'pending').length;
  const done = files.filter(f => f.status === 'done').length;
  const errors = files.filter(f => f.status === 'error').length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
          {label}
        </h2>
        {files.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-[#a7afb8]">
            {done > 0 && <span className="text-green-400">✓ {done} importados</span>}
            {errors > 0 && <span className="text-red-400">✗ {errors} errores</span>}
            {pending > 0 && <span>{pending} pendientes</span>}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-[#ff7a00] bg-[#ff7a00]/10'
            : 'border-[#2b3138] hover:border-[#ff7a00]/50 bg-[#1a1d21]'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".txt,.md"
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
        <Upload className={`w-8 h-8 mx-auto mb-3 ${dragging ? 'text-[#ff7a00]' : 'text-[#a7afb8]'}`} />
        <p className="text-white font-medium">Arrastra archivos .txt aquí</p>
        <p className="text-[#a7afb8] text-sm mt-1">o haz clic para seleccionar — ilimitados</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-[#1a1d21] border border-[#2b3138] rounded-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto divide-y divide-[#2b3138]">
            {files.map(f => (
              <div key={f.name} className="flex items-center gap-3 px-4 py-2.5">
                <FileText className="w-4 h-4 text-[#a7afb8] shrink-0" />
                <span className="text-sm text-white truncate flex-1">{f.name}</span>
                {f.status === 'pending' && (
                  <button onClick={() => removeFile(f.name)} className="text-[#a7afb8] hover:text-white shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {f.status === 'processing' && <Loader2 className="w-4 h-4 text-[#ff7a00] animate-spin shrink-0" />}
                {f.status === 'done' && (
                  <span className="flex items-center gap-1 text-green-400 text-xs shrink-0">
                    <CheckCircle className="w-4 h-4" />
                    {f.result?.title && <span className="hidden sm:inline truncate max-w-32">{f.result.title}</span>}
                  </span>
                )}
                {f.status === 'error' && (
                  <span title={f.result} className="flex items-center gap-1 text-red-400 text-xs shrink-0">
                    <AlertCircle className="w-4 h-4" />
                    Error
                  </span>
                )}
              </div>
            ))}
          </div>
          {pending > 0 && (
            <div className="px-4 py-3 border-t border-[#2b3138] bg-[#111315]">
              <button
                onClick={processAll}
                disabled={processing}
                className="w-full py-2.5 bg-[#ff7a00] text-white rounded-lg font-medium text-sm hover:bg-[#e66e00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {processing ? 'Procesando...' : `Importar ${pending} archivo${pending !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}