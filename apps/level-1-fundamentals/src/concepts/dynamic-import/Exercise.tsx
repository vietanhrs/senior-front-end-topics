import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const before = `// Two problems: (1) a sequential waterfall, (2) re-imports on every call
async function openEditor() {
  const editor = await import('./editor');     // wait for this…
  const theme = await import('./editorTheme'); // …before even starting this (waterfall)
  return editor.create({ theme: theme.dark });
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: remove the waterfall and the double-fetch"
        description="The function below loads two chunks sequentially (a waterfall) and doesn't cache. Load them in parallel and make repeated calls fetch only once."
      >
        <CodeHighlight code={before} language="ts" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Two independent imports → <code>Promise.all</code>. To avoid refetching on repeated
        calls, cache the <b>Promise</b> at module scope (not the resolved value, to avoid a race
        on concurrent calls).
      </Callout>

      <SolutionReveal
        language="ts"
        code={`let editorBundle: Promise<{ editor: Editor; theme: Theme }> | null = null;

function loadEditorBundle() {
  if (editorBundle) return editorBundle;       // cache by Promise
  editorBundle = Promise.all([                 // load IN PARALLEL, no waterfall
    import('./editor'),
    import('./editorTheme'),
  ]).then(([editor, theme]) => ({ editor, theme: theme.dark }));
  return editorBundle;
}

async function openEditor() {
  const { editor, theme } = await loadEditorBundle();
  return editor.create({ theme });
}

// (optional) prefetch on hover so the click is instant:
button.addEventListener('mouseenter', () => void loadEditorBundle());`}
      />
    </Stack>
  );
}
