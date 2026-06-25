import type { LevelMeta } from '@sfe/workbook';
import { reactElements } from './react-elements';
import { renderPipeline } from './render-pipeline';
import { reactDomHostRenderer } from './react-dom-host-renderer';
import { reconciliation } from './reconciliation';
import { fiber } from './fiber';
import { concurrentRendering } from './concurrent-rendering';
import { timeSlicing } from './time-slicing';
import { schedulerPriorities } from './scheduler-priorities';
import { suspense } from './suspense';
import { selectiveHydration } from './selective-hydration';
import { serverComponents } from './server-components';
import { tearing } from './tearing';
import { staleClosures } from './stale-closures';

export const LEVEL: LevelMeta = {
  level: 2,
  title: 'React Core & Rendering Mechanics',
  tagline: 'From JSX objects to Fiber, ReactDOM commits, concurrency, and rendering traps',
  concepts: [
    reactElements,
    renderPipeline,
    reactDomHostRenderer,
    reconciliation,
    fiber,
    concurrentRendering,
    timeSlicing,
    schedulerPriorities,
    suspense,
    selectiveHydration,
    serverComponents,
    tearing,
    staleClosures,
  ],
};
