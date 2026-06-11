import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A "fit text to box" widget. It logs the ResizeObserver loop error and
// flickers, because the callback resizes the very element it observes.
function fitText(box, label) {
  let fontSize = 16;
  const ro = new ResizeObserver(() => {
    // measure
    while (label.scrollWidth > box.clientWidth && fontSize > 8) {
      fontSize -= 1;
      label.style.fontSize = fontSize + 'px';   // (a) write that changes layout...
    }
    // (b) ...and we also nudge the box itself to "snap" to the text — feedback!
    box.style.height = label.scrollHeight + 'px';  // observed element resized in-callback
  });
  ro.observe(box);   // (c) observing the same element we resize → loop
  // (d) never disconnected
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: stop the ResizeObserver loop"
        description="The callback resizes the observed box, which re-triggers the observer — the browser caps it at one pass per frame and logs the loop error. Break the synchronous feedback and clean up."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Don't write a size that affects the observed box <i>synchronously</i> inside its own
        callback. Defer the writes to <code>requestAnimationFrame</code>, observe a wrapper you
        never resize (or skip writes when nothing changed), and return a teardown that{' '}
        <code>disconnect()</code>s.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function fitText(box, label) {
  let lastWidth = -1;
  const ro = new ResizeObserver((entries) => {
    const width = entries[0].contentBoxSize[0].inlineSize;
    if (width === lastWidth) return;      // equality check: ignore no-op deliveries
    lastWidth = width;

    // Defer all writes to the next frame so the mutation doesn't feed back
    // into THIS delivery — the loop is broken, no "undelivered notifications".
    requestAnimationFrame(() => {
      let fontSize = 16;
      label.style.fontSize = fontSize + 'px';
      while (label.scrollWidth > width && fontSize > 8) {
        fontSize -= 1;
        label.style.fontSize = fontSize + 'px';
      }
      // We resize the box in rAF, not synchronously in the callback.
      box.style.height = label.scrollHeight + 'px';
    });
  });

  ro.observe(box, { box: 'content-box' });
  return () => ro.disconnect();           // teardown on unmount / disconnectedCallback
}

// Why it works:
// • rAF defers the size write out of the callback, so resizing the observed
//   element no longer schedules a synchronous re-notification → no loop error.
// • The width equality check drops redundant deliveries (sub-pixel ping-pong).
// • disconnect() prevents the observer + target leak.
// Even better when possible: CSS container queries (container-type + @container)
// or intrinsic sizing remove the measure-then-resize JS entirely.`}
      />
    </Stack>
  );
}
