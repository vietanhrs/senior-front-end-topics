import { makeNginxConcept, nginx } from '../common';
import doc from './doc.md?raw';

export const staticSpaHosting = makeNginxConcept({
  slug: 'static-spa-hosting',
  title: 'Static SPA hosting and fallback',
  summary: 'SPA hosting needs immutable asset caching and safe index.html fallback for client routes.',
  tags: ['Nginx', 'SPA', 'Static assets'],
  doc,
  requestStory:
    'For /assets/app.abc123.js Nginx should serve a long-lived immutable file. For /portfolio/123 refresh, it should serve index.html so the client router can take over.',
  config: nginx`
root /var/www/app;

location /assets/ {
  try_files $uri =404;
  add_header Cache-Control "public, max-age=31536000, immutable";
}

location = /index.html {
  add_header Cache-Control "no-cache";
}

location / {
  try_files $uri $uri/ /index.html;
}
  `,
  decisionRows: [
    {
      directive: 'root',
      purpose: 'Defines where static files are read from.',
      pitfall: 'Confusing root and alias changes path resolution.',
    },
    {
      directive: 'Cache-Control',
      purpose: 'Immutable hashed assets can be cached for a year.',
      pitfall: 'Caching index.html forever traps users on old deploys.',
    },
    {
      directive: 'try_files',
      purpose: 'Refresh-safe client routes fall back to index.html.',
      pitfall: 'Fallback can mask missing assets unless assets use =404.',
    },
  ],
  exercise: {
    prompt: 'Design Nginx rules for a Vite/React SPA deployed with hashed assets.',
    answer: `Serve /assets/* with immutable long cache and no fallback. Serve index.html with no-cache or short validation. Use try_files $uri $uri/ /index.html only for client routes. This lets refresh work while deploy rollbacks and new HTML pick up the correct asset manifest.`,
    checklist: [
      'Immutable cache for hashed assets.',
      'No-cache or validation for index.html.',
      'SPA fallback only for routes.',
      '404 for missing assets.',
    ],
  },
});
