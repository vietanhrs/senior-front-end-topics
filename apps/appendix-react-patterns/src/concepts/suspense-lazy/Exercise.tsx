import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Every route + a giant editor are imported eagerly, so the initial bundle is
// huge and slow to boot — even for users who never open the editor.
import Dashboard from './routes/Dashboard';
import Settings from './routes/Settings';
import Reports from './routes/Reports';
import RichTextEditor from './RichTextEditor'; // ~300KB, used by ~5% of sessions

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  );
}

function NoteForm() {
  return <RichTextEditor />; // pulled into the main bundle for everyone
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: code-split routes and the heavy editor"
        description="Eager imports bloat the initial bundle. Lazy-load each route and the rarely-used editor behind Suspense, with a fallback and an error boundary for failed chunk loads — and preload on intent."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Replace eager imports with <code>lazy(() =&gt; import(...))</code> and render them inside{' '}
        <code>&lt;Suspense fallback&gt;</code>. Wrap with an <b>error boundary</b> so a failed chunk
        shows a retry, not a crash. <b>Preload</b> the editor's chunk on hover/focus so it's ready
        when opened.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// route-level splitting first — the biggest win
const Dashboard = lazy(() => import('./routes/Dashboard'));
const Settings = lazy(() => import('./routes/Settings'));
const Reports = lazy(() => import('./routes/Reports'));

// heavy, rarely-used widget split out + a named importer we can also preload
const importEditor = () => import('./RichTextEditor');
const RichTextEditor = lazy(importEditor);

function App() {
  return (
    <ErrorBoundary FallbackComponent={ChunkError}>   {/* failed chunk → retry, not crash */}
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function NoteForm() {
  const [editing, setEditing] = useState(false);
  return (
    <>
      {/* preload the chunk on intent so it's warm by the time they click */}
      <button onMouseEnter={importEditor} onFocus={importEditor} onClick={() => setEditing(true)}>
        Add note
      </button>
      {editing && (
        <Suspense fallback={<EditorSkeleton />}>
          <RichTextEditor />     {/* only the ~5% who open it download 300KB */}
        </Suspense>
      )}
    </>
  );
}

function ChunkError({ resetErrorBoundary }) {
  return <button onClick={resetErrorBoundary}>Failed to load — retry</button>;
}

// Why it's better: the initial bundle drops to the current route's code; other
// routes and the 300KB editor load on demand. Suspense shows layout-matching
// skeletons; the error boundary turns a failed chunk fetch into a retry instead of
// a white screen; and preloading on hover hides the latency when the editor opens.`}
      />
    </Stack>
  );
}
