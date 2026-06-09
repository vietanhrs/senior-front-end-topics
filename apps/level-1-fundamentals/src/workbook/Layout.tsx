import {
  AppShell,
  Badge,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLock, IconStairs } from '@tabler/icons-react';
import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom';
import { LEVEL } from '../concepts';
import { ROADMAP } from './curriculum';

export function Layout() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const location = useLocation();

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
                Level {LEVEL.level} · {LEVEL.title}
              </Title>
              <Text size="xs" c="dimmed">
                {LEVEL.tagline}
              </Text>
            </div>
          </Group>
          <Badge variant="light" visibleFrom="sm">
            Senior Front-end Workbook
          </Badge>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <AppShell.Section grow component={ScrollArea}>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" mt="xs" mb={4}>
            Concepts
          </Text>
          <NavLink
            component={RouterNavLink}
            to="/"
            label="Tổng quan"
            active={location.pathname === '/'}
            onClick={close}
          />
          {LEVEL.concepts.map((c, i) => (
            <NavLink
              key={c.slug}
              component={RouterNavLink}
              to={`/${c.slug}`}
              active={location.pathname === `/${c.slug}`}
              onClick={close}
              label={
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" c="dimmed" w={20}>
                    {String(i + 1).padStart(2, '0')}
                  </Text>
                  <Text size="sm">{c.title}</Text>
                </Group>
              }
              description={c.summary}
            />
          ))}

          <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" mt="lg" mb={4}>
            Roadmap (levels khác)
          </Text>
          <Stack gap={2} px="xs" pb="md">
            {ROADMAP.filter((l) => l.status === 'planned').map((l) => (
              <Tooltip
                key={l.level}
                multiline
                w={260}
                label={l.concepts.join(' · ')}
                position="right"
                withArrow
              >
                <Group gap="xs" wrap="nowrap" py={4}>
                  <ThemeIcon size="sm" variant="light" color="gray">
                    <IconLock size={12} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed">
                    L{l.level} · {l.title}
                  </Text>
                </Group>
              </Tooltip>
            ))}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
