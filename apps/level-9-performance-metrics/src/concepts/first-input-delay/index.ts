import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const firstInputDelay: ConceptModule = {
  slug: 'first-input-delay',
  title: 'First Input Delay (FID)',
  summary: 'The input-delay-only metric of the first interaction, why a busy main thread inflates it, and why INP replaced it.',
  tags: ['Web Vitals', 'Performance', 'Metrics'],
  doc,
  Demo,
  Exercise,
};
