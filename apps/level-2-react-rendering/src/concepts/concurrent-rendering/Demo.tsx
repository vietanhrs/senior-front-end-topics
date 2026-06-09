import { useDeferredValue, useMemo, useState } from 'react';
import { Badge, Group, Loader, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// A large dataset so re-filtering + re-rendering is genuinely expensive.
const ITEMS = Array.from({ length: 6000 }, (_, i) => `Item #${i} — react fiber lane scheduler ${i * 7}`);

function HeavyList({ query }: { query: string }) {
  // Filtering 6000 items and rendering the matches is the costly work whose
  // priority we want to control.
  const matches = useMemo(() => ITEMS.filter((t) => t.toLowerCase().includes(query.toLowerCase())), [query]);
  return (
    <div className="h-72 overflow-auto rounded-md border p-2">
      <Text size="xs" c="dimmed" mb={4}>
        {matches.length} matches
      </Text>
      {matches.map((t) => (
        <div key={t} className="border-b border-dashed py-0.5 text-sm">
          {t}
        </div>
      ))}
    </div>
  );
}

export function Demo() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'blocking' | 'concurrent'>('blocking');

  // In concurrent mode the list reads a DEFERRED query: React keeps the input
  // update urgent and re-renders the big list at low priority, interrupting it
  // if you keep typing. In blocking mode the list reads `query` directly.
  const deferredQuery = useDeferredValue(query);
  const listQuery = mode === 'concurrent' ? deferredQuery : query;
  const isStale = mode === 'concurrent' && listQuery !== query;

  return (
    <Stack gap="md">
      <Callout kind="info" title="How to feel the difference">
        Type quickly in both modes. In <b>blocking</b> mode every keystroke re-renders all 6000
        rows synchronously and the input stutters. In <b>concurrent</b> mode the input stays
        responsive — the list lags behind (note the "updating…" badge) but never blocks typing.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => setMode(v as typeof mode)}
        fullWidth
        data={[
          { label: 'Blocking (no concurrency)', value: 'blocking' },
          { label: 'Concurrent (useDeferredValue)', value: 'concurrent' },
        ]}
      />

      <DemoCard
        title="Filter 6000 items"
        right={
          isStale ? (
            <Badge color="orange" variant="light" leftSection={<Loader size={10} color="orange" />}>
              list updating…
            </Badge>
          ) : (
            <Badge color="teal" variant="light">
              in sync
            </Badge>
          )
        }
      >
        <Stack gap="sm">
          <TextInput
            label="Search (urgent update — should always feel instant)"
            placeholder="type fast: lane, fiber, 123…"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          <div style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 120ms' }}>
            <HeavyList query={listQuery} />
          </div>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              input value: <b>{query || '(empty)'}</b>
            </Text>
            <Text size="xs" c="dimmed">
              · list rendered for: <b>{listQuery || '(empty)'}</b>
            </Text>
          </Group>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
