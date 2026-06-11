import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Tries to report FID, but it's wrong in several ways and also CAUSES bad FID.
// (1) measures the wrong delta, (2) misses the entry if it already fired,
// (3) runs a giant blocking task during boot that inflates real FID.
function trackFID() {
  // huge synchronous init on the main thread during startup
  buildEntireAppState();           // ~400ms blocking — delays first input!

  new PerformanceObserver((list) => {
    const entry = list.getEntries()[0];
    const fid = entry.duration;     // wrong: duration isn't the input delay
    sendToAnalytics('FID', fid);
  }).observe({ type: 'first-input' });  // no buffered → may miss the only entry
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: measure FID correctly — and stop causing it"
        description="The observer computes the wrong value, can miss the single first-input entry, and the boot-time blocking work is itself the reason FID is bad. Fix the measurement and remove the cause."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        FID = <code>processingStart − startTime</code> (the delay), not <code>duration</code>. Use{' '}
        <code>buffered: true</code> so you still get the entry if it fired before your observer
        registered. And the real win is breaking up that boot task so the main thread can dispatch the
        first input promptly (yield / defer / off-thread).
      </Callout>

      <SolutionReveal
        language="js"
        code={`function trackFID() {
  // (3) Don't monopolize the main thread during boot. Break the init into yielding
  // chunks (or move it to a worker / defer it) so the FIRST input isn't queued.
  scheduleInitInChunks(buildEntireAppState);   // yields between chunks

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = entry.processingStart - entry.startTime; // (1) the input DELAY
      sendToAnalytics('FID', fid);
    }
  }).observe({ type: 'first-input', buffered: true });     // (2) catch it even if early
}

// In real apps, don't hand-roll this — use the web-vitals library, which handles
// buffering, the FID→INP transition, and reporting:
//   import { onFID, onINP } from 'web-vitals';
//   onFID((m) => sendToAnalytics('FID', m.value));   // m.value already = the delay
//   onINP((m) => sendToAnalytics('INP', m.value));   // prefer INP going forward

// Why it's better: the metric is the actual input delay (processingStart−startTime),
// buffered:true guarantees the single first-input entry isn't missed, and chunking
// the boot work means the main thread is free to start the first interaction fast —
// fixing the number AND the underlying experience.`}
      />
    </Stack>
  );
}
