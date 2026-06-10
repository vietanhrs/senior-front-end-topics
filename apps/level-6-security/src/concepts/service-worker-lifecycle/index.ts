import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const serviceWorkerLifecycle: ConceptModule = {
  slug: 'service-worker-lifecycle',
  title: 'Service Worker lifecycle traps',
  summary: 'New SW stuck in "waiting"; reload won\'t activate it. skipWaiting/claim, cache versioning, update prompts.',
  tags: ['Security', 'PWA', 'Caching'],
  doc,
  Demo,
  Exercise,
};
