import type { ConceptModule } from '@sfe/workbook';
import doc from './doc.md?raw';
import { Demo } from './Demo';
import { Exercise } from './Exercise';

export const webrtcBasics: ConceptModule = {
  slug: 'webrtc-basics',
  title: 'WebRTC basics',
  summary: 'P2P media/data: signaling, offer/answer SDP, ICE/STUN/TURN NAT traversal, and a real loopback DataChannel.',
  tags: ['Networking', 'P2P', 'Realtime'],
  doc,
  Demo,
  Exercise,
};
