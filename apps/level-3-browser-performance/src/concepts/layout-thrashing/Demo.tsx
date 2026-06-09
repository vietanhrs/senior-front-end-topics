import { useRef, useState } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const COUNT = 200;

export function Demo() {
  const { logs, log, clear } = useLogger();
  const containerRef = useRef<HTMLDivElement>(null);

  const [running, setRunning] = useState(false);

  function boxes(): HTMLElement[] {
    return Array.from(containerRef.current?.querySelectorAll<HTMLElement>('[data-box]') ?? []);
  }

  function runThrash() {
    setRunning(true);
    const els = boxes();
    const t0 = performance.now();
    // ❌ Interleaved read/write: each read forces a synchronous layout.
    for (const el of els) {
      const w = el.offsetWidth; // READ — forces reflow because the previous WRITE dirtied layout
      el.style.width = `${w + ((Math.random() * 4) | 0) - 2 + 40}px`; // WRITE — dirties layout again
    }
    const ms = performance.now() - t0;
    log(`THRASH: ${els.length} interleaved read→write = ${ms.toFixed(1)}ms (up to ${els.length} forced reflows)`, 'error');
    setRunning(false);
  }

  function runBatched() {
    setRunning(true);
    const els = boxes();
    const t0 = performance.now();
    // ✔ Read phase, then write phase: at most one layout is forced.
    const widths = els.map((el) => el.offsetWidth); // all READS together
    els.forEach((el, i) => {
      el.style.width = `${widths[i] + ((Math.random() * 4) | 0) - 2 + 40}px`; // all WRITES together
    });
    const ms = performance.now() - t0;
    log(`BATCHED: read-all → write-all = ${ms.toFixed(1)}ms (≈1 forced reflow)`, 'success');
    setRunning(false);
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Measure it yourself">
        Both buttons do the same {COUNT} read+write operations. The thrashing version interleaves
        them (each read forces a reflow); the batched version reads all first, then writes all.
        Run each a few times and compare the milliseconds. Open DevTools → Performance and look for
        the "Forced reflow" warning during the thrash run.
      </Callout>

      <DemoCard
        title={`${COUNT} boxes — interleaved vs batched`}
        right={
          <Group gap="xs">
            <Button size="xs" color="red" onClick={runThrash} disabled={running}>
              Run thrashing
            </Button>
            <Button size="xs" color="teal" onClick={runBatched} disabled={running}>
              Run batched
            </Button>
            <Button size="xs" variant="default" onClick={clear}>
              Clear
            </Button>
          </Group>
        }
      >
        <div ref={containerRef} className="flex max-h-40 flex-wrap gap-1 overflow-hidden rounded-md border p-2">
          {Array.from({ length: COUNT }, (_, i) => (
            <div
              key={i}
              data-box
              className="h-3 rounded-sm"
              style={{ width: 40, background: `hsl(${(i * 7) % 360} 70% 55%)` }}
            />
          ))}
        </div>
        <Text size="xs" c="dimmed" mt="xs">
          The timing gap widens with element count and on slower devices. Same work, very different
          cost — purely because of read/write ordering.
        </Text>
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Run a measurement to compare timings." />
    </Stack>
  );
}
