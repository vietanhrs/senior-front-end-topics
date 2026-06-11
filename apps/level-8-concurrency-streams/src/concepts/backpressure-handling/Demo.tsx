import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Progress, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const HWM = 4;
const CONSUMER_MS = 360; // slow consumer
const PUSH_MS = 120; // fast producer (push mode only)
const RUN_MS = 3200;

interface Stats {
  mode: string;
  produced: number;
  consumed: number;
  buffered: number;
  desired: number;
}

const ZERO: Stats = { mode: '', produced: 0, consumed: 0, buffered: 0, desired: HWM };

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [stats, setStats] = useState<Stats>(ZERO);
  const stopRef = useRef<(() => void) | null>(null);

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
  };
  useEffect(() => () => stop(), []);

  const run = (mode: 'push' | 'pull') => {
    stop();
    clear();
    setStats({ ...ZERO, mode });
    let produced = 0;
    let consumed = 0;
    let active = true;
    let lastDesired = HWM;
    let timer: ReturnType<typeof setInterval> | undefined;

    const sync = (desired: number) => {
      lastDesired = desired;
      setStats({ mode, produced, consumed, buffered: produced - consumed, desired });
    };

    const strategy = new CountQueuingStrategy({ highWaterMark: HWM });
    const stream =
      mode === 'push'
        ? new ReadableStream<number>(
            {
              start(controller) {
                // Push regardless of demand — ignores desiredSize → unbounded backlog.
                timer = setInterval(() => {
                  produced += 1;
                  controller.enqueue(produced);
                  sync(controller.desiredSize ?? 0);
                }, PUSH_MS);
              },
            },
            strategy,
          )
        : new ReadableStream<number>(
            {
              // Pull is called only while desiredSize > 0 → throttled to the reader.
              pull(controller) {
                produced += 1;
                controller.enqueue(produced);
                sync(controller.desiredSize ?? 0);
              },
            },
            strategy,
          );

    const reader = stream.getReader();
    log(`${mode}: producer started, slow consumer reads every ${CONSUMER_MS}ms (highWaterMark=${HWM})`, 'sync');

    (async () => {
      while (active) {
        const { value, done } = await reader.read();
        if (done || value === undefined) break;
        await delay(CONSUMER_MS); // slow processing
        consumed += 1;
        setStats((s) => ({ ...s, consumed, buffered: produced - consumed }));
      }
    })().catch(() => {});

    stopRef.current = () => {
      active = false;
      if (timer) clearInterval(timer);
      reader.cancel().catch(() => {});
    };

    setTimeout(() => {
      if (!active) return;
      const backlog = produced - consumed;
      if (mode === 'push') {
        log(`push: produced ${produced}, consumed ${consumed} → backlog ${backlog}, desiredSize went to ${lastDesired} — queue grows unbounded`, 'error');
        log('a push source must check desiredSize and pause when it hits 0', 'macro');
      } else {
        log(`pull: produced ${produced}, consumed ${consumed} → backlog stayed ≤ ${HWM} — producer throttled to the consumer`, 'success');
      }
      stop();
    }, RUN_MS);
  };

  const overHwm = stats.buffered > HWM;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Fast producer, slow consumer — with and without backpressure">
        Both runs read one item every {CONSUMER_MS}ms. <b>Push</b> enqueues every {PUSH_MS}ms
        ignoring demand, so the buffer (and negative <code>desiredSize</code>) grows without bound.{' '}
        <b>Pull</b> only produces when the stream asks (queue below the high-water mark of {HWM}), so
        the producer is automatically throttled to the consumer.
      </Callout>

      <Group>
        <Button color="red" onClick={() => run('push')}>Run push (no backpressure)</Button>
        <Button color="teal" onClick={() => run('pull')}>Run pull (backpressure)</Button>
        <Button variant="subtle" onClick={stop}>Stop</Button>
      </Group>

      <DemoCard title={`Live stats${stats.mode ? ` · ${stats.mode}` : ''}`}>
        <Stack gap="xs">
          <Group>
            <Badge variant="light" color="blue">produced {stats.produced}</Badge>
            <Badge variant="light" color="teal">consumed {stats.consumed}</Badge>
            <Badge variant="light" color={overHwm ? 'red' : 'grape'}>buffered {stats.buffered}</Badge>
            <Badge variant="light" color={stats.desired < 0 ? 'red' : 'gray'}>desiredSize {stats.desired}</Badge>
          </Group>
          <div>
            <Text size="xs" c="dimmed" mb={2}>buffer vs high-water mark</Text>
            <Progress
              value={Math.min(100, (stats.buffered / (HWM * 3)) * 100)}
              color={overHwm ? 'red' : 'teal'}
            />
          </div>
        </Stack>
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Run each mode and watch the buffer." />
    </Stack>
  );
}
