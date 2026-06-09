import { Paper, Stack, Text, Title } from '@mantine/core';

/**
 * Stand-in for a "heavy" component (imagine a charting lib, rich text editor,
 * map, etc.). Because it's only ever reached via `import('./HeavyWidget')`,
 * Vite/Rollup emits it as a SEPARATE chunk — open the Network tab and watch a
 * new .js file load the first time you reveal it.
 */
export default function HeavyWidget() {
  // A little CPU work so it feels non-trivial.
  const bars = Array.from({ length: 40 }, (_, i) => Math.round(50 + 45 * Math.sin(i / 3)));
  return (
    <Paper withBorder radius="md" p="md" bg="var(--mantine-color-default-hover)">
      <Stack gap="xs">
        <Title order={5}>📊 Heavy widget loaded (separate chunk)</Title>
        <Text size="sm" c="dimmed">
          This component is loaded only when you ask for it. In the Network tab you'll see a new{' '}
          <code>.js</code> chunk appear the first time it opens.
        </Text>
        <div className="flex h-24 items-end gap-1">
          {bars.map((h, i) => (
            <div key={i} style={{ height: `${h}%`, flex: 1, background: 'var(--mantine-color-indigo-5)', borderRadius: 2 }} />
          ))}
        </div>
      </Stack>
    </Paper>
  );
}
