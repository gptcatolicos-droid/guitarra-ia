import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Facebook, Send, RefreshCw, ChevronDown } from 'lucide-react';

export default function FacebookPostManager() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState(null);

  const loadPages = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('facebookGetPages', {});
      const pageList = res.data?.pages || [];
      setPages(pageList);
      if (pageList.length > 0) setSelectedPage(pageList[0]);
    } catch (e) {
      setResult({ error: e.message || 'Error al cargar páginas de Facebook' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPages(); }, []);

  const handlePost = async () => {
    if (!message.trim() || !selectedPage) return;
    setPosting(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('facebookPost', {
        message: message.trim(),
        pageId: selectedPage.id,
      });
      if (res.data?.success) {
        setResult({ success: `¡Publicado en "${res.data.page_name}"! ID: ${res.data.post_id}` });
        setMessage('');
      } else {
        setResult({ error: res.data?.error || 'Error desconocido' });
      }
    } catch (e) {
      setResult({ error: e.message || 'Error al publicar' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Facebook className="w-5 h-5" style={{ color: '#1877F2' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: '#F4F4F2' }}>Publicar en Facebook</p>
            <p className="text-xs" style={{ color: '#747B7F' }}>Publica directamente en tu página de Facebook.</p>
          </div>
        </div>
        <button onClick={loadPages} disabled={loading}
          className="p-2 rounded-lg transition-opacity hover:opacity-70"
          style={{ color: '#747B7F' }}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: '#303538', borderTopColor: '#1877F2' }} />
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl p-5 text-center" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
          <p className="text-sm" style={{ color: '#747B7F' }}>No se encontraron páginas de Facebook asociadas a tu cuenta.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Page selector */}
          {pages.length > 1 && (
            <div className="relative">
              <label className="text-xs font-medium block mb-1.5" style={{ color: '#A7ACAE' }}>Página</label>
              <select
                value={selectedPage?.id || ''}
                onChange={e => setSelectedPage(pages.find(p => p.id === e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none appearance-none"
                style={{ backgroundColor: '#181B1D', border: '1px solid #303538', color: '#F4F4F2' }}
              >
                {pages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.fan_count ? ` (${p.fan_count.toLocaleString()} fans)` : ''}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-[34px] w-4 h-4 pointer-events-none" style={{ color: '#747B7F' }} />
            </div>
          )}

          {/* Selected page info */}
          {selectedPage && pages.length === 1 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#1877F2' }}>
                <Facebook className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F4F4F2' }}>{selectedPage.name}</p>
                {selectedPage.fan_count != null && (
                  <p className="text-xs" style={{ color: '#747B7F' }}>{selectedPage.fan_count.toLocaleString()} fans</p>
                )}
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: '#A7ACAE' }}>Mensaje</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={5}
              placeholder="Escribe tu post aquí..."
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ backgroundColor: '#181B1D', border: '1px solid #303538', color: '#F4F4F2' }}
            />
            <p className="text-xs mt-1 text-right" style={{ color: '#444A4E' }}>{message.length} caracteres</p>
          </div>

          {/* Result */}
          {result?.success && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(89,184,121,0.1)', border: '1px solid rgba(89,184,121,0.3)', color: '#59B879' }}>
              ✓ {result.success}
            </div>
          )}
          {result?.error && (
            <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(224,100,100,0.1)', border: '1px solid rgba(224,100,100,0.3)', color: '#E06464' }}>
              ✗ {result.error}
            </div>
          )}

          {/* Post button */}
          <button
            onClick={handlePost}
            disabled={posting || !message.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#1877F2' }}>
            <Send className="w-4 h-4" />
            {posting ? 'Publicando...' : 'Publicar en Facebook'}
          </button>
        </div>
      )}
    </div>
  );
}