import { makeNginxConcept, nginx } from '../common';
import doc from './doc.md?raw';

export const routingRewrites = makeNginxConcept({
  slug: 'routing-rewrites',
  title: 'Routing, rewrites, root, and alias',
  summary: 'Small URI mapping differences can decide whether static files, APIs, and client routes work.',
  tags: ['Nginx', 'Rewrites', 'Paths'],
  doc,
  requestStory:
    'Nginx maps a URI to either a filesystem path or an upstream URI. root, alias, rewrite, return, and proxy_pass slash semantics all affect the final target.',
  config: nginx`
location /docs/ {
  alias /var/www/docs/;
  try_files $uri $uri/ =404;
}

location /old-path/ {
  return 301 /new-path/;
}

location /api/ {
  rewrite ^/api/(.*)$ /$1 break;
  proxy_pass http://api_upstream;
}
  `,
  decisionRows: [
    {
      directive: 'root',
      purpose: 'Appends URI to the configured filesystem root.',
      pitfall: 'Using root where alias is needed duplicates path segments.',
    },
    {
      directive: 'alias',
      purpose: 'Maps a location prefix to a different directory.',
      pitfall: 'Missing trailing slash changes resolved paths.',
    },
    {
      directive: 'rewrite/return',
      purpose: 'Transforms or redirects URI.',
      pitfall: 'Rewrite loops and accidental method/body changes.',
    },
  ],
  exercise: {
    prompt: 'Static files under /docs/ 404 after moving them outside the app root.',
    answer: `Use alias for /docs/ when the files live outside the main root, include the trailing slash consistently, and test the resolved path. Keep SPA fallback out of this location so missing docs files return 404 instead of index.html.`,
    checklist: [
      'Distinguishes root vs alias.',
      'Mentions trailing slash.',
      'Avoids SPA fallback for docs assets.',
      'Mentions redirect vs internal rewrite.',
    ],
  },
});
