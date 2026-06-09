import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const corsPreflight: ConceptModule = {
  slug: 'cors-preflight',
  title: 'CORS preflight',
  summary: 'Khi nào trình duyệt tự gửi OPTIONS; simple vs preflighted; ràng buộc credentials.',
  tags: ['Security', 'Network', 'HTTP'],
  doc,
  Demo,
  Exercise,
};
