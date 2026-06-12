import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// The whole app is wrapped in a single boundary, the fallback has no recovery,
// and the team expects it to catch an async fetch error (it won't).
function App() {
  return (
    <ErrorBoundary>            {/* only ONE, at the root → any error blanks everything */}
      <Header />
      <Dashboard />            {/* if a chart throws, Header + Sidebar vanish too */}
      <Sidebar />
    </ErrorBoundary>
  );
}

function Chart() {
  useEffect(() => {
    fetch('/api/data').then((r) => r.json()).then(setData); // (async) rejection NOT caught by boundary
  }, []);
  return <Canvas data={data} />;
}

// fallback with no way out:
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? <h1>Something went wrong</h1> : this.props.children; }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: scope, recover, and report — and handle the async error correctly"
        description="One root boundary means any error blanks the app; the fallback can't recover; nothing is logged; and an async fetch rejection won't be caught at all. Fix the granularity, add reset + reporting, and surface the async error properly."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Wrap <b>independent regions</b> in their own boundaries (so one failure is local). Add{' '}
        <code>componentDidCatch</code> for logging and a <b>reset</b> in the fallback (e.g.{' '}
        <code>resetKeys</code>). The async error isn't a render error — catch it and put it in state,
        then <b>re-throw it during render</b> so a boundary can show it.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`import { ErrorBoundary } from 'react-error-boundary';

// 1) Scope boundaries to independent regions → local failure, not a blank app.
function App() {
  return (
    <>
      <ErrorBoundary FallbackComponent={Fallback} onError={report}><Header /></ErrorBoundary>
      <ErrorBoundary FallbackComponent={Fallback} onError={report}><Dashboard /></ErrorBoundary>
      <ErrorBoundary FallbackComponent={Fallback} onError={report}><Sidebar /></ErrorBoundary>
    </>
  );
}

// 2) Fallback WITH recovery (resetErrorBoundary remounts the subtree).
function Fallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>This section failed: {error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
const report = (error, info) => sendToSentry(error, info.componentStack); // 3) log it

// 4) Async errors aren't caught by boundaries — surface them by re-throwing in render.
function Chart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    fetch('/api/data').then((r) => r.json())
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e));   // catch the rejection ourselves
    return () => { active = false; };
  }, []);
  if (error) throw error;                       // re-throw DURING render → boundary catches it
  return <Canvas data={data} />;
}
// (or use a data lib / use() + Suspense, whose errors DO hit the boundary.)

// Why it's better: a chart crash now degrades only the Dashboard region (Header/
// Sidebar keep working); users can retry via resetErrorBoundary; errors are logged
// with their component stack; and the async failure is converted into a render-time
// throw so the boundary can actually display it.`}
      />
    </Stack>
  );
}
