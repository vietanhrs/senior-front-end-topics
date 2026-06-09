import { useState } from 'react';
import { Button, Checkbox, Group, Stack, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

interface Task {
  id: number;
  label: string;
}

const SEED: Task[] = [
  { id: 1, label: 'Read the hydration theory' },
  { id: 2, label: 'Do the event-loop demo' },
  { id: 3, label: 'Review CORS preflight' },
];

/**
 * BUG: uses `index` as the key in a list that CAN remove items. Tick the first
 * row's checkbox then delete it → the "checked" mark jumps to the next row,
 * because the checkbox's DOM state is keyed by position, not by task. Switch to
 * a stable key.
 */
export function Exercise() {
  const [tasks, setTasks] = useState(SEED);
  const remove = (id: number) => setTasks((t) => t.filter((x) => x.id !== id));
  const reset = () => setTasks(SEED);

  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the key for a removable list"
        description="Tick the FIRST row's checkbox (uncontrolled), then delete that row. Because it uses key=index, the tick sticks to the wrong row. Task: switch to key={task.id}."
      >
        <Stack gap="xs">
          {/* ❌ key={index} — the source of the bug */}
          {tasks.map((task, index) => (
            <Group key={index} justify="space-between">
              <Checkbox label={task.label} />
              <Button
                size="xs"
                variant="subtle"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => remove(task.id)}
              >
                Delete
              </Button>
            </Group>
          ))}
          {tasks.length === 0 && <Text c="dimmed">No tasks left.</Text>}
        </Stack>
        <Button mt="md" size="xs" variant="default" onClick={reset}>
          Reset
        </Button>
      </DemoCard>

      <Callout kind="tip" title="Hint">
        The checkbox here is <i>uncontrolled</i>, so its checked state lives in the DOM. The key
        decides which DOM node is kept when the list changes. Index is not stable when items are
        removed.
      </Callout>

      <SolutionReveal
        notes="Just change the key. For dynamic lists (add/remove/reorder), always use a stable id."
        code={`{tasks.map((task) => (
  <Group key={task.id} justify="space-between">
    <Checkbox label={task.label} />
    <Button onClick={() => remove(task.id)}>Delete</Button>
  </Group>
))}`}
      />
    </Stack>
  );
}
