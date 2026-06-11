import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const webassemblyIntegration: ConceptModule = {
  slug: 'webassembly-integration',
  title: 'WebAssembly integration',
  summary: 'WASM as a near-native co-processor: instantiation, linear-memory marshalling, and not crossing the JS↔WASM boundary in hot loops.',
  tags: ['Architecture', 'WASM', 'Performance'],
  doc,
  Demo,
  Exercise,
};
