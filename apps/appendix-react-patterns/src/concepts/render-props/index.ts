import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const renderProps: ConceptModule = {
  slug: 'render-props',
  title: 'Render Props',
  summary: 'A function-as-prop (often children) that delegates rendering while the component owns behavior — and when hooks supersede it.',
  tags: ['Pattern', 'Composition', 'Reuse'],
  doc,
  Demo,
  Exercise,
};
