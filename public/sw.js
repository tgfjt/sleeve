/*!
 * SLEEVE service worker
 *
 * Responsibilities:
 *
 *   1. Inject Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy /
 *      Cross-Origin-Resource-Policy response headers for every same-origin
 *      fetch, so crossOriginIsolated becomes true and SharedArrayBuffer /
 *      threaded WASM are unlocked. GitHub Pages cannot set response
 *      headers directly; this is the only practical path.
 *
 *   2. Cache assets so repeat visits are fast and the app keeps working
 *      offline:
 *        - /sleeve/assets/<name>-<hash>.<ext>  → cache-first (immutable per
 *          Vite's content hashing)
 *        - the HTML shell (/sleeve/ and /sleeve/index.html) → stale-while-
 *          revalidate (serve cache, refresh in the background)
 *        - everything else → network, fall back to cache when offline
 *
 *      SlimSAM model weights are NOT cached here; Transformers.js already
 *      stores them in IndexedDB on first load.
 *
 * The COOP/COEP machinery (install/activate/fetch header rewriting, the
 * coepCredentialless toggle, the page-side registration-with-reload dance)
 * is adapted from coi-serviceworker v0.1.7 by Guido Zuidhof and
 * contributors (MIT). https://github.com/gzuidhof/coi-serviceworker
 * The caching layer is original to this project.
 */

const CACHE_NAME = 'sleeve-v1';

let coepCredentialless = false;

if (typeof window === 'undefined') {
  // ===== Service worker side =====

  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keys) =>
          Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
        .then(() => self.clients.claim())
    );
  });

  self.addEventListener('message', (ev) => {
    if (!ev.data) return;
    if (ev.data.type === 'deregister') {
      self.registration
        .unregister()
        .then(() => self.clients.matchAll())
        .then((clients) => clients.forEach((c) => c.navigate(c.url)));
    } else if (ev.data.type === 'coepCredentialless') {
      coepCredentialless = ev.data.value;
    }
  });

  function withCoiHeaders(response) {
    if (response.status === 0) return response;
    const headers = new Headers(response.headers);
    headers.set(
      'Cross-Origin-Embedder-Policy',
      coepCredentialless ? 'credentialless' : 'require-corp'
    );
    if (!coepCredentialless) {
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  // Vite outputs hashed filenames like /assets/index-zYFe6NDG.js. The hash
  // is [A-Za-z0-9_-]+ of >= 8 chars in practice; we allow 6+ to stay safe.
  function isHashedAsset(url) {
    return /\/assets\/[^/]+-[A-Za-z0-9_-]{6,}\.[a-z0-9]+$/i.test(url.pathname);
  }

  function isShellDoc(url) {
    return url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  }

  async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  }

  async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const network = fetch(request)
      .then((response) => {
        if (response.ok) cache.put(request, response.clone()).catch(() => {});
        return response;
      })
      .catch(() => null);
    const response = cached ?? (await network);
    if (!response) throw new Error('sw: offline and no cached shell');
    return response;
  }

  async function networkThenCache(request) {
    try {
      return await fetch(request);
    } catch (err) {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw err;
    }
  }

  self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

    const url = new URL(request.url);
    const sameOrigin = url.origin === self.location.origin;

    // COEP credentialless re-request trick (same as coi-serviceworker upstream).
    const outbound =
      coepCredentialless && request.mode === 'no-cors'
        ? new Request(request, { credentials: 'omit' })
        : request;

    event.respondWith(
      (async () => {
        try {
          let response;
          if (sameOrigin && isHashedAsset(url)) {
            response = await cacheFirst(outbound);
          } else if (sameOrigin && isShellDoc(url)) {
            response = await staleWhileRevalidate(outbound);
          } else {
            response = await networkThenCache(outbound);
          }
          return withCoiHeaders(response);
        } catch (err) {
          console.error('[sw] fetch failed:', url.pathname, err);
          throw err;
        }
      })()
    );
  });
} else {
  // ===== Page side: register + reload dance =====
  (() => {
    const coi = {
      shouldRegister: () => true,
      shouldDeregister: () => false,
      coepCredentialless: () => !(window.chrome || window.netscape),
      doReload: () => window.location.reload(),
      quiet: false,
      ...window.coi
    };

    const n = navigator;

    if (n.serviceWorker && n.serviceWorker.controller) {
      n.serviceWorker.controller.postMessage({
        type: 'coepCredentialless',
        value: coi.coepCredentialless()
      });
      if (coi.shouldDeregister()) {
        n.serviceWorker.controller.postMessage({ type: 'deregister' });
      }
    }

    if (window.crossOriginIsolated !== false || !coi.shouldRegister()) return;

    if (!window.isSecureContext) {
      if (!coi.quiet) console.log('[sw] secure context required, skipping registration');
      return;
    }

    if (!n.serviceWorker) return;

    n.serviceWorker.register(window.document.currentScript.src).then(
      (registration) => {
        if (!coi.quiet) console.log('[sw] registered at', registration.scope);
        registration.addEventListener('updatefound', () => {
          if (!coi.quiet) console.log('[sw] update found, reloading');
          coi.doReload();
        });
        if (registration.active && !n.serviceWorker.controller) {
          if (!coi.quiet) console.log('[sw] active but not controlling — reloading');
          coi.doReload();
        }
      },
      (err) => {
        if (!coi.quiet) console.error('[sw] registration failed:', err);
      }
    );
  })();
}
