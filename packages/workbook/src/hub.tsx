import {
  AppShell,
  Badge,
  Burger,
  Card,
  Container,
  Group,
  NavLink,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowRight, IconLock, IconStairs } from '@tabler/icons-react';
import {
  Navigate,
  NavLink as RouterNavLink,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { WorkbookProvider } from './context';
import { ROADMAP } from './curriculum';
import type { LevelMeta } from './types';

/**
 * Resolves the `:levelId` route param to a level and provides the workbook
 * context for the nested Overview/ConceptPage routes. Links inside them are
 * prefixed with `/​<levelId>` via `base`.
 */
export function LevelScope({ levels }: { levels: LevelMeta[] }) {
  const { levelId } = useParams();
  const level = levels.find((l) => String(l.level) === levelId);
  if (!level) return <Navigate to="/" replace />;
  return (
    <WorkbookProvider value={{ level, base: `/${levelId}`, levels }}>
      <Outlet />
    </WorkbookProvider>
  );
}

/** App shell for the multi-level hub: header + a navbar listing every level. */
export function HubShell({ levels }: { levels: LevelMeta[] }) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const location = useLocation();
  const activeLevelId = location.pathname.split('/')[1] ?? '';
  const activeLevel = levels.find((l) => String(l.level) === activeLevelId);
  const totalConcepts = levels.reduce((n, l) => n + l.concepts.length, 0);
  const planned = ROADMAP.filter((r) => !levels.some((l) => l.level === r.level));

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 320, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <ThemeIcon variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} radius="md">
              <IconStairs size={18} />
            </ThemeIcon>
            <div>
              <Title order={5} lh={1}>
                Senior Front-end Workbook
              </Title>
              <Text size="xs" c="dimmed">
                {activeLevel ? `Level ${activeLevel.level} · ${activeLevel.title}` : 'All levels'}
              </Text>
            </div>
          </Group>
          <Badge variant="light" visibleFrom="sm">
            {levels.length} levels · {totalConcepts} concepts
          </Badge>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <AppShell.Section grow component={ScrollArea}>
          <NavLink
            component={RouterNavLink}
            to="/"
            label="All levels"
            active={location.pathname === '/'}
            onClick={close}
          />
          {levels.map((lv) => {
            const id = String(lv.level);
            const isActive = activeLevelId === id;
            return (
              <Stack key={id} gap={0}>
                <NavLink
                  component={RouterNavLink}
                  to={`/${id}`}
                  label={
                    <Text size="sm" fw={isActive ? 600 : 400}>
                      L{lv.level} · {lv.title}
                    </Text>
                  }
                  active={isActive}
                  onClick={close}
                />
                {isActive && lv.concepts.map((c, i) => (
                  <NavLink
                    key={c.slug}
                    component={RouterNavLink}
                    to={`/${id}/${c.slug}`}
                    active={location.pathname === `/${id}/${c.slug}`}
                    onClick={close}
                    label={
                      <Group gap={6} wrap="nowrap">
                        <Text size="xs" c="dimmed" w={18}>
                          {String(i + 1).padStart(2, '0')}
                        </Text>
                        <Text size="sm">{c.title}</Text>
                      </Group>
                    }
                  />
                ))}
              </Stack>
            );
          })}

          {planned.length > 0 && (
            <>
              <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" mt="lg" mb={4}>
                Coming soon
              </Text>
              <Stack gap={2} px="xs" pb="md">
                {planned.map((r) => (
                  <Group key={r.level} gap="xs" wrap="nowrap" py={4}>
                    <ThemeIcon size="sm" variant="light" color="gray">
                      <IconLock size={12} />
                    </ThemeIcon>
                    <Text size="xs" c="dimmed">
                      L{r.level} · {r.title}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </>
          )}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

/** Landing page of the hub: one card per level (+ locked planned levels). */
export function HubOverview({ levels }: { levels: LevelMeta[] }) {
  const navigate = useNavigate();
  const planned = ROADMAP.filter((r) => !levels.some((l) => l.level === r.level));

  return (
    <Container size="lg" pb={80}>
      <Stack gap="xs" mb="xl">
        <Title order={1}>Senior Front-end Workbook</Title>
        <Text c="dimmed" size="lg">
          Interactive deep dives for senior front-end engineers — theory, observable demos, and
          fix-it exercises for every concept.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {levels.map((lv) => (
          <Card
            key={lv.level}
            withBorder
            radius="md"
            padding="lg"
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => navigate(`/${lv.level}`)}
          >
            <Group justify="space-between" align="flex-start">
              <Badge variant="light">Level {lv.level}</Badge>
              <IconArrowRight size={16} className="opacity-40" />
            </Group>
            <Title order={4} mt={6}>
              {lv.title}
            </Title>
            <Text size="sm" c="dimmed" mt={4}>
              {lv.tagline}
            </Text>
            <Text size="xs" c="dimmed" mt="sm">
              {lv.concepts.length} concepts ·{' '}
              {lv.concepts
                .slice(0, 3)
                .map((c) => c.title)
                .join(' · ')}
              …
            </Text>
          </Card>
        ))}

        {planned.map((r) => (
          <Card key={r.level} withBorder radius="md" padding="lg" style={{ opacity: 0.55 }}>
            <Group justify="space-between" align="flex-start">
              <Badge variant="light" color="gray">
                Level {r.level}
              </Badge>
              <IconLock size={16} className="opacity-40" />
            </Group>
            <Title order={4} mt={6}>
              {r.title}
            </Title>
            <Text size="xs" c="dimmed" mt="sm">
              Coming soon · {r.concepts.slice(0, 4).join(' · ')}…
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}
