import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const startingPoint = `new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    sendToRUM({
      duration: entry.duration
    });
  }
}).observe({ type: 'long-animation-frame', buffered: true });`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make LoAF telemetry actionable"
        description="The observer only reports total frame duration. Enrich the payload so production telemetry can identify blocking severity and the script most responsible for the frame."
      >
        <CodeHighlight code={startingPoint} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="What should the telemetry answer?">
        Capture <code>blockingDuration</code>, then inspect <code>scripts</code> and keep the most
        expensive script's source URL/function. Do not assume attribution always exists: cross-origin
        frames, extensions, workers, and browser limitations can leave gaps.
      </Callout>

      <SolutionReveal
        language="js"
        code={`new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const topScript = [...entry.scripts]
      .sort((a, b) => b.duration - a.duration)[0];

    sendToRUM({
      duration: entry.duration,
      blockingDuration: entry.blockingDuration,
      renderStart: entry.renderStart,
      styleAndLayoutStart: entry.styleAndLayoutStart,
      script: topScript
        ? {
            duration: topScript.duration,
            sourceURL: topScript.sourceURL,
            sourceFunctionName: topScript.sourceFunctionName,
            forcedStyleAndLayoutDuration:
              topScript.forcedStyleAndLayoutDuration
          }
        : null
    });
  }
}).observe({
  type: 'long-animation-frame',
  buffered: true
});

// In production:
// - sample before sending high-volume telemetry;
// - aggregate by route/release/script;
// - correlate with INP instead of treating LoAF count as a user metric;
// - feature-detect because browser support is not universal.`}
      />
    </Stack>
  );
}
