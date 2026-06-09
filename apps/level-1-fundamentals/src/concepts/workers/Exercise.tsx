import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '../../workbook/ui';

const buggy = `// Lọc ảnh (grayscale) đang chạy ngay trong event handler trên main thread
// -> với ảnh lớn, toàn bộ UI đứng hình vài giây. Hãy chuyển sang Web Worker.
function applyGrayscale(imageData: ImageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
    d[i] = d[i + 1] = d[i + 2] = avg;
  }
  return imageData;
}

button.onclick = () => {
  const out = applyGrayscale(ctx.getImageData(0, 0, w, h)); // BLOCK UI
  ctx.putImageData(out, 0, 0);
};`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Bài tập: đưa xử lý ảnh sang Web Worker"
        description="Chuyển hàm lọc grayscale ra Web Worker để main thread không bị block. Bonus: dùng Transferable để truyền buffer không cần copy."
      >
        <CodeHighlight code={buggy} language="ts" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Yêu cầu">
        Tạo worker với <code>new Worker(new URL('./grayscale.worker.ts', import.meta.url), {'{'} type:
        'module' {'}'})</code>; truyền <code>ImageData.data.buffer</code> qua{' '}
        <code>postMessage(msg, [buffer])</code> (Transferable, zero-copy); nhận kết quả qua{' '}
        <code>onmessage</code> rồi <code>putImageData</code>.
      </Callout>

      <SolutionReveal
        language="ts"
        notes="Tách compute sang worker; dùng Transferable để tránh copy buffer lớn (sau khi transfer, buffer ở phía gửi trở nên rỗng)."
        code={`// grayscale.worker.ts
/// <reference lib="webworker" />
const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<{ buffer: ArrayBuffer; w: number; h: number }>) => {
  const { buffer, w, h } = e.data;
  const d = new Uint8ClampedArray(buffer);
  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
    d[i] = d[i + 1] = d[i + 2] = avg;
  }
  // Transfer buffer trở lại (zero-copy)
  ctx.postMessage({ buffer: d.buffer, w, h }, [d.buffer]);
};

// main.ts
const worker = new Worker(new URL('./grayscale.worker.ts', import.meta.url), { type: 'module' });

button.onclick = () => {
  const img = ctx2d.getImageData(0, 0, w, h);
  worker.onmessage = (e) => {
    const out = new ImageData(new Uint8ClampedArray(e.data.buffer), e.data.w, e.data.h);
    ctx2d.putImageData(out, 0, 0); // UI không hề bị đứng
  };
  // Transfer quyền sở hữu buffer -> không copy
  worker.postMessage({ buffer: img.data.buffer, w, h }, [img.data.buffer]);
};`}
      />
    </Stack>
  );
}
