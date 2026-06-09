import { useState } from 'react';
import { Badge, Button, Group, Paper, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { IconArrowsShuffle, IconRefresh } from '@tabler/icons-react';
import { Callout, DemoCard } from '../../workbook/ui';

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
        placeholder={`Ghi chú cho ${item.fruit}…`}
        className="flex-1"
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
      <Callout kind="info" title="Cách quan sát">
        Gõ ghi chú vào vài ô input, rồi bấm <b>Reverse</b>. Với <code>key=index</code>, ghi
        chú <b>dính theo vị trí</b> (gắn nhầm trái cây). Với <code>key=id</code>, ghi chú{' '}
        <b>đi theo đúng item</b>. Đây chính là hệ quả của heuristic dùng key khi diffing.
      </Callout>

      <SegmentedControl
        value={keyMode}
        onChange={(v) => setKeyMode(v as 'index' | 'id')}
        data={[
          { label: 'key = index (❌ bẫy)', value: 'index' },
          { label: 'key = item.id (✔ đúng)', value: 'id' },
        ]}
      />

      <DemoCard
        title="Danh sách có state cục bộ"
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
          Thứ tự hiện tại: {items.map((i) => i.id).join(' → ')}
        </Text>
      </DemoCard>
    </Stack>
  );
}
