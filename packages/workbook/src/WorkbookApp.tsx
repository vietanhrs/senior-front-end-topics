import { useMemo } from 'react';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { WorkbookProvider } from './context';
import { Layout } from './Layout';
import { Overview } from './Overview';
import { ConceptPage } from './ConceptPage';
import { HubOverview, HubShell, LevelScope } from './hub';
import type { LevelMeta } from './types';

// Hash routing keeps each app deployable as a static SPA on any host
// (e.g. GitHub Pages) without server-side rewrite rules.
function makeSingleRouter() {
  return createHashRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Overview /> },
        { path: ':slug', element: <ConceptPage /> },
      ],
    },
  ]);
}

// Hub mode: '/' lists all levels, '/:levelId' is a level overview, and
// '/:levelId/:slug' is a concept page. LevelScope resolves the level and
// provides the context (with base='/<levelId>') to the shared pages.
function makeHubRouter(levels: LevelMeta[]) {
  return createHashRouter([
    {
      path: '/',
      element: <HubShell levels={levels} />,
      children: [
        { index: true, element: <HubOverview levels={levels} /> },
        {
          path: ':levelId',
          element: <LevelScope levels={levels} />,
          children: [
            { index: true, element: <Overview /> },
            { path: ':slug', element: <ConceptPage /> },
          ],
        },
      ],
    },
  ]);
}

/**
 * The shared workbook application.
 *
 * - Single-level mode: pass `level` — the app renders that level's workbook
 *   (used by the per-level apps).
 * - Hub mode: pass `levels` — one app navigates across every level
 *   (used by apps/workbook-hub).
 */
export function WorkbookApp({ level, levels }: { level?: LevelMeta; levels?: LevelMeta[] }) {
  const router = useMemo(
    () => (levels && levels.length > 0 ? makeHubRouter(levels) : makeSingleRouter()),
    [levels],
  );

  if (levels && levels.length > 0) {
    // Context is provided per-level by LevelScope inside the router.
    return <RouterProvider router={router} />;
  }

  if (!level) throw new Error('WorkbookApp requires either `level` or `levels`');
  return (
    <WorkbookProvider value={{ level, base: '' }}>
      <RouterProvider router={router} />
    </WorkbookProvider>
  );
}
