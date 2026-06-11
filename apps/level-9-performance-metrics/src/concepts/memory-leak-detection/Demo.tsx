import { useState } from 'react';
import { Button, Group, Progress, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

// A module-level array = a real "unintended reference" that keeps allocations
// (and detached DOM) reachable, exactly like a leak. Reset releases them for GC.
const retained: { buffer: Uint8Array; node: HTMLElement }[] = [];
const CHUNK_BYTES = 512 * 1024; // 0.5MB per leaked cycle

interface HeapInfo {
  used: number;
  limit: number;
}

function readHeap(): HeapInfo | null {
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  if (!mem) return null;
  return { used: mem.usedJSHeapSize, limit: mem.jsHeapSizeLimit };
}

const measureSupported =
  typeof (performance as Performance & { measureUserAgentSpecificMemory?: unknown }).measureUserAgentSpecificMemory ===
  'function';

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [count, setCount] = useState(0);
  const [listeners, setListeners] = useState(0); // simulated active listeners/timers
  const [heap, setHeap] = useState<HeapInfo | null>(() => readHeap());

  const makeWidget = () => {
    // a detached DOM subtree + a big buffer — the kind of thing a leaky
    // "mount" allocates.
    const node = document.createElement('div');
    for (let i = 0; i < 200; i++) node.appendChild(document.createElement('span'));
    return { buffer: new Uint8Array(CHUNK_BYTES), node };
  };

  const leakCycle = () => {
    // mount + "unmount" a widget but KEEP references (no cleanup) → leak.
    retained.push(makeWidget());
    setCount(retained.length);
    setListeners((n) => n + 1); // a listener/timer we "forgot" to remove
    setHeap(readHeap());
    log(`leaky mount/unmount: retained ${retained.length} widgets (~${((retained.length * CHUNK_BYTES) / 1048576).toFixed(1)}MB), +1 uncleaned listener`, 'error');
  };

  const cleanCycle = () => {
    // mount + unmount, but release everything → nothing retained.
    const w = makeWidget();
    void w; // used briefly, then dropped — no reference kept, no listener left
    setHeap(readHeap());
    log('clean mount/unmount: widget + buffer dropped, listener removed → retained unchanged', 'success');
  };

  const reset = () => {
    retained.length = 0; // release references → eligible for GC
    setCount(0);
    setListeners(0);
    setHeap(readHeap());
    log('released all references — the retained objects can now be garbage-collected', 'macro');
  };

  const retainedMb = (count * CHUNK_BYTES) / 1048576;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Leak vs clean: watch the retained count climb">
        Each <b>leaky cycle</b> mounts and "unmounts" a widget (a detached DOM subtree + a 0.5MB
        buffer) but keeps a module-level reference and a forgotten listener — so it's never collected.
        The <b>clean cycle</b> does the same work but drops every reference. Repeat each and compare:
        leaky grows without bound; clean stays flat. (Reset releases everything for GC.)
      </Callout>

      <Group>
        <Button color="red" onClick={leakCycle}>Leaky cycle</Button>
        <Button color="teal" onClick={cleanCycle}>Clean cycle</Button>
        <Button variant="subtle" onClick={() => { reset(); clear(); }}>Reset (release refs)</Button>
      </Group>

      <Group grow>
        <DemoCard title="Retained by the leak">
          <Group>
            <Text size="xl" fw={700}>{count}</Text>
            <Text size="sm" c="dimmed">widgets · ~{retainedMb.toFixed(1)}MB · {listeners} uncleaned listeners</Text>
          </Group>
        </DemoCard>
        <DemoCard title="JS heap (performance.memory)">
          {heap ? (
            <Stack gap={4}>
              <Text size="sm">
                {(heap.used / 1048576).toFixed(1)}MB used / {(heap.limit / 1048576).toFixed(0)}MB limit
              </Text>
              <Progress value={(heap.used / heap.limit) * 100} color="grape" />
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              performance.memory unavailable here.{' '}
              {measureSupported
                ? 'measureUserAgentSpecificMemory() exists (needs cross-origin isolation).'
                : 'Use DevTools → Memory snapshots / Performance Monitor.'}
            </Text>
          )}
        </DemoCard>
      </Group>

      <LogConsole logs={logs} height={150} empty="Run leaky vs clean cycles and watch what's retained." />
    </Stack>
  );
}
