import { makeNginxConcept, nginx } from '../common';
import doc from './doc.md?raw';

export const observabilityDebugging = makeNginxConcept({
  slug: 'observability-debugging',
  title: 'Observability and debugging',
  summary: 'Useful logs expose request ID, upstream timing, cache status, and final routing result.',
  tags: ['Nginx', 'Logs', 'Debugging'],
  doc,
  requestStory:
    'When a front-end bug appears as a blank page or API timeout, Nginx logs should reveal whether the file was missing, the SPA fallback fired, the upstream was slow, or the cache served stale content.',
  config: nginx`
log_format main '$request_id $remote_addr $host "$request" '
                '$status $body_bytes_sent $request_time '
                'upstream=$upstream_addr upstream_time=$upstream_response_time '
                'cache=$upstream_cache_status';

access_log /var/log/nginx/access.log main;
error_log /var/log/nginx/error.log warn;

add_header X-Request-ID $request_id always;
  `,
  decisionRows: [
    {
      directive: 'log_format',
      purpose: 'Defines fields needed for debugging.',
      pitfall: 'Default logs lack upstream/cache/request-id context.',
    },
    {
      directive: 'error_log',
      purpose: 'Captures config/runtime errors.',
      pitfall: 'Debug level in production can flood disk.',
    },
    {
      directive: 'X-Request-ID',
      purpose: 'Correlates browser, Nginx, and upstream logs.',
      pitfall: 'No correlation ID means slow incidents become manual timestamp matching.',
    },
  ],
  exercise: {
    prompt: 'A user reports intermittent blank pages after deploy. What Nginx evidence do you want?',
    answer: `I would check access logs for the HTML and asset requests with status, request time, cache status, and request ID. Then I would confirm whether missing hashed assets return 404, whether index.html points to the right asset names, whether a CDN served stale HTML, and whether errors correlate with a specific upstream or deploy window.`,
    checklist: [
      'Mentions request ID correlation.',
      'Mentions upstream timing/status.',
      'Mentions cache status.',
      'Mentions asset 404 vs stale HTML.',
    ],
  },
});
