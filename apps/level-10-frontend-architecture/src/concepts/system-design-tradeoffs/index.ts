import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const systemDesignTradeoffs: ConceptModule = {
  slug: 'system-design-tradeoffs',
  title: 'Frontend system design trade-offs',
  summary: 'Drive architecture from constraints, not trends: rendering-strategy fit, monolith vs micro-frontends, and naming the trade-off you accept.',
  tags: ['Architecture', 'System design', 'Decisions'],
  doc,
  Demo,
  Exercise,
};
