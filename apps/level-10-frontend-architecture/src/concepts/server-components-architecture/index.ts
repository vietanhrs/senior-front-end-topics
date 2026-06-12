import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const serverComponentsArchitecture: ConceptModule = {
  slug: 'server-components-architecture',
  title: 'Server Components architecture',
  summary: 'Components that render only on the server and ship no JS: the use-client boundary, serializable props, and bundle/data wins.',
  tags: ['Architecture', 'React', 'SSR'],
  doc,
  Demo,
  Exercise,
};
