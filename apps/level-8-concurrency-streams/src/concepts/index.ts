import type { LevelMeta } from '@sfe/workbook';
import { taskStarvation } from './task-starvation';
import { priorityInversion } from './priority-inversion';
import { schedulerInternals } from './scheduler-internals';
import { concurrentRenderingTearing } from './concurrent-rendering-tearing';
import { backpressureHandling } from './backpressure-handling';
import { streamingSsrPipelines } from './streaming-ssr-pipelines';
import { webrtcBasics } from './webrtc-basics';
import { crdtBasics } from './crdt-basics';
import { sharedMemoryModels } from './shared-memory-models';
import { deterministicUi } from './deterministic-ui';

export const LEVEL: LevelMeta = {
  level: 8,
  title: 'Concurrency & Streams',
  tagline: 'Scheduling, backpressure, and consistency: keeping the UI correct and responsive under async load',
  concepts: [
    taskStarvation,
    priorityInversion,
    schedulerInternals,
    concurrentRenderingTearing,
    backpressureHandling,
    streamingSsrPipelines,
    webrtcBasics,
    crdtBasics,
    sharedMemoryModels,
    deterministicUi,
  ],
};
