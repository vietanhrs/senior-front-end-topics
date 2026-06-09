import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const serverComponents: ConceptModule = {
  slug: 'server-components',
  title: 'Server components',
  summary: "Server-only components ship no JS & access server resources; 'use client' marks the interactivity boundary.",
  tags: ['React', 'RSC', 'Architecture'],
  doc,
  Demo,
  Exercise,
};
