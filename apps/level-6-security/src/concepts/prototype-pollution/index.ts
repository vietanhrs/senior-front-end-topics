import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const prototypePollution: ConceptModule = {
  slug: 'prototype-pollution',
  title: 'Prototype pollution',
  summary: 'Attacker __proto__/constructor keys in a merge mutate every object; reject keys, use Map/null-proto, validate.',
  tags: ['Security', 'JavaScript', 'Injection'],
  doc,
  Demo,
  Exercise,
};
