import type { LevelMeta } from '@sfe/workbook';
import { angularTemplates } from './angular-templates';
import { ivyViewModel } from './ivy-view-model';
import { angularRenderer } from './angular-renderer';
import { listIdentityTrackby } from './list-identity-trackby';
import { changeDetection } from './change-detection';
import { signalsReactivity } from './signals-reactivity';
import { zonesZoneless } from './zones-zoneless';
import { schedulingWork } from './scheduling-work';
import { deferrableViews } from './deferrable-views';
import { hydrationEventReplay } from './hydration-event-replay';
import { ssrServerRendering } from './ssr-server-rendering';
import { rxjsExternalState } from './rxjs-external-state';
import { staleCapturesLifecycle } from './stale-captures-lifecycle';

export const LEVEL: LevelMeta = {
  level: 2.1,
  levelLabel: '2*',
  routeId: '2-star',
  title: 'Angular for React Developers',
  tagline: 'Angular runtime mechanics explained through React mental models, then corrected',
  concepts: [
    angularTemplates,
    ivyViewModel,
    angularRenderer,
    listIdentityTrackby,
    changeDetection,
    signalsReactivity,
    zonesZoneless,
    schedulingWork,
    deferrableViews,
    hydrationEventReplay,
    ssrServerRendering,
    rxjsExternalState,
    staleCapturesLifecycle,
  ],
};
