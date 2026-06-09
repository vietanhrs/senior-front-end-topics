import { createHashRouter, RouterProvider } from 'react-router-dom';
import { WorkbookProvider } from './context';
import { Layout } from './Layout';
import { Overview } from './Overview';
import { ConceptPage } from './ConceptPage';
import type { LevelMeta } from './types';

// Hash routing keeps each level deployable as a static SPA on any host
// (e.g. GitHub Pages) without server-side rewrite rules.
function makeRouter() {
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

/**
 * The shared workbook application. A level app just provides its `level`
 * metadata (title + concepts); the engine renders the nav, routing, theory
 * renderer, demos and exercises.
 */
export function WorkbookApp({ level }: { level: LevelMeta }) {
  const router = makeRouter();
  return (
    <WorkbookProvider value={level}>
      <RouterProvider router={router} />
    </WorkbookProvider>
  );
}
