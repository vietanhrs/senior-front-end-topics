import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const offlineFirstDesign: ConceptModule = {
  slug: 'offline-first-design',
  title: 'Offline-first design',
  summary: 'Local store as the UI’s source of truth: SW-cached shell, IndexedDB data, an optimistic outbox, and idempotent replay on reconnect.',
  tags: ['Architecture', 'Offline', 'Sync'],
  doc,
  Demo,
  Exercise,
};
