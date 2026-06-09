import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const dynamicImport: ConceptModule = {
  slug: 'dynamic-import',
  title: 'Dynamic import chunking',
  summary: 'import() trả Promise, bundler cắt chunk, module cache theo specifier; khử waterfall.',
  tags: ['Bundling', 'Runtime', 'Vite'],
  doc,
  Demo,
  Exercise,
};
