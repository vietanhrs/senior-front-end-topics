import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A filter button. Clicking it feels frozen for ~400ms: the handler does all the
// work synchronously before the browser can paint the pressed state or results.
function onFilterClick(category) {
  setActive(category);                       // state update (feedback)
  const results = filterAndSortHugeList(items, category); // ~350ms synchronous
  setResults(results);                       // big list re-render
  trackAnalytics('filter', category);        // more sync work in the handler
  // next paint only happens AFTER all of the above → huge INP (processing phase)
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: cut the INP of this interaction"
        description="Everything runs in the handler before the next paint, so the interaction's processing phase (and INP) is ~400ms. Paint cheap feedback first, then get the heavy compute off this task entirely (worker / chunked) — not just wrapped in startTransition."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        INP is measured to the <b>next paint</b>. Commit cheap feedback (<code>setActive</code>)
        urgently, then get the <i>heavy compute itself</i> off this task — a <b>Worker</b> (zero
        blocking) or chunked/yielded work / <code>scheduler.postTask</code>. Note{' '}
        <code>startTransition</code> does <b>not</b> help here: its callback runs <i>synchronously</i>,
        so the 350ms still blocks. And <code>requestAnimationFrame</code>/<code>queueMicrotask</code>{' '}
        both run <i>before</i> the paint — don't put heavy work or analytics there; use{' '}
        <code>sendBeacon</code>/<code>postTask('background')</code>/<code>requestIdleCallback</code>.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`import { startTransition } from 'react';

// ❗ Misconception: startTransition does NOT move synchronous work off the task.
// The function you pass runs SYNCHRONOUSLY; only the state updates it schedules are
// marked non-urgent. So filterAndSortHugeList() inside startTransition would STILL
// block this task and the next paint. You must get the heavy COMPUTE off the task.

// BEST: run the heavy compute in a Worker → zero main-thread blocking.
function onFilterClick(category) {
  setActive(category);                 // urgent feedback → paints on the next frame

  worker.postMessage({ category });
  worker.onmessage = (e) => {
    startTransition(() => setResults(e.data.results)); // now it's just the render
  };

  // analytics: fire-and-forget AFTER paint — never a microtask (runs before paint)
  if (navigator.sendBeacon) navigator.sendBeacon('/track', JSON.stringify({ filter: category }));
  else scheduler.postTask(() => trackAnalytics('filter', category), { priority: 'background' });
}

// NO WORKER? Yield so the feedback paints first, and CHUNK the compute so it isn't
// one long task (a single setTimeout/rAF that runs the 350ms still blocks a frame):
async function onFilterClickNoWorker(category) {
  setActive(category);
  await new Promise((r) => setTimeout(r));            // yield → feedback paints now
  const results = await filterAndSortInChunks(items, category); // yields between chunks
  startTransition(() => setResults(results));
}

// Why INP drops: the interaction's next paint shows only the cheap setActive update,
// so the measured latency is small. The expensive work runs off-thread (worker) or in
// later, chunked tasks — never blocking the paint INP measures. Caveats that matter:
//   • rAF runs BEFORE the next paint → not a place for heavy compute.
//   • queueMicrotask runs in the microtask checkpoint BEFORE paint → not "off the
//     critical path"; use sendBeacon / postTask('background') / requestIdleCallback.
//   • Also helps: useDeferredValue + virtualizing the list so the render is cheap.`}
      />
    </Stack>
  );
}
