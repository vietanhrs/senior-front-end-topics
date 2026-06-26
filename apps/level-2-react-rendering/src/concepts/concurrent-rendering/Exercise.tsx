import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Typing in the search box is laggy because each keystroke synchronously
// re-renders a very expensive <Results> tree. Make the input responsive
// WITHOUT debouncing and WITHOUT changing the data.
function Search({ allItems }) {
  const [query, setQuery] = useState('');
  const results = allItems.filter((i) => i.includes(query)); // expensive downstream render

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Results items={results} />
    </>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the input responsive with concurrency"
        description="Keep the keystroke update urgent, but render the expensive results at low priority so they can be interrupted. Show a 'pending' state. Solve it two ways: useDeferredValue and useTransition."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        The input update must stay urgent. Only the expensive <code>Results</code> render should
        be deferred/transitioned. <code>useDeferredValue</code> when you only have the value;
        <code>useTransition</code> when you control the setter.
      </Callout>

      <SolutionReveal
        notes="Option A — useDeferredValue (simplest here; we only have the value):"
        code={`function Search({ allItems }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);          // lags behind, low priority
  const results = useMemo(
    () => allItems.filter((i) => i.includes(deferredQuery)),
    [allItems, deferredQuery],
  );
  const isStale = deferredQuery !== query;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.6 : 1 }}>
        <Results items={results} />
      </div>
    </>
  );
}

// Option B — useTransition (when you own the state that drives the slow tree):
function Search({ allItems }) {
  const [query, setQuery] = useState('');
  const [resultsQuery, setResultsQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const results = useMemo(
    () => allItems.filter((i) => i.includes(resultsQuery)),
    [allItems, resultsQuery],
  );

  function onChange(e) {
    const nextQuery = e.target.value;
    setQuery(nextQuery);                                   // urgent
    startTransition(() => {                                // interruptible
      setResultsQuery(nextQuery);                          // cheap state update
    });
  }

  return (
    <>
      <input value={query} onChange={onChange} />
      {isPending && <Spinner />}
      <Results items={results} />
    </>
  );
}

// The expensive filter/render is now part of the transition render path.
// Do not put a big synchronous CPU loop directly inside startTransition's callback.`}
      />
    </Stack>
  );
}
