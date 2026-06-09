import { lazy, Suspense, useState } from 'react';
import { Button, Group, Loader, Stack, Text } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { Callout, DemoCard } from '../../workbook/ui';
import { ChunkErrorBoundary } from './ChunkErrorBoundary';

// The import() call is what creates a separate chunk. React.lazy turns the
// returned module into a component that suspends while the chunk loads.
const HeavyWidget = lazy(() => import('./HeavyWidget'));

function Skeleton() {
  return (
    <Group justify="center" p="xl">
      <Loader size="sm" />
      <Text size="sm" c="dimmed">
        Đang tải chunk của Heavy widget…
      </Text>
    </Group>
  );
}

export function Demo() {
  const [show, setShow] = useState(false);
  const [key, setKey] = useState(0);

  return (
    <Stack gap="md">
      <Callout kind="tip" title="Mở Network tab trước khi bấm">
        Lọc theo <code>JS</code>. Lần đầu bấm "Tải Heavy widget", một file chunk{' '}
        <code>.js</code> mới sẽ được tải về theo nhu cầu — đó chính là code splitting đang hoạt động.
      </Callout>

      <DemoCard
        title="React.lazy + Suspense + Error Boundary"
        description="Heavy widget không nằm trong bundle ban đầu. Nó chỉ được tải khi bạn yêu cầu, có skeleton trong lúc chờ và Error Boundary phòng khi tải lỗi."
      >
        <Stack gap="md">
          <Group>
            <Button leftSection={<IconDownload size={16} />} onClick={() => setShow(true)} disabled={show}>
              Tải Heavy widget
            </Button>
            <Button
              variant="default"
              onClick={() => {
                setShow(false);
                setKey((k) => k + 1);
              }}
            >
              Ẩn / Reset
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
