import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A looping spinner implemented in JS. It stutters whenever the app is busy
// (data parsing, big renders) because it runs on the main thread. Make it
// GPU-accelerated so it stays smooth regardless of main-thread load.
function Spinner() {
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    let angle = 0;
    const loop = () => {
      angle = (angle + 4) % 360;
      ref.current.style.transform = 'rotate(' + angle + 'deg)';  // main-thread per frame
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={ref} className="spinner" />;
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: move the spinner onto the GPU compositor"
        description="A continuous transform animation has no reason to run on the main thread. Re-implement it as a CSS animation so the compositor runs it independently and it can't be blocked by JS."
      >
        <CodeHighlight code={buggy} language="tsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        For a constant transform/opacity loop, hand it to CSS (or the Web Animations API) so the
        compositor owns it. No JS per frame = nothing to block. Pre-promote with{' '}
        <code>will-change: transform</code>.
      </Callout>

      <SolutionReveal
        notes="Pure CSS — the compositor runs it; survives main-thread jank. No rAF, no per-frame JS."
        code={`function Spinner() {
  return <div className="spinner" />;
}

/* CSS */
.spinner {
  animation: spin 0.8s linear infinite;
  will-change: transform;   /* promote the layer for the animation */
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* If you need to start/stop from JS, use the Web Animations API — still
   compositor-driven, no per-frame main-thread work: */
// const anim = el.animate(
//   [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
//   { duration: 800, iterations: Infinity },
// );
// anim.pause(); anim.play();`}
      />
    </Stack>
  );
}
