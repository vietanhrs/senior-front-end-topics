import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const controlledUncontrolled: ConceptModule = {
  slug: 'controlled-uncontrolled',
  title: 'Controlled vs Uncontrolled',
  summary: 'Who owns the value — parent (value+onChange) or the component (defaultValue+ref); never switch modes, and how to support both.',
  tags: ['Pattern', 'Forms', 'State'],
  doc,
  Demo,
  Exercise,
};
