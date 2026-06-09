import { Card, Container, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { LEVEL } from '../concepts';

export function Overview() {
  const navigate = useNavigate();
  return (
    <Container size="lg" pb={80}>
      <Stack gap="xs" mb="xl">
        <Title order={1}>
          Level {LEVEL.level} — {LEVEL.title}
        </Title>
        <Text c="dimmed" size="lg">
          {LEVEL.tagline}
        </Text>
        <Text>
          Mỗi concept gồm 3 phần: <b>Lý thuyết</b> (markdown đủ sâu + references),{' '}
          <b>Demo</b> tương tác để quan sát hành vi thật trong trình duyệt, và <b>Bài tập</b>{' '}
          để bạn tự hoàn thiện/sửa/cải tiến code. Mở DevTools (Console, Network, Performance)
          khi chạy demo để thấy rõ điều đang diễn ra.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {LEVEL.concepts.map((c, i) => (
          <Card
            key={c.slug}
            withBorder
            radius="md"
            padding="lg"
            className="transition-shadow hover:shadow-md cursor-pointer"
            onClick={() => navigate(`/${c.slug}`)}
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
