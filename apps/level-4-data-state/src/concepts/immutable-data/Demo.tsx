import { useRef, useState } from 'react';
import { Badge, Button, Group, List, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

export function Demo() {
  const [items, setItems] = useState<string[]>(['alpha', 'beta']);
  const renders = useRef(0);
  renders.current += 1;
  const [, forceRender] = useState(0);

  function addMutating() {
    // ❌ Mutate the same array, then set the SAME reference back.
    items.push(`item ${items.length + 1}`);
    setItems(items); // Object.is(items, items) === true → React bails, no re-render
  }

  function addImmutable() {
    setItems((prev) => [...prev, `item ${prev.length + 1}`]); // new reference → re-render
  }

  function sortMutating() {
    setItems(items.sort()); // sort() mutates in place AND returns the same ref → no re-render
  }

  return (
    <Stack gap="md">
      <Callout kind="info" title="Mutation = stale UI">
        Click "Add (mutating)" several times: the underlying array grows (see the length counter
        after forcing a render), but the list on screen doesn't update — React saw the same
        reference and skipped re-rendering. "Add (immutable)" creates a new array and updates
        correctly. <code>sort()</code> has the same bug (mutates + returns the same ref).
      </Callout>

      <DemoCard
        title="Same data, different references"
        right={
          <Group gap="xs">
            <Badge variant="light">renders: {renders.current}</Badge>
            <Badge variant="light">actual length: {items.length}</Badge>
          </Group>
        }
      >
        <Group mb="md">
          <Button color="red" onClick={addMutating}>
            Add (mutating)
          </Button>
          <Button color="teal" onClick={addImmutable}>
            Add (immutable)
          </Button>
          <Button variant="light" color="red" onClick={sortMutating}>
            Sort (mutating)
          </Button>
          <Button variant="default" onClick={() => forceRender((x) => x + 1)}>
            Force re-render (reveal hidden mutations)
          </Button>
        </Group>
        <List>
          {items.map((it, i) => (
            <List.Item key={i}>{it}</List.Item>
          ))}
        </List>
        <Text size="xs" c="dimmed" mt="sm">
          If "actual length" is bigger than the visible list, mutations changed the data without
          re-rendering. Forcing a render reveals them — exactly the kind of bug mutation causes.
        </Text>
      </DemoCard>
    </Stack>
  );
}
