import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const before = `// Hai vấn đề: (1) waterfall tuần tự, (2) mỗi lần gọi lại import lại
async function openEditor() {
  const editor = await import('./editor');   // chờ xong cái này…
  const theme = await import('./editorTheme'); // …mới bắt đầu cái kia (waterfall)
  return editor.create({ theme: theme.dark });
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Bài tập: khử waterfall và double-fetch"
        description="Hàm dưới tải hai chunk tuần tự (waterfall) và không cache. Hãy tải song song và đảm bảo gọi nhiều lần chỉ tải một lần."
      >
        <CodeHighlight code={before} language="ts" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Gợi ý">
        Hai import độc lập → <code>Promise.all</code>. Để gọi nhiều lần không tải lại, hãy
        cache <b>Promise</b> ở module scope (không cache giá trị đã resolve, để tránh race khi
        gọi đồng thời).
      </Callout>

      <SolutionReveal
        language="ts"
        code={`let editorBundle: Promise<{ editor: Editor; theme: Theme }> | null = null;

function loadEditorBundle() {
  if (editorBundle) return editorBundle;       // cache theo Promise
  editorBundle = Promise.all([                 // tải SONG SONG, hết waterfall
    import('./editor'),
    import('./editorTheme'),
  ]).then(([editor, theme]) => ({ editor, theme: theme.dark }));
  return editorBundle;
}

async function openEditor() {
  const { editor, theme } = await loadEditorBundle();
  return editor.create({ theme });
}

// (tuỳ chọn) prefetch khi hover để click là tức thì:
button.addEventListener('mouseenter', () => void loadEditorBundle());`}
      />
    </Stack>
  );
}
