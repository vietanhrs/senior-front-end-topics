import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const customElementsLifecycle: ConceptModule = {
  slug: 'custom-elements-lifecycle',
  title: 'Custom elements lifecycle',
  summary: 'constructor/connected/disconnected/attributeChanged/adopted; observedAttributes, upgrades, idempotent connect.',
  tags: ['Web Components', 'DOM', 'Lifecycle'],
  doc,
  Demo,
  Exercise,
};
