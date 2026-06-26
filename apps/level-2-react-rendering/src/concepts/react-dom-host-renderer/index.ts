import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const reactDomHostRenderer: ConceptModule = {
  slug: 'react-dom-host-renderer',
  title: 'ReactDOM host renderer',
  summary: 'How React delegates host work to ReactDOM: DOM nodes, props, events, refs, and hydration.',
  tags: ['ReactDOM', 'DOM', 'Rendering'],
  doc,
  Demo,
  Exercise,
};
