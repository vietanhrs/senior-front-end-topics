self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PING') {
    event.source?.postMessage({ type: 'PONG', source: 'senior-demo-sw' });
  }
});
