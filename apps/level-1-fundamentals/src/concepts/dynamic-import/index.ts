import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const dynamicImport: ConceptModule = {
  slug: 'dynamic-import',
  title: 'Dynamic import chunking',
  summary: 'import() returns a Promise, the bundler cuts chunks, modules cache by specifier; avoid waterfalls.',
  tags: ['Bundling', 'Runtime', 'Vite'],
  doc,
  Demo,
  Exercise,
};
