import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Slider, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface Interaction {
  type: string;
  inputDelay: number;
  processing: number;
  presentation: number;
  duration: number;
}

function rate(ms: number) {
  if (ms <= 200) return { label: 'good', color: 'teal' };
  if (ms <= 500) return { label: 'needs improvement', color: 'orange' };
  return { label: 'poor', color: 'red' };
}

const supported =
  typeof PerformanceObserver !== 'undefined' &&
  PerformanceObserver.supportedEntryTypes?.includes('event');

export function Demo() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [inp, setInp] = useState(0);
  const blockRef = useRef(0);
  const [block, setBlock] = useState(0);

  useEffect(() => {
    if (!supported) return;
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEventTiming & { interactionId?: number })[]) {
        if (!e.interactionId) continue; // only true interactions
        const inputDelay = e.processingStart - e.startTime;
        const processing = e.processingEnd - e.processingStart;
        const presentation = e.startTime + e.duration - e.processingEnd;
        const rec: Interaction = {
          type: e.name,
          inputDelay,
          processing,
          presentation,
          duration: e.duration,
        };
        setInteractions((prev) => [rec, ...prev].slice(0, 8));
        setInp((cur) => Math.max(cur, e.duration)); // simplified INP = worst interaction
      }
    });
    po.observe({ type: 'event', durationThreshold: 16, buffered: true } as PerformanceObserverInit & { durationThreshold: number });
    return () => po.disconnect();
  }, []);

  // A handler that deliberately blocks (inflates the "processing" phase).
  const onSlowClick = () => {
    const end = performance.now() + blockRef.current;
    while (performance.now() < end) {
      /* block the main thread inside the handler */
    }
  };

  const r = rate(inp);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Click the buttons and watch the interaction latency break down">
        A real <code>PerformanceObserver</code> on <code>event</code> entries records each
        interaction's <b>input delay + processing + presentation</b>. Drag the slider to make the
        slow button's handler block, then click it: processing balloons and the page INP (the worst
        interaction) climbs out of the green.
      </Callout>

      {!supported && (
        <Callout kind="warning" title="Event Timing unsupported">
          This engine doesn't expose <code>event</code> timing entries, so latencies can't be
          measured live here. The phases and code in the theory still apply.
        </Callout>
      )}

      <DemoCard title="Slow handler block time">
        <Slider
          min={0}
          max={600}
          step={20}
          value={block}
          onChange={(v) => { setBlock(v); blockRef.current = v; }}
          marks={[
            { value: 0, label: '0ms' },
            { value: 200, label: '200ms' },
            { value: 400, label: '400ms' },
            { value: 600, label: '600ms' },
          ]}
        />
      </DemoCard>

      <Group>
        <Button onClick={() => {}}>Fast button (cheap handler)</Button>
        <Button color="orange" onClick={onSlowClick}>Slow button (blocks {block}ms)</Button>
        <Badge size="lg" variant="light" color={r.color}>INP ≈ {inp.toFixed(0)}ms · {r.label}</Badge>
      </Group>

      <DemoCard title="Recent interactions (newest first)">
        {interactions.length === 0 ? (
          <Text size="sm" c="dimmed">Click a button (interactions ≥ 16ms are recorded).</Text>
        ) : (
          <Table withRowBorders={false}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>type</Table.Th>
                <Table.Th>input delay</Table.Th>
                <Table.Th>processing</Table.Th>
                <Table.Th>presentation</Table.Th>
                <Table.Th>total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {interactions.map((it, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{it.type}</Table.Td>
                  <Table.Td>{it.inputDelay.toFixed(0)}ms</Table.Td>
                  <Table.Td>{it.processing.toFixed(0)}ms</Table.Td>
                  <Table.Td>{it.presentation.toFixed(0)}ms</Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light" color={rate(it.duration).color}>
                      {it.duration.toFixed(0)}ms
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </DemoCard>
    </Stack>
  );
}
