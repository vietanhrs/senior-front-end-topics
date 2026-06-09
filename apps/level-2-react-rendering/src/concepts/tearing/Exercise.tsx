import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A hand-rolled subscription to an external store. It can MISS updates (between
// render and effect) and TEARS under concurrent rendering, because each
// component copies the value into its own state at a slightly different time.
const store = {
  value: 0,
  listeners: new Set(),
  subscribe(cb) { store.listeners.add(cb); return () => store.listeners.delete(cb); },
  set(v) { store.value = v; store.listeners.forEach((l) => l()); },
};

function usePrice() {
  const [price, setPrice] = useState(store.value);
  useEffect(() => {
    return store.subscribe(() => setPrice(store.value));
  }, []);
  return price;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the external store concurrency-safe"
        description="Replace the useState + useEffect subscription with the primitive designed for this, so reads are consistent across a single commit and no updates are missed."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        <code>useSyncExternalStore(subscribe, getSnapshot)</code>. <code>getSnapshot</code> must
        return a stable, cached value for the same state (don't build a new object each call). For
        derived slices, use <code>useSyncExternalStoreWithSelector</code>.
      </Callout>

      <SolutionReveal
        code={`import { useSyncExternalStore } from 'react';

const store = {
  value: 0,
  listeners: new Set<() => void>(),
  subscribe(cb: () => void) {
    store.listeners.add(cb);
    return () => store.listeners.delete(cb);
  },
  getSnapshot: () => store.value,        // stable primitive snapshot
  set(v: number) {
    store.value = v;
    store.listeners.forEach((l) => l());
  },
};

function usePrice() {
  // Consistent snapshot per commit; no missed updates; tearing-safe.
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

// Selecting a slice from a bigger store (avoid returning fresh objects):
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector';

function useUserName() {
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,          // server snapshot
    (state) => state.user.name, // selector
  );
}`}
      />
    </Stack>
  );
}
