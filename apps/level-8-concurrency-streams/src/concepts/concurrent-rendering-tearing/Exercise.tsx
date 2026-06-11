import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A hook that subscribes a component to an external store. Under concurrent
// rendering (startTransition, sliced renders) it can tear: different components
// read different store values within one commit.
const store = {
  value: 0,
  listeners: new Set(),
  set(v) { this.value = v; this.listeners.forEach((l) => l()); },
  subscribe(l) { this.listeners.add(l); return () => this.listeners.delete(l); },
};

function useStoreValue() {
  const [value, setValue] = useState(store.value);     // mirror in React state
  useEffect(() => {
    return store.subscribe(() => setValue(store.value)); // update AFTER render/commit
  }, []);
  return value;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the external store read tear-free"
        description="The useState+useEffect mirror updates after commit, so during a sliced concurrent render some components can read the old mirrored value and others the freshly-set store — tearing. Replace it with the primitive built for this."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        <code>useSyncExternalStore(subscribe, getSnapshot)</code> reads a consistent snapshot for the
        whole tree and forces a synchronous re-render if the store changes mid-render. Keep{' '}
        <code>getSnapshot</code> cheap and <b>referentially stable</b> — return the same value/object
        for unchanged state, or React re-renders forever. Add a <code>getServerSnapshot</code> for SSR.
      </Callout>

      <SolutionReveal
        language="js"
        code={`import { useSyncExternalStore } from 'react';

const store = {
  value: 0,
  listeners: new Set(),
  set(v) {
    if (v === this.value) return;        // stable snapshot: no-op on equal values
    this.value = v;
    this.listeners.forEach((l) => l());
  },
  subscribe(l) { this.listeners.add(l); return () => this.listeners.delete(l); },
  getSnapshot: function () { return this.value; }, // cheap + stable for unchanged state
};

function useStoreValue() {
  return useSyncExternalStore(
    store.subscribe,                       // (cb) => unsubscribe
    () => store.getSnapshot(),             // consistent synchronous read
    () => store.getSnapshot(),             // server snapshot for SSR/hydration
  );
}

// If the snapshot must be DERIVED (e.g. select a slice), memoize so the
// reference is stable across calls with the same state:
//   const selectItems = (s) => s.items;          // returns the same array ref
//   useSyncExternalStore(subscribe, () => selectItems(store));
// For computed/object selections, cache with useSyncExternalStoreWithSelector
// (from 'use-sync-external-store/with-selector') and an isEqual comparator.

// Why it's better: React reads ONE snapshot for the whole render and, if the
// store mutates mid-render, it detects the mismatch and re-renders synchronously,
// abandoning the torn work — so the commit is always internally consistent.`}
      />
    </Stack>
  );
}
