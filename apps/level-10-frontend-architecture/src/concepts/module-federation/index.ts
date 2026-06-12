import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const moduleFederation: ConceptModule = {
  slug: 'module-federation',
  title: 'Module Federation',
  summary: 'Runtime code sharing across separately built bundles: host/remote/shared scope negotiation and why React must be a singleton.',
  tags: ['Architecture', 'Bundling', 'Micro-frontends'],
  doc,
  Demo,
  Exercise,
};
