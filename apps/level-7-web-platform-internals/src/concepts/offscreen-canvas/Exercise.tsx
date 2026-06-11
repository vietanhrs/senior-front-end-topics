import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A particle visualization that janks whenever React re-renders. It draws on
// the main thread and tries (wrongly) to move work to a worker.
function mountViz(canvas) {
  const ctx = canvas.getContext('2d');           // (1) main-thread context...
  const worker = new Worker(new URL('./viz.worker.ts', import.meta.url), { type: 'module' });

  function frame() {
    worker.postMessage({ type: 'tick' });        // (2) ask worker to compute...
    worker.onmessage = (e) => {
      drawParticles(ctx, e.data.particles);       // (3) ...but still PAINT on main thread
    };
    requestAnimationFrame(frame);                 // (4) rAF driven on main thread
  }
  frame();
  // (5) worker can't paint; main thread still does all the canvas work and janks
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: move the whole render loop off the main thread"
        description="The worker only computes; the main thread still gets the 2D context and paints every frame, so it still janks. Transfer the canvas to the worker and let it own the entire draw loop."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Feature-detect <code>transferControlToOffscreen</code>. Call it on the canvas, post the
        resulting <code>OffscreenCanvas</code> to the worker in the <b>transfer list</b>, and run{' '}
        <code>getContext</code> + <code>requestAnimationFrame</code> <i>inside</i> the worker. Pass{' '}
        <code>devicePixelRatio</code> in too (no DOM in the worker). The main thread should do no
        per-frame canvas work at all.
      </Callout>

      <SolutionReveal
        language="js"
        code={`// main thread — set up once, then get out of the way
function mountViz(canvas) {
  if (!('transferControlToOffscreen' in canvas)) {
    return mountVizMainThreadFallback(canvas); // graceful degradation
  }
  const offscreen = canvas.transferControlToOffscreen(); // one-time, one-way
  const worker = new Worker(new URL('./viz.worker.ts', import.meta.url), { type: 'module' });

  // Transfer the surface (moved, not copied) + the data the worker needs.
  worker.postMessage(
    { type: 'init', canvas: offscreen, dpr: window.devicePixelRatio || 1 },
    [offscreen],
  );

  // Forward input the worker can't see (no DOM in a worker).
  const onResize = () =>
    worker.postMessage({ type: 'resize', w: canvas.clientWidth, h: canvas.clientHeight });
  window.addEventListener('resize', onResize);

  return () => { worker.terminate(); window.removeEventListener('resize', onResize); };
}

// viz.worker.ts — owns the ENTIRE loop; main thread does zero canvas work
self.onmessage = (e) => {
  const msg = e.data;
  if (msg.type !== 'init') return;
  const canvas = msg.canvas;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.width * msg.dpr;       // size backing store for HiDPI
  canvas.height = canvas.height * msg.dpr;
  ctx.scale(msg.dpr, msg.dpr);

  const frame = () => {
    const particles = step();                  // compute
    drawParticles(ctx, particles);             // AND paint — both off-main-thread
    requestAnimationFrame(frame);              // worker rAF, keyed to the display
  };
  requestAnimationFrame(frame);
};

// Why it's better:
// • The context + rAF + painting all live in the worker, so main-thread renders
//   (React, layout, GC) never stall the animation, and vice versa.
// • The canvas is transferred (no per-frame pixel copy across threads).
// • HiDPI handled with the dpr passed in; input forwarded via postMessage.`}
      />
    </Stack>
  );
}
