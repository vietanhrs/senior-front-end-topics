import { memo, useState, useTransition } from 'react';
import { Badge, Button, Group, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// Expensive low-priority render (CPU in render phase).
const Heavy = memo(function Heavy({ seed }: { seed: number }) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: 120 }, (_, i) => {
        let x = 0;
        for (let k = 0; k < 300_000; k++) x += Math.sqrt(k + i + seed);
        return (
          <span key={i} className="w-14 text-center text-xs">
            {x.toFixed(0).slice(-3)}
          </span>
        );
      })}
    </div>
  );
});

export function Demo() {
  const [urgent, setUrgent] = useState(0); // urgent counter (must stay instant)
  const [seed, setSeed] = useState(0); // drives the low-priority heavy render
  const [isPending, startTransition] = useTransition();

  return (
    <Stack gap="md">
      <Callout kind="info" title="Urgent preempts low priority">
        Click <b>Recompute (transition)</b> to kick off an expensive, low-priority render. While
        it's pending, hammer the <b>Urgent +1</b> button — the counter still increments instantly
        because urgent updates preempt the transition. React keeps the UI responsive and finishes
        the transition when it can.
      </Callout>

      <DemoCard
        title="Two competing updates"
        right={
          isPending ? (
            <Badge color="orange" variant="light">
              transition pending…
            </Badge>
          ) : (
            <Badge color="teal" variant="light">
              idle
            </Badge>
          )
        }
      >
        <Group mb="md">
          <Button color="indigo" onClick={() => setUrgent((u) => u + 1)}>
            Urgent +1 (count: {urgent})
          </Button>
          <Button
            variant="light"
            onClick={() => startTransition(() => setSeed((s) => s + 1))}
          >
            Recompute (transition)
          </Button>
        </Group>
        <div className="h-40 overflow-auto rounded-md border p-2">
          <Heavy seed={seed} />
        </div>
        <Text size="xs" c="dimmed" mt="xs">
          The urgent counter updates immediately even mid-transition; the heavy block (seed {seed})
          renders at low priority and can be interrupted.
        </Text>
      </DemoCard>

      <DemoCard title="Priority tiers (high → low)">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Tier</Table.Th>
              <Table.Th>Triggered by</Table.Th>
              <Table.Th>API</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {[
              ['Discrete / urgent', 'click, keypress, input', 'default setState'],
              ['Continuous', 'scroll, mousemove, drag', 'default setState'],
              ['Default', 'network cb, timeout', 'default setState'],
              ['Transition', 'non-urgent updates', 'useTransition'],
              ['Deferred', 'lagging value', 'useDeferredValue'],
              ['Idle', 'offscreen', '(internal)'],
            ].map(([t, by, api]) => (
              <Table.Tr key={t}>
                <Table.Td>{t}</Table.Td>
                <Table.Td>{by}</Table.Td>
                <Table.Td>{api}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </DemoCard>
    </Stack>
  );
}
