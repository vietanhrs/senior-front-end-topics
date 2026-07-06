import { makeNginxConcept, nginx } from '../common';
import doc from './doc.md?raw';

export const tlsHttp2Http3 = makeNginxConcept({
  slug: 'tls-http2-http3',
  title: 'TLS, HTTP/2, and HTTP/3',
  summary: 'Nginx often terminates TLS and negotiates modern protocols before app traffic starts.',
  tags: ['Nginx', 'TLS', 'HTTP'],
  doc,
  requestStory:
    'Before any app route is served, the browser negotiates TLS and protocol capabilities. Nginx presents certificates, chooses HTTP/2 or HTTP/3 where configured, and can redirect plaintext HTTP.',
  config: nginx`
server {
  listen 80;
  server_name app.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name app.example.com;

  ssl_certificate /etc/ssl/app/fullchain.pem;
  ssl_certificate_key /etc/ssl/app/privkey.pem;
  add_header Strict-Transport-Security "max-age=31536000" always;
}
  `,
  decisionRows: [
    {
      directive: 'ssl_certificate',
      purpose: 'Presents the certificate chain for the hostname.',
      pitfall: 'Missing chain causes browser/client trust failures.',
    },
    {
      directive: 'http2/http3',
      purpose: 'Enables multiplexed modern transport where supported.',
      pitfall: 'Protocol enabled without validating CDN/LB/browser path.',
    },
    {
      directive: 'HSTS',
      purpose: 'Forces future HTTPS use by browsers.',
      pitfall: 'Bad preload/max-age can lock in a broken HTTPS rollout.',
    },
  ],
  exercise: {
    prompt: 'A site works on HTTP but secure cookies fail and Lighthouse flags insecure transport.',
    answer: `Redirect HTTP to HTTPS, terminate TLS with a valid full chain, forward X-Forwarded-Proto to upstreams, set Secure cookies from the app, and add HSTS only after HTTPS is stable. Enable HTTP/2 where supported and verify through curl/browser devtools.`,
    checklist: [
      'HTTP to HTTPS redirect.',
      'Valid certificate chain.',
      'Forwarded scheme header.',
      'Cautious HSTS rollout.',
    ],
  },
});
