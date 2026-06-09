import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const corsPreflight: ConceptModule = {
  slug: 'cors-preflight',
  title: 'CORS preflight',
  summary: 'When the browser auto-sends OPTIONS; simple vs preflighted; credentials constraints.',
  tags: ['Security', 'Network', 'HTTP'],
  doc,
  Demo,
  Exercise,
};
