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
        description="Everything runs in the handler before the next paint, so the interaction's processing phase (and INP) is ~400ms. Paint feedback fast, and get the heavy work off the critical path to the next frame."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        INP is measured to the <b>next paint</b>. So commit the cheap visual feedback urgently, then
        defer the expensive filter/render so it doesn't block that paint — <code>startTransition</code>{' '}
        (mark the heavy state update non-urgent) and/or yield with{' '}
        <code>requestAnimationFrame</code>/<code>scheduler.yield()</code>. Move fire-and-forget work
        (analytics) out of the critical path entirely.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`import { startTransition } from 'react';

function onFilterClick(category) {
  // 1) URGENT: cheap feedback that paints on the very next frame → low INP.
  setActive(category);

  // 2) NON-URGENT: the heavy filter + big list render is a transition, so React
  //    can paint the pressed state first and render results at lower priority.
  startTransition(() => {
    const results = filterAndSortHugeList(items, category);
    setResults(results);
  });

  // 3) Off the critical path: don't run analytics synchronously in the handler.
  queueMicrotask(() => trackAnalytics('filter', category));
  // or: scheduler.postTask(() => trackAnalytics(...), { priority: 'background' });
}

// If the heavy compute is pure, also consider:
//   - useDeferredValue(category) to drive the list off a deferred value
//   - memoizing/virtualizing the list so the render itself is cheap
//   - doing filterAndSortHugeList in a Worker and posting results back

// Why INP drops: the interaction now reaches its next paint after only the tiny
// setActive update; the expensive work renders afterward at low priority and the
// analytics call no longer sits in the interaction's processing window. The
// measured phases shrink: small processing, small presentation → good INP.`}
      />
    </Stack>
  );
}
