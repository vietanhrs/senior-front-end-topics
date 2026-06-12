import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Group, Skeleton, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface User {
  name: string;
  email: string;
  role: string;
}

const FAKES: User[] = [
  { name: 'Ada Lovelace', email: 'ada@calc.io', role: 'Engineer' },
  { name: 'Alan Turing', email: 'alan@enigma.dev', role: 'Researcher' },
  { name: 'Grace Hopper', email: 'grace@navy.mil', role: 'Architect' },
];
let idx = 0;
const fetchUser = () =>
  new Promise<User>((resolve) => setTimeout(() => resolve(FAKES[idx++ % FAKES.length]), 600));

// ---- Presentational: pure, prop-driven, no idea where data comes from ----
function UserCard({
  user,
  loading,
  onRefresh,
}: {
  user: User | null;
  loading: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className="rounded-md border p-3" style={{ minWidth: 220 }}>
      {loading || !user ? (
        <Stack gap={6}>
          <Skeleton h={16} w="60%" />
          <Skeleton h={12} w="80%" />
        </Stack>
      ) : (
        <Stack gap={4}>
          <Group justify="space-between">
            <Text fw={600}>{user.name}</Text>
            <Badge size="xs" variant="light">{user.role}</Badge>
          </Group>
          <Text size="sm" c="dimmed">{user.email}</Text>
        </Stack>
      )}
      {onRefresh && <Button size="compact-xs" variant="light" mt={8} onClick={onRefresh} disabled={loading}>Refresh</Button>}
    </div>
  );
}

// ---- Container: owns data + behavior, passes props down ----
function UserCardContainer() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    fetchUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);
  useEffect(() => { load(); }, [load]);
  return <UserCard user={user} loading={loading} onRefresh={load} />;
}

export function Demo() {
  return (
    <Stack gap="md">
      <Callout kind="info" title="Same view, driven by props vs by a container">
        <code>UserCard</code> is <b>presentational</b> — it only renders props, so it works with any
        data source and is trivial to render in every state. <code>UserCardContainer</code> is the{' '}
        <b>container</b> — it fetches and feeds the card. Below, the same <code>UserCard</code> is
        rendered with hard-coded props (left) and wired to live data (right).
      </Callout>

      <Group grow align="flex-start">
        <DemoCard title="Presentational only (static props)">
          <Stack>
            <UserCard user={{ name: 'Static User', email: 'static@props.dev', role: 'Demo' }} loading={false} />
            <UserCard user={null} loading={true} />
            <Text size="xs" c="dimmed">no fetch, no mocking — just props in different states</Text>
          </Stack>
        </DemoCard>
        <DemoCard title="Container → presentational (live data)">
          <Stack>
            <UserCardContainer />
            <Text size="xs" c="dimmed">container fetches + passes props; the card is unchanged</Text>
          </Stack>
        </DemoCard>
      </Group>
    </Stack>
  );
}
