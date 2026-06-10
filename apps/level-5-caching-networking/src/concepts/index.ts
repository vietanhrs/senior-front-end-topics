import type { LevelMeta } from '@sfe/workbook';
import { cacheInvalidation } from './cache-invalidation';
import { staleWhileRevalidate } from './stale-while-revalidate';
import { etagCacheControl } from './etag-cache-control';
import { http3Quic } from './http3-quic';
import { backpressure } from './backpressure';
import { abortController } from './abort-controller';
import { streamingFetch } from './streaming-fetch';
import { priorityHints } from './priority-hints';
import { sameSiteCookies } from './samesite-cookies';
import { speculativePrerendering } from './speculative-prerendering';

export const LEVEL: LevelMeta = {
  level: 5,
  title: 'Caching & Networking',
  tagline: 'Latency, freshness, and flow control on the wire',
  concepts: [
    cacheInvalidation,
    staleWhileRevalidate,
    etagCacheControl,
    http3Quic,
    backpressure,
    abortController,
    streamingFetch,
    priorityHints,
    sameSiteCookies,
    speculativePrerendering,
  ],
};
