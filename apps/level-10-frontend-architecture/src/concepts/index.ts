import type { LevelMeta } from '@sfe/workbook';
import { edgeRendering } from './edge-rendering';
import { microFrontendOrchestration } from './micro-frontend-orchestration';
import { moduleFederation } from './module-federation';
import { webassemblyIntegration } from './webassembly-integration';
import { indexeddbScaling } from './indexeddb-scaling';
import { serverComponentsArchitecture } from './server-components-architecture';
import { offlineFirstDesign } from './offline-first-design';
import { conflictResolutionModels } from './conflict-resolution-models';
import { distributedUiConsistency } from './distributed-ui-consistency';
import { systemDesignTradeoffs } from './system-design-tradeoffs';

export const LEVEL: LevelMeta = {
  level: 10,
  title: 'Modern Frontend System Architecture',
  tagline: 'Designing front-ends as distributed systems: edge, federation, offline, and the consistency trade-offs that tie them together',
  concepts: [
    edgeRendering,
    microFrontendOrchestration,
    moduleFederation,
    webassemblyIntegration,
    indexeddbScaling,
    serverComponentsArchitecture,
    offlineFirstDesign,
    conflictResolutionModels,
    distributedUiConsistency,
    systemDesignTradeoffs,
  ],
};
