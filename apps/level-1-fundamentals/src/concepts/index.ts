import type { LevelMeta } from '../workbook/types';
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
  tagline: 'Cơ bản nhưng không được mơ hồ',
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
