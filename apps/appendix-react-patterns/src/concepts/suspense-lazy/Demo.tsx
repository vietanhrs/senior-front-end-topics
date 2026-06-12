import { lazy, Suspense, useState } from 'react';
import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import { Callout, DemoCard } from '@sfe/workbook';

// Real code-splitting: its own chunk, fetched on first render. A small artificial
// delay makes the Suspense fallback visible (the chunk itself loads fast locally).
const Heavy = lazy(
  () => new Promise<typeof import('./Heavy')>((resolve) => setTimeout(() => resolve(import('./Heavy')), 800)),
);

export function Demo() {
  const [show, setShow] = useState(false);

  return (
    <Stack gap="md">
      <Callout kind="info" title="Load a chunk on demand, show a fallback while it arrives">
        <code>Heavy</code> is a <code>React.lazy</code> component in its own bundle chunk. Click{' '}
        <b>Load</b>: its <code>import()</code> fires, <code>&lt;Suspense&gt;</code> shows the fallback
        for ~800ms, then the component renders. It was never in the initial bundle.
      </Callout>

      <DemoCard title="React.lazy + Suspense">
        <Stack gap="sm">
          <Group>
            <Button
              size="compact-sm"
              onClick={() => setShow(true)}
              disabled={show}
              // preload on hover so the chunk is warm before the click commits
              onMouseEnter={() => import('./Heavy')}
            >
              Load widget
            </Button>
            <Button size="compact-sm" variant="subtle" onClick={() => setShow(false)} disabled={!show}>
              Unmount
            </Button>
            <Text size="xs" c="dimmed">(hovering the button preloads the chunk)</Text>
          </Group>

          {show && (
            <Suspense
              fallback={
                <Group gap="xs" p="sm">
                  <Loader size="sm" />
                  <Text size="sm" c="dimmed">downloading chunk…</Text>
                </Group>
              }
            >
              <Heavy />
            </Suspense>
          )}
        </Stack>
      </DemoCard>

      <Text size="sm" c="dimmed">
        In real DevTools you'd see a separate JS file fetched on first load. In production you'd also
        wrap this in an <b>error boundary</b> (chunk loads can fail) and offer retry.
      </Text>
    </Stack>
  );
}
