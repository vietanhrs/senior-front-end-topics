import { useState } from 'react';
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

export interface NginxConceptConfig {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  doc: string;
  requestStory: string;
  config: string;
  decisionRows: Array<{
    directive: string;
    purpose: string;
    pitfall: string;
  }>;
  exercise: {
    prompt: string;
    answer: string;
    checklist: string[];
  };
}

function NginxDemo({ config }: { config: NginxConceptConfig }) {
  const [view, setView] = useState<'flow' | 'config' | 'review'>('flow');

  return (
    <Stack gap="md">
      <Callout kind="info" title="Read Nginx as a request router">
        For front-end work, Nginx usually sits between the browser, static assets, APIs, and edge
        caches. Every directive should answer where a request goes and what headers survive.
      </Callout>

      <SegmentedControl
        value={view}
        onChange={(value) => setView(value as typeof view)}
        data={[
          { value: 'flow', label: 'Request flow' },
          { value: 'config', label: 'Config shape' },
          { value: 'review', label: 'Review traps' },
        ]}
      />

      {view === 'flow' && (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <DemoCard title="Request story">
            <Text>{config.requestStory}</Text>
          </DemoCard>
          <DemoCard title="Senior question">
            <Text>
              What happens to this request under refresh, deploy rollback, upstream failure, cache
              revalidation, and a malicious client?
            </Text>
          </DemoCard>
        </SimpleGrid>
      )}

      {view === 'config' && (
        <DemoCard title="Representative Nginx config" right={<Badge variant="light">nginx.conf</Badge>}>
          <CodeHighlight code={config.config} language="nginx" radius="md" withCopyButton />
        </DemoCard>
      )}

      {view === 'review' && (
        <DemoCard title="Directive review">
          <Table withTableBorder withColumnBorders verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Directive / area</Table.Th>
                <Table.Th>Purpose</Table.Th>
                <Table.Th>Common pitfall</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {config.decisionRows.map((row) => (
                <Table.Tr key={row.directive}>
                  <Table.Td>
                    <Code>{row.directive}</Code>
                  </Table.Td>
                  <Table.Td>{row.purpose}</Table.Td>
                  <Table.Td>{row.pitfall}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </DemoCard>
      )}
    </Stack>
  );
}

function NginxExercise({ config }: { config: NginxConceptConfig }) {
  return (
    <Stack gap="md">
      <DemoCard title="Exercise: production config review" description={config.exercise.prompt}>
        <Text size="sm" c="dimmed">
          Answer as the front-end owner who must keep refreshes, assets, APIs, headers, and rollback
          behavior reliable.
        </Text>
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Nginx bugs often hide in fallback order, missing forwarded headers, stale cache policy, or
        config that works only for the happy path.
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
          </Stack>
        }
      />
    </Stack>
  );
}

export function makeNginxConcept(config: NginxConceptConfig): ConceptModule {
  return {
    slug: config.slug,
    title: config.title,
    summary: config.summary,
    tags: config.tags,
    doc: config.doc,
    Demo: () => <NginxDemo config={config} />,
    Exercise: () => <NginxExercise config={config} />,
  };
}

export function nginx(strings: TemplateStringsArray) {
  return strings[0].trim();
}
