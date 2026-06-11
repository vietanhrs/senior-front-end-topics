import type { LevelMeta } from '@sfe/workbook';
import { islandArchitecture } from './island-architecture';
import { partialHydration } from './partial-hydration';
import { streamingSsr } from './streaming-ssr';
import { shadowDom } from './shadow-dom';
import { customElementsLifecycle } from './custom-elements-lifecycle';
import { webComponentsInterop } from './web-components-interop';
import { intersectionObserver } from './intersection-observer';
import { resizeObserverLoop } from './resize-observer-loop';
import { mutationObserverCost } from './mutation-observer-cost';
import { offscreenCanvas } from './offscreen-canvas';

export const LEVEL: LevelMeta = {
  level: 7,
  title: 'Web Platform Internals',
  tagline: 'Below the framework: rendering strategies, web components, and observer plumbing',
  concepts: [
    islandArchitecture,
    partialHydration,
    streamingSsr,
    shadowDom,
    customElementsLifecycle,
    webComponentsInterop,
    intersectionObserver,
    resizeObserverLoop,
    mutationObserverCost,
    offscreenCanvas,
  ],
};
