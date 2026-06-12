import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const errorBoundary: ConceptModule = {
  slug: 'error-boundary',
  title: 'Error Boundaries',
  summary: 'Catch render/lifecycle errors and show a fallback; scope per region, add reset + reporting; async/handlers need try/catch.',
  tags: ['Pattern', 'Resilience', 'Errors'],
  doc,
  Demo,
  Exercise,
};
