import { useMemo, useState } from 'react';
import { Badge, Code, Group, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

type PropCase = 'className' | 'style' | 'boolean' | 'event' | 'children';

const propCases: Record<PropCase, { label: string; jsx: string; host: string; note: string }> = {
  className: {
    label: 'className',
    jsx: '<button className="primary" />',
    host: 'node.className = "primary"',
    note: 'JSX uses className because class is reserved in JavaScript.',
  },
  style: {
    label: 'style object',
    jsx: '<div style={{ opacity: 0.5, marginTop: 8 }} />',
    host: 'node.style.opacity = "0.5"; node.style.marginTop = "8px"',
    note: 'ReactDOM diffs individual style properties instead of replacing the whole attribute.',
  },
  boolean: {
    label: 'boolean prop',
    jsx: '<button disabled={false} />',
    host: 'node.disabled = false',
    note: 'Boolean props map to DOM properties and presence/absence rules.',
  },
  event: {
    label: 'event handler',
    jsx: '<button onClick={save} />',
    host: 'delegated root listener dispatches synthetic onClick',
    note: 'ReactDOM does not set an onclick string on every node.',
  },
  children: {
    label: 'text child',
    jsx: '<button>Save</button>',
    host: 'node.textContent = "Save"',
    note: 'Text children become host text work, often optimized separately from element children.',
  },
};

export function Demo() {
  const [selected, setSelected] = useState<PropCase>('className');
  const current = propCases[selected];
  const rows = useMemo(
    () => [
      ['Reconciler', 'Figures out the next host tree and marks Placement/Update/Deletion work.'],
      ['ReactDOM host config', 'Knows how to create DOM nodes, set props, and append children.'],
      ['Browser DOM', 'Receives property changes, text updates, insertions, and removals.'],
    ],
    [],
  );

  return (
    <Stack gap="md">
      <Callout kind="info" title="Renderer boundary">
        React elements and Fibers are renderer-neutral. The web-specific translation happens in
        ReactDOM.
      </Callout>

      <SegmentedControl
        value={selected}
        onChange={(value) => setSelected(value as PropCase)}
        fullWidth
        data={Object.entries(propCases).map(([value, item]) => ({ value, label: item.label }))}
      />

      <DemoCard
        title="JSX prop to host operation"
        right={<Badge variant="light">{current.label}</Badge>}
      >
        <Stack gap="sm">
          <Group align="stretch" grow>
            <div className="rounded-md border p-3">
              <Text fw={700} mb="xs">
                JSX
              </Text>
              <Code block>{current.jsx}</Code>
            </div>
            <div className="rounded-md border p-3">
              <Text fw={700} mb="xs">
                Host operation
              </Text>
              <Code block>{current.host}</Code>
            </div>
          </Group>
          <Text size="sm" c="dimmed">
            {current.note}
          </Text>
        </Stack>
      </DemoCard>

      <DemoCard title="Who owns each decision?">
        <Table withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Layer</Table.Th>
              <Table.Th>Responsibility</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map(([layer, responsibility]) => (
              <Table.Tr key={layer}>
                <Table.Td>{layer}</Table.Td>
                <Table.Td>{responsibility}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </DemoCard>
    </Stack>
  );
}
