import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const csp: ConceptModule = {
  slug: 'csp',
  title: 'CSP (Content Security Policy)',
  summary: 'An allow-list for content sources; a strict nonce + strict-dynamic policy neutralizes injected scripts.',
  tags: ['Security', 'XSS', 'Headers'],
  doc,
  Demo,
  Exercise,
};
