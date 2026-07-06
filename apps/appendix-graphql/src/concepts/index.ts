import type { LevelMeta } from '@sfe/workbook';
import { schemaResolvers } from './schema-resolvers';
import { queriesFragments } from './queries-fragments';
import { mutationsErrors } from './mutations-errors';
import { paginationConnections } from './pagination-connections';
import { normalizedCache } from './normalized-cache';
import { nPlusOnePerformance } from './n-plus-one-performance';
import { realtimeSubscriptions } from './realtime-subscriptions';
import { securityGovernance } from './security-governance';
import { clientArchitecture } from './client-architecture';

export const LEVEL: LevelMeta = {
  level: 11,
  sectionLabel: 'Appendix',
  levelLabel: 'GraphQL',
  routeId: 'graphql',
  title: 'GraphQL for Front-end Engineers',
  tagline: 'Schema contracts, client operations, cache design, performance, realtime, and governance',
  concepts: [
    schemaResolvers,
    queriesFragments,
    mutationsErrors,
    paginationConnections,
    normalizedCache,
    nPlusOnePerformance,
    realtimeSubscriptions,
    securityGovernance,
    clientArchitecture,
  ],
};
