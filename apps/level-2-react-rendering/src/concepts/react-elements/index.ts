import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const reactElements: ConceptModule = {
  slug: 'react-elements',
  title: 'React elements & JSX output',
  summary: 'JSX produces immutable React element objects: type, props, key, ref, and children.',
  tags: ['React', 'JSX', 'Rendering'],
  doc,
  Demo,
  Exercise,
};
