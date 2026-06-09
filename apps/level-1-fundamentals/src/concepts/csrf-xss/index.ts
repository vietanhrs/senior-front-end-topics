import type { ConceptModule } from '../../workbook/types';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const csrfXss: ConceptModule = {
  slug: 'csrf-xss',
  title: 'CSRF vs XSS mitigation',
  summary: 'XSS = mã lạ trong origin bạn; CSRF = mượn cookie. Escaping/sanitize/CSP vs SameSite/token.',
  tags: ['Security', 'React'],
  doc,
  Demo,
  Exercise,
};
