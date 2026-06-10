import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Users report: "we deployed hours ago but everyone still runs the old app,
// and some assets are stale." Find the lifecycle/cache bugs and fix them.

// sw.js
const CACHE = 'app-cache';                       // (1) unversioned cache name
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE_URLS)));
  // (2) never skips waiting → new SW stuck behind the old one
});
self.addEventListener('activate', () => {
  // (3) no old-cache cleanup, no clients.claim()
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((hit) => hit ?? fetch(e.request)));
  // (4) cache-first with a static cache name → old assets served forever
});

// page registration
navigator.serviceWorker.register('/sw.js');      // (5) no update handling at all
// and sw.js is served with: Cache-Control: max-age=86400   (6)`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the update + cache lifecycle"
        description="Make deploys actually reach users without breaking open sessions, and stop serving stale assets. Address all six issues; prefer a user-prompted update over silent skipWaiting."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Version the cache name and clean old ones in <code>activate</code> + <code>clients.claim()</code>.
        Detect the waiting worker on the page and prompt the user; <code>skipWaiting()</code> via{' '}
        <code>postMessage</code> on accept, reload on <code>controllerchange</code>. Serve{' '}
        <code>sw.js</code> with <code>no-cache</code>.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// sw.js
const CACHE = 'app-v2';                          // (1) versioned per release (build hash)
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE_URLS)));
  // (2) do NOT auto-skip; let the page decide (avoids version skew). See message handler.
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))); // (3) clean old caches
    await self.clients.claim();                  // (3) control open pages
  })());
});
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting(); // (2) user-triggered activation
});
self.addEventListener('fetch', (e) => {
  // (4) for hashed static assets cache-first is fine (URL changes per build);
  //     for HTML/navigation use network-first so new deploys are picked up.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/offline.html')));
  } else {
    e.respondWith(caches.match(e.request).then((hit) => hit ?? fetch(e.request)));
  }
});

// page registration — (5) handle updates and (6) serve sw.js with no-cache
const reg = await navigator.serviceWorker.register('/sw.js');  // server: Cache-Control: no-cache
reg.addEventListener('updatefound', () => {
  const sw = reg.installing;
  sw?.addEventListener('statechange', () => {
    if (sw.state === 'installed' && navigator.serviceWorker.controller) {
      showUpdateToast(() => reg.waiting?.postMessage({ type: 'SKIP_WAITING' })); // user opts in
    }
  });
});
let reloaded = false;
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (!reloaded) { reloaded = true; location.reload(); }      // reload once onto the new SW
});`}
      />
    </Stack>
  );
}
