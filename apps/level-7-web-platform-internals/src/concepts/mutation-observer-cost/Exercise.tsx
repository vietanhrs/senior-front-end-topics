import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// Watches a third-party widget container and "tidies up" injected nodes.
// It pegs the CPU and sometimes recurses forever.
function autoTidy(root) {
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {                 // (1) heavy work PER record
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) {
          node.classList.add('tidied');           // (2) mutates observed DOM in callback → re-fires
          measureAndLayout(node);                 // (3) sync layout read/write per node
        }
      }
    }
  });
  mo.observe(document.body, {                      // (4) whole body...
    childList: true,
    subtree: true,                                 // (5) ...with subtree → floods records
    attributes: true,                              // (6) every attribute change too (incl. our own)
  });
  // (7) never disconnected
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: tame the MutationObserver"
        description="Scope it, stop the self-trigger loop, coalesce the work, and clean up. The callback currently mutates the very DOM it observes (with subtree on all of body) and does layout work per record."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Observe the tightest node (the widget root, not <code>document.body</code>), drop
        <code>attributes</code> if you don't need them, collect added nodes into one list and act
        once in <code>requestAnimationFrame</code>, and guard your own writes with{' '}
        <code>disconnect()</code> / <code>takeRecords()</code> / re-<code>observe()</code> so they
        don't re-trigger the callback. Return a teardown.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function autoTidy(root) {
  const opts = { childList: true, subtree: true }; // (4)(5)(6) scoped to root, no attributes
  let queued = [];

  const mo = new MutationObserver((mutations) => {
    // (1) Coalesce: just collect element nodes, do no heavy work here.
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1 && !node.classList.contains('tidied')) queued.push(node);
      }
    }
    if (queued.length === 0) return;

    // (2)(3) Act ONCE, in a frame, and don't let our writes re-trigger us.
    const batch = queued;
    queued = [];
    requestAnimationFrame(() => {
      mo.disconnect();                 // stop observing our own mutations
      for (const node of batch) node.classList.add('tidied');
      measureAndLayoutAll(batch);      // one batched layout pass, not per-record
      mo.takeRecords();                // discard the records WE just generated
      mo.observe(root, opts);          // resume
    });
  });

  mo.observe(root, opts);              // (4) observe the widget root only
  return () => mo.disconnect();        // (7) teardown
}

// Why it's better:
// • Scoped to root (not body) → far fewer records; no attributes we don't use.
// • Per-record loop only buckets nodes; the expensive layout work runs once/frame.
// • disconnect → write → takeRecords → observe breaks the self-trigger loop.
// • disconnect() on teardown stops the leak (records hold node references).`}
      />
    </Stack>
  );
}
