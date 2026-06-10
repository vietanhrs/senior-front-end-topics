import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const http3Quic: ConceptModule = {
  slug: 'http3-quic',
  title: 'HTTP/3 and QUIC',
  summary: 'QUIC kills TCP head-of-line blocking with independent streams over UDP; 0/1-RTT + migration.',
  tags: ['Network', 'Protocols', 'Performance'],
  doc,
  Demo,
  Exercise,
};
