import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const higherOrderComponents: ConceptModule = {
  slug: 'higher-order-components',
  title: 'Higher-Order Components (HOC)',
  summary: 'Component → component wrappers for cross-cutting concerns; hygiene (displayName, ref forwarding, props) and why hooks superseded them.',
  tags: ['Pattern', 'Composition', 'Legacy'],
  doc,
  Demo,
  Exercise,
};
