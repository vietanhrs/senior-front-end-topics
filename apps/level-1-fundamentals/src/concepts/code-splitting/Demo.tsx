import { lazy, Suspense, useState } from 'react';
import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { Callout, DemoCard } from '@sfe/workbook';
import { ChunkErrorBoundary } from './ChunkErrorBoundary';

// The import() call is what creates a separate chunk. React.lazy turns the
// returned module into a component that suspends while the chunk loads.
const HeavyWidget = lazy(() => import('./HeavyWidget'));

function Skeleton() {
  return (
    <Group justify="center" p="xl">
      <Loader size="sm" />
      <Text size="sm" c="dimmed">
        Loading the Heavy widget chunk…
      </Text>
    </Group>
  );
}

export function Demo() {
  const [show, setShow] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <Stack gap="md">
      <Callout kind="tip" title="Open the Network tab before clicking">
        Filter by <code>JS</code>. The first time you click "Load Heavy widget", a new{' '}
        <code>.js</code> chunk is fetched on demand — that's code splitting in action.
      </Callout>

      <DemoCard
        title="React.lazy + Suspense + Error Boundary"
        description="The Heavy widget is not in the initial bundle. It loads only when you ask, with a skeleton while waiting and an Error Boundary in case the load fails."
      >
        <Stack gap="md">
          <Group>
            <Button leftSection={<IconDownload size={16} />} onClick={() => setShow(true)} disabled={show}>
              Load Heavy widget
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setShow(false);
                setKey((k) => k + 1);
              }}
            >
              Hide / Reset
            </Button>
          </Group>

          {show && (
            <ChunkErrorBoundary key={key}>
              <Suspense fallback={<Skeleton />}>
                <HeavyWidget />
              </Suspense>
            </ChunkErrorBoundary>
          )}
        </Stack>
      </DemoCard>
    </Stack>
  );
}
