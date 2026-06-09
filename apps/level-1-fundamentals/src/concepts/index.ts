import type { LevelMeta } from '@sfe/workbook';
import { hydration } from './hydration';
import { vdomDiffing } from './vdom-diffing';
import { eventLoop } from './event-loop';
import { criticalRenderingPath } from './critical-rendering-path';
import { codeSplitting } from './code-splitting';
import { dynamicImport } from './dynamic-import';
import { resourceHints } from './resource-hints';
import { corsPreflight } from './cors-preflight';
import { csrfXss } from './csrf-xss';
import { workers } from './workers';

export const LEVEL: LevelMeta = {
  level: 1,
  title: 'Fundamentals',
  tagline: 'Fundamentals you must not be fuzzy about',
  concepts: [
    hydration,
    vdomDiffing,
    eventLoop,
    criticalRenderingPath,
    codeSplitting,
    dynamicImport,
    resourceHints,
    corsPreflight,
    csrfXss,
    workers,
  ],
};
