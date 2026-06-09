import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const csrfXss: ConceptModule = {
  slug: 'csrf-xss',
  title: 'CSRF vs XSS mitigation',
  summary: 'XSS = foreign code in your origin; CSRF = borrowed cookies. Escaping/sanitize/CSP vs SameSite/token.',
  tags: ['Security', 'React'],
  doc,
  Demo,
  Exercise,
};
