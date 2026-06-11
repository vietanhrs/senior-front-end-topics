import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const webComponentsInterop: ConceptModule = {
  slug: 'web-components-interop',
  title: 'Web components interoperability',
  summary: 'Strings→attributes, objects→properties; custom events need addEventListener, not onX (React 19 nuances).',
  tags: ['Web Components', 'React', 'Interop'],
  doc,
  Demo,
  Exercise,
};
