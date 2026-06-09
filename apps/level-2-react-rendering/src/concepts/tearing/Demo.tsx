import { useEffect, useState, useSyncExternalStore } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// A mutable value living OUTSIDE React (like a module/global store).
let external = 10;

// A real external store wired correctly for the second card.
const liveStore = (() => {
  let value = 0;
  const listeners = new Set<() => void>();
  return {
    subscribe(cb: () => void) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSnapshot: () => value,
    tick() {
      value += 1;
      listeners.forEach((l) => l());
    },
  };
})();

function LiveReader({ tag }: { tag: string }) {
  const v = useSyncExternalStore(liveStore.subscribe, liveStore.getSnapshot);
  return (
    <Badge size="lg" variant="light">
      {tag}: {v}
    </Badge>
  );
}

export function Demo() {
  const [mode, setMode] = useState<'naive' | 'snapshot'>('naive');
  const [rows, setRows] = useState<number[] | null>(null);

  // Drive the live store so the second card visibly updates.
  useEffect(() => {
    const id = setInterval(() => liveStore.tick(), 600);
    return () => clearInterval(id);
  }, []);

  function simulateRender() {
    // Simulate a time-sliced render of 6 rows. Between row 2 and 3 the render
    // "yields", and the external store mutates during that gap.
    const snapshotAtStart = external;
    const result: number[] = [];
    for (let i = 0; i < 6; i++) {
      if (i === 3) external += 5; // store changes mid-render (the yield gap)
      result.push(mode === 'snapshot' ? snapshotAtStart : external);
    }
    setRows(result);
  }

  function reset() {
    external = 10;
    setRows(null);
  }

  const torn = rows ? new Set(rows).size > 1 : false;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Reproducible simulation">
        We simulate a time-sliced render of 6 rows that all read the same external store. Midway
        through, the store mutates (as it could during a real yield gap). <b>Naive</b> reads the
        live value per row → some rows show the old value, some the new → <b>torn</b>. <b>Snapshot</b>
        reads once at render start → all rows agree.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => {
          setMode(v as typeof mode);
          setRows(null);
        }}
        fullWidth
        data={[
          { label: 'Naive (read live per row) — tears', value: 'naive' },
          { label: 'Snapshot (read once) — safe', value: 'snapshot' },
        ]}
      />

      <DemoCard
        title="Render 6 rows reading one external value"
        right={
          <Group gap="xs">
            <Button size="xs" onClick={simulateRender}>
              Simulate sliced render
            </Button>
            <Button size="xs" variant="default" onClick={reset}>
              Reset
            </Button>
          </Group>
        }
      >
        {rows ? (
          <Stack gap="xs">
            <Group gap="xs">
              {rows.map((v, i) => (
                <Badge key={i} size="lg" color={i >= 3 && mode === 'naive' ? 'red' : 'indigo'} variant="filled">
                  row{i}: {v}
                </Badge>
              ))}
            </Group>
            <Badge color={torn ? 'red' : 'teal'} variant="light" size="lg" w="fit-content">
              {torn ? '✗ TORN — rows disagree within one commit' : '✓ Consistent — all rows agree'}
            </Badge>
          </Stack>
        ) : (
          <Text c="dimmed" size="sm">
            Press "Simulate sliced render".
          </Text>
        )}
      </DemoCard>

      <DemoCard title="The fix, live: useSyncExternalStore keeps readers in sync">
        <Text size="sm" c="dimmed" mb="sm">
          A real external store ticking every 600ms, read by three independent components via{' '}
          <code>useSyncExternalStore</code>. They always show the same value — React guarantees a
          consistent snapshot per commit.
        </Text>
        <Group>
          <LiveReader tag="A" />
          <LiveReader tag="B" />
          <LiveReader tag="C" />
        </Group>
      </DemoCard>
    </Stack>
  );
}
