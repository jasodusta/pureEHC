/*
 * pureEHC service worker
 * Purpose: let the app SHELL (HTML/JS/fonts/PDF libs) load with zero network,
 * so the app opens offline and Firestore's own offline persistence
 * (persistentLocalCache, already configured in app.js) can take over for data.
 *
 * IMPORTANT: this SW deliberately does NOT touch Firestore/Auth network
 * traffic (firestore.googleapis.com, identitytoolkit, securetoken, etc).
 * Firestore manages its own offline queue via IndexedDB; if we intercept
 * or cache those requests here we can conflict with that queue. We only
 * ever handle GET requests for the static shell and third-party libraries.
 */

const SW_VERSION = 'v1';
const SHELL_CACHE = `pureehc-shell-${SW_VERSION}`;
const RUNTIME_CACHE = `pureehc-runtime-${SW_VERSION}`;

// Same-origin files that make up the app shell.
const SHELL_ASSETS = [
    './',
    './index.html',
    './app.js',
    './manifest.json',
    './pureEHC.jpg'
];

// Third-party origins we're allowed to cache-and-serve offline.
// (Firebase's own API origins are intentionally excluded — see note above.)
const CACHEABLE_ORIGINS = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://cdnjs.cloudflare.com',
    'https://www.gstatic.com' // firebasejs SDK modules (not the Firestore/Auth API calls)
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            .then(cache => Promise.all(
                SHELL_ASSETS.map(url =>
                    cache.add(url).catch(err => console.warn('[sw] precache skip', url, err))
                )
            ))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

function isCacheableThirdParty(url) {
    return CACHEABLE_ORIGINS.some(origin => url.href.startsWith(origin));
}

self.addEventListener('fetch', event => {
    const req = event.request;

    // Never touch non-GET requests (all Firestore writes are POST) —
    // let those go straight to the network / Firestore's own queue.
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Never intercept Firebase Auth or Firestore API traffic — Firestore's
    // built-in persistentLocalCache already handles offline reads/writes for
    // these, and a caching SW in front of it can cause stale or conflicting
    // state.
    if (
        url.hostname.includes('firestore.googleapis.com') ||
        url.hostname.includes('identitytoolkit.googleapis.com') ||
        url.hostname.includes('securetoken.googleapis.com') ||
        url.hostname.includes('firebaseapp.com')
    ) {
        return;
    }

    const sameOrigin = url.origin === self.location.origin;

    if (sameOrigin) {
        // App shell: network-first so staff on a live connection always get the
        // latest build, falling back to cache so the app still opens offline.
        event.respondWith(
            fetch(req)
                .then(res => {
                    const copy = res.clone();
                    caches.open(SHELL_CACHE).then(cache => cache.put(req, copy));
                    return res;
                })
                .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
        );
        return;
    }

    if (isCacheableThirdParty(url)) {
        event.respondWith(
            caches.match(req).then(cached => {
                if (cached) return cached;
                return fetch(req).then(res => {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then(cache => cache.put(req, copy));
                    return res;
                }).catch(() => cached);
            })
        );
    }
});