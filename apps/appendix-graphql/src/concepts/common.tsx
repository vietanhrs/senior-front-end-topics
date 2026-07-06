import { useState } from 'react';
import {
  Badge,
  List,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal, type ConceptModule } from '@sfe/workbook';

export interface GraphQLConceptConfig {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  doc: string;
  problem: string;
  code: string;
  decisionRows: Array<{
    decision: string;
    good: string;
    risk: string;
  }>;
  exercise: {
    prompt: string;
    answer: string;
    checklist: string[];
  };
}

function GraphQLDemo({ config }: { config: GraphQLConceptConfig }) {
  const [view, setView] = useState<'problem' | 'code' | 'tradeoffs'>('problem');

  return (
    <Stack gap="md">
      <Callout kind="info" title="Think in contracts">
        GraphQL is strongest when schema, operations, cache keys, and error semantics are treated as
        product contracts, not just a different HTTP endpoint shape.
      </Callout>

      <SegmentedControl
        value={view}
        onChange={(value) => setView(value as typeof view)}
        data={[
          { value: 'problem', label: 'Problem' },
          { value: 'code', label: 'Concrete shape' },
          { value: 'tradeoffs', label: 'Trade-offs' },
        ]}
      />

      {view === 'problem' && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <DemoCard title="What this solves">
            <Text>{config.problem}</Text>
          </DemoCard>
          <DemoCard title="Senior question">
            <Text>
              Can this contract evolve without breaking old clients, creating invisible cache bugs,
              or moving backend cost into every screen?
            </Text>
          </DemoCard>
        </SimpleGrid>
      )}

      {view === 'code' && (
        <DemoCard title="Representative GraphQL shape" right={<Badge variant="light">GraphQL</Badge>}>
          <CodeHighlight code={config.code} language="graphql" radius="md" withCopyButton />
        </DemoCard>
      )}

      {view === 'tradeoffs' && (
        <DemoCard title="Design decisions to review">
          <Table withTableBorder withColumnBorders verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Decision</Table.Th>
                <Table.Th>Good answer</Table.Th>
                <Table.Th>Risk if ignored</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {config.decisionRows.map((row) => (
                <Table.Tr key={row.decision}>
                  <Table.Td>{row.decision}</Table.Td>
                  <Table.Td>{row.good}</Table.Td>
                  <Table.Td>{row.risk}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </DemoCard>
      )}
    </Stack>
  );
}

function GraphQLExercise({ config }: { config: GraphQLConceptConfig }) {
  return (
    <Stack gap="md">
      <DemoCard title="Exercise: design review prompt" description={config.exercise.prompt}>
        <Text size="sm" c="dimmed">
          Answer as if you are reviewing a production front-end feature that depends on this GraphQL
          contract.
        </Text>
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Cover both client ergonomics and backend blast radius. A GraphQL answer that only talks
        about syntax is incomplete.
      </Callout>

      <SolutionReveal
        language="md"
        code={config.exercise.answer}
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
            <Text size="xs" c="dimmed">
              Use exact field names, cache keys, and error cases in real code review comments.
            </Text>
          </Stack>
        }
      />
    </Stack>
  );
}

export function makeGraphQLConcept(config: GraphQLConceptConfig): ConceptModule {
  return {
    slug: config.slug,
    title: config.title,
    summary: config.summary,
    tags: config.tags,
    doc: config.doc,
    Demo: () => <GraphQLDemo config={config} />,
    Exercise: () => <GraphQLExercise config={config} />,
  };
}

export function gql(strings: TemplateStringsArray) {
  return strings[0].trim();
}
