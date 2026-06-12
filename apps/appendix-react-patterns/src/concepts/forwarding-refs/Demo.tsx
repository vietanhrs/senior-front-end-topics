import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface TextFieldHandle {
  focus: () => void;
  clear: () => void;
}

// Exposes a SMALL imperative API (focus/clear), not the raw <input> node.
const TextField = forwardRef<TextFieldHandle, { placeholder?: string }>(function TextField(
  { placeholder },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      clear: () => {
        if (inputRef.current) inputRef.current.value = '';
        inputRef.current?.focus();
      },
    }),
    [],
  );
  return (
    <input
      ref={inputRef}
      placeholder={placeholder}
      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--mantine-color-default-border)', width: '100%' }}
    />
  );
});

export function Demo() {
  const fieldRef = useRef<TextFieldHandle>(null);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Parent drives the child imperatively — through a forwarded ref">
        <code>TextField</code> forwards a ref, but via <code>useImperativeHandle</code> it exposes only{' '}
        <code>focus()</code> and <code>clear()</code> — not the raw DOM node. The buttons below call
        that API on the child.
      </Callout>

      <DemoCard title="Imperative API over a child input">
        <Stack gap="sm">
          <TextField placeholder="click a button to control me imperatively" ref={fieldRef} />
          <Group>
            <Button size="compact-sm" onClick={() => fieldRef.current?.focus()}>focus()</Button>
            <Button size="compact-sm" variant="light" onClick={() => fieldRef.current?.clear()}>clear()</Button>
          </Group>
        </Stack>
      </DemoCard>

      <Text size="sm" c="dimmed">
        The parent can <code>focus()</code>/<code>clear()</code> but can't reach into the input's
        internals — the imperative surface is intentional and minimal. (Reserve this for focus/scroll/
        media; for data, use props/state.) In React 19 you'd skip <code>forwardRef</code> and take{' '}
        <code>ref</code> as a normal prop.
      </Text>
    </Stack>
  );
}
