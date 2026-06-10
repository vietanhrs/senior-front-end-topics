import { createContext, useContext } from 'react';
import type { LevelMeta } from './types';

export interface WorkbookContextValue {
  /** The level whose concepts are currently being shown. */
  level: LevelMeta;
  /** Route prefix for concept links: '' in single-level mode, '/3' in hub mode. */
  base: string;
  /** All available levels when running as the multi-level hub. */
  levels?: LevelMeta[];
}

const WorkbookContext = createContext<WorkbookContextValue | null>(null);

export const WorkbookProvider = WorkbookContext.Provider;

/** Access the full workbook context (level + link base + hub levels). */
export function useWorkbook(): WorkbookContextValue {
  const ctx = useContext(WorkbookContext);
  if (!ctx) throw new Error('useWorkbook must be used inside <WorkbookApp>');
  return ctx;
}

/** Access the active level's metadata + concepts from within the engine. */
export function useLevel(): LevelMeta {
  return useWorkbook().level;
}
