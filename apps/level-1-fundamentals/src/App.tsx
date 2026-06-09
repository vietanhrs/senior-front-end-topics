import { createHashRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './workbook/Layout';
import { Overview } from './workbook/Overview';
import { ConceptPage } from './workbook/ConceptPage';

// Hash routing keeps the app deployable as a static SPA on any host
// (e.g. GitHub Pages) without server-side rewrite rules.
const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Overview /> },
      { path: ':slug', element: <ConceptPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
