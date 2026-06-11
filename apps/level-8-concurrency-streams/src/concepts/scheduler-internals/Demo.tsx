import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';
import { MiniScheduler, type Priority } from './scheduler';

const COLOR: Record<Priority, string> = {
  'user-blocking': 'red',
  normal: 'indigo',
  low: 'gray',
};

function burn(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    /* busy so the 5ms slice budget actually triggers a yield */
  }
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [order, setOrder] = useState<{ id: string; priority: Priority }[]>([]);
  const [yields, setYields] = useState(0);
  const beatRef = useRef(0);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      beatRef.current += 1;
      setBeat(beatRef.current);
    }, 16);
    return () => clearInterval(id);
  }, []);

  const run = () => {
    clear();
    setOrder([]);
    setYields(0);
    const startBeat = beatRef.current;

    const scheduler = new MiniScheduler(
      (task) => {
        burn(2);
        setOrder((o) => [...o, { id: task.id, priority: task.priority }]);
      },
      (queued) => {
        setYields((y) => y + 1);
        log(`shouldYield() → yielding to the event loop (${queued} task(s) still queued)`, 'macro');
      },
    );

    // Enqueue a batch: priorities map to expiration, soonest-expiring runs first.
    log('posting: normal N1 (4 slices), low L1 (3), user-blocking U1 (3)', 'sync');
    scheduler.post('N1', 'normal', 4);
    scheduler.post('L1', 'low', 3);
    scheduler.post('U1', 'user-blocking', 3);

    // A late high-priority task: it has a NEARER expiration than the running
    // normal task, so it preempts and jumps ahead when the loop next picks.
    setTimeout(() => {
      log('posting late U2 (user-blocking, 2) — nearer expiration, preempts queued normal work', 'sync');
      scheduler.post('U2', 'user-blocking', 2);
    }, 8);

    setTimeout(() => {
      const beats = beatRef.current - startBeat;
      log(`done — heartbeat ticked ${beats}x during the run (loop yielded between slices)`, 'success');
    }, 250);
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="A real cooperative scheduler: min-heap + MessageChannel + 5ms slices">
        Pressing run posts several tasks at different priorities into a min-heap keyed by{' '}
        <i>expiration time</i>. The work loop runs ~5ms slices, then yields via a{' '}
        <code>MessageChannel</code> macrotask so the browser (and the heartbeat below) gets a turn.
        Watch user-blocking tasks run ahead of normal/low, and the late <b>U2</b> preempt queued
        normal work.
      </Callout>

      <Group>
        <Button onClick={run}>Run scheduler</Button>
        <Badge variant="light" color="grape">heartbeat #{beat}</Badge>
        <Badge variant="light" color="orange">yields {yields}</Badge>
      </Group>

      <DemoCard title="Execution order (one chip per slice)">
        {order.length === 0 ? (
          <Text size="sm" c="dimmed">Press run — slices appear in priority/expiration order.</Text>
        ) : (
          <Group gap={4} wrap="wrap">
            {order.map((s, i) => (
              <Badge key={i} size="sm" color={COLOR[s.priority]} variant="filled">
                {s.id}
              </Badge>
            ))}
          </Group>
        )}
      </DemoCard>

      <LogConsole logs={logs} height={170} empty="Run the scheduler to see slicing, yielding, and priority ordering." />
    </Stack>
  );
}
