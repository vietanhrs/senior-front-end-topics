import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

const HWM = 10; // high-water mark
const PRODUCE_MS = 40; // fast producer: a chunk every 40ms
const CONSUME_MS = 200; // slow consumer: drains one chunk every 200ms
const TOTAL = 60;

type Mode = 'firehose' | 'backpressure';

export function Demo() {
  const [mode, setMode] = useState<Mode>('firehose');
  const [queue, setQueue] = useState(0);
  const [produced, setProduced] = useState(0);
  const [consumed, setConsumed] = useState(0);
  const [running, setRunning] = useState(false);
  const [peak, setPeak] = useState(0);
  const stopRef = useRef(false);

  useEffect(() => () => { stopRef.current = true; }, []);

  async function run() {
    stopRef.current = false;
    setQueue(0); setProduced(0); setConsumed(0); setPeak(0);
    setRunning(true);

    let q = 0, p = 0, c = 0, pk = 0;
    const sync = () => { setQueue(q); setProduced(p); setConsumed(c); setPeak(pk); };

    // Consumer: drains one chunk per CONSUME_MS regardless of mode.
    const consumer = (async () => {
      while (!stopRef.current && c < TOTAL) {
        await new Promise((r) => setTimeout(r, CONSUME_MS));
        if (q > 0) { q -= 1; c += 1; pk = Math.max(pk, q); sync(); }
      }
    })();

    // Producer
    const producer = (async () => {
      while (!stopRef.current && p < TOTAL) {
        if (mode === 'backpressure') {
          // Respect desiredSize: don't enqueue while the queue is at the HWM.
          while (!stopRef.current && q >= HWM) await new Promise((r) => setTimeout(r, 25));
        }
        await new Promise((r) => setTimeout(r, PRODUCE_MS));
        q += 1; p += 1; pk = Math.max(pk, q); sync();
      }
    })();

    await Promise.all([producer, consumer]);
    setRunning(false);
  }

  const overHwm = queue > HWM;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Fast producer (40ms/chunk) vs slow consumer (200ms/chunk)">
        <b>Firehose</b>: the producer enqueues regardless — watch the queue grow ~unbounded (this is
        the memory blow-up). <b>Backpressure</b>: the producer checks <code>desiredSize</code> and
        pauses when the queue hits the high-water mark ({HWM}) — the queue stays bounded and the
        slow consumer paces the whole pipeline (what <code>await writer.ready</code> /{' '}
        <code>pull()</code> give you for free).
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        fullWidth
        data={[
          { label: 'Firehose (ignore desiredSize)', value: 'firehose' },
          { label: `Backpressure (HWM = ${HWM})`, value: 'backpressure' },
        ]}
      />

      <DemoCard
        title="The internal queue"
        right={
          <Group gap="xs">
            <Badge variant="light">produced {produced}/{TOTAL}</Badge>
            <Badge variant="light">consumed {consumed}/{TOTAL}</Badge>
            <Badge color={overHwm ? 'red' : 'teal'} variant="filled">
              queue: {queue} (peak {peak})
            </Badge>
            <Button size="xs" onClick={run} disabled={running}>
              {running ? 'Running…' : 'Run'}
            </Button>
          </Group>
        }
      >
        <div className="relative h-8 w-full overflow-hidden rounded-md border">
          {/* HWM marker */}
          <div
            className="absolute top-0 h-full border-l-2 border-dashed"
            style={{ left: `${(HWM / TOTAL) * 100}%`, borderColor: 'var(--mantine-color-orange-6)' }}
            title={`high-water mark = ${HWM}`}
          />
          <div
            className="h-full"
            style={{
              width: `${(queue / TOTAL) * 100}%`,
              background: overHwm ? 'var(--mantine-color-red-6)' : 'var(--mantine-color-indigo-5)',
              transition: 'width 80ms linear, background 200ms',
            }}
          />
        </div>
        <Text size="xs" c="dimmed" mt="xs">
          Orange dashed line = high-water mark ({HWM} chunks). In firehose mode the bar blows past
          it (each excess chunk is memory you're holding); with backpressure it never exceeds it.
        </Text>
      </DemoCard>
    </Stack>
  );
}
