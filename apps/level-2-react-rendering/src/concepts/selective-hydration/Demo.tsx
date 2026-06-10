import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type Status = 'ssr' | 'interactive';

const SECTIONS = ['Header', 'Sidebar', 'Article', 'Comments', 'Footer'];

/**
 * Pure CSR has no SSR markup to hydrate, so we SIMULATE React's selective
 * hydration scheduler: boundaries hydrate one at a time (low priority), but
 * clicking a not-yet-hydrated boundary bumps it to the front of the queue.
 */
export function Demo() {
  const { logs, log, clear } = useLogger();
  const [status, setStatus] = useState<Status[]>(() => SECTIONS.map(() => 'ssr'));
  const [running, setRunning] = useState(false);
  const queueRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function start() {
    clear();
    setStatus(SECTIONS.map(() => 'ssr'));
    queueRef.current = SECTIONS.map((_, i) => i); // document order
    setRunning(true);
    log('JS loaded. Hydrating boundaries in document order (low priority)…', 'sync');
    timerRef.current = setTimeout(step, 700);
  }

  function step() {
    const next = queueRef.current.shift();
    if (next == null) {
      setRunning(false);
      log('All boundaries hydrated.', 'success');
      return;
    }
    setStatus((prev) => {
      if (prev[next] === 'interactive') return prev; // already done (was prioritized)
      const copy = [...prev];
      copy[next] = 'interactive';
      log(`Hydrated <Suspense> boundary: ${SECTIONS[next]}`, 'success');
      return copy;
    });
    timerRef.current = setTimeout(step, 700);
  }

  function clickSection(i: number) {
    if (status[i] === 'interactive') {
      log(`Click handled by ${SECTIONS[i]} (already interactive)`, 'micro');
      return;
    }
    // Selective hydration: prioritize this boundary, hydrate it NOW, replay the click.
    log(`⚡ Click on un-hydrated ${SECTIONS[i]} → prioritize + hydrate it first, then replay event`, 'macro');
    queueRef.current = [i, ...queueRef.current.filter((x) => x !== i)];
    setStatus((prev) => {
      const copy = [...prev];
      copy[i] = 'interactive';
      return copy;
    });
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Simulation">
        Click <b>Start hydration</b>, then quickly click a section that's still "SSR (inert)".
        React would hydrate that boundary first and replay your click — here we simulate that
        scheduling. Watch the console for the prioritization event.
      </Callout>

      <Callout kind="warning" title="Runtime boundary">
        Real selective hydration requires server-rendered HTML plus Suspense boundaries from
        React's streaming SSR runtime. This Vite workbook is client-rendered, so it cannot perform
        true boundary hydration here. Use this panel to inspect the scheduling rule, then validate
        the real behavior in a streaming SSR app.
      </Callout>

      <DemoCard
        title="Boundaries hydrating independently"
        right={
          <Button size="xs" onClick={start} disabled={running}>
            {running ? 'Hydrating…' : 'Start hydration'}
          </Button>
        }
      >
        <Stack gap="xs">
          {SECTIONS.map((name, i) => {
            const interactive = status[i] === 'interactive';
            return (
              <Paper
                key={name}
                withBorder
                p="sm"
                radius="md"
                onClick={() => clickSection(i)}
                style={{ cursor: 'pointer', opacity: interactive ? 1 : 0.6 }}
              >
                <Group justify="space-between">
                  <Text fw={500}>{name}</Text>
                  <Badge color={interactive ? 'teal' : 'gray'} variant={interactive ? 'filled' : 'light'}>
                    {interactive ? 'interactive' : 'SSR (inert)'}
                  </Badge>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Press Start, then click an inert section." />
    </Stack>
  );
}
