# OffscreenCanvas

## The problem it solves

A normal `<canvas>` is owned by the **main thread** — its 2D/WebGL context can only be driven from
the thread that owns the DOM. So any non-trivial canvas animation, data viz, or game render loop
competes with React, layout, event handling, and everything else for the **same** thread. When the
main thread is busy (a big render, a sync parse), your canvas **stutters or freezes**.

`OffscreenCanvas` decouples the **rendering surface** from the DOM. You can create one directly, or
**transfer control** of an on-screen `<canvas>` to a worker, and run the entire draw loop —
including `requestAnimationFrame` — on a **worker thread**. The animation stays smooth even while
the main thread is janked.

## Two ways to get one

### 1. Transfer an on-screen canvas to a worker (most common)

```js
// main thread
const canvas = document.querySelector('canvas');
const offscreen = canvas.transferControlToOffscreen(); // canvas is now worker-controlled
const worker = new Worker(new URL('./render.worker.ts', import.meta.url), { type: 'module' });
worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]); // TRANSFER, not copy
```

```js
// render.worker.ts
self.onmessage = (e) => {
  const ctx = e.data.canvas.getContext('2d');
  const loop = () => {
    draw(ctx);
    requestAnimationFrame(loop); // rAF exists in the worker because it drives an OffscreenCanvas
  };
  requestAnimationFrame(loop);
};
```

Key points:
- `transferControlToOffscreen()` can be called **once** per canvas; afterwards the main thread can
  no longer get a context from that `<canvas>` (it's owned by the worker). Pixels still display
  on-screen — the worker paints into the same surface.
- Pass the offscreen canvas in the **transfer list** (`[offscreen]`) — it's a *transferable*, moved
  not copied (Level 6 — transferable objects), so there's no per-frame serialization cost.
- The worker has its own `requestAnimationFrame` keyed to the display, and `getContext('2d' | 'webgl' | 'webgl2' | 'bitmaprenderer')`.

### 2. Create a detached OffscreenCanvas (render-to-bitmap)

```js
const off = new OffscreenCanvas(256, 256);
const ctx = off.getContext('2d');
draw(ctx);
const bitmap = off.transferToImageBitmap();   // cheap snapshot to hand back
// or: const blob = await off.convertToBlob({ type: 'image/png' });
```

Useful for generating images/thumbnails/tiles off-thread without ever touching the DOM, then
handing an `ImageBitmap` (also transferable) to the main thread to `drawImage` onto a visible canvas.

## Why it's faster

- The draw loop runs on a **separate thread** → main-thread jank (React renders, layout, GC pauses)
  doesn't stall the animation, and vice versa.
- No copying: the surface is **transferred**, and `ImageBitmap` results are transferable too.
- You can even run **multiple** workers each owning their own canvas for parallel rendering.

## Caveats & senior notes

- **One-way transfer:** after `transferControlToOffscreen()`, the main thread can't draw to that
  canvas — design the worker as the single renderer; send it *data/commands*, not pixels.
- **No DOM in the worker:** no `document`, no CSS, no fonts-by-name unless loaded via the
  worker-accessible `FontFace`/`self.fonts`. Measure text and lay out yourself.
- **Sizing/HiDPI:** the worker must size the canvas backing store for `devicePixelRatio` (pass it in
  the init message; the worker has no `window.devicePixelRatio` reflecting the element's box).
- **Feature-detect:** `'transferControlToOffscreen' in HTMLCanvasElement.prototype`. Broadly
  supported now, but provide a main-thread fallback for old engines.
- **Input still arrives on the main thread:** forward pointer/resize events to the worker via
  `postMessage`.

## Senior checklist

- OffscreenCanvas moves the **render surface** off the DOM thread; `transferControlToOffscreen()` +
  worker `requestAnimationFrame` runs the whole loop off-main-thread → no jank tug-of-war.
- Transfer the canvas (transfer list), don't copy; the transfer is one-time and one-way.
- Worker has no DOM/CSS — feed it data + `devicePixelRatio`; forward input events via messages.
- Alternatively `new OffscreenCanvas()` + `transferToImageBitmap()` / `convertToBlob()` to render
  images off-thread. Feature-detect and fall back.

## Angular equivalent

Angular competes for the same main thread through change detection, template work, layout, and event handlers. Moving canvas rendering to a Worker with OffscreenCanvas protects Angular checks from animation cost just as it protects React renders.

## References

- [MDN: OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)
- [MDN: HTMLCanvasElement.transferControlToOffscreen()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen)
- [web.dev: OffscreenCanvas — render in a worker](https://web.dev/articles/offscreen-canvas)
- [MDN: OffscreenCanvas.convertToBlob()](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob)
