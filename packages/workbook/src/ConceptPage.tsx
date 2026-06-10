import { Badge, Button, Container, Group, Stack, Tabs, Text, Title } from '@mantine/core';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook2,
  IconFlask,
  IconPencil,
} from '@tabler/icons-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useWorkbook } from './context';
import { DocView } from './DocView';

export function ConceptPage() {
  const { level, base } = useWorkbook();
  const { slug } = useParams();
  const navigate = useNavigate();

  const index = level.concepts.findIndex((c) => c.slug === slug);
  if (index === -1) return <Navigate to={base || '/'} replace />;

  const concept = level.concepts[index];
  const prev = index > 0 ? level.concepts[index - 1] : null;
  const next = index < level.concepts.length - 1 ? level.concepts[index + 1] : null;
  const { Demo, Exercise } = concept;

  return (
    <Container size="lg" pb={80}>
      <Stack gap="lg">
        <Stack gap={4}>
          <Text size="sm" c="dimmed">
            Concept {String(index + 1).padStart(2, '0')} of {level.concepts.length}
          </Text>
          <Title order={2}>{concept.title}</Title>
          <Text c="dimmed">{concept.summary}</Text>
          <Group gap="xs" mt={4}>
            {concept.tags.map((t) => (
              <Badge key={t} variant="dot" color="indigo">
                {t}
              </Badge>
            ))}
          </Group>
        </Stack>

        <Tabs defaultValue="theory" keepMounted={false}>
          <Tabs.List>
            <Tabs.Tab value="theory" leftSection={<IconBook2 size={16} />}>
              Theory
            </Tabs.Tab>
            <Tabs.Tab value="demo" leftSection={<IconFlask size={16} />}>
              Demo
            </Tabs.Tab>
            {Exercise && (
              <Tabs.Tab value="exercise" leftSection={<IconPencil size={16} />}>
                Exercise
              </Tabs.Tab>
            )}
          </Tabs.List>

          <Tabs.Panel value="theory" pt="lg">
            <DocView markdown={concept.doc} />
          </Tabs.Panel>
          <Tabs.Panel value="demo" pt="lg">
            <Demo />
          </Tabs.Panel>
          {Exercise && (
            <Tabs.Panel value="exercise" pt="lg">
              <Exercise />
            </Tabs.Panel>
          )}
        </Tabs>

        <Group justify="space-between" mt="xl">
          <Button
            variant="default"
            leftSection={<IconArrowLeft size={16} />}
            disabled={!prev}
            onClick={() => prev && navigate(`${base}/${prev.slug}`)}
          >
            {prev ? prev.title : 'Start'}
          </Button>
          <Button
            variant="default"
            rightSection={<IconArrowRight size={16} />}
            disabled={!next}
            onClick={() => next && navigate(`${base}/${next.slug}`)}
          >
            {next ? next.title : 'End of level'}
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
