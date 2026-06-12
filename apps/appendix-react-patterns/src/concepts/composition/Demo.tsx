import { type ReactNode } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// A generic structural component: one body via children + named slots for the rest.
function Panel({
  title,
  actions,
  footer,
  children,
}: {
  title: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Text fw={600} size="sm">{title}</Text>
        <div>{actions}</div>
      </header>
      <div style={{ padding: 12 }}>{children}</div>
      {footer && (
        <footer style={{ padding: '8px 12px', borderTop: '1px solid var(--mantine-color-default-border)' }}>{footer}</footer>
      )}
    </section>
  );
}

// Specialization by COMPOSITION (not inheritance): wrap Panel with fixed slots.
function ConfirmCard({ onConfirm, children }: { onConfirm: () => void; children: ReactNode }) {
  return (
    <Panel
      title="Confirm action"
      actions={<Badge size="xs" color="red" variant="light">danger</Badge>}
      footer={
        <Group justify="flex-end" gap="xs">
          <Button size="compact-xs" variant="default">Cancel</Button>
          <Button size="compact-xs" color="red" onClick={onConfirm}>Confirm</Button>
        </Group>
      }
    >
      {children}
    </Panel>
  );
}

export function Demo() {
  return (
    <Stack gap="md">
      <Callout kind="info" title="One structural component, arbitrary content via slots">
        <code>Panel</code> provides structure (header / body / footer); the consumer fills each hole
        with real JSX — a <code>title</code>, custom <code>actions</code>, a <code>footer</code>, and{' '}
        <code>children</code>. <code>ConfirmCard</code> is a <i>specialization</i> built by wrapping{' '}
        <code>Panel</code>, not by subclassing or by adding flags.
      </Callout>

      <Group grow align="flex-start">
        <DemoCard title="Generic Panel with slots">
          <Panel
            title="Settings"
            actions={<Button size="compact-xs" variant="light">Edit</Button>}
            footer={<Text size="xs" c="dimmed">last saved 2m ago</Text>}
          >
            <Text size="sm">Any markup goes in the body — even a chart, a form, or another Panel.</Text>
          </Panel>
        </DemoCard>

        <DemoCard title="Specialized by composition">
          <ConfirmCard onConfirm={() => {}}>
            <Text size="sm">Delete this workspace? This can't be undone.</Text>
          </ConfirmCard>
        </DemoCard>
      </Group>

      <Text size="sm" c="dimmed">
        No <code>showHeader</code>/<code>headerText</code>/<code>footerButtons</code> props — the
        consumer passes the exact content. Adding a header badge or a custom footer needs zero changes
        to <code>Panel</code>.
      </Text>
    </Stack>
  );
}
