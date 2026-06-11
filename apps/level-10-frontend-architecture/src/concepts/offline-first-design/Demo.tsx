import { useEffect, useRef, useState } from 'react';
import { Badge, Button, Group, Stack, Switch, Text, TextInput } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type SyncState = 'synced' | 'pending' | 'syncing';

interface Todo {
  id: string;
  text: string;
  state: SyncState;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState('Buy milk');
  const outbox = useRef<string[]>([]); // ids queued while offline
  const [outboxLen, setOutboxLen] = useState(0);

  // Reflect REAL connectivity events (in addition to the manual toggle).
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const syncOne = async (id: string) => {
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, state: 'syncing' } : x)));
    await delay(450); // simulate the server round-trip (idempotent by id)
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, state: 'synced' } : x)));
  };

  const flush = async () => {
    if (outbox.current.length === 0) return;
    log(`back online — flushing outbox (${outbox.current.length} queued write(s))`, 'macro');
    const queue = [...outbox.current];
    for (const id of queue) {
      await syncOne(id); // replay in order; idempotency key = id
      outbox.current = outbox.current.filter((x) => x !== id);
      setOutboxLen(outbox.current.length);
      log(`replayed write ${id.slice(0, 6)} → server ack`, 'success');
    }
    log('outbox empty — local and server are in sync', 'sync');
  };

  // When connectivity returns, flush the queue.
  useEffect(() => {
    if (online) flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const addTodo = () => {
    const text = draft.trim();
    if (!text) return;
    const id = crypto.randomUUID();
    // optimistic: apply to local store immediately, UI updates instantly
    setTodos((t) => [...t, { id, text, state: online ? 'syncing' : 'pending' }]);
    setDraft('');
    if (online) {
      log(`online: "${text}" written locally + syncing`, 'sync');
      syncOne(id);
    } else {
      outbox.current.push(id);
      setOutboxLen(outbox.current.length);
      log(`offline: "${text}" saved locally + queued in outbox (will replay on reconnect)`, 'macro');
    }
  };

  const stateBadge = (s: SyncState) =>
    s === 'synced'
      ? <Badge size="xs" color="teal" variant="light">synced</Badge>
      : s === 'syncing'
        ? <Badge size="xs" color="blue" variant="light">syncing…</Badge>
        : <Badge size="xs" color="orange" variant="light">pending (offline)</Badge>;

  return (
    <Stack gap="md">
      <Callout kind="info" title="Write offline, watch it queue and replay">
        Toggle the network offline and add todos: each is saved locally and applied to the UI
        <b> instantly</b> (optimistic), then queued in the <b>outbox</b>. Flip back online and the
        outbox <b>replays</b> in order to the server. The local store — not the network — drives the UI.
      </Callout>

      <Group>
        <Switch
          label={online ? 'online' : 'offline'}
          checked={online}
          onChange={(e) => setOnline(e.currentTarget.checked)}
          color="teal"
        />
        <Badge variant="light" color={online ? 'teal' : 'orange'}>
          navigator.onLine: {String(typeof navigator !== 'undefined' ? navigator.onLine : true)}
        </Badge>
        <Badge variant="light" color={outboxLen ? 'orange' : 'gray'}>outbox: {outboxLen}</Badge>
      </Group>

      <DemoCard title="Todos (local store)">
        <Stack gap="xs">
          <Group>
            <TextInput
              flex={1}
              value={draft}
              onChange={(e) => setDraft(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="add a todo…"
            />
            <Button onClick={addTodo}>Add</Button>
            <Button variant="subtle" onClick={() => { setTodos([]); outbox.current = []; setOutboxLen(0); clear(); }}>Clear</Button>
          </Group>
          {todos.length === 0 ? (
            <Text size="sm" c="dimmed">No todos — add some (try while offline).</Text>
          ) : (
            <Stack gap={4}>
              {todos.map((t) => (
                <Group key={t.id} justify="space-between">
                  <Text size="sm">{t.text}</Text>
                  {stateBadge(t.state)}
                </Group>
              ))}
            </Stack>
          )}
        </Stack>
      </DemoCard>

      <LogConsole logs={logs} height={150} empty="Go offline, add todos, then come back online." />
    </Stack>
  );
}
