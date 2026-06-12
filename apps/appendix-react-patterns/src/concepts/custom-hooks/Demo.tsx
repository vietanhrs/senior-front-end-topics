import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// ---- a reusable stateful-logic hook: each call gets its OWN isolated state ----
function useCounter(step = 1) {
  const [count, setCount] = useState(0);
  const inc = useCallback(() => setCount((c) => c + step), [step]);
  const dec = useCallback(() => setCount((c) => c - step), [step]);
  const reset = useCallback(() => setCount(0), []);
  return { count, inc, dec, reset };
}

// ---- a hook that encapsulates an effect + cleanup (debounce) ----
function useDebouncedValue<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id); // cleanup owned by the hook
  }, [value, ms]);
  return debounced;
}

function Counter({ label, step }: { label: string; step: number }) {
  const { count, inc, dec, reset } = useCounter(step);
  return (
    <div className="rounded-md border p-3">
      <Group justify="space-between">
        <Text size="sm" fw={600}>{label} (step {step})</Text>
        <Badge variant="light" size="lg">{count}</Badge>
      </Group>
      <Group gap="xs" mt={8}>
        <Button size="compact-xs" onClick={dec}>−</Button>
        <Button size="compact-xs" onClick={inc}>+</Button>
        <Button size="compact-xs" variant="subtle" onClick={reset}>reset</Button>
      </Group>
    </div>
  );
}

export function Demo() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 500);

  return (
    <Stack gap="md">
      <Callout kind="info" title="One hook, reused — independent state per call">
        Both counters use the same <code>useCounter</code> hook (shared <b>logic</b>), yet each has
        its <b>own</b> count (independent <b>state</b>). The search box uses{' '}
        <code>useDebouncedValue</code>, a hook that hides a timer + its cleanup. That's the whole
        point: reuse behavior without sharing state or duplicating effect code.
      </Callout>

      <DemoCard title="Two independent useCounter() instances">
        <Group grow>
          <Counter label="Counter A" step={1} />
          <Counter label="Counter B" step={5} />
        </Group>
      </DemoCard>

      <DemoCard title="useDebouncedValue() — effect + cleanup encapsulated">
        <Stack gap={6}>
          <TextInput
            label="type fast — the debounced value lags 500ms behind"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            placeholder="search…"
          />
          <Group>
            <Badge variant="light" color="gray">live: "{query}"</Badge>
            <Badge variant="light" color="teal">debounced: "{debounced}"</Badge>
          </Group>
        </Stack>
      </DemoCard>
    </Stack>
  );
}
