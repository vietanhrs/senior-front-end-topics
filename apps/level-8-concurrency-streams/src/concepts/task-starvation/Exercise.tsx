import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Validates a big list of records "in the background" while keeping the UI live.
// In practice the page freezes: no paint, no input, no spinner, until it's done.
function validateAll(records, onProgress) {
  let i = 0;
  function tick() {
    const r = records[i];
    r.valid = expensiveValidate(r);   // a few ms each
    i++;
    onProgress(i / records.length);
    if (i < records.length) {
      Promise.resolve().then(tick);   // "async" — but re-queues a microtask every time
    }
  }
  tick();
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: stop starving the UI"
        description="This loop schedules each step as a microtask, so the whole queue drains in one checkpoint — rendering, the progress spinner, and input are all starved until it finishes. Make it actually yield, and ideally do background work without blocking interaction."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        A microtask continuation runs inside the same checkpoint — it doesn't let the browser paint
        or run input. Yield to the event loop between chunks (a macrotask or{' '}
        <code>scheduler.yield()</code>), and process a <i>batch</i> per yield so you're not paying
        scheduling overhead per record. For truly background work, prefer{' '}
        <code>scheduler.postTask</code> with a low priority or a worker.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// Yield to the event loop between batches so paint + input get a turn.
async function validateAll(records, onProgress, { signal } = {}) {
  const BATCH = 200;                      // tune: enough work to amortize the yield
  const yieldToLoop =
    'scheduler' in globalThis && 'yield' in scheduler
      ? () => scheduler.yield()           // native, preserves priority
      : () => new Promise((r) => setTimeout(r, 0)); // macrotask fallback

  for (let i = 0; i < records.length; i++) {
    records[i].valid = expensiveValidate(records[i]);
    if (i % BATCH === BATCH - 1) {
      onProgress((i + 1) / records.length);
      await yieldToLoop();                // <-- the browser can paint + handle input here
      signal?.throwIfAborted();           // cancellable
    }
  }
  onProgress(1);
}

// Even better for pure CPU work: move expensiveValidate into a Worker so the
// main thread is never blocked at all, and post results back in batches.
// And for background-priority scheduling without a worker:
//   scheduler.postTask(() => validateAll(...), { priority: 'background' });

// Why it's better: each batch ends with a real yield, so the event loop runs a
// microtask checkpoint AND a render opportunity AND pending input between
// batches — no starvation. Batching keeps the yield overhead negligible.`}
      />
    </Stack>
  );
}
