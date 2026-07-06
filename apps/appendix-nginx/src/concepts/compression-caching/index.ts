import { makeNginxConcept, nginx } from '../common';
import doc from './doc.md?raw';

export const compressionCaching = makeNginxConcept({
  slug: 'compression-caching',
  title: 'Compression and cache headers',
  summary: 'Compression reduces transfer size; cache headers control freshness and deploy safety.',
  tags: ['Nginx', 'Caching', 'Compression'],
  doc,
  requestStory:
    'The browser requests JS/CSS/HTML. Nginx can serve pre-compressed assets, compress text responses, and attach cache headers that determine whether users see a new deploy.',
  config: nginx`
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_vary on;

location /assets/ {
  try_files $uri =404;
  add_header Cache-Control "public, max-age=31536000, immutable";
}

location = /index.html {
  add_header Cache-Control "no-cache";
}
  `,
  decisionRows: [
    {
      directive: 'gzip_types',
      purpose: 'Compresses text-like assets/responses.',
      pitfall: 'Compressing already-compressed media wastes CPU.',
    },
    {
      directive: 'Cache-Control immutable',
      purpose: 'Lets hashed assets stay in browser/CDN cache.',
      pitfall: 'Using it on HTML prevents deploy pickup.',
    },
    {
      directive: 'Vary',
      purpose: 'Keeps cache variants correct for compression.',
      pitfall: 'Shared caches may serve wrong encoding variants.',
    },
  ],
  exercise: {
    prompt: 'Users keep seeing an old SPA after deploy even though assets are hashed.',
    answer: `Check index.html cache policy first. Hashed assets should be immutable, but HTML should be no-cache or short-lived validation because it points to the current asset filenames. If a CDN sits in front, align CDN rules with Nginx headers and purge only HTML when needed.`,
    checklist: [
      'Separates HTML and hashed asset cache.',
      'Mentions compression content types.',
      'Mentions CDN/header alignment.',
      'Avoids caching HTML forever.',
    ],
  },
});
