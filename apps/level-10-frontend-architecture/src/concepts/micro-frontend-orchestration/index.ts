import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const microFrontendOrchestration: ConceptModule = {
  slug: 'micro-frontend-orchestration',
  title: 'Micro-frontend orchestration',
  summary: 'Independently deployed apps composed by a shell: routing, loose communication, failure isolation, and avoiding the distributed monolith.',
  tags: ['Architecture', 'Micro-frontends', 'Teams'],
  doc,
  Demo,
  Exercise,
};
