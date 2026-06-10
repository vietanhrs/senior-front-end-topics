import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A pool of workers increments a shared counter and the main thread reads a
// "progress" value. Two problems: (1) SharedArrayBuffer is undefined at runtime,
// (2) the increment races and the final count is wrong. Fix both.

// main.ts
const sab = new SharedArrayBuffer(8);          // ❌ throws: SharedArrayBuffer is not defined
const counter = new Int32Array(sab);
workers.forEach((w) => w.postMessage({ sab }));

// worker.ts
self.onmessage = ({ data }) => {
  const counter = new Int32Array(data.sab);
  for (let i = 0; i < 100_000; i++) {
    counter[0] = counter[0] + 1;               // ❌ non-atomic read-modify-write → lost updates
  }
  // main thread also wants to BLOCK-wait until all workers finish (how?)
};`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the shared counter available and correct"
        description="Enable the context so SharedArrayBuffer exists, make the increment atomic, and coordinate completion. Note where Atomics.wait may and may not be used."
      >
        <CodeHighlight code={buggy} language="ts" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        SAB needs cross-origin isolation (COOP/COEP response headers). Replace the racy{' '}
        <code>counter[0] = counter[0] + 1</code> with <code>Atomics.add</code>. Use a second slot +{' '}
        <code>Atomics.add</code>/<code>notify</code> for "workers done", and remember{' '}
        <code>Atomics.wait</code> is worker-only (main thread uses <code>waitAsync</code>).
      </Callout>

      <SolutionReveal
        language="ts"
        code={`// 1) Serve the document cross-origin isolated so SharedArrayBuffer exists:
//    Cross-Origin-Opener-Policy: same-origin
//    Cross-Origin-Embedder-Policy: require-corp   (cross-origin subresources must send CORP/CORS)
//    Then self.crossOriginIsolated === true and 'SharedArrayBuffer' in self.
if (!crossOriginIsolated) throw new Error('not cross-origin isolated — SAB unavailable');

// main.ts
const sab = new SharedArrayBuffer(8);
const view = new Int32Array(sab);     // [0] = counter, [1] = workers-done
const DONE = 1, COUNT = 0;
workers.forEach((w) => w.postMessage({ sab }));

// Wait for all N workers WITHOUT blocking the UI thread:
const { value } = Atomics.waitAsync(view, DONE, 0); // main thread → async variant
Promise.resolve(value).then(() => {
  console.log('final count =', Atomics.load(view, COUNT)); // exact, no lost updates
});

// worker.ts
self.onmessage = ({ data }) => {
  const view = new Int32Array(data.sab);
  for (let i = 0; i < 100_000; i++) {
    Atomics.add(view, 0, 1);          // ✅ atomic read-modify-write
  }
  // signal completion: bump the done-counter and wake any waiters
  Atomics.add(view, 1, 1);
  Atomics.notify(view, 1);
  // (a worker that needed to block could use Atomics.wait(view, 1, X) — main thread cannot)
};

// Note: if you don't actually need shared mutable state, postMessage with a
// Transferable result is simpler than SAB — see the next concept.`}
      />
    </Stack>
  );
}
