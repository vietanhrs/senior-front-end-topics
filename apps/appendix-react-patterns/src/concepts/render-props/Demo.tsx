import { useState, type ReactNode } from 'react';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

interface Pos {
  x: number;
  y: number;
  inside: boolean;
}

// One behavior component — tracks the pointer within its box — that delegates ALL
// rendering to a render prop (or children-as-a-function).
function MouseArea({
  render,
  children,
}: {
  render?: (pos: Pos) => ReactNode;
  children?: (pos: Pos) => ReactNode;
}) {
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0, inside: false });
  const ui = render ?? children;
  return (
    <div
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPos({ x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top), inside: true });
      }}
      onPointerLeave={() => setPos((p) => ({ ...p, inside: false }))}
      style={{ position: 'relative', height: 160, borderRadius: 8, border: '1px solid var(--mantine-color-default-border)', overflow: 'hidden', touchAction: 'none' }}
    >
      {ui?.(pos)}
    </div>
  );
}

export function Demo() {
  return (
    <Stack gap="md">
      <Callout kind="info" title="Same behavior, two completely different renders">
        <code>MouseArea</code> owns the pointer-tracking logic and hands the position to a{' '}
        <b>render prop</b>. Move your pointer over each box: identical logic, but the consumer decides
        the UI — coordinates text in one, a follower dot (via children-as-a-function) in the other.
      </Callout>

      <Group grow align="flex-start">
        <DemoCard title="render={(pos) => …}">
          <MouseArea
            render={({ x, y, inside }) => (
              <div style={{ padding: 12 }}>
                <Group>
                  <Badge variant="light" color={inside ? 'teal' : 'gray'}>{inside ? 'tracking' : 'move pointer in'}</Badge>
                  <Badge variant="light">x: {x}</Badge>
                  <Badge variant="light">y: {y}</Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={8}>the render prop chose to show coordinates</Text>
              </div>
            )}
          />
        </DemoCard>

        <DemoCard title="{(pos) => …} (children as a function)">
          <MouseArea>
            {({ x, y, inside }) =>
              inside ? (
                <div
                  style={{
                    position: 'absolute',
                    left: x - 8,
                    top: y - 8,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--mantine-color-indigo-6)',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <Text size="xs" c="dimmed" style={{ padding: 12 }}>move pointer to spawn a follower dot</Text>
              )
            }
          </MouseArea>
        </DemoCard>
      </Group>

      <Text size="sm" c="dimmed">
        For pure logic reuse you'd usually write <code>useMousePosition()</code> instead — but render
        props shine here because the shared unit owns the <b>DOM element</b> the handlers attach to.
      </Text>
    </Stack>
  );
}
