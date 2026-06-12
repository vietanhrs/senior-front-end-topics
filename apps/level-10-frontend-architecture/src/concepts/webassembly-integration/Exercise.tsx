import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Uses a WASM image filter, but it's slower than the JS version and blocks the
// UI. The hot loop crosses the JS↔WASM boundary per pixel, it buffers via
// ArrayBuffer (compiles after full download), and it runs on the main thread.
const { instance } = await WebAssembly.instantiate(await (await fetch('/filter.wasm')).arrayBuffer());
const grayscalePixel = instance.exports.grayscalePixel;

function applyFilter(imageData) {
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    const g = grayscalePixel(px[i], px[i + 1], px[i + 2]); // boundary crossing PER PIXEL
    px[i] = px[i + 1] = px[i + 2] = g;
  }
  return imageData; // megapixels × one WASM call each → slow + main-thread block
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: integrate WASM the right way"
        description="Per-pixel boundary crossings make this slower than JS, ArrayBuffer instantiation wastes the download window, and it blocks the main thread. Pass the whole buffer once, process it inside WASM, stream-compile, and run it off-thread."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Copy the whole pixel buffer into the module's linear <code>Memory</code> once, run the entire
        loop <b>inside</b> WASM (one call), then read the result back — don't call across the boundary
        per pixel. Use <code>instantiateStreaming</code> to compile during download, and run it in a{' '}
        <b>Worker</b> so the main thread stays responsive.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// --- worker.js (keeps the main thread free) ---
// Compile WHILE downloading.
const { instance } = await WebAssembly.instantiateStreaming(fetch('/filter.wasm'), {});
const { memory, grayscaleBuffer, alloc } = instance.exports; // module exposes a bulk fn

self.onmessage = ({ data }) => {
  const { pixels } = data;                  // Uint8ClampedArray (transferred, not copied)

  // 1) copy the buffer INTO wasm linear memory ONCE
  const ptr = alloc(pixels.length);
  const wasmMem = new Uint8Array(memory.buffer, ptr, pixels.length);
  wasmMem.set(pixels);

  // 2) ONE call — the whole loop runs inside WASM, no per-pixel boundary cost
  grayscaleBuffer(ptr, pixels.length);

  // 3) read the result back out and transfer it home (zero-copy)
  const out = wasmMem.slice();
  self.postMessage({ pixels: out }, [out.buffer]);
};

// --- main thread ---
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
function applyFilter(imageData) {
  return new Promise((resolve) => {
    worker.onmessage = ({ data }) => {
      imageData.data.set(data.pixels);
      resolve(imageData);
    };
    // transfer the pixel buffer to the worker (no copy)
    const copy = imageData.data.slice();
    worker.postMessage({ pixels: copy }, [copy.buffer]);
  });
}

// Why it's faster: the heavy loop lives entirely INSIDE WASM (one boundary
// crossing for a megapixel image, not millions); instantiateStreaming compiles
// during the network fetch; and the work runs in a Worker so the UI never blocks.
// Marshalling cost is paid once (copy in / read out), not per pixel.`}
      />
    </Stack>
  );
}
