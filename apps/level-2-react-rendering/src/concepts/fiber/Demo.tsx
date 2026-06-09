import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Badge, Button, Code, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [n, setN] = useState(0);

  // Counting renders via a ref is a mild render-phase action used only to
  // illustrate; real side effects must NOT live in the render body.
  const renderCount = useRef(0);
  renderCount.current += 1;

  useLayoutEffect(() => {
    log(`commit · layout effect (sync, before paint) — n=${n}`, 'sync');
  }, [n, log]);

  useEffect(() => {
    log(`commit · passive effect (after paint) — n=${n}`, 'success');
  }, [n, log]);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Render phase vs commit phase">
        Clicking re-runs the render phase (pure — produces no log here), then React commits:
        layout effects run synchronously before paint, passive effects after paint. The render
        body has no business logging/mutating — that's why this demo only logs from effects.
      </Callout>

      <DemoCard
        title="Phase ordering"
        right={
          <Group gap="xs">
            <Badge variant="light">renders: {renderCount.current}</Badge>
            <Button size="xs" onClick={() => setN((x) => x + 1)}>
              Trigger update (n={n})
            </Button>
            <Button size="xs" variant="default" onClick={clear}>
              Clear
            </Button>
          </Group>
        }
      >
        <LogConsole logs={logs} height={150} empty="Click 'Trigger update' to see commit-phase ordering." />
        <Text size="xs" c="dimmed" mt="sm">
          In dev StrictMode, render and effect setup/cleanup are intentionally double-invoked to
          surface impurity — the production build runs them once.
        </Text>
      </DemoCard>

      <DemoCard title="A fiber tree (child / sibling / return pointers)">
        <Text size="sm" c="dimmed" mb="sm">
          React traverses this structure iteratively, so it can pause after any fiber and yield
          to the browser. For the JSX:
        </Text>
        <Code block mb="md">
          {`<App>
  <Header />
  <List>
    <Item /> <Item />
  </List>
</App>`}
        </Code>
        <FiberTree />
      </DemoCard>
    </Stack>
  );
}

function Node({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-indigo-400/60 p-2">
      <Badge size="sm" variant="filled" color="indigo">
        {label}
      </Badge>
      {children && <div className="mt-2 flex flex-wrap gap-2 pl-4">{children}</div>}
    </div>
  );
}

function FiberTree() {
  return (
    <Stack gap={6}>
      <Node label="App (return: root)">
        <Node label="Header (sibling → List)" />
        <Node label="List (child → Item)">
          <Node label="Item (sibling → Item)" />
          <Node label="Item (return → List)" />
        </Node>
      </Node>
      <Text size="xs" c="dimmed">
        child = first child · sibling = next sibling · return = parent (where traversal resumes).
      </Text>
    </Stack>
  );
}
