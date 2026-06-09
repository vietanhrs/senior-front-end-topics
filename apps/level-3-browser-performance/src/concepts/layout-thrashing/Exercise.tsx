import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A masonry layout that positions each card below the shortest column.
// It thrashes: every iteration reads geometry AND writes styles, forcing a
// synchronous reflow per card. Refactor to batch reads and writes.
function layoutMasonry(cards, columns) {
  const heights = new Array(columns).fill(0);
  for (const card of cards) {
    // READ: forces layout (it was just dirtied by the previous WRITE)
    const h = card.getBoundingClientRect().height;
    const shortest = heights.indexOf(Math.min(...heights));

    // WRITE: dirties layout again
    card.style.transform =
      'translate(' + shortest * 220 + 'px, ' + heights[shortest] + 'px)';
    heights[shortest] += h + 16;
  }
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: de-thrash the masonry layout"
        description="Each loop iteration reads height then writes a transform → up to N forced reflows. Restructure into a read pass and a write pass so layout is computed at most once. Note: transform writes don't affect height here, so the read pass is safe to hoist."
      >
        <CodeHighlight code={buggy} language="js" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Measure all heights first (reads), then do all positioning (writes). Computing which column
        is shortest is pure JS and can stay in the write pass. Bonus: schedule the write pass in{' '}
        <code>requestAnimationFrame</code> so it lines up with the frame.
      </Callout>

      <SolutionReveal
        language="js"
        code={`function layoutMasonry(cards, columns) {
  // 1) READ PASS — one layout at most; no writes in between.
  const cardHeights = cards.map((card) => card.getBoundingClientRect().height);

  // 2) WRITE PASS — pure computation + style writes, no geometry reads.
  const heights = new Array(columns).fill(0);
  const transforms = cards.map((_, i) => {
    const shortest = heights.indexOf(Math.min(...heights));
    const t = \`translate(\${shortest * 220}px, \${heights[shortest]}px)\`;
    heights[shortest] += cardHeights[i] + 16;
    return t;
  });

  requestAnimationFrame(() => {
    cards.forEach((card, i) => {
      card.style.transform = transforms[i]; // transform = composite-only, cheap
    });
  });
}

// Result: O(1) forced reflows instead of O(n). Using transform (not top/left)
// also keeps the writes off the layout/paint path entirely.`}
      />
    </Stack>
  );
}
