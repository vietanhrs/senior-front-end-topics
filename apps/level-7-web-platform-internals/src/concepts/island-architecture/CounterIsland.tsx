import { useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';

/** A second independent island with its own state/root. */
export function CounterIsland() {
  const [n, setN] = useState(0);
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="sm" fw={600}>
          🏝 Cart island
        </Text>
        <Badge size="xs" color="teal" variant="light">
          interactive
        </Badge>
      </Group>
      <Button size="xs" variant="light" onClick={() => setN((c) => c + 1)} w="fit-content">
        Add to cart ({n})
      </Button>
    </Stack>
  );
}
