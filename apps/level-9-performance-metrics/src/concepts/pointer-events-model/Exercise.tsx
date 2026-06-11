import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A drag-to-reposition handle. It only works with a mouse, breaks if you drag
// fast (pointer leaves the element), scrolls the page on touch, and draws jagged
// lines because it ignores high-frequency samples.
function initDrag(handle) {
  handle.addEventListener('mousedown', (e) => {        // mouse only
    const onMove = (ev) => moveTo(ev.clientX, ev.clientY);
    document.addEventListener('mousemove', onMove);    // document-level tracking
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', onMove);
    }, { once: true });
  });
  // touch users: page scrolls, nothing drags
  // fast drags: fine (document-level), but on touch it's a mess
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: rewrite the drag on Pointer Events"
        description="Make it work for mouse, touch, and pen with one code path; keep tracking when the pointer leaves the element; stop the page scrolling on touch; and use coalesced samples for smooth motion."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Use <code>pointerdown/move/up</code> (+ <code>pointercancel</code>). Call{' '}
        <code>setPointerCapture(e.pointerId)</code> on down so you can listen on the element itself and
        still track outside it (no document listeners). Set <code>touch-action: none</code> so touch
        doesn't scroll. Draw/move through <code>getCoalescedEvents()</code> for smoothness.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function initDrag(handle) {
  handle.style.touchAction = 'none';   // don't let touch scroll/zoom — we own the gesture

  handle.addEventListener('pointerdown', (e) => {
    handle.setPointerCapture(e.pointerId);   // route all this pointer's events here
    handle.dataset.dragging = 'true';
  });

  handle.addEventListener('pointermove', (e) => {
    if (handle.dataset.dragging !== 'true') return;
    if (!handle.hasPointerCapture(e.pointerId)) return;
    // smooth: apply every high-frequency sample, not just the latest point
    const samples = e.getCoalescedEvents?.() ?? [e];
    for (const s of samples) moveTo(s.clientX, s.clientY);
  });

  const end = (e) => {
    delete handle.dataset.dragging;
    if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
  };
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);   // browser took over → abort cleanly
}

// Multi-touch variant: track each e.pointerId in a Map so two fingers drag two
// things independently; use e.isPrimary when you only want the primary pointer.
// Branch on e.pointerType ('mouse' | 'touch' | 'pen') only where behavior must differ.

// Why it's better: ONE handler set covers mouse/touch/pen; pointer capture keeps
// the drag working when the pointer leaves the handle and auto-releases on up
// (no leaky document listeners); touch-action:none stops the page scrolling; and
// coalesced events make fast drags smooth.`}
      />
    </Stack>
  );
}
