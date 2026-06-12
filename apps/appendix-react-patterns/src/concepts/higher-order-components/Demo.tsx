import { useState, type ComponentType } from 'react';
import { Badge, Button, Group, Loader, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// ---- the HOC: adds a loading state around any component ----
function withLoading<P extends object>(Wrapped: ComponentType<P>) {
  function WithLoading({ isLoading, ...rest }: P & { isLoading: boolean }) {
    if (isLoading) {
      return (
        <Group gap="xs" p="md">
          <Loader size="sm" />
          <Text size="sm" c="dimmed">loading…</Text>
        </Group>
      );
    }
    return <Wrapped {...(rest as P)} />;
  }
  WithLoading.displayName = `withLoading(${Wrapped.displayName ?? Wrapped.name})`;
  return WithLoading;
}

// ---- a plain presentational component (knows nothing about loading) ----
function UserList({ users }: { users: string[] }) {
  return (
    <Stack gap={4}>
      {users.map((u) => (
        <Text key={u} size="sm">• {u}</Text>
      ))}
    </Stack>
  );
}

// wrap ONCE at module scope — never inside render
const UserListWithLoading = withLoading(UserList);

export function Demo() {
  const [loading, setLoading] = useState(false);
  const users = ['Ada', 'Alan', 'Grace'];

  const load = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <Stack gap="md">
      <Callout kind="info" title="An HOC wraps a component to inject behavior">
        <code>withLoading</code> takes <code>UserList</code> and returns a new component that shows a
        spinner while <code>isLoading</code> is true, otherwise renders the original with its props
        passed through. The wrapped component stays oblivious to loading.
      </Callout>

      <Group>
        <Button onClick={load} disabled={loading}>Simulate fetch</Button>
        <Badge variant="light" color="gray">displayName: {UserListWithLoading.displayName}</Badge>
      </Group>

      <DemoCard title="withLoading(UserList)">
        <UserListWithLoading isLoading={loading} users={users} />
      </DemoCard>

      <Text size="sm" c="dimmed">
        The same <code>withLoading</code> wraps any component. Note the <code>displayName</code>{' '}
        (DevTools clarity), the <code>...rest</code> pass-through, and that the wrapper is created
        once at module scope — creating it in render would remount the list every render.
      </Text>
    </Stack>
  );
}
