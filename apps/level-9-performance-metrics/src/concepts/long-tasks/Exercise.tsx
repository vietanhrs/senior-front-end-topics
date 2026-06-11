import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Renders a dashboard on load. It's one giant ~600ms task that blocks the whole
// main thread — no input, no paint — until it finishes. High TBT, high INP.
function bootDashboard(data) {
  const widgets = data.map((d) => buildWidget(d));     // thousands, ~400ms
  const sorted = expensiveSort(widgets);               // ~120ms
  renderAll(sorted);                                   // ~80ms synchronous DOM
  // all of the above runs in ONE task → one ~600ms long task
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: eliminate the long task"
        description="This boot runs as a single ~600ms task (≈550ms of blocking time). Break it up so each task stays under 50ms and the thread can paint + handle input between chunks — or move the heavy compute off-thread."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Chunk the work and <b>yield between chunks</b> (<code>scheduler.yield()</code> or a macrotask)
        so no single task exceeds ~50ms. Better yet, do the pure CPU work (building/sorting) in a{' '}
        <b>Web Worker</b> and only touch the DOM on the main thread, in batches. Prioritize what the
        user sees first.
      </Callout>

      <SolutionReveal
        language="js"
        code={`const yieldToLoop =
  'scheduler' in globalThis && 'yield' in scheduler
    ? () => scheduler.yield()
    : () => new Promise((r) => setTimeout(r));

async function bootDashboard(data) {
  // 1) Build in yielding batches so each task stays well under 50ms.
  const widgets = [];
  const BATCH = 100;
  for (let i = 0; i < data.length; i += BATCH) {
    for (let j = i; j < Math.min(i + BATCH, data.length); j++) {
      widgets.push(buildWidget(data[j]));
    }
    await yieldToLoop();          // ends the task → input/paint can happen
  }

  // 2) Heavy pure compute → off the main thread entirely.
  const sorted = await runInWorker('expensiveSort', widgets);

  // 3) Render in chunks too (or virtualize so only visible rows render).
  for (let i = 0; i < sorted.length; i += BATCH) {
    renderChunk(sorted.slice(i, i + BATCH));
    await yieldToLoop();
  }
}

// Best of all: render the above-the-fold widgets first (urgent), defer the rest;
// virtualize long lists so render cost is bounded regardless of data size.

// Why it's better: the work is the same, but no single task exceeds ~50ms, so
// there are NO long tasks → TBT ≈ 0 and input/animation stay responsive during
// boot. The sort no longer blocks the thread at all (it's in a worker).`}
      />
    </Stack>
  );
}
