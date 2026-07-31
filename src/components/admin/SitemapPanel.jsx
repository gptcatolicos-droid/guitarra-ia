import { useState } from 'react';
import { AlertTriangle, CheckCircle, Copy, ExternalLink, Globe, RefreshCw, XCircle } from 'lucide-react';

const CANONICAL = 'https://guitarraia.com';
const SITEMAP_URL = `${CANONICAL}/sitemap.xml`;
const ROBOTS_URL = `${CANONICAL}/robots.txt`;

function analyzeSitemap(text, status, contentType) {
  const locs = [...text.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => match[1].trim());
  const unique = new Set(locs);
  const invalidUrls = locs.filter((loc) => !loc.startsWith(`${CANONICAL}/`));
  const privateUrls = locs.filter((loc) => /\/(admin|buscar|chat)(?:[/?#]|$)/.test(loc));
  const isHtml = /<!doctype html|<html|<div id="root"/i.test(text);
  const hasXmlDeclaration = /^\s*<\?xml/i.test(text);
  const hasUrlset = /<urlset\b/i.test(text);
  const isValid = status === 200
    && hasXmlDeclaration
    && hasUrlset
    && locs.length > 0
    && !isHtml
    && invalidUrls.length === 0
    && privateUrls.length === 0;

  return {
    isValid,
    isHtml,
    hasXmlDeclaration,
    hasUrlset,
    locCount: locs.length,
    duplicateCount: locs.length - unique.size,
    invalidUrls,
    privateUrls,
    contentType,
    firstUrl: locs[0] || '—',
    lastUrl: locs.at(-1) || '—',
  };
}

async function request(url) {
  const response = await fetch(`${url}?audit=${Date.now()}`, {
    headers: { Accept: 'application/xml,text/plain;q=0.9,*/*;q=0.1' },
    cache: 'no-store',
  });
  const text = await response.text();
  return {
    status: response.status,
    contentType: response.headers.get('content-type') || 'sin cabecera',
    text,
  };
}

function Status({ ok, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${ok ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
      {ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {children}
    </span>
  );
}

function DataRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`max-w-[68%] break-all text-right text-xs text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export default function SitemapPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  const copy = async (value) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(''), 1800);
  };

  const audit = async () => {
    setLoading(true);
    setError('');
    try {
      const [sitemap, robots] = await Promise.all([request(SITEMAP_URL), request(ROBOTS_URL)]);
      const report = analyzeSitemap(sitemap.text, sitemap.status, sitemap.contentType);
      setResult({
        ...report,
        robotsStatus: robots.status,
        robotsHasSitemap: robots.text.includes(`Sitemap: ${SITEMAP_URL}`),
        auditedAt: new Date().toLocaleString('es-CO'),
      });
    } catch (auditError) {
      setResult(null);
      setError('No fue posible leer el sitemap público. Comprueba que la versión publicada ya terminó de sincronizarse e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 rounded-xl border p-4" style={{ backgroundColor: 'rgba(249,115,22,0.07)', borderColor: 'rgba(249,115,22,0.32)' }}>
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="text-xs leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Fuente de verdad SEO.</strong> Google solo ve el archivo público{' '}
          <code className="text-primary">{SITEMAP_URL}</code>. Esta auditoría revisa exactamente esa URL, no una función interna de Base44.
        </div>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Verificar sitemap antes de enviarlo</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Comprueba el HTTP, el XML, las URLs canónicas y que no haya rutas privadas. Solo muestra el resultado que recibe Google.
        </p>
        <button
          type="button"
          onClick={audit}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#FF7200' }}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Verificando sitemap público…' : 'Verificar sitemap público'}
        </button>
      </section>

      {error && <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-500">{error}</div>}

      {result && (
        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Resultado de la verificación</h3>
            <div className="flex flex-wrap gap-1.5">
              <Status ok={result.status === 200}>HTTP {result.status}</Status>
              <Status ok={result.isValid}>{result.isValid ? 'Listo para enviar' : 'Requiere corrección'}</Status>
              <Status ok={!result.isHtml}>{result.isHtml ? 'Devuelve HTML' : 'Devuelve XML'}</Status>
            </div>
          </div>
          <div>
            <DataRow label="Content-Type" value={result.contentType} mono />
            <DataRow label="URLs encontradas" value={result.locCount} />
            <DataRow label="URLs duplicadas" value={result.duplicateCount} />
            <DataRow label="URLs fuera de www.guitarraia.com" value={result.invalidUrls.length} />
            <DataRow label="Rutas privadas incluidas" value={result.privateUrls.length} />
            <DataRow label="robots.txt" value={`HTTP ${result.robotsStatus} · ${result.robotsHasSitemap ? 'declara el sitemap correcto' : 'no declara el sitemap correcto'}`} />
            <DataRow label="Primera URL" value={result.firstUrl} mono />
            <DataRow label="Última URL" value={result.lastUrl} mono />
            <DataRow label="Verificado" value={result.auditedAt} />
          </div>
          {!result.isValid && (
            <div className="rounded-lg bg-red-500/10 p-3 text-xs leading-relaxed text-red-500">
              No lo envíes todavía: debe responder HTTP 200 como XML, contener URLs y usar únicamente el dominio canónico sin rutas privadas.
            </div>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Enviar a Google Search Console</h3>
        <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
          <li>Publica primero estos cambios y espera a que Base44 termine la sincronización.</li>
          <li>Abre el sitemap en una ventana privada y ejecuta la verificación anterior.</li>
          <li>En Search Console, envía <strong className="text-foreground">sitemap.xml</strong> para la propiedad <strong className="text-foreground">https://guitarraia.com/</strong>.</li>
        </ol>
        {[{ label: 'Sitemap público', url: SITEMAP_URL }, { label: 'robots.txt público', url: ROBOTS_URL }].map((item) => (
          <div key={item.url} className="flex items-center gap-2 rounded-lg border border-border p-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground">{item.label}</p>
              <p className="truncate text-[11px] text-muted-foreground">{item.url}</p>
            </div>
            <a href={item.url} target="_blank" rel="noreferrer" className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Abrir">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button type="button" onClick={() => copy(item.url)} className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Copiar">
              {copied === item.url ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ))}
        <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <ExternalLink className="h-4 w-4" /> Abrir Google Search Console
        </a>
      </section>
    </div>
  );
}
