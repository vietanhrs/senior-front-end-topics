import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const sameSiteCookies: ConceptModule = {
  slug: 'samesite-cookies',
  title: 'SameSite cookie modes',
  summary: 'Strict/Lax/None semantics on SITES (eTLD+1), the Lax GET exception, and where SSO/iframes break.',
  tags: ['Cookies', 'Security', 'HTTP'],
  doc,
  Demo,
  Exercise,
};
