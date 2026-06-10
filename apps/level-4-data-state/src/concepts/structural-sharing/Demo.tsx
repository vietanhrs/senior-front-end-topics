import { useMemo, useState } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface State {
  user: { profile: { name: string }; settings: { theme: string } };
  posts: { id: number; title: string }[];
}

const INITIAL: State = {
  user: { profile: { name: 'Ada' }, settings: { theme: 'dark' } },
  posts: [
    { id: 1, title: 'Hello' },
    { id: 2, title: 'World' },
  ],
};

const NODES: { path: string; get: (s: State) => unknown }[] = [
  { path: 'root', get: (s) => s },
  { path: 'user', get: (s) => s.user },
  { path: 'user.profile', get: (s) => s.user.profile },
  { path: 'user.settings', get: (s) => s.user.settings },
  { path: 'posts', get: (s) => s.posts },
];

export function Demo() {
  const [prev, setPrev] = useState<State>(INITIAL);
  const [next, setNext] = useState<State>(INITIAL);
  const [counter, setCounter] = useState(0);

  function updateShared() {
    setPrev(next);
    setNext((s) => ({
      ...s, // new root
      user: {
        ...s.user, // new user
        profile: { ...s.user.profile, name: `Ada #${counter + 1}` }, // new profile + change
        // settings NOT spread → shared
      },
      // posts NOT spread → shared
    }));
    setCounter((c) => c + 1);
  }

  function updateDeepClone() {
    setPrev(next);
    setNext((s) => {
      const clone: State = JSON.parse(JSON.stringify(s)); // everything becomes a new reference
      clone.user.profile.name = `Ada #${counter + 1}`;
      return clone;
    });
    setCounter((c) => c + 1);
  }

  const rows = useMemo(
    () =>
      NODES.map((n) => ({
        path: n.path,
        shared: n.get(prev) === n.get(next),
      })),
    [prev, next],
  );

  return (
    <Stack gap="md">
      <Callout kind="info" title="Watch which nodes keep their reference">
        Update <code>user.profile.name</code> two ways. With <b>structural sharing</b>, only the
        nodes on the path (root → user → profile) get new references; <code>settings</code> and{' '}
        <code>posts</code> stay <b>shared</b> (<code>prev.x === next.x</code>). With a <b>deep
        clone</b>, every node is new — which breaks <code>===</code>-based memoization everywhere.
      </Callout>

      <DemoCard
        title="prev vs next — reference identity per node"
        right={
          <Group gap="xs">
            <Button size="xs" onClick={updateShared}>
              Update (structural sharing)
            </Button>
            <Button size="xs" color="orange" variant="light" onClick={updateDeepClone}>
              Update (deep clone)
            </Button>
          </Group>
        }
      >
        <Stack gap={6}>
          {rows.map((r) => (
            <Group key={r.path} justify="space-between" className="rounded-md border px-3 py-2">
              <Text ff="monospace" size="sm">
                {r.path}
              </Text>
              <Badge color={r.shared ? 'teal' : 'red'} variant={r.shared ? 'light' : 'filled'}>
                {r.shared ? 'prev === next (shared)' : 'new reference'}
              </Badge>
            </Group>
          ))}
        </Stack>
        <Text size="sm" mt="md">
          Current name: <b>{next.user.profile.name}</b> · updates: {counter}
        </Text>
        <Text size="xs" c="dimmed" mt={4}>
          A `React.memo` component reading `posts` re-renders only when `posts`' reference changes —
          true after a deep clone (wasteful), false after a structural-sharing update (correct).
        </Text>
      </DemoCard>
    </Stack>
  );
}
