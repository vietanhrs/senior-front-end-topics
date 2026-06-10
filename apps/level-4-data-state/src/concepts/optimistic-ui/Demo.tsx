import { useState } from 'react';
import { ActionIcon, Badge, Group, Loader, Stack, Switch, Text } from '@mantine/core';
import { IconHeart, IconHeartFilled } from '@tabler/icons-react';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

interface Item {
  id: number;
  label: string;
  liked: boolean;
  likes: number;
  pending: boolean;
}

const INITIAL: Item[] = [
  { id: 1, label: 'Optimistic post A', liked: false, likes: 12, pending: false },
  { id: 2, label: 'Optimistic post B', liked: true, likes: 30, pending: false },
  { id: 3, label: 'Optimistic post C', liked: false, likes: 4, pending: false },
];

function fakeServer(shouldFail: boolean, ms = 900): Promise<void> {
  return new Promise((resolve, reject) => setTimeout(() => (shouldFail ? reject(new Error('500 server error')) : resolve()), ms));
}

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [items, setItems] = useState<Item[]>(INITIAL);
  const [failNext, setFailNext] = useState(false);

  function toggleLike(id: number) {
    const target = items.find((i) => i.id === id);
    if (!target || target.pending) return;
    const wasLiked = target.liked;

    // Optimistic update (instant) — functional + targeted so concurrent toggles don't clobber.
    setItems((cur) =>
      cur.map((i) => (i.id === id ? { ...i, liked: !i.liked, likes: i.likes + (i.liked ? -1 : 1), pending: true } : i)),
    );
    log(`optimistic: post ${id} → ${!wasLiked ? 'liked' : 'unliked'} (pending server)`, 'macro');

    fakeServer(failNext)
      .then(() => {
        // Reconcile: clear pending; in a real app, replace with the server's returned value.
        setItems((cur) => cur.map((i) => (i.id === id ? { ...i, pending: false } : i)));
        log(`server OK for post ${id} → kept`, 'success');
      })
      .catch((err) => {
        // Roll back ONLY this item (targeted revert), restoring its prior liked/count.
        setItems((cur) =>
          cur.map((i) => (i.id === id ? { ...i, liked: wasLiked, likes: i.likes + (wasLiked ? 1 : -1), pending: false } : i)),
        );
        log(`server FAILED for post ${id} (${err.message}) → rolled back`, 'error');
      });
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Instant UI, with rollback on failure">
        Clicking a heart updates immediately (optimistic). Toggle "next request fails" to force the
        server to reject — watch the like revert and an error logged. The revert is <b>targeted</b>{' '}
        (only the affected post), so it's safe even with several toggles in flight.
      </Callout>

      <Switch
        label="Next request fails (force rollback)"
        checked={failNext}
        onChange={(e) => setFailNext(e.currentTarget.checked)}
      />

      <DemoCard title="Optimistic likes">
        <Stack gap="xs">
          {items.map((i) => (
            <Group key={i.id} justify="space-between" className="rounded-md border px-3 py-2">
              <Text size="sm">{i.label}</Text>
              <Group gap="sm">
                <Badge variant="light">{i.likes} likes</Badge>
                {i.pending && <Loader size="xs" />}
                <ActionIcon variant="subtle" color="red" onClick={() => toggleLike(i.id)} aria-label="like">
                  {i.liked ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
                </ActionIcon>
              </Group>
            </Group>
          ))}
        </Stack>
        <Group mt="sm">
          <Text size="xs" c="dimmed">
            Server latency ~900ms; tip several hearts quickly with "fail" on/off to see concurrent
            optimistic updates and independent rollbacks.
          </Text>
        </Group>
      </DemoCard>

      <Group justify="flex-end">
        <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }} onClick={clear}>
          clear log
        </Text>
      </Group>
      <LogConsole logs={logs} height={160} empty="Tap a heart to see the optimistic → confirm/rollback flow." />
    </Stack>
  );
}
