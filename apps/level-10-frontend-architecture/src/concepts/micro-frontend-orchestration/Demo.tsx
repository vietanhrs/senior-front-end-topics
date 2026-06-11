import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Loader, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

type Status = 'loading' | 'ready' | 'failed';

interface Mfe {
  id: string;
  name: string;
  team: string;
  version: string;
  loadMs: number;
  status: Status;
  failNext: boolean;
}

const INITIAL: Mfe[] = [
  { id: 'nav', name: 'Top Nav', team: 'team-platform', version: '4.2.0', loadMs: 300, status: 'loading', failNext: false },
  { id: 'catalog', name: 'Product Catalog', team: 'team-catalog', version: '12.7.1', loadMs: 700, status: 'loading', failNext: false },
  { id: 'recs', name: 'Recommendations', team: 'team-ml', version: '2.0.3', loadMs: 1100, status: 'loading', failNext: false },
];

export function Demo() {
  const [mfes, setMfes] = useState<Mfe[]>(INITIAL);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const loadOne = (id: string) => {
    setMfes((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'loading' } : m)));
    const mfe = mfes.find((m) => m.id === id);
    const t = setTimeout(() => {
      setMfes((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: m.failNext ? 'failed' : 'ready' } : m)),
      );
    }, mfe?.loadMs ?? 500);
    timers.current.push(t);
  };

  useEffect(() => {
    INITIAL.forEach((m) => {
      const t = setTimeout(() => {
        setMfes((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: 'ready' } : x)));
      }, m.loadMs);
      timers.current.push(t);
    });
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFail = (id: string, failNext: boolean) => {
    setMfes((prev) => prev.map((m) => (m.id === id ? { ...m, failNext } : m)));
  };

  const redeploy = (id: string) => {
    setMfes((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const [maj, min, patch] = m.version.split('.').map(Number);
        return { ...m, version: `${maj}.${min}.${patch + 1}` };
      }),
    );
    loadOne(id);
  };

  const tileColor = (s: Status) => (s === 'ready' ? 'teal' : s === 'failed' ? 'red' : 'gray');

  return (
    <Stack gap="md">
      <Callout kind="info" title="One shell, independently-loaded remotes — failure stays contained">
        The app shell composes three MFEs that load independently (staggered). Flip a remote's "fail
        on next load" and redeploy it: that tile falls back to an error boundary while the shell and
        the other MFEs keep working. Each MFE also versions and deploys on its own.
      </Callout>

      <DemoCard title="App shell">
        <Stack gap="xs">
          <div className="rounded-md border-2 border-dashed p-2">
            <Text size="xs" c="dimmed" mb={6}>shell — owns routing, auth, theme, layout</Text>
            <Stack gap="sm">
              {mfes.map((m) => (
                <div
                  key={m.id}
                  className="rounded-md border p-3"
                  style={{ borderColor: `var(--mantine-color-${tileColor(m.status)}-4)` }}
                >
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Text size="sm" fw={600}>{m.name}</Text>
                      <Badge size="xs" variant="light">{m.team}</Badge>
                      <Badge size="xs" variant="outline">v{m.version}</Badge>
                    </Group>
                    {m.status === 'loading' && <Loader size="xs" />}
                    {m.status === 'ready' && <Badge size="xs" color="teal" variant="light">mounted</Badge>}
                    {m.status === 'failed' && <Badge size="xs" color="red" variant="light">error boundary fallback</Badge>}
                  </Group>
                  {m.status === 'failed' && (
                    <Text size="xs" c="red" mt={6}>⚠ this remote failed to load — isolated; siblings + shell unaffected</Text>
                  )}
                  <Group gap="xs" mt={8}>
                    <Switch
                      size="xs"
                      label="fail on next load"
                      checked={m.failNext}
                      onChange={(e) => toggleFail(m.id, e.currentTarget.checked)}
                    />
                    <Button size="compact-xs" variant="light" onClick={() => redeploy(m.id)}>
                      redeploy (bump version)
                    </Button>
                  </Group>
                </div>
              ))}
            </Stack>
          </div>
        </Stack>
      </DemoCard>

      <Text size="sm" c="dimmed">
        Notice: failing one remote never blanks the page. That failure isolation — plus per-team
        independent deploys — is the whole point. The cost is the orchestration you see here.
      </Text>
    </Stack>
  );
}
