import { useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// A Rating that supports BOTH modes: controlled when `value` is passed, else it
// manages its own state from `defaultValue`. Always notifies via onChange.
function Rating({
  value,
  defaultValue = 0,
  onChange,
  max = 5,
}: {
  value?: number;
  defaultValue?: number;
  onChange?: (v: number) => void;
  max?: number;
}) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = isControlled ? value : internal;
  const set = (v: number) => {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };
  return (
    <Group gap={2}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          onClick={() => set(star)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 24, lineHeight: 1, color: star <= current ? 'var(--mantine-color-yellow-6)' : 'var(--mantine-color-gray-4)' }}
          aria-label={`${star} stars`}
        >
          ★
        </button>
      ))}
    </Group>
  );
}

export function Demo() {
  const [controlled, setControlled] = useState(3);
  const [lastUncontrolled, setLastUncontrolled] = useState<number | null>(null);

  return (
    <Stack gap="md">
      <Callout kind="info" title="One component, both modes">
        The same <code>Rating</code> is <b>controlled</b> on the left (the parent owns the value — note
        the external buttons drive it) and <b>uncontrolled</b> on the right (it manages its own state
        from <code>defaultValue</code>; the parent only learns the value via <code>onChange</code>).
      </Callout>

      <Group grow align="flex-start">
        <DemoCard title="Controlled (parent owns value)">
          <Stack gap="xs">
            <Rating value={controlled} onChange={setControlled} />
            <Group>
              <Badge variant="light">parent state: {controlled}</Badge>
              <Button size="compact-xs" variant="light" onClick={() => setControlled(0)}>reset</Button>
              <Button size="compact-xs" variant="light" onClick={() => setControlled(5)}>set 5</Button>
            </Group>
            <Text size="xs" c="dimmed">external buttons can drive it — single source of truth is the parent</Text>
          </Stack>
        </DemoCard>

        <DemoCard title="Uncontrolled (component owns value)">
          <Stack gap="xs">
            <Rating defaultValue={2} onChange={setLastUncontrolled} />
            <Badge variant="light" color="teal">last onChange: {lastUncontrolled ?? '—'}</Badge>
            <Text size="xs" c="dimmed">parent can't force it; it just reports changes. (Reset buttons can't move it.)</Text>
          </Stack>
        </DemoCard>
      </Group>

      <Text size="sm" c="dimmed">
        It decides the mode once from whether <code>value</code> is defined — and never flips, which is
        what avoids React's "changing uncontrolled to controlled" warning.
      </Text>
    </Stack>
  );
}
