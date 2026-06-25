import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Code, Group, Stack, Stepper, Table, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

const steps = [
  {
    label: 'Trigger',
    body: 'A root or setState enqueues an update with a lane.',
    code: "root.render(<App />)\nsetState(next)",
  },
  {
    label: 'beginWork',
    body: 'React walks down the WIP tree, calls components, and gets child elements.',
    code: 'App(props) -> <main><Profile /></main>',
  },
  {
    label: 'completeWork',
    body: 'React walks back up, prepares host work, and bubbles flags.',
    code: "HostComponent('button') -> Placement | Update",
  },
  {
    label: 'Commit',
    body: 'ReactDOM applies mutations, attaches refs, and runs effects.',
    code: 'appendChild(button)\nrun layout effects\nschedule passive effects',
  },
];

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [active, setActive] = useState(0);
  const [count, setCount] = useState(0);
  const renderCount = useRef(0);
  renderCount.current += 1;

  const rows = useMemo(
    () => [
      ['HostRoot', 'stateNode', 'Root object that points at the container.'],
      ['FunctionComponent', 'memoizedState', 'Hook linked list for this component.'],
      ['HostComponent', 'stateNode', 'The real DOM node, such as HTMLButtonElement.'],
      ['Any fiber', 'flags', 'Work commit must perform for this fiber.'],
    ],
    [],
  );

  useLayoutEffect(() => {
    log(`layout phase: DOM is committed for count=${count}`, 'sync');
  }, [count, log]);

  useEffect(() => {
    log(`passive phase: effect flushed for count=${count}`, 'success');
  }, [count, log]);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Render produces work; commit changes the host tree">
        Click through the pipeline, then trigger an update. The visible log starts in commit-phase
        effects because render-phase work must stay pure.
      </Callout>

      <DemoCard
        title="Pipeline walkthrough"
        right={<Badge variant="light">renders: {renderCount.current}</Badge>}
      >
        <Stack gap="md">
          <Stepper active={active} onStepClick={setActive} size="sm">
            {steps.map((step) => (
              <Stepper.Step key={step.label} label={step.label} description={step.body} />
            ))}
          </Stepper>
          <Code block>{steps[active]?.code}</Code>
          <Group>
            <Button onClick={() => setActive((value) => Math.max(0, value - 1))} variant="default">
              Previous
            </Button>
            <Button onClick={() => setActive((value) => Math.min(steps.length - 1, value + 1))}>
              Next
            </Button>
            <Button
              color="indigo"
              onClick={() => {
                clear();
                setCount((value) => value + 1);
              }}
            >
              Trigger update ({count})
            </Button>
          </Group>
        </Stack>
      </DemoCard>

      <DemoCard title="Fiber fields worth recognizing">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Fiber kind</Table.Th>
              <Table.Th>Field</Table.Th>
              <Table.Th>Why it matters</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map(([kind, field, detail]) => (
              <Table.Tr key={`${kind}-${field}`}>
                <Table.Td>{kind}</Table.Td>
                <Table.Td>
                  <Code>{field}</Code>
                </Table.Td>
                <Table.Td>{detail}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Text size="xs" c="dimmed" mt="xs">
          Names are internal and can move between versions; the mental model is the durable part.
        </Text>
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Trigger an update to see commit phase logs." />
    </Stack>
  );
}
