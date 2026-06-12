import type { LevelMeta } from '@sfe/workbook';
import { containerPresentational } from './container-presentational';
import { customHooks } from './custom-hooks';
import { compoundComponents } from './compound-components';
import { renderProps } from './render-props';
import { higherOrderComponents } from './higher-order-components';
import { providerPattern } from './provider-pattern';
import { controlledUncontrolled } from './controlled-uncontrolled';
import { stateReducer } from './state-reducer';
import { propsGetters } from './props-getters';
import { compositionPattern } from './composition';
import { forwardingRefs } from './forwarding-refs';
import { errorBoundary } from './error-boundary';
import { suspenseLazy } from './suspense-lazy';
import { portalsPattern } from './portals';

export const LEVEL: LevelMeta = {
  level: 11,
  title: 'Appendix · React Design Patterns',
  tagline: 'The canonical React composition patterns — what each is for, when to reach for it, and a runnable example',
  concepts: [
    containerPresentational,
    customHooks,
    compoundComponents,
    renderProps,
    higherOrderComponents,
    providerPattern,
    controlledUncontrolled,
    stateReducer,
    propsGetters,
    compositionPattern,
    forwardingRefs,
    errorBoundary,
    suspenseLazy,
    portalsPattern,
  ],
};
