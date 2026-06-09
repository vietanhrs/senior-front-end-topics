import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const before = `import RichEditor from './RichEditor'; // ~300KB, only used when the "Compose" modal opens

function App() {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <Button onClick={() => setEditing(true)}>Compose</Button>
      {editing && <RichEditor />}
    </>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: split a heavy component out of the initial bundle"
        description="The 300KB RichEditor is statically imported, so it sits in the initial bundle — even though most users never open it. Convert it to dynamic loading, with a loading state and chunk-load error handling."
      >
        <CodeHighlight code={before} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Requirements">
        Use <code>lazy</code> + <code>Suspense</code>; wrap it in an Error Boundary; keep the
        skeleton the same size to avoid layout shift.
      </Callout>

      <SolutionReveal
        code={`const RichEditor = lazy(() => import('./RichEditor'));

function App() {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <Button onClick={() => setEditing(true)}>Compose</Button>
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

// Advanced: prefetch on HOVER so it's ready by the time they click:
<Button
  onMouseEnter={() => import('./RichEditor')}
  onClick={() => setEditing(true)}
>
  Compose
</Button>`}
      />
    </Stack>
  );
}
