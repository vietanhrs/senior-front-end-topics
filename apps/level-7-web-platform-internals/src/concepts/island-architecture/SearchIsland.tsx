import { useState } from 'react';
import { Badge, Group, Stack, Text, TextInput } from '@mantine/core';

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Cherry', 'Grape', 'Mango', 'Melon'];

/** A self-contained interactive island: filter a small list. */
export function SearchIsland() {
  const [q, setQ] = useState('');
  const hits = FRUITS.filter((f) => f.toLowerCase().includes(q.toLowerCase()));
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="sm" fw={600}>
          🏝 Search island
        </Text>
        <Badge size="xs" color="teal" variant="light">
          interactive
        </Badge>
      </Group>
      <TextInput size="xs" placeholder="filter fruit…" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
      <Text size="xs" c="dimmed">
        {hits.join(', ') || 'no matches'}
      </Text>
    </Stack>
  );
}
