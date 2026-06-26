import { isValidElement, useState, type ReactElement, type ReactNode } from 'react';
import { Badge, Code, Group, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

type SampleKey = 'host' | 'component' | 'nested' | 'list';

function ProfileCard({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <article>
      <h3>{name}</h3>
      {children}
    </article>
  );
}

const samples: Record<SampleKey, { label: string; source: string; element: ReactElement }> = {
  host: {
    label: 'Host element',
    source: '<button className="primary">Save</button>',
    element: <button className="primary">Save</button>,
  },
  component: {
    label: 'Function component',
    source: '<ProfileCard name="Ada" />',
    element: <ProfileCard name="Ada" />,
  },
  nested: {
    label: 'Nested children',
    source: '<ProfileCard name="Ada"><span>Online</span></ProfileCard>',
    element: (
      <ProfileCard name="Ada">
        <span>Online</span>
      </ProfileCard>
    ),
  },
  list: {
    label: 'Keyed sibling',
    source: '<Row key="42" item={item} />',
    element: <ProfileCard key="42" name="Keyed row" />,
  },
};

function describeValue(value: unknown): string {
  if (typeof value === 'symbol') return value.toString();
  if (typeof value === 'function') return value.name || '(anonymous function)';
  if (isValidElement(value)) {
    const type = typeof value.type === 'string' ? value.type : describeValue(value.type);
    return `<${type} /> element`;
  }
  if (Array.isArray(value)) return `[${value.map(describeValue).join(', ')}]`;
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  return JSON.stringify(value);
}

function inspectElement(element: ReactElement) {
  const raw = element as unknown as Record<PropertyKey, unknown>;
  return Reflect.ownKeys(raw).map((key) => ({
    field: typeof key === 'symbol' ? key.toString() : key,
    value: describeValue(raw[key]),
  }));
}

export function Demo() {
  const [selected, setSelected] = useState<SampleKey>('host');
  const sample = samples[selected];
  const rows = inspectElement(sample.element);
  const typeLabel = describeValue(sample.element.type);

  return (
    <Stack gap="md">
      <Callout kind="info" title="JSX is data first">
        The JSX expression below has already produced a React element object. No DOM node exists
        until a renderer commits it.
      </Callout>

      <SegmentedControl
        value={selected}
        onChange={(value) => setSelected(value as SampleKey)}
        fullWidth
        data={Object.entries(samples).map(([value, entry]) => ({ value, label: entry.label }))}
      />

      <DemoCard
        title="Element object"
        right={
          <Badge color={typeof sample.element.type === 'string' ? 'teal' : 'indigo'} variant="light">
            type: {typeLabel}
          </Badge>
        }
      >
        <Stack gap="sm">
          <Code block>{sample.source}</Code>
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Field</Table.Th>
                <Table.Th>Runtime value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.field}>
                  <Table.Td>
                    <Code>{row.field}</Code>
                  </Table.Td>
                  <Table.Td>
                    <Code>{row.value}</Code>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Text size="xs" c="dimmed">
            Development builds may expose extra debug fields. Treat those as internals, not API.
          </Text>
        </Stack>
      </DemoCard>

      <DemoCard title="What happens next">
        <Group align="stretch" grow>
          {[
            ['Element', 'Immutable description returned by JSX.'],
            ['Fiber', 'Mutable work node that stores state, lanes, and effects.'],
            ['DOM', 'Host output created or updated by react-dom during commit.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-md border p-3">
              <Text fw={700}>{title}</Text>
              <Text size="sm" c="dimmed">
                {body}
              </Text>
            </div>
          ))}
        </Group>
      </DemoCard>
    </Stack>
  );
}
