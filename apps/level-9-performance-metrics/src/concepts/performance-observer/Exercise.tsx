import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Collects field metrics, but it's fragile: it polls, misses early entries,
// throws on browsers lacking a type, and loses data on page unload.
function collectMetrics() {
  // polling — misses entries that came and went between ticks
  setInterval(() => {
    const lcp = performance.getEntriesByType('largest-contentful-paint');
    const cls = performance.getEntriesByType('layout-shift');
    send({ lcp, cls });
  }, 1000);

  // observing multiple types AND expecting buffered (won't work together);
  // also throws if 'event' isn't supported
  new PerformanceObserver((list) => send(list.getEntries()))
    .observe({ entryTypes: ['event', 'longtask'], buffered: true });
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: collect metrics robustly"
        description="Stop polling, stop missing pre-observer entries, feature-detect before observing, and flush pending entries before the page goes away."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Use one observer per type with <code>{'{ type, buffered: true }'}</code> (the{' '}
        <code>entryTypes</code> form ignores <code>buffered</code>). Guard each with{' '}
        <code>supportedEntryTypes</code>. Don't poll. Flush with <code>takeRecords()</code> on{' '}
        <code>visibilitychange → hidden</code> (the reliable "page going away" signal) using{' '}
        <code>sendBeacon</code>.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function collectMetrics() {
  const supported = PerformanceObserver.supportedEntryTypes ?? [];
  const observers = [];

  function watch(type, handle) {
    if (!supported.includes(type)) return;     // feature-detect, don't throw
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) handle(entry);
    });
    po.observe({ type, buffered: true });        // single type → buffered works
    observers.push(po);
  }

  watch('largest-contentful-paint', (e) => queue('LCP', e.startTime));
  watch('layout-shift', (e) => { if (!e.hadRecentInput) queue('CLS', e.value); });
  watch('event', (e) => { if (e.interactionId) queue('INP', e.duration); });
  watch('longtask', (e) => queue('longtask', e.duration));

  // Flush reliably when the page is backgrounded/closed (more reliable than
  // 'unload'/'beforeunload', which don't fire on mobile). Drain pending entries
  // synchronously with takeRecords() so nothing in the buffer is lost.
  const flush = () => {
    if (document.visibilityState !== 'hidden') return;
    for (const po of observers) po.takeRecords().forEach(/* queue */);
    navigator.sendBeacon('/metrics', JSON.stringify(drainQueue()));
  };
  addEventListener('visibilitychange', flush);

  // In real apps just use the web-vitals library, which does all of this
  // (buffering, attribution, the FID→INP migration, beacon flushing) for you.
}

// Why it's better: push-based (no polling, no missed entries), buffered:true
// replays pre-observer load entries, each type is feature-detected so it never
// throws, and takeRecords()+sendBeacon on visibility-hidden flushes the last
// batch even as the page unloads.`}
      />
    </Stack>
  );
}
