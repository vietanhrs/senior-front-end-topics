import { makeNginxConcept, nginx } from '../common';
import doc from './doc.md?raw';

export const securityRateLimiting = makeNginxConcept({
  slug: 'security-rate-limiting',
  title: 'Security headers and rate limiting',
  summary: 'Nginx can enforce baseline browser security headers and edge request limits.',
  tags: ['Nginx', 'Security', 'Rate limiting'],
  doc,
  requestStory:
    'Before a request reaches the app, Nginx can reject noisy clients and attach browser security headers to static and proxied responses.',
  config: nginx`
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

server {
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Content-Security-Policy "default-src 'self'; object-src 'none'" always;

  location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://api_upstream;
  }
}
  `,
  decisionRows: [
    {
      directive: 'add_header ... always',
      purpose: 'Applies security headers to normal and error responses.',
      pitfall: 'Without always, some error responses miss headers.',
    },
    {
      directive: 'limit_req_zone',
      purpose: 'Defines shared state for request rate limiting.',
      pitfall: 'Using wrong key behind a proxy limits the load balancer instead of users.',
    },
    {
      directive: 'CSP',
      purpose: 'Restricts script/style/connect/image sources.',
      pitfall: 'A too-broad CSP gives false confidence; a too-strict one breaks deploys.',
    },
  ],
  exercise: {
    prompt: 'Add baseline edge security for a public SPA with API proxying.',
    answer: `Add security headers with always, start CSP in report-only if the app has many third-party assets, ensure real client IP is used for rate limiting behind proxies, and apply stricter limits to auth/write endpoints than static assets. Validate headers on 200, 404, and 5xx responses.`,
    checklist: [
      'Security headers use always.',
      'CSP rollout is realistic.',
      'Rate limit key respects real client IP.',
      'Different limits for static/API/auth traffic.',
    ],
  },
});
