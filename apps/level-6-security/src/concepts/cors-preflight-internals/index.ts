import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const corsPreflightInternals: ConceptModule = {
  slug: 'cors-preflight-internals',
  title: 'CORS preflight internals',
  summary: 'Inside the OPTIONS exchange: header matching, credentials rules (no *), Max-Age caching, failure modes.',
  tags: ['Security', 'CORS', 'HTTP'],
  doc,
  Demo,
  Exercise,
};
