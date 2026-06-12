import { useReducer } from 'react';
import { Badge, Button, Group, Stack, Text } from '@mantine/core';
import { Callout } from '@sfe/workbook';

interface ToggleState {
  on: boolean;
  count: number;
}
type ToggleAction = { type: 'toggle' } | { type: 'reset' };
type StateReducer = (state: ToggleState, changes: ToggleState, action: ToggleAction) => ToggleState;

function internalReducer(state: ToggleState, action: ToggleAction): ToggleState {
  switch (action.type) {
    case 'toggle':
      return { on: !state.on, count: state.count + 1 };
    case 'reset':
      return { on: false, count: 0 };
  }
}

function useToggle({ stateReducer = (_s, changes) => changes }: { stateReducer?: StateReducer } = {}) {
  const [state, dispatch] = useReducer((state: ToggleState, action: ToggleAction) => {
    const changes = internalReducer(state, action);
    return stateReducer(state, changes, action); // consumer has the final say
  }, { on: false, count: 0 });
  return {
    ...state,
    toggle: () => dispatch({ type: 'toggle' }),
    reset: () => dispatch({ type: 'reset' }),
  };
}

function ToggleRow({ label, toggle }: { label: string; toggle: ReturnType<typeof useToggle> }) {
  return (
    <div className="rounded-md border p-3">
      <Group justify="space-between">
        <Text size="sm" fw={600}>{label}</Text>
        <Group gap="xs">
          <Badge variant="light" color={toggle.on ? 'teal' : 'gray'}>{toggle.on ? 'ON' : 'OFF'}</Badge>
          <Badge variant="light">toggles: {toggle.count}</Badge>
        </Group>
      </Group>
      <Group gap="xs" mt={8}>
        <Button size="compact-xs" onClick={toggle.toggle}>toggle</Button>
        <Button size="compact-xs" variant="subtle" onClick={toggle.reset}>reset</Button>
      </Group>
    </div>
  );
}

export function Demo() {
  // default: no extra rules
  const plain = useToggle();
  // SAME hook, but the consumer injects a rule: can't toggle more than 4 times
  const limited = useToggle({
    stateReducer(state, changes, action) {
      if (action.type === 'toggle' && state.count >= 4) return state; // veto
      return changes;
    },
  });

  return (
    <Stack gap="md">
      <Callout kind="info" title="Same hook, consumer-defined rules via a state reducer">
        Both rows use the identical <code>useToggle</code>. The right one passes a{' '}
        <code>stateReducer</code> that <b>vetoes</b> any toggle after 4 — a rule the hook never knew
        about. That's inversion of control: the consumer owns the transition, not a pile of props.
      </Callout>

      <Group grow align="flex-start">
        <ToggleRow label="default useToggle()" toggle={plain} />
        <ToggleRow label="useToggle({ stateReducer }) — max 4 toggles" toggle={limited} />
      </Group>

      <Text size="sm" c="dimmed">
        Try toggling the right one more than four times — it freezes ON/OFF at the 4th, while its
        count stops climbing. No <code>maxToggles</code> prop was needed; one reducer hook covers any
        rule a consumer dreams up.
      </Text>
    </Stack>
  );
}
