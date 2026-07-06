// The hub aggregates every level's registry from the sibling workspace apps.
// Each LEVEL is plain data (LevelMeta) + React components, all built on the
// same @sfe/workbook engine and identical tooling, so importing across app
// boundaries inside the monorepo is safe.
import type { LevelMeta } from '@sfe/workbook';
import { LEVEL as level1 } from '../../level-1-fundamentals/src/concepts';
import { LEVEL as level2 } from '../../level-2-react-rendering/src/concepts';
import { LEVEL as level2Star } from '../../level-2-angular-for-react-devs/src/concepts';
import { LEVEL as level3 } from '../../level-3-browser-performance/src/concepts';
import { LEVEL as level4 } from '../../level-4-data-state/src/concepts';
import { LEVEL as level5 } from '../../level-5-caching-networking/src/concepts';
import { LEVEL as level6 } from '../../level-6-security/src/concepts';
import { LEVEL as level7 } from '../../level-7-web-platform-internals/src/concepts';
import { LEVEL as level8 } from '../../level-8-concurrency-streams/src/concepts';
import { LEVEL as level9 } from '../../level-9-performance-metrics/src/concepts';
import { LEVEL as level10 } from '../../level-10-frontend-architecture/src/concepts';

export const LEVELS: LevelMeta[] = [
  level1,
  level2,
  level2Star,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
  level9,
  level10,
];
