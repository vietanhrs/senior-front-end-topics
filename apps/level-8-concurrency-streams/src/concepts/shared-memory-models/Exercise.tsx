import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Main thread hands work to a worker through a SharedArrayBuffer, using a plain
// "ready" flag and a busy-wait. It races on the flag, can publish stale data,
// busy-spins (burning CPU), and would freeze the UI if it blocked.

// shared layout: [0]=ready flag, [1]=input, [2]=result
const sab = new SharedArrayBuffer(3 * 4);
const view = new Int32Array(sab);

// main:
function compute(n) {
  view[1] = n;        // write input
  view[0] = 1;        // flip ready (plain store — may be seen before view[1])
  while (view[0] !== 2) {}   // busy-wait on the main thread (freezes UI)
  return view[2];
}

// worker:
function workerLoop(view) {
  while (view[0] !== 1) {}    // busy-wait, plain reads
  view[2] = view[1] * view[1];
  view[0] = 2;                // plain store
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: synchronize correctly with Atomics"
        description="Replace plain flag reads/writes with atomic release/acquire so the input is published before the flag, stop busy-waiting (use wait/notify), and never block the main thread."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Write the input first, then <code>Atomics.store</code> the flag (release) — and read with{' '}
        <code>Atomics.load</code> (acquire). In the <b>worker</b>, block with{' '}
        <code>Atomics.wait</code> instead of spinning, and <code>Atomics.notify</code> when done. On
        the <b>main thread</b> you may not call <code>Atomics.wait</code> — use{' '}
        <code>Atomics.waitAsync</code> (or just <code>await</code> a <code>postMessage</code> reply).
      </Callout>

      <SolutionReveal
        language="js"
        code={`// layout: [0]=state (0=idle,1=request,2=done), [1]=input, [2]=result
const sab = new SharedArrayBuffer(3 * 4);
const view = new Int32Array(sab);

// --- main thread (must NOT block) ---
async function compute(n) {
  Atomics.store(view, 1, n);             // write input
  Atomics.store(view, 0, 1);             // release: publishes the input write
  Atomics.notify(view, 0);               // wake the worker waiting on state

  // Don't busy-wait, and don't Atomics.wait (illegal on main thread):
  const { async, value } = Atomics.waitAsync(view, 0, 1); // wait while state===1
  if (async) await value;                // resolves when the worker sets state=2
  return Atomics.load(view, 2);          // acquire: sees the worker's result
}

// --- worker ---
function workerLoop(view) {
  for (;;) {
    Atomics.wait(view, 0, 0);            // block (futex) until state !== 0 — no CPU spin
    if (Atomics.load(view, 0) !== 1) continue;
    const n = Atomics.load(view, 1);     // acquire: sees the published input
    Atomics.store(view, 2, n * n);       // write result
    Atomics.store(view, 0, 2);           // release: publishes the result
    Atomics.notify(view, 0);             // wake the main thread's waitAsync
  }
}

// Why it's correct:
// • store-release / load-acquire on the flag establish happens-before, so the
//   input/result are visible before the flag is observed — no stale reads.
// • Atomics.wait/notify replace busy-waiting (a futex: the worker sleeps, costs
//   no CPU, wakes on notify).
// • The main thread uses waitAsync (or a postMessage reply) and never blocks the
//   UI. Requires crossOriginIsolated (COOP/COEP) for SharedArrayBuffer.`}
      />
    </Stack>
  );
}
