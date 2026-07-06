import { makeNginxConcept, nginx } from '../common';
import doc from './doc.md?raw';

export const requestLifecycle = makeNginxConcept({
  slug: 'request-lifecycle',
  title: 'Request lifecycle and config selection',
  summary: 'Nginx chooses server and location blocks before serving files or proxying upstream.',
  tags: ['Nginx', 'Routing', 'Lifecycle'],
  doc,
  requestStory:
    'A browser request enters a listen socket, matches server_name, then location rules decide whether Nginx serves a file, rewrites the URI, proxies upstream, or returns an error.',
  config: nginx`
server {
  listen 443 ssl http2;
  server_name app.example.com;
  root /var/www/app;

  location = /healthz { return 204; }
  location /api/ { proxy_pass http://api_upstream; }
  location / { try_files $uri $uri/ /index.html; }
}
  `,
  decisionRows: [
    {
      directive: 'listen/server_name',
      purpose: 'Select the virtual server for a Host/SNI name.',
      pitfall: 'Wrong default server catches production traffic unexpectedly.',
    },
    {
      directive: 'location',
      purpose: 'Choose the handling rule for a URI.',
      pitfall: 'Prefix/regex/exact priority surprises route matching.',
    },
    {
      directive: 'try_files',
      purpose: 'Check filesystem candidates before falling back.',
      pitfall: 'Bad fallback sends API 404s to index.html.',
    },
  ],
  exercise: {
    prompt: 'A production refresh on /settings works, but /api/settings returns index.html. What do you inspect?',
    answer: `Inspect location precedence and fallback order. The /api/ location must be selected before the SPA fallback, and the SPA try_files rule should only apply to front-end routes. I would add an exact health route, a clear /api/ proxy location, then a final / fallback to /index.html.`,
    checklist: [
      'Explains server and location matching.',
      'Separates API routes from SPA fallback.',
      'Mentions try_files order.',
      'Includes health route behavior.',
    ],
  },
});
