import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A chart drawn on a canvas looks blurry on Retina/phones, and a JS-driven
// "scrubber" line shimmers as it moves. Fix both for crisp, device-pixel-aligned
// rendering.
function drawChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  // canvas.width/height left at CSS size -> upscaled & blurry on DPR > 1
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSeries(ctx, data);
}

function moveScrubber(el, x) {
  el.style.transform = 'translateX(' + x + 'px)'; // fractional x -> blurry 1px line
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make canvas + scrubber crisp on HiDPI"
        description="Scale the canvas backing store by DPR, and snap the scrubber to the device-pixel grid. Account for DPR changing (zoom / moving between monitors)."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Canvas: set the bitmap size to <code>cssSize * dpr</code> and <code>ctx.scale(dpr, dpr)</code>.
        Scrubber: round the offset to <code>1/dpr</code>. Listen to a DPR-change media query to
        re-render when zoom/monitor changes.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const { width: cssW, height: cssH } = canvas.getBoundingClientRect();
  // Backing store in DEVICE pixels...
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  // ...but keep the element sized in CSS pixels.
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr); // now draw in CSS-pixel coordinates, crisply
  return ctx;
}

function drawChart(canvas, data) {
  const ctx = setupCanvas(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSeries(ctx, data);
}

function moveScrubber(el, x) {
  const dpr = window.devicePixelRatio || 1;
  const snapped = Math.round(x * dpr) / dpr;       // align to the device grid
  el.style.transform = 'translateX(' + snapped + 'px)';
}

// Re-render when DPR changes (browser zoom, dragging window to another monitor):
function onDprChange(cb) {
  const mq = matchMedia(\`(resolution: \${window.devicePixelRatio}dppx)\`);
  mq.addEventListener('change', cb, { once: true }); // re-arm inside cb
}`}
      />
    </Stack>
  );
}
