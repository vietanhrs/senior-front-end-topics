import { useMemo, useState } from 'react';
import {
  Badge,
  Code,
  List,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal, type ConceptModule } from '@sfe/workbook';

export interface BridgeRow {
  react: string;
  angular: string;
  seniorNote: string;
}

export interface AngularConceptConfig {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  doc: string;
  reactMentalModel: string;
  angularEquivalent: string;
  code: string;
  bridge: BridgeRow[];
  exercise: {
    prompt: string;
    reactFirstThinking: string[];
    angularAnswer: string;
    checklist: string[];
  };
}

function AngularBridgeDemo({ config }: { config: AngularConceptConfig }) {
  const [focus, setFocus] = useState<'map' | 'code' | 'review'>('map');
  const seniorNotes = useMemo(() => config.bridge.map((row) => row.seniorNote), [config.bridge]);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Use React as a bridge, not as a translation layer">
        Start from the React concept you already know, then switch to Angular's own nouns:
        templates, views, change detection, signals, injectors, and RxJS streams.
      </Callout>

      <SegmentedControl
        value={focus}
        onChange={(value) => setFocus(value as typeof focus)}
        data={[
          { value: 'map', label: 'Mental map' },
          { value: 'code', label: 'Angular shape' },
          { value: 'review', label: 'Review traps' },
        ]}
      />

      {focus === 'map' && (
        <DemoCard
          title="React mental model -> Angular equivalent"
          right={<Badge variant="light">Level 2*</Badge>}
        >
          <Table withTableBorder withColumnBorders verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>React concept</Table.Th>
                <Table.Th>Angular equivalent</Table.Th>
                <Table.Th>Senior note</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {config.bridge.map((row) => (
                <Table.Tr key={`${row.react}-${row.angular}`}>
                  <Table.Td>{row.react}</Table.Td>
                  <Table.Td>{row.angular}</Table.Td>
                  <Table.Td>{row.seniorNote}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </DemoCard>
      )}

      {focus === 'code' && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <DemoCard title="What to carry over from React">
            <Text>{config.reactMentalModel}</Text>
          </DemoCard>
          <DemoCard title="What Angular names differently">
            <Text>{config.angularEquivalent}</Text>
          </DemoCard>
          <DemoCard title="Angular example">
            <CodeHighlight code={config.code} language="ts" radius="md" withCopyButton />
          </DemoCard>
          <DemoCard title="Transfer rule">
            <Text>
              If the React phrase in your head is <Code>{config.bridge[0]?.react}</Code>, pause and
              ask which Angular primitive owns the same responsibility.
            </Text>
          </DemoCard>
        </SimpleGrid>
      )}

      {focus === 'review' && (
        <DemoCard title="Review checklist">
          <List spacing="xs">
            {seniorNotes.map((note) => (
              <List.Item key={note}>{note}</List.Item>
            ))}
          </List>
        </DemoCard>
      )}
    </Stack>
  );
}

function AngularBridgeExercise({ config }: { config: AngularConceptConfig }) {
  return (
    <Stack gap="md">
      <DemoCard title="Exercise: translate the React-first instinct" description={config.exercise.prompt}>
        <List spacing="xs">
          {config.exercise.reactFirstThinking.map((item) => (
            <List.Item key={item}>{item}</List.Item>
          ))}
        </List>
      </DemoCard>

      <Callout kind="tip" title="What a strong answer should include">
        Name the Angular primitive first, then explain where the React analogy helps and where it
        stops being accurate.
      </Callout>

      <SolutionReveal
        language="md"
        code={config.exercise.angularAnswer}
        notes={
          <Stack gap={4}>
            <Text size="sm" fw={700}>
              Acceptance checklist
            </Text>
            <List size="sm" spacing={2}>
              {config.exercise.checklist.map((item) => (
                <List.Item key={item}>{item}</List.Item>
              ))}
            </List>
          </Stack>
        }
      />
    </Stack>
  );
}

export function makeAngularConcept(config: AngularConceptConfig): ConceptModule {
  return {
    slug: config.slug,
    title: config.title,
    summary: config.summary,
    tags: config.tags,
    doc: config.doc,
    Demo: () => <AngularBridgeDemo config={config} />,
    Exercise: () => <AngularBridgeExercise config={config} />,
  };
}
