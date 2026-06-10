import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Autocomplete that races: fast keystrokes mean responses can land out of
// order, so an older query's results overwrite a newer one. Fix it (show both
// the effect-cleanup idiom and AbortController).
function Autocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetch('/api/search?q=' + query)
      .then((r) => r.json())
      .then((data) => setResults(data)); // applies whatever resolves, even if stale
  }, [query]);

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
        title="Exercise: kill the autocomplete race"
        description="Ensure only the response for the CURRENT query updates state. Provide the ignore-flag version and the AbortController version (which also cancels the request)."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        The effect cleanup runs before the next effect (when <code>query</code> changes) and on
        unmount — set an <code>ignore</code> flag there, or call <code>controller.abort()</code>.
      </Callout>

      <SolutionReveal
        code={`// Option A — ignore stale responses (cheap, idiomatic)
function Autocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    let ignore = false;
    fetch('/api/search?q=' + query)
      .then((r) => r.json())
      .then((data) => { if (!ignore) setResults(data); }); // drop superseded responses
    return () => { ignore = true; };  // marks this request stale on change/unmount
  }, [query]);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <Results items={results} />
    </>
  );
}

// Option B — AbortController (also cancels the in-flight request)
useEffect(() => {
  const ctrl = new AbortController();
  fetch('/api/search?q=' + query, { signal: ctrl.signal })
    .then((r) => r.json())
    .then(setResults)
    .catch((e) => { if (e.name !== 'AbortError') throw e; });
  return () => ctrl.abort();
}, [query]);

// Production: let React Query/SWR key by [\\'search\\', query] — stale responses
// are discarded automatically, plus caching, dedupe, retries, and cancellation.`}
      />
    </Stack>
  );
}
