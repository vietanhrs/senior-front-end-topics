import type { LevelMeta } from '@sfe/workbook';
import { csp } from './csp';
import { trustedTypes } from './trusted-types';
import { domClobbering } from './dom-clobbering';
import { prototypePollution } from './prototype-pollution';
import { sameOriginPolicy } from './same-origin-policy';
import { serviceWorkerLifecycle } from './service-worker-lifecycle';
import { sharedArrayBuffer } from './shared-array-buffer';
import { transferableObjects } from './transferable-objects';
import { corsPreflightInternals } from './cors-preflight-internals';
import { offlineConflict } from './offline-conflict-resolution';

export const LEVEL: LevelMeta = {
  level: 6,
  title: 'Security',
  tagline: 'Trust boundaries, injection sinks, isolation, and conflict',
  concepts: [
    csp,
    trustedTypes,
    domClobbering,
    prototypePollution,
    sameOriginPolicy,
    serviceWorkerLifecycle,
    sharedArrayBuffer,
    transferableObjects,
    corsPreflightInternals,
    offlineConflict,
  ],
};
