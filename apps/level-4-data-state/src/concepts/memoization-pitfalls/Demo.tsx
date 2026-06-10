import { useMemo, useRef, useState } from 'react';
import { Badge, Button, Group, SegmentedControl, Stack, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

export function Demo() {
  const [query, setQuery] = useState('ab');
  const [tick, setTick] = useState(0); // unrelated re-render trigger
  const [mode, setMode] = useState<'broken' | 'fixed'>('broken');
  const computes = useRef(0);

  // "broken": dependency is a NEW object every render → useMemo always misses.
  const brokenDep = { q: query };
  // We deliberately reference both deps; the object one defeats the cache.
  const result = useMemo(() => {
    computes.current += 1;
    // pretend-expensive compute
    let acc = 0;
    for (let i = 0; i < 200_000; i++) acc += (query.charCodeAt(i % Math.max(1, query.length)) || 0) % 7;
    return `${query.toUpperCase()} (#${acc % 1000})`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, mode === 'broken' ? [brokenDep] : [query]);

  return (
    <Stack gap="md">
      <Callout kind="info" title="A cache that never hits">
        Type in the box, then click "Bump unrelated state" a few times <i>without</i> changing the
        query. In <b>broken</b> mode the expensive compute runs on <i>every</i> render — its
        dependency is a fresh <code>{'{ q: query }'}</code> object each time, so{' '}
        <code>useMemo</code> can never reuse the result. In <b>fixed</b> mode the dep is the{' '}
        <code>query</code> primitive, so it only recomputes when the query actually changes.
      </Callout>

      <SegmentedControl
        value={mode}
        onChange={(v) => {
          setMode(v as typeof mode);
          computes.current = 0;
        }}
        fullWidth
        data={[
          { label: 'deps: [{ q: query }] (always misses)', value: 'broken' },
          { label: 'deps: [query] (correct)', value: 'fixed' },
        ]}
      />

      <DemoCard
        title="useMemo recompute count"
        right={
          <Group gap="xs">
            <Badge color={mode === 'broken' ? 'red' : 'teal'} variant="filled">
              computes: {computes.current}
            </Badge>
            <Badge variant="light">renders: {tick}</Badge>
          </Group>
        }
      >
        <Group align="flex-end">
          <TextInput label="query" value={query} onChange={(e) => setQuery(e.currentTarget.value)} />
          <Button onClick={() => setTick((t) => t + 1)}>Bump unrelated state</Button>
        </Group>
        <Text mt="md" size="sm">
          memoized result: <b>{result}</b>
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          In broken mode, "computes" climbs with every render (even unrelated ones). In fixed mode it
          only increments when you edit the query.
        </Text>
      </DemoCard>
    </Stack>
  );
}
