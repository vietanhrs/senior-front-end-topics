import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const forwardingRefs: ConceptModule = {
  slug: 'forwarding-refs',
  title: 'Ref Forwarding & Imperative Handle',
  summary: 'Pass a ref through to a DOM node (forwardRef / React 19 ref-as-prop) and expose a minimal imperative API via useImperativeHandle.',
  tags: ['Pattern', 'Refs', 'Imperative'],
  doc,
  Demo,
  Exercise,
};
