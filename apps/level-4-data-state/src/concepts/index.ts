import type { LevelMeta } from '@sfe/workbook';
import { structuralSharing } from './structural-sharing';
import { immutableData } from './immutable-data';
import { referentialEquality } from './referential-equality';
import { memoizationPitfalls } from './memoization-pitfalls';
import { raceConditions } from './race-conditions';
import { finiteState } from './finite-state';
import { eventSourcing } from './event-sourcing';
import { optimisticUi } from './optimistic-ui';
import { deterministicRendering } from './deterministic-rendering';
import { idempotentActions } from './idempotent-actions';

export const LEVEL: LevelMeta = {
  level: 4,
  title: 'Advanced Data & State',
  tagline: 'Modeling state correctly: identity, immutability, time, and failure',
  concepts: [
    structuralSharing,
    immutableData,
    referentialEquality,
    memoizationPitfalls,
    raceConditions,
    finiteState,
    eventSourcing,
    optimisticUi,
    deterministicRendering,
    idempotentActions,
  ],
};
