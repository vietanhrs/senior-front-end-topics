import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// An image filter (grayscale) runs right in the event handler on the main
// thread -> for large images, the whole UI freezes for seconds. Move it to a Web Worker.
function applyGrayscale(imageData: ImageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
    d[i] = d[i + 1] = d[i + 2] = avg;
  }
  return imageData;
}

button.onclick = () => {
  const out = applyGrayscale(ctx.getImageData(0, 0, w, h)); // BLOCKS THE UI
  ctx.putImageData(out, 0, 0);
};`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: move image processing into a Web Worker"
        description="Move the grayscale filter into a Web Worker so the main thread isn't blocked. Bonus: use a Transferable to pass the buffer without copying."
      >
        <CodeHighlight code={buggy} language="ts" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Requirements">
        Create the worker with <code>new Worker(new URL('./grayscale.worker.ts', import.meta.url),
        {'{'} type: 'module' {'}'})</code>; pass <code>ImageData.data.buffer</code> via{' '}
        <code>postMessage(msg, [buffer])</code> (Transferable, zero-copy); receive the result in{' '}
        <code>onmessage</code> then <code>putImageData</code>.
      </Callout>

      <SolutionReveal
        language="ts"
        notes="Move the compute into the worker; use a Transferable to avoid copying a large buffer (after transfer, the buffer on the sending side becomes empty)."
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
  // Transfer the buffer back (zero-copy)
  ctx.postMessage({ buffer: d.buffer, w, h }, [d.buffer]);
};

// main.ts
const worker = new Worker(new URL('./grayscale.worker.ts', import.meta.url), { type: 'module' });

button.onclick = () => {
  const img = ctx2d.getImageData(0, 0, w, h);
  worker.onmessage = (e) => {
    const out = new ImageData(new Uint8ClampedArray(e.data.buffer), e.data.w, e.data.h);
    ctx2d.putImageData(out, 0, 0); // UI never freezes
  };
  // Transfer ownership of the buffer -> no copy
  worker.postMessage({ buffer: img.data.buffer, w, h }, [img.data.buffer]);
};`}
      />
    </Stack>
  );
}
