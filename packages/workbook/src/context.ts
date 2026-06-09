import { createContext, useContext } from 'react';
import type { LevelMeta } from './types';

const WorkbookContext = createContext<LevelMeta | null>(null);

export const WorkbookProvider = WorkbookContext.Provider;

/** Access the active level's metadata + concepts from within the engine. */
export function useLevel(): LevelMeta {
  const level = useContext(WorkbookContext);
  if (!level) throw new Error('useLevel must be used inside <WorkbookApp>');
  return level;
}
