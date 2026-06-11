import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

interface TaskEntry {
  id: number;
  duration: number;
  blocking: number;
  startTime: number;
}

const supported =
  typeof PerformanceObserver !== 'undefined' &&
  PerformanceObserver.supportedEntryTypes?.includes('longtask');

const block = (ms: number) => {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    /* hold the main thread */
  }
};

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [tasks, setTasks] = useState<TaskEntry[]>([]);
  const [tbt, setTbt] = useState(0);
  const idRef = useRef(0);

  useEffect(() => {
    if (!supported) return;
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const blocking = Math.max(0, e.duration - 50);
        setTasks((prev) => [{ id: idRef.current++, duration: e.duration, blocking, startTime: e.startTime }, ...prev].slice(0, 12));
        setTbt((t) => t + blocking);
        log(`longtask: ${e.duration.toFixed(0)}ms (blocking ${blocking.toFixed(0)}ms)`, 'error');
      }
    });
    po.observe({ type: 'longtask', buffered: true });
    return () => po.disconnect();
  }, [log]);

  const oneLongTask = () => {
    log('running ONE 300ms synchronous task…', 'macro');
    block(300); // → a single longtask (~300ms, 250ms blocking)
  };

  const chunked = async () => {
    log('running the same ~300ms work as 8×38ms chunks, yielding between…', 'macro');
    for (let i = 0; i < 8; i++) {
      block(38); // each task < 50ms → NOT a long task
      await new Promise((r) => setTimeout(r, 0)); // yield: ends the task
    }
    log('done — no long tasks recorded (each chunk stayed under 50ms)', 'success');
  };

  const reset = () => {
    setTasks([]);
    setTbt(0);
    clear();
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="Same work, very different blocking">
        Both buttons do ~300ms of work. <b>One long task</b> blocks the thread in a single 300ms
        stretch → a <code>longtask</code> entry with ~250ms of blocking time. <b>Chunked + yielding</b>{' '}
        splits it into sub-50ms tasks → <b>zero</b> long tasks and zero blocking time, even though the
        total CPU is identical.
      </Callout>

      {!supported && (
        <Callout kind="warning" title="longtask unsupported">
          This engine doesn't expose <code>longtask</code> entries; the table won't populate here.
          The theory and exercise still apply.
        </Callout>
      )}

      <Group>
        <Button color="red" onClick={oneLongTask}>One 300ms task</Button>
        <Button color="teal" onClick={chunked}>Chunked + yielding (8×38ms)</Button>
        <Button variant="subtle" onClick={reset}>Reset</Button>
        <Badge size="lg" variant="light" color={tbt > 0 ? 'red' : 'teal'}>
          total blocking time {tbt.toFixed(0)}ms
        </Badge>
      </Group>

      <DemoCard title="Recorded long tasks (> 50ms)">
        {tasks.length === 0 ? (
          <Text size="sm" c="dimmed">No long tasks yet — try each button and compare.</Text>
        ) : (
          <Table withRowBorders={false}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>duration</Table.Th>
                <Table.Th>blocking (dur − 50)</Table.Th>
                <Table.Th>start</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tasks.map((t) => (
                <Table.Tr key={t.id}>
                  <Table.Td><Badge color="red" variant="light">{t.duration.toFixed(0)}ms</Badge></Table.Td>
                  <Table.Td>{t.blocking.toFixed(0)}ms</Table.Td>
                  <Table.Td><Text size="xs" c="dimmed">{t.startTime.toFixed(0)}ms</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </DemoCard>

      <LogConsole logs={logs} height={140} empty="Run each button and watch long tasks (or the lack of them)." />
    </Stack>
  );
}
