import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A <Fetch> helper that hard-codes how it renders. Every screen needs a different
// layout for loading/error/data, so people keep copying and tweaking this file.
function Fetch({ url }) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let active = true;
    fetch(url).then((r) => r.json())
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => active && setState({ data: null, error, loading: false }));
    return () => { active = false; };
  }, [url]);

  // hard-coded rendering — not reusable for different UIs
  if (state.loading) return <Spinner />;
  if (state.error) return <Error message={state.error.message} />;
  return <pre>{JSON.stringify(state.data)}</pre>;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: let the consumer control rendering (render prop)"
        description="The fetch logic is reusable but the rendering is hard-coded. Expose the {data, error, loading} state via a children-as-a-function render prop so each screen renders it its own way. (Then note when a hook would be the better choice.)"
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Keep the logic, but instead of returning fixed JSX, call{' '}
        <code>children(state)</code> and return that. Consumers pass a function that decides the UI.
        For pure logic reuse, a <code>useFetch(url)</code> hook is usually cleaner — mention both.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`// Render-prop version: logic owned here, UI decided by the caller.
function Fetch({ url, children }) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    fetch(url).then((r) => r.json())
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => active && setState({ data: null, error, loading: false }));
    return () => { active = false; };
  }, [url]);
  return children(state);          // delegate rendering
}

// each screen renders the SAME logic differently:
<Fetch url="/api/user">
  {({ data, error, loading }) =>
    loading ? <SkeletonCard /> : error ? <Toast error={error} /> : <UserCard user={data} />
  }
</Fetch>

<Fetch url="/api/stats">
  {({ data, loading }) => (loading ? <Dots /> : <Chart points={data} />)}
</Fetch>

// MODERN ALTERNATIVE (prefer for pure logic reuse — flat, composable, typed):
function useFetch(url) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  useEffect(() => { /* same effect as above */ }, [url]);
  return state;
}
function UserScreen() {
  const { data, error, loading } = useFetch('/api/user');   // no wrapper, no nesting
  return loading ? <SkeletonCard /> : error ? <Toast error={error} /> : <UserCard user={data} />;
}

// Why: the render prop makes ONE logic component serve any UI (no copy-paste). But
// since fetching is pure logic (no DOM ownership), a custom hook is usually the
// better tool today — same reuse, no extra component in the tree.`}
      />
    </Stack>
  );
}
