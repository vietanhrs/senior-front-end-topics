import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const hydration: ConceptModule = {
  slug: 'hydration',
  title: 'Hydration',
  summary: 'Gắn event handlers & state lên HTML render sẵn từ server, không vẽ lại DOM.',
  tags: ['SSR', 'React', 'TTI'],
  doc,
  Demo,
  Exercise,
};
