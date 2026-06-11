import type { LevelMeta } from '@sfe/workbook';
import { firstInputDelay } from './first-input-delay';
import { interactionToNextPaint } from './interaction-to-next-paint';
import { cumulativeLayoutShift } from './cumulative-layout-shift';
import { largestContentfulPaint } from './largest-contentful-paint';
import { performanceObserver } from './performance-observer';
import { longTasks } from './long-tasks';
import { memoryLeakDetection } from './memory-leak-detection';
import { accessibilityTree } from './accessibility-tree';
import { ariaLiveRegions } from './aria-live-regions';
import { pointerEventsModel } from './pointer-events-model';

export const LEVEL: LevelMeta = {
  level: 9,
  title: 'Performance Metrics in Practice',
  tagline: 'Measuring what users actually feel: Core Web Vitals, the observer APIs behind them, and the input & accessibility plumbing',
  concepts: [
    firstInputDelay,
    interactionToNextPaint,
    cumulativeLayoutShift,
    largestContentfulPaint,
    performanceObserver,
    longTasks,
    memoryLeakDetection,
    accessibilityTree,
    ariaLiveRegions,
    pointerEventsModel,
  ],
};
