import { useReducer, useState } from 'react';
import { Alert, Badge, Button, Group, Stack, Switch, Text } from '@mantine/core';
import { Callout, DemoCard, LogConsole, useLogger } from '@sfe/workbook';

type Status = 'idle' | 'loading' | 'success' | 'error';
type Event = 'FETCH' | 'RESOLVE' | 'REJECT' | 'CANCEL' | 'RETRY';

const TRANSITIONS: Record<Status, Partial<Record<Event, Status>>> = {
  idle: { FETCH: 'loading' },
  loading: { RESOLVE: 'success', REJECT: 'error', CANCEL: 'idle' },
  success: { FETCH: 'loading' },
  error: { RETRY: 'loading' },
};

const ALL_EVENTS: Event[] = ['FETCH', 'RESOLVE', 'REJECT', 'CANCEL', 'RETRY'];
const STATUS_COLOR: Record<Status, string> = { idle: 'gray', loading: 'blue', success: 'teal', error: 'red' };

export function Demo() {
  const { logs, log, clear } = useLogger();
  const [status, send] = useReducer((state: Status, event: Event): Status => {
    const next = TRANSITIONS[state][event];
    return next ?? state;
  }, 'idle');

  function dispatch(event: Event) {
    const next = TRANSITIONS[status][event];
    if (next) log(`${status} --${event}--> ${next}`, 'success');
    else log(`${event} ignored in state "${status}" (invalid transition)`, 'error');
    send(event);
  }

  // Boolean-soup comparison
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [ok, setOk] = useState(false);
  const impossible = [loading, error, ok].filter(Boolean).length > 1;

  return (
    <Stack gap="md">
      <Callout kind="info" title="FSM vs boolean soup">
        Top: a finite state machine — only valid events transition; everything else is ignored, so
        impossible states can't occur. Bottom: three independent booleans — flip more than one and
        you reach an <b>impossible state</b> (e.g. loading AND error) that real code then has to
        defend against.
      </Callout>

      <DemoCard
        title="Fetch machine"
        right={
          <Badge size="lg" color={STATUS_COLOR[status]} variant="filled">
            state: {status}
          </Badge>
        }
      >
        <Text size="sm" c="dimmed" mb="xs">
          Valid events from <b>{status}</b>: {Object.keys(TRANSITIONS[status]).join(', ') || '(none)'}
        </Text>
        <Group gap="xs" mb="md">
          {ALL_EVENTS.map((e) => {
            const valid = !!TRANSITIONS[status][e];
            return (
              <Button key={e} size="xs" variant={valid ? 'filled' : 'default'} color={valid ? 'indigo' : 'gray'} onClick={() => dispatch(e)}>
                {e}
              </Button>
            );
          })}
          <Button size="xs" variant="subtle" onClick={clear}>
            clear log
          </Button>
        </Group>
        <LogConsole logs={logs} height={140} empty="Send events; invalid ones are ignored." />
      </DemoCard>

      <DemoCard
        title="The same UI as 'boolean soup'"
        right={
          <Badge color={impossible ? 'red' : 'teal'} variant="filled">
            {impossible ? 'IMPOSSIBLE STATE' : 'valid'}
          </Badge>
        }
      >
        <Group>
          <Switch label="isLoading" checked={loading} onChange={(e) => setLoading(e.currentTarget.checked)} />
          <Switch label="isError" checked={error} onChange={(e) => setError(e.currentTarget.checked)} />
          <Switch label="isSuccess" checked={ok} onChange={(e) => setOk(e.currentTarget.checked)} />
        </Group>
        {impossible && (
          <Alert color="red" variant="light" mt="md">
            More than one flag is true — e.g. a spinner over an error, or success without data. With
            4 booleans, 16 combinations exist but only a few are valid; the FSM above makes these
            unreachable.
          </Alert>
        )}
      </DemoCard>
    </Stack>
  );
}
