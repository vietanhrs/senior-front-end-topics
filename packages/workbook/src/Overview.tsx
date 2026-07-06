import { Card, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useWorkbook } from './context';
import { getLevelLabel, getSectionLabel } from './types';

export function Overview() {
  const { level, base } = useWorkbook();
  const levelLabel = getLevelLabel(level);
  const sectionLabel = getSectionLabel(level);
  const navigate = useNavigate();
  return (
    <Container size="lg" pb={80}>
      <Stack gap="xs" mb="xl">
        <Title order={1}>
          {sectionLabel} {levelLabel} — {level.title}
        </Title>
        <Text c="dimmed" size="lg">
          {level.tagline}
        </Text>
        <Text>
          Each concept has 3 parts: <b>Theory</b> (in-depth markdown + references), an
          interactive <b>Demo</b> to observe real browser behavior, and an <b>Exercise</b> for
          you to complete/fix/improve the code. Open DevTools (Console, Network, Performance)
          while running a demo to see exactly what's happening.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {level.concepts.map((c, i) => (
          <Card
            key={c.slug}
            withBorder
            radius="md"
            padding="lg"
            className="transition-shadow hover:shadow-md cursor-pointer"
            onClick={() => navigate(`${base}/${c.slug}`)}
          >
            <Group justify="space-between" align="flex-start">
              <Text size="xs" fw={700} c="indigo">
                {String(i + 1).padStart(2, '0')}
              </Text>
              <IconArrowRight size={16} className="opacity-40" />
            </Group>
            <Title order={4} mt={4}>
              {c.title}
            </Title>
            <Text size="sm" c="dimmed" mt={4}>
              {c.summary}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
