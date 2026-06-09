import type { LevelMeta } from '@sfe/workbook';
import { layoutThrashing } from './layout-thrashing';
import { paintLayoutComposite } from './paint-layout-composite';
import { compositingLayers } from './compositing-layers';
import { gpuAcceleration } from './gpu-acceleration';
import { cssContainment } from './css-containment';
import { renderBlocking } from './render-blocking-resources';
import { renderWaterfall } from './render-waterfall';
import { subpixelRendering } from './subpixel-rendering';
import { detachedDomNodes } from './detached-dom-nodes';
import { gcTiming } from './gc-timing';

export const LEVEL: LevelMeta = {
  level: 3,
  title: 'Browser Performance',
  tagline: 'Pixels, the render pipeline, and where frames go to die',
  concepts: [
    layoutThrashing,
    paintLayoutComposite,
    compositingLayers,
    gpuAcceleration,
    cssContainment,
    renderBlocking,
    renderWaterfall,
    subpixelRendering,
    detachedDomNodes,
    gcTiming,
  ],
};
