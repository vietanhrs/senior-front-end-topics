import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A useData hook that always blocks on the network — users see a spinner on
// every navigation even for data they just saw. Re-implement it with the
// stale-while-revalidate pattern (module-level cache + background refresh +
// dedupe of concurrent revalidations).
function useData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);                       // throws away the previous content!
    fetch(url).then((r) => r.json()).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [url]);

  return { data, loading };
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: build a mini-SWR hook"
        description="Serve cached data instantly (no spinner for revisits), revalidate in the background, expose isValidating, and dedupe concurrent revalidations for the same key."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Module-level <code>Map&lt;url, data&gt;</code> for the cache and{' '}
        <code>Map&lt;url, Promise&gt;</code> for in-flight revalidations (dedupe). Initialize state
        from the cache; always revalidate on mount; only show "loading" when there's nothing cached.
        Guard the setState against unmount/url change (race conditions — Level 4).
      </Callout>

      <SolutionReveal
        code={`const cache = new Map();      // url -> data
const inflight = new Map();   // url -> Promise (dedupes concurrent revalidations)

function revalidate(url) {
  if (inflight.has(url)) return inflight.get(url);   // share one request per key
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then((data) => {
      cache.set(url, data);
      return data;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

function useData(url) {
  // 1) serve whatever is cached IMMEDIATELY (possibly stale)
  const [data, setData] = useState(() => cache.get(url) ?? null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    let ignore = false;                      // race guard
    setData(cache.get(url) ?? null);         // instant content on url change
    setIsValidating(true);
    revalidate(url)
      .then((fresh) => { if (!ignore) setData(fresh); })   // 2) background update
      .catch(() => {})                       // keep stale data on error (stale-if-error)
      .finally(() => { if (!ignore) setIsValidating(false); });
    return () => { ignore = true; };
  }, [url]);

  return {
    data,
    isLoading: data === null && isValidating,  // spinner ONLY when nothing cached
    isValidating,                              // subtle "updating…" indicator
  };
}

// Production: use SWR/React Query — same model plus focus/reconnect revalidation,
// retries, GC, and cache invalidation by key.`}
      />
    </Stack>
  );
}
