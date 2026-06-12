import { Badge, Group, Stack, Text } from '@mantine/core';

// This component lives in its own chunk — it's only downloaded when the lazy
// import is first rendered (see the Demo's network panel in real DevTools).
export default function Heavy() {
  return (
    <Stack gap={6} className="rounded-md border p-3">
      <Group>
        <Badge color="teal" variant="light">loaded from a separate chunk</Badge>
      </Group>
      <Text size="sm">
        This widget's code was split out by the bundler and fetched on demand via{' '}
        <code>import('./Heavy')</code> — it wasn't in the initial bundle.
      </Text>
    </Stack>
  );
}
