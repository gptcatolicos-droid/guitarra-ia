import { useEffect, useRef, useState } from 'react';

// Every Spotify controller registered in the current page.  The official
// embed runs in an iframe, so ordinary React events cannot hear its Play
// button. Spotify's IFrame API gives us the playback event needed to make
// embeds behave like a single, shared player.
const activeControllers = new Map();
let iframeApiPromise;

function loadIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Spotify solo está disponible en el navegador.'));
  if (window.SpotifyIframeApi) return Promise.resolve(window.SpotifyIframeApi);
  if (iframeApiPromise) return iframeApiPromise;

  iframeApiPromise = new Promise((resolve, reject) => {
    const previousReadyHandler = window.onSpotifyIframeApiReady;
    const timeout = window.setTimeout(() => reject(new Error('No se pudo cargar el reproductor de Spotify.')), 12000);

    window.onSpotifyIframeApiReady = (api) => {
      window.clearTimeout(timeout);
      previousReadyHandler?.(api);
      resolve(api);
    };

    const existingScript = document.querySelector('script[data-guitarraia-spotify-iframe-api]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      script.dataset.guitarraiaSpotifyIframeApi = 'true';
      script.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error('No se pudo cargar el reproductor de Spotify.'));
      };
      document.body.appendChild(script);
    }
  });

  return iframeApiPromise;
}

function spotifyEntityUrl(rawSource) {
  if (!rawSource) return null;
  const iframeMatch = rawSource.match?.(/src=["']([^"']+)["']/i);
  const source = iframeMatch ? iframeMatch[1] : rawSource;
  const trackMatch = source.match?.(/(?:embed\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/i);
  if (!trackMatch) return source;
  return `https://open.spotify.com/${trackMatch[1].toLowerCase()}/${trackMatch[2]}`;
}

function pauseOtherPlayers(currentId) {
  activeControllers.forEach((controller, id) => {
    if (id !== currentId) controller.pause?.();
  });
}

/**
 * Official Spotify Embed with one-at-a-time playback across every card on the
 * current page. It keeps Spotify's UI and playback policies intact.
 */
export default function SpotifyEmbed({ source, height = 152, title = 'Spotify', className = '' }) {
  const mountRef = useRef(null);
  const playerId = useRef(`spotify-${Math.random().toString(36).slice(2)}`);
  const entityUrl = spotifyEntityUrl(source);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (!entityUrl || !mountRef.current || shouldMount) return undefined;
    const mount = mountRef.current;
    if (!('IntersectionObserver' in window)) {
      setShouldMount(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShouldMount(true);
      observer.disconnect();
    }, { rootMargin: '320px 0px' });
    observer.observe(mount);
    return () => observer.disconnect();
  }, [entityUrl, shouldMount]);

  useEffect(() => {
    if (!entityUrl || !mountRef.current || !shouldMount) return undefined;

    let disposed = false;
    let controller;
    const mount = mountRef.current;

    loadIframeApi()
      .then((api) => {
        if (disposed || !mount.isConnected) return;

        // The API replaces this element with Spotify's official iframe.
        api.createController(mount, {
          url: entityUrl,
          width: '100%',
          height: String(height),
        }, (embedController) => {
          if (disposed) {
            embedController.destroy?.();
            return;
          }

          controller = embedController;
          activeControllers.set(playerId.current, embedController);
          embedController.addListener?.('playback_started', () => pauseOtherPlayers(playerId.current));
          embedController.addListener?.('playback_update', (event) => {
            if (event?.data?.isPaused === false) pauseOtherPlayers(playerId.current);
          });
        });
      })
      .catch(() => {
        // Keep the card usable if Spotify itself is blocked by a network,
        // extension, or privacy setting. The official iframe is the fallback.
        if (!disposed && mount.isConnected) {
          mount.innerHTML = '';
          const iframe = document.createElement('iframe');
          iframe.src = entityUrl.replace('open.spotify.com/', 'open.spotify.com/embed/');
          iframe.width = '100%';
          iframe.height = String(height);
          iframe.title = title;
          iframe.loading = 'lazy';
          iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
          iframe.style.border = '0';
          iframe.style.display = 'block';
          mount.appendChild(iframe);
        }
      });

    return () => {
      disposed = true;
      activeControllers.delete(playerId.current);
      controller?.pause?.();
      controller?.destroy?.();
    };
  }, [entityUrl, height, title, shouldMount]);

  if (!entityUrl) return null;

  return <div ref={mountRef} className={className} aria-label={title} style={{ minHeight: height }} />;
}
