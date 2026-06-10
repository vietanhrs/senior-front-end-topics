import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const trustedTypes: ConceptModule = {
  slug: 'trusted-types',
  title: 'Trusted Types',
  summary: 'DOM XSS sinks reject raw strings; only policy-produced Trusted* objects pass — one auditable boundary.',
  tags: ['Security', 'XSS', 'DOM'],
  doc,
  Demo,
  Exercise,
};
