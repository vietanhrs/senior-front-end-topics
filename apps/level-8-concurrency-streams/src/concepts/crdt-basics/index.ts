import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const crdtBasics: ConceptModule = {
  slug: 'crdt-basics',
  title: 'CRDT basics for collaboration',
  summary: 'Coordination-free convergence: commutative/associative/idempotent merges, G-Counter vs LWW, and the CRDT zoo behind Yjs/Automerge.',
  tags: ['Collaboration', 'Distributed', 'State'],
  doc,
  Demo,
  Exercise,
};
