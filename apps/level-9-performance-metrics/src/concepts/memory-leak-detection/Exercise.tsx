import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A chart widget. Every time it mounts it leaks: a listener, an interval, a
// detached node reference, and an ever-growing cache. Revisiting the route a few
// times bloats memory and the page slows down.
const tooltipCache = new Map();           // keyed by element, never cleared

function ChartWidget({ id, data }) {
  useEffect(() => {
    const el = document.getElementById('chart-' + id);
    window.addEventListener('resize', () => redraw(el));   // never removed
    setInterval(() => poll(id), 5000);                     // never cleared
    tooltipCache.set(el, buildTooltips(data));             // grows forever, holds el
    // no cleanup returned
  }, [id, data]);

  return <canvas id={'chart-' + id} />;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: plug every leak in this widget"
        description="There are four: a never-removed resize listener, an uncleared interval, an unbounded cache that also retains DOM nodes, and a missing effect cleanup. Fix them so repeated mounts don't grow memory."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Return a cleanup from the effect that removes the listener and clears the interval (keep named
        references so you <i>can</i> remove them — an inline arrow can't be removed). Replace the
        unbounded <code>Map</code> keyed by elements with a <code>WeakMap</code> (entries die with the
        node) or a bounded LRU. Use the ref instead of <code>getElementById</code>.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`// WeakMap: entries are GC'd automatically when the key element is gone → no leak.
const tooltipCache = new WeakMap();

function ChartWidget({ id, data }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // named handlers so they can actually be removed
    const onResize = () => redraw(el);
    window.addEventListener('resize', onResize);

    const intervalId = setInterval(() => poll(id), 5000);

    tooltipCache.set(el, buildTooltips(data)); // WeakMap → released with el

    return () => {                              // THE FIX: clean up on unmount
      window.removeEventListener('resize', onResize);
      clearInterval(intervalId);
      // no need to delete from a WeakMap; it clears itself when el is collected
    };
  }, [id, data]);

  return <canvas ref={ref} />;
}

// If you truly need a strong cache, bound it (simple LRU):
//   if (cache.size >= MAX) cache.delete(cache.keys().next().value);
//   cache.set(key, value);

// Verify with DevTools: Performance Monitor (listener count + JS heap should stay
// flat across remounts), or a 3-snapshot heap comparison filtered by "Detached".

// Why it's fixed: every per-mount resource (listener, timer) is released on
// unmount, the cache no longer pins DOM nodes (WeakMap) and can't grow without
// bound, so repeated mounts/unmounts return to a steady-state heap.`}
      />
    </Stack>
  );
}
