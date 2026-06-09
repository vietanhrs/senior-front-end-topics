import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const before = `import RichEditor from './RichEditor'; // ~300KB, chỉ dùng khi mở modal "Soạn thảo"

function App() {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <Button onClick={() => setEditing(true)}>Soạn thảo</Button>
      {editing && <RichEditor />}
    </>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Bài tập: tách component nặng ra khỏi bundle ban đầu"
        description="RichEditor 300KB đang được import tĩnh nên nằm trong bundle ban đầu — dù phần lớn người dùng không bao giờ mở. Hãy chuyển sang tải động, có trạng thái chờ và xử lý lỗi tải chunk."
      >
        <CodeHighlight code={before} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Yêu cầu">
        Dùng <code>lazy</code> + <code>Suspense</code>; bọc Error Boundary; giữ skeleton cùng
        kích thước để tránh layout shift.
      </Callout>

      <SolutionReveal
        code={`const RichEditor = lazy(() => import('./RichEditor'));

function App() {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <Button onClick={() => setEditing(true)}>Soạn thảo</Button>
      {editing && (
        <ChunkErrorBoundary>
          <Suspense fallback={<EditorSkeleton />}>
            <RichEditor />
          </Suspense>
        </ChunkErrorBoundary>
      )}
    </>
  );
}

// Nâng cao: prefetch khi người dùng HOVER nút, để khi click là đã sẵn sàng:
<Button
  onMouseEnter={() => import('./RichEditor')}
  onClick={() => setEditing(true)}
>
  Soạn thảo
</Button>`}
      />
    </Stack>
  );
}
