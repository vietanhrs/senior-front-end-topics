import { memo, useEffect, useState, useTransition } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// Each item burns CPU during its RENDER phase (not the commit), so the total
// render is expensive while the DOM stays small — exactly the case time slicing
// can help with.
function HeavyItem({ i }: { i: number }) {
  let x = 0;
  for (let k = 0; k < 350_000; k++) x += Math.sqrt(k + i);
  return (
    <span className="inline-block w-16 border-b border-dashed py-0.5 text-center text-xs">
      {x.toFixed(0).slice(-4)}
    </span>
  );
}

// Memoized so the heartbeat's re-renders don't re-run the heavy work — it only
// re-renders when `count` actually changes.
const HeavyGrid = memo(function HeavyGrid({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: count }, (_, i) => (
        <HeavyItem key={i} i={i} />
      ))}
    </div>
  );
});

/** Independent rAF heartbeat — freezes when the main thread is blocked. */
function Heartbeat() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <Group gap="xs">
      <div
        className="h-4 w-4 rounded-full"
        style={{ background: tick % 2 ? 'var(--mantine-color-teal-5)' : 'var(--mantine-color-teal-9)' }}
      />
      <Text ff="monospace" size="sm">
        frame #{tick}
      </Text>
    </Group>
  );
}

const HEAVY = 140;

export function Demo() {
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<'blocking' | 'sliced'>('blocking');
  const [isPending, startTransition] = useTransition();

  function render() {
    const next = count === 0 ? HEAVY : 0;
    if (mode === 'sliced') {
      startTransition(() => setCount(next)); // interruptible, time-sliced render
    } else {
      setCount(next); // urgent -> one synchronous, blocking render
    }
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Watch the heartbeat while rendering">
        Click "Render heavy tree" in each mode. <b>Blocking</b>: the heartbeat freezes for the
        whole render (one long task). <b>Sliced</b> (transition): the heartbeat keeps ticking
        because React renders in ~5ms slices and yields to the browser between them.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        fullWidth
        data={[
          { label: 'Blocking (urgent setState)', value: 'blocking' },
          { label: 'Time-sliced (startTransition)', value: 'sliced' },
        ]}
      />

      <DemoCard
        title="Heavy render vs the heartbeat"
        right={
          <Group gap="xs">
            <Heartbeat />
            {isPending && (
              <Badge color="orange" variant="light">
                rendering…
              </Badge>
            )}
          </Group>
        }
      >
        <Stack gap="sm">
          <Button onClick={render} w="fit-content">
            {count === 0 ? `Render heavy tree (${HEAVY} CPU-heavy nodes)` : 'Clear'}
          </Button>
          <div className="h-56 overflow-auto rounded-md border p-2">
            <HeavyGrid count={count} />
          </div>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
