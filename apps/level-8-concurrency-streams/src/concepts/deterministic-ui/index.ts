import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const deterministicUi: ConceptModule = {
  slug: 'deterministic-ui',
  title: 'Deterministic UI under async',
  summary: 'Beating the stale-response race: apply latest-not-last, abort superseded work, idempotent updates, single source of truth.',
  tags: ['Async', 'React', 'State'],
  doc,
  Demo,
  Exercise,
};
