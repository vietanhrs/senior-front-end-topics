import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Search box. It shows results for whatever request resolves LAST, which on a
// jittery network is often a stale, superseded query.
function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/api/search?q=' + encodeURIComponent(query))
      .then((r) => r.json())
      .then((data) => setResults(data));   // applied no matter how stale; no cleanup
    // no AbortController, no "is this still the latest?" guard
  }, [query]);

  return <List items={results} />;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the results deterministic"
        description="This effect applies every response, so a slow earlier request can overwrite a fast later one. Neutralize stale runs and cancel superseded requests so the UI always matches the current query."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Each effect run owns its request. Use a cleanup <code>active</code> flag so a stale run can't{' '}
        <code>setState</code>, and an <code>AbortController</code> to actually cancel the superseded
        fetch. The cleanup runs before the next effect (and on unmount), which is exactly when an
        in-flight request becomes stale.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    let active = true;                       // this run's "am I still latest?" flag
    const ctrl = new AbortController();

    fetch('/api/search?q=' + encodeURIComponent(query), { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => { if (active) setResults(data); }) // ignore if superseded
      .catch((err) => { if (err.name !== 'AbortError') throw err; });

    return () => {
      active = false;       // a later effect run has started → neutralize this one
      ctrl.abort();         // and actually cancel the in-flight request
    };
  }, [query]);

  return <List items={results} />;
}

// Equivalent non-React core (apply latest, not last):
//   let latest = 0;
//   async function search(q) {
//     const id = ++latest;
//     const res = await api(q);
//     if (id === latest) render(res);   // drop stale responses
//   }

// Even better for this exact problem: a data library (TanStack Query / SWR) keys
// the cache by query and handles cancellation + dedupe + latest-wins for you; or
// useDeferredValue to keep the input responsive while results catch up.

// Why it's deterministic now: only the newest request can write to state, and
// older ones are both ignored AND aborted — so the displayed results always
// correspond to the current query regardless of response ordering.`}
      />
    </Stack>
  );
}
