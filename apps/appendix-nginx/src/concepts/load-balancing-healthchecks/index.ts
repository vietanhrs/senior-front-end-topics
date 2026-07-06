import { makeNginxConcept, nginx } from '../common';
import doc from './doc.md?raw';

export const loadBalancingHealthchecks = makeNginxConcept({
  slug: 'load-balancing-healthchecks',
  title: 'Load balancing and health checks',
  summary: 'Nginx can spread traffic across upstreams and fail away from unhealthy instances.',
  tags: ['Nginx', 'Load balancing', 'Reliability'],
  doc,
  requestStory:
    'An API route should continue working when one backend instance is slow or down. Nginx chooses an upstream peer and retries only when it is safe.',
  config: nginx`
upstream api_upstream {
  least_conn;
  server 10.0.1.10:8080 max_fails=3 fail_timeout=10s;
  server 10.0.1.11:8080 max_fails=3 fail_timeout=10s;
  keepalive 32;
}

location /api/ {
  proxy_pass http://api_upstream;
  proxy_next_upstream error timeout http_502 http_503 http_504;
}
  `,
  decisionRows: [
    {
      directive: 'least_conn',
      purpose: 'Sends requests to the peer with fewer active connections.',
      pitfall: 'Wrong strategy can overload slow instances.',
    },
    {
      directive: 'max_fails/fail_timeout',
      purpose: 'Temporarily marks failing peers unavailable.',
      pitfall: 'Passive health is delayed and request-driven.',
    },
    {
      directive: 'proxy_next_upstream',
      purpose: 'Retries selected failure classes.',
      pitfall: 'Retrying non-idempotent requests can duplicate writes.',
    },
  ],
  exercise: {
    prompt: 'One upstream is intermittently timing out and users see random API failures.',
    answer: `Configure sensible upstream failure handling and timeouts, add active health checks if available in the deployment layer, and avoid retrying unsafe POST mutations unless they are idempotent. Add upstream timing logs so the failing peer is visible.`,
    checklist: [
      'Mentions upstream strategy.',
      'Mentions health/failure settings.',
      'Mentions idempotent retry risk.',
      'Mentions upstream timing logs.',
    ],
  },
});
