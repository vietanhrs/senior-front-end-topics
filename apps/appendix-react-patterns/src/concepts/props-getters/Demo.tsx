import { useId, useState, type ButtonHTMLAttributes, type HTMLAttributes } from 'react';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const callAll =
  (...fns: (((...a: unknown[]) => void) | undefined)[]) =>
  (...args: unknown[]) =>
    fns.forEach((fn) => fn?.(...args));

function useDisclosure() {
  const [isOpen, setOpen] = useState(false);
  const panelId = useId();

  const getTriggerProps = (props: ButtonHTMLAttributes<HTMLButtonElement> = {}) => ({
    'aria-expanded': isOpen,
    'aria-controls': panelId,
    ...props, // consumer styling/attrs
    onClick: callAll(props.onClick as never, () => setOpen((o) => !o)), // compose handlers
  });

  const getPanelProps = (props: HTMLAttributes<HTMLDivElement> = {}) => ({
    id: panelId,
    role: 'region',
    hidden: !isOpen,
    ...props,
  });

  return { isOpen, getTriggerProps, getPanelProps };
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const { isOpen, getTriggerProps, getPanelProps } = useDisclosure();

  return (
    <Stack gap="md">
      <Callout kind="info" title="Spread a getter — a11y wiring + your handler, both for free">
        <code>useDisclosure</code> returns <code>getTriggerProps</code>/<code>getPanelProps</code>.
        Spreading them onto your elements wires <code>aria-expanded</code>, <code>aria-controls</code>,
        the matching <code>id</code>, and the toggle handler. Your own <code>onClick</code> is{' '}
        <b>composed</b> with the internal one — both run.
      </Callout>

      <DemoCard title="Consumer markup (your onClick + the getter's are merged)">
        <Stack gap="xs">
          <button
            {...getTriggerProps({
              onClick: () => log('consumer onClick fired too (e.g. analytics)', 'sync'),
              className: 'mantine-active',
              style: { padding: '6px 12px', borderRadius: 8, cursor: 'pointer', width: 'fit-content' },
            })}
          >
            {isOpen ? '▾ Hide details' : '▸ Show details'}
          </button>

          <div {...getPanelProps({ style: { border: '1px solid var(--mantine-color-default-border)', borderRadius: 8, padding: 12 } })}>
            <Text size="sm">Panel content — its <code>id</code> matches the trigger's <code>aria-controls</code>, and it toggles <code>hidden</code> from the hook's state.</Text>
          </div>

          <Group gap="xs">
            <Badge variant="light" color={isOpen ? 'teal' : 'gray'}>aria-expanded: {String(isOpen)}</Badge>
            <Badge variant="light" color="gray" onClick={clear} style={{ cursor: 'pointer' }}>clear log</Badge>
          </Group>
        </Stack>
      </DemoCard>

      <LogConsole logs={logs} height={120} empty="Click the trigger — both the getter's toggle and your onClick run." />
    </Stack>
  );
}
