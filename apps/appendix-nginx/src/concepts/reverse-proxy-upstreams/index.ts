import { makeNginxConcept, nginx } from '../common';
import doc from './doc.md?raw';

export const reverseProxyUpstreams = makeNginxConcept({
  slug: 'reverse-proxy-upstreams',
  title: 'Reverse proxy and upstream headers',
  summary: 'Proxying needs correct Host, client IP, scheme, timeout, and buffering behavior.',
  tags: ['Nginx', 'Proxy', 'Headers'],
  doc,
  requestStory:
    'A browser calls /api/orders. Nginx forwards it to an upstream service while preserving enough original request context for auth, redirects, logs, and rate limits.',
  config: nginx`
upstream api_upstream {
  server 10.0.1.10:8080;
  server 10.0.1.11:8080;
}

location /api/ {
  proxy_pass http://api_upstream/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_connect_timeout 2s;
  proxy_read_timeout 30s;
}
  `,
  decisionRows: [
    {
      directive: 'proxy_pass',
      purpose: 'Sends matching requests to an upstream service.',
      pitfall: 'Trailing slash changes how URI prefixes are forwarded.',
    },
    {
      directive: 'proxy_set_header',
      purpose: 'Preserves host, client IP, and scheme context.',
      pitfall: 'Missing X-Forwarded-Proto breaks redirects and secure cookies.',
    },
    {
      directive: 'proxy_read_timeout',
      purpose: 'Bounds slow upstream response behavior.',
      pitfall: 'Too long hides incidents; too short kills legitimate streams.',
    },
  ],
  exercise: {
    prompt: 'An API behind Nginx generates http redirects and wrong absolute URLs. What is likely missing?',
    answer: `Check forwarded headers. The upstream needs Host and X-Forwarded-Proto to reconstruct the public URL, plus X-Forwarded-For/X-Real-IP for logs/rate limits. Also verify proxy_pass slash behavior so /api/foo maps to the intended upstream URI.`,
    checklist: [
      'Mentions Host.',
      'Mentions X-Forwarded-Proto.',
      'Mentions client IP headers.',
      'Mentions proxy_pass URI behavior.',
    ],
  },
});
