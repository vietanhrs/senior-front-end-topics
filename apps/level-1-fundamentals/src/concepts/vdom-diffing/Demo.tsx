import { useState } from 'react';
import { Badge, Button, Group, Paper, SegmentedControl, Stack, Table, Text, TextInput } from '@mantine/core';
import { IconArrowsShuffle, IconRefresh } from '@tabler/icons-react';
import { Callout, DemoCard } from '@sfe/workbook';

interface Item {
  id: number;
  fruit: string;
}

const INITIAL: Item[] = [
  { id: 1, fruit: '🍎 Apple' },
  { id: 2, fruit: '🍌 Banana' },
  { id: 3, fruit: '🍒 Cherry' },
  { id: 4, fruit: '🍇 Grape' },
];

/**
 * Each row holds *uncontrolled* local DOM state (the text input the user types
 * into). Whether that state follows the item or stays glued to the position
 * after a shuffle depends entirely on the `key`.
 */
function Row({ item }: { item: Item }) {
  return (
    <Group gap="sm" wrap="nowrap">
      <Badge w={110} variant="light">
        {item.fruit}
      </Badge>
      <TextInput
        size="xs"
        placeholder={`Note for ${item.fruit}…`}
        styles={{ root: { flex: 1 } }}
      />
    </Group>
  );
}

export function Demo() {
  const [items, setItems] = useState(INITIAL);
  const [keyMode, setKeyMode] = useState<'index' | 'id'>('index');

  const shuffle = () => setItems((prev) => [...prev].reverse());
  const reset = () => setItems(INITIAL);

  return (
    <Stack gap="md">
      <Callout kind="info" title="What to observe">
        Type a note into a few inputs, then click <b>Reverse</b>. With <code>key=index</code>,
        notes <b>stick to the position</b> (attached to the wrong fruit). With{' '}
        <code>key=id</code>, notes <b>follow the right item</b>. This is the direct consequence
        of the key heuristic during diffing.
      </Callout>

      <SegmentedControl
        value={keyMode}
        onChange={(v) => setKeyMode(v as 'index' | 'id')}
        data={[
          { label: 'key = index (❌ trap)', value: 'index' },
          { label: 'key = item.id (✔ correct)', value: 'id' },
        ]}
      />

      <DemoCard
        title="A list with local state"
        right={
          <Group gap="xs">
            <Button
              size="xs"
              variant="light"
              leftSection={<IconArrowsShuffle size={14} />}
              onClick={shuffle}
            >
              Reverse
            </Button>
            <Button size="xs" variant="default" leftSection={<IconRefresh size={14} />} onClick={reset}>
              Reset
            </Button>
          </Group>
        }
      >
        <Paper p="md" radius="md" bg="var(--mantine-color-default-hover)">
          <Stack gap="xs">
            {items.map((item, i) =>
              keyMode === 'index' ? (
                <Row key={i} item={item} />
              ) : (
                <Row key={item.id} item={item} />
              ),
            )}
          </Stack>
        </Paper>
        <Text size="xs" c="dimmed" mt="sm">
          Current order: {items.map((i) => i.id).join(' → ')}
        </Text>
      </DemoCard>

      <DemoCard title="When the heuristic is cheap vs expensive">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Change shape</Table.Th>
              <Table.Th>React can match identity?</Table.Th>
              <Table.Th>Result</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {[
              ['Same type/key, changed prop', 'Yes', 'Reuses fiber/DOM; updates the prop only.'],
              ['Append keyed item', 'Yes', 'Scans siblings once; creates one new child.'],
              ['Reorder with stable keys', 'Yes', 'Preserves state; may move DOM nodes.'],
              ['Insert with index keys', 'No, identity shifts by position', 'O(n) scan, but state/DOM attach to the wrong item.'],
              ['Random keys', 'No, every child looks new', 'Remounts the list every render.'],
              ['Root type changes', 'No', 'Tears down and rebuilds the whole subtree.'],
            ].map(([shape, identity, result]) => (
              <Table.Tr key={shape}>
                <Table.Td>{shape}</Table.Td>
                <Table.Td>{identity}</Table.Td>
                <Table.Td>{result}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </DemoCard>
    </Stack>
  );
}
