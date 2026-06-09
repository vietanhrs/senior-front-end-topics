import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `let analyticsSent = 0;

function Chart({ data, sessionId }) {
  // (1) Side effect in the RENDER phase. Under concurrent React / StrictMode
  //     this can run multiple times or be discarded before commit -> double or
  //     phantom analytics events.
  analyticsSent += 1;
  track('chart_viewed', { sessionId });

  // (2) Mutating a prop/object during render (impure).
  data.lastViewedAt = Date.now();

  return <svg>{/* ...render bars... */}</svg>;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: move side effects out of the render phase"
        description="The render phase must be pure — it may run multiple times or be thrown away before commit. Identify the two impurities and move them to where side effects belong (the commit phase / event handlers)."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Anything observable from the outside (analytics, mutation, DOM writes, timers) belongs in
        an effect (commit phase) or an event handler — never in the component body, a render-time
        <code>useMemo</code>, or a state initializer.
      </Callout>

      <SolutionReveal
        code={`function Chart({ data, sessionId }) {
  // Fire the analytics event once per commit, as a passive effect.
  useEffect(() => {
    track('chart_viewed', { sessionId });
  }, [sessionId]);

  // Don't mutate props. Derive what you need purely, or store metadata
  // in your own state/store via an effect — not during render.
  const viewedAt = useMemo(() => Date.now(), [data]);

  return <svg data-viewed-at={viewedAt}>{/* ...render bars... */}</svg>;
}

// Why: the render phase is interruptible. React may call Chart() several times
// (or abandon a render entirely) before committing. Only the commit phase is
// guaranteed to run exactly once and is where the DOM/refs/effects are real.`}
      />
    </Stack>
  );
}
