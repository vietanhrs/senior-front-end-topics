import { useMemo, useState } from 'react';
import { Badge, Button, Code, Group, List, Slider, Stack, Text, TextInput } from '@mantine/core';
import { IconArrowBackUp, IconArrowForwardUp } from '@tabler/icons-react';
import { Callout, DemoCard } from '@sfe/workbook';

type Event =
  | { type: 'add'; id: number; text: string }
  | { type: 'toggle'; id: number }
  | { type: 'remove'; id: number };

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

// The `apply` function: fold one event into state. State is purely derived.
function apply(todos: Todo[], e: Event): Todo[] {
  switch (e.type) {
    case 'add':
      return [...todos, { id: e.id, text: e.text, done: false }];
    case 'toggle':
      return todos.map((t) => (t.id === e.id ? { ...t, done: !t.done } : t));
    case 'remove':
      return todos.filter((t) => t.id !== e.id);
  }
}

export function Demo() {
  const [log, setLog] = useState<Event[]>([]);
  const [cursor, setCursor] = useState(0); // how many events are applied (for time-travel/undo)
  const [text, setText] = useState('');
  const idRef = useState(() => ({ n: 1 }))[0];

  // Derived state = fold the first `cursor` events. Pure projection.
  const todos = useMemo(() => log.slice(0, cursor).reduce(apply, [] as Todo[]), [log, cursor]);

  function append(makeEvent: (id: number) => Event) {
    // Appending after an undo truncates the "future" (redo) events.
    const truncated = log.slice(0, cursor);
    const ev = makeEvent(idRef.n++);
    setLog([...truncated, ev]);
    setCursor(truncated.length + 1);
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="State is derived from the event log">
        Every action appends an immutable event. The todo list is just{' '}
        <code>events.slice(0, cursor).reduce(apply)</code>. Drag the time-travel slider to render
        the state at any point in history; Undo/Redo just move the cursor.
      </Callout>

      <DemoCard
        title="Event-sourced todo list"
        right={
          <Group gap="xs">
            <Button size="xs" variant="default" leftSection={<IconArrowBackUp size={14} />} disabled={cursor === 0} onClick={() => setCursor((c) => c - 1)}>
              Undo
            </Button>
            <Button size="xs" variant="default" leftSection={<IconArrowForwardUp size={14} />} disabled={cursor === log.length} onClick={() => setCursor((c) => c + 1)}>
              Redo
            </Button>
          </Group>
        }
      >
        <Group align="flex-end" mb="md">
          <TextInput label="New todo" value={text} onChange={(e) => setText(e.currentTarget.value)} style={{ flex: 1 }} />
          <Button
            disabled={!text.trim()}
            onClick={() => {
              append((id) => ({ type: 'add', id, text: text.trim() }));
              setText('');
            }}
          >
            Add (append event)
          </Button>
        </Group>

        <List spacing={4}>
          {todos.map((t) => (
            <List.Item key={t.id}>
              <Group gap="xs">
                <Text td={t.done ? 'line-through' : undefined} c={t.done ? 'dimmed' : undefined}>
                  {t.text}
                </Text>
                <Button size="compact-xs" variant="subtle" onClick={() => append(() => ({ type: 'toggle', id: t.id }))}>
                  toggle
                </Button>
                <Button size="compact-xs" variant="subtle" color="red" onClick={() => append(() => ({ type: 'remove', id: t.id }))}>
                  remove
                </Button>
              </Group>
            </List.Item>
          ))}
          {todos.length === 0 && <Text c="dimmed" size="sm">No todos at this point in history.</Text>}
        </List>
      </DemoCard>

      <DemoCard
        title="The log (source of truth)"
        right={
          <Badge variant="light">
            applied {cursor} / {log.length}
          </Badge>
        }
      >
        {log.length > 0 && (
          <Slider mb="md" min={0} max={log.length} value={cursor} onChange={setCursor} label={(v) => `t=${v}`} />
        )}
        <Stack gap={2}>
          {log.map((e, i) => (
            <Code key={i} c={i < cursor ? undefined : 'dimmed'} block style={{ opacity: i < cursor ? 1 : 0.45 }}>
              {i}: {JSON.stringify(e)}
            </Code>
          ))}
          {log.length === 0 && <Text c="dimmed" size="sm">Append an event to start the log.</Text>}
        </Stack>
      </DemoCard>
    </Stack>
  );
}
