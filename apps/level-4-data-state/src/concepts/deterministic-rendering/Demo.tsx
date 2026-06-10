import { useRef, useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface Row {
  id: string;
  name: string;
  score: number;
}

// Several rows share the same score → ties that a comparator must order deterministically.
const ROWS: Row[] = [
  { id: 'a', name: 'Ana', score: 90 },
  { id: 'b', name: 'Bo', score: 90 },
  { id: 'c', name: 'Cy', score: 75 },
  { id: 'd', name: 'Di', score: 90 },
  { id: 'e', name: 'Ed', score: 75 },
];

export function Demo() {
  const [mode, setMode] = useState<'nondet' | 'det'>('nondet');
  const [, bump] = useState(0);
  const prevOrder = useRef<string>('');

  const sorted = [...ROWS].sort((a, b) => {
    if (mode === 'nondet') {
      // ❌ ties broken with randomness → order changes every render
      return b.score - a.score || (Math.random() - 0.5);
    }
    // ✔ total order: score desc, then id asc (stable tiebreaker)
    return b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });

  const order = sorted.map((r) => r.id).join(',');
  const changed = prevOrder.current !== '' && prevOrder.current !== order;
  prevOrder.current = order;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Re-render and watch the tied rows">
        Rows with score 90 (Ana, Bo, Di) and 75 (Cy, Ed) are tied. Click "Re-render" repeatedly. In
        <b> non-deterministic</b> mode the comparator breaks ties with <code>Math.random()</code>,
        so tied rows shuffle on every render (and would mismatch between server and client). In
        <b> deterministic</b> mode a stable <code>id</code> tiebreaker fixes the order forever.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => {
          setMode(v as typeof mode);
          prevOrder.current = '';
        }}
        fullWidth
        data={[
          { label: 'Random tiebreaker (non-deterministic)', value: 'nondet' },
          { label: 'id tiebreaker (deterministic)', value: 'det' },
        ]}
      />

      <DemoCard
        title="Sorted leaderboard"
        right={
          <Group gap="xs">
            <Badge color={changed ? 'red' : 'teal'} variant="filled">
              {changed ? 'order changed!' : 'order stable'}
            </Badge>
            <Button size="xs" onClick={() => bump((x) => x + 1)}>
              Re-render
            </Button>
          </Group>
        }
      >
        <Table withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Score</Table.Th>
              <Table.Th>id</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sorted.map((r, i) => (
              <Table.Tr key={r.id}>
                <Table.Td>{i + 1}</Table.Td>
                <Table.Td>{r.name}</Table.Td>
                <Table.Td>{r.score}</Table.Td>
                <Table.Td>
                  <Text ff="monospace" size="sm">
                    {r.id}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Text size="xs" c="dimmed" mt="sm">
          order signature: <Text span ff="monospace">{order}</Text>
        </Text>
      </DemoCard>
    </Stack>
  );
}
