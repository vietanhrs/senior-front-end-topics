import { Suspense, use, useState, useTransition } from 'react';
import { Badge, Button, Group, Loader, Paper, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// A stable promise cache keyed by version. Components `use()` these promises and
// suspend until they resolve. Caching is essential — a new promise each render
// would loop the fallback forever.
const cache = new Map<string, Promise<string>>();
function fetchData(label: string, version: number, ms: number): Promise<string> {
  const key = `${label}-${version}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      new Promise((resolve) => setTimeout(() => resolve(`${label} v${version} · loaded ${new Date().toLocaleTimeString()}`), ms)),
    );
  }
  return cache.get(key)!;
}

function Panel({ label, version, ms, color }: { label: string; version: number; ms: number; color: string }) {
  const data = use(fetchData(label, version, ms));
  return (
    <Paper withBorder p="sm" radius="md" bg={`var(--mantine-color-${color}-light)`}>
      <Text size="sm">{data}</Text>
    </Paper>
  );
}

function Fallback({ what }: { what: string }) {
  return (
    <Group gap="xs" p="sm">
      <Loader size="xs" />
      <Text size="sm" c="dimmed">
        Loading {what}…
      </Text>
    </Group>
  );
}

export function Demo() {
  const [version, setVersion] = useState(1);
  const [useTransitionMode, setUseTransitionMode] = useState(true);
  const [isPending, startTransition] = useTransition();

  function reload() {
    if (useTransitionMode) {
      startTransition(() => setVersion((v) => v + 1)); // keep old content, no fallback flash
    } else {
      setVersion((v) => v + 1); // shows the fallback again
    }
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="What to watch">
        The sidebar text renders instantly. The outer panel and the nested inner panel each wait
        as their own unit with their own fallback (inner is slower, so it reveals later). Toggle
        the transition switch and hit Reload: with transitions on, already-visible content stays
        put instead of flashing back to a skeleton.
      </Callout>

      <Group justify="space-between">
        <Switch
          label="Reload inside a transition (avoid fallback flash)"
          checked={useTransitionMode}
          onChange={(e) => setUseTransitionMode(e.currentTarget.checked)}
        />
        <Button size="xs" onClick={reload} rightSection={isPending ? <Loader size={12} /> : null}>
          Reload (v{version})
        </Button>
      </Group>

      <DemoCard title="Boundaries & progressive reveal">
        <Group align="flex-start" grow>
          <Paper withBorder p="sm" radius="md">
            <Badge variant="light" mb="xs">
              Sidebar (outside any boundary)
            </Badge>
            <Text size="sm" c="dimmed">
              Renders immediately — never blocked by the suspending panels.
            </Text>
          </Paper>

          <Stack gap="xs" style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 120ms' }}>
            <Suspense fallback={<Fallback what="the outer panel" />}>
              <Panel label="Outer profile" version={version} ms={1000} color="indigo" />
              <Suspense fallback={<Fallback what="comments (nested)" />}>
                <Panel label="Nested comments" version={version} ms={2200} color="grape" />
              </Suspense>
            </Suspense>
          </Stack>
        </Group>
      </DemoCard>
    </Stack>
  );
}
