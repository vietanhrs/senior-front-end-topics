import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// A memoized child that counts its own renders.
const Child = memo(function Child({ config, onPing }: { config: { color: string }; onPing: () => void }) {
  const renders = useRef(0);
  renders.current += 1;
  return (
    <Group justify="space-between" className="rounded-md border px-3 py-2">
      <Text size="sm" style={{ color: config.color }}>
        Memoized child
      </Text>
      <Group gap="xs">
        <Badge color={renders.current > 1 ? 'red' : 'teal'} variant="light">
          child renders: {renders.current}
        </Badge>
        <Button size="xs" variant="subtle" onClick={onPing}>
          ping
        </Button>
      </Group>
    </Group>
  );
});

export function Demo() {
  const [tick, setTick] = useState(0); // unrelated parent state
  const [mode, setMode] = useState<'inline' | 'stable'>('inline');

  // ❌ inline: new object + new function every parent render → memo defeated
  const inlineConfig = { color: 'var(--mantine-color-indigo-6)' };
  const inlineOnPing = () => {};

  // ✔ stable: same references across renders → memo works
  const stableConfig = useMemo(() => ({ color: 'var(--mantine-color-teal-7)' }), []);
  const stableOnPing = useCallback(() => {}, []);

  const config = mode === 'inline' ? inlineConfig : stableConfig;
  const onPing = mode === 'inline' ? inlineOnPing : stableOnPing;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Same memo, different prop identity">
        Bump the unrelated parent counter and watch the child's render count. In <b>inline</b> mode
        the child re-renders every time (its <code>config</code>/<code>onPing</code> props are new
        objects/functions each parent render, so <code>React.memo</code> can't bail). In <b>stable</b>
        mode the references are memoized, so the child renders once and then skips.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        fullWidth
        data={[
          { label: 'Inline props (memo defeated)', value: 'inline' },
          { label: 'useMemo/useCallback (memo works)', value: 'stable' },
        ]}
      />

      <DemoCard
        title="Parent re-render → does the memoized child re-render?"
        right={<Badge variant="light">parent tick: {tick}</Badge>}
      >
        <Stack gap="md">
          <Button w="fit-content" onClick={() => setTick((t) => t + 1)}>
            Bump unrelated parent state
          </Button>
          {/* key forces a fresh child (reset its counter) when switching modes */}
          <Child key={mode} config={config} onPing={onPing} />
          <Text size="xs" c="dimmed">
            The child's work didn't change — only the <i>identity</i> of its props did. Reference
            equality is the difference between "renders once" and "renders on every parent update."
          </Text>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
