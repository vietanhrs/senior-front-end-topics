import type { LevelMeta } from '@sfe/workbook';
import { requestLifecycle } from './request-lifecycle';
import { staticSpaHosting } from './static-spa-hosting';
import { reverseProxyUpstreams } from './reverse-proxy-upstreams';
import { tlsHttp2Http3 } from './tls-http2-http3';
import { compressionCaching } from './compression-caching';
import { loadBalancingHealthchecks } from './load-balancing-healthchecks';
import { routingRewrites } from './routing-rewrites';
import { securityRateLimiting } from './security-rate-limiting';
import { observabilityDebugging } from './observability-debugging';

export const LEVEL: LevelMeta = {
  level: 12,
  sectionLabel: 'Appendix',
  levelLabel: 'Nginx',
  routeId: 'nginx',
  title: 'Nginx for Front-end Engineers',
  tagline: 'Static hosting, reverse proxying, TLS, cache headers, routing, security, and debugging',
  concepts: [
    requestLifecycle,
    staticSpaHosting,
    reverseProxyUpstreams,
    tlsHttp2Http3,
    compressionCaching,
    loadBalancingHealthchecks,
    routingRewrites,
    securityRateLimiting,
    observabilityDebugging,
  ],
};
