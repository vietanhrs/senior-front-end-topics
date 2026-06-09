import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `/* A long feed of ~5,000 comment cards. Initial render is slow and scrolling
   janks because the browser lays out and paints every card up front. The team
   doesn't want to add a virtualization library yet. Speed it up with CSS.

   Also: toggling a card's "expanded" class reflows the WHOLE feed, because
   nothing tells the browser the card is layout-independent. */
.comment-card {
  /* lots of nested content */
}
.comment-card.expanded {
  /* taller; toggling this reflows everything below */
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: speed up the feed with containment (no virtualization)"
        description="Skip rendering off-screen cards, and isolate each card so expanding one doesn't reflow the whole feed. Keep scrollbar stability."
      >
        <CodeHighlight code={buggy} language="css" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        <code>content-visibility: auto</code> skips off-screen render; pair it with{' '}
        <code>contain-intrinsic-size</code> so the scrollbar doesn't jump. <code>contain: content</code>
        makes each card a layout/paint boundary so an expand doesn't escape.
      </Callout>

      <SolutionReveal
        language="css"
        code={`.comment-card {
  /* 1) Skip layout+paint for cards that are off-screen, render them just-in-time. */
  content-visibility: auto;

  /* 2) Reserve space so the scrollbar/positions don't jump as cards render.
        'auto <size>' lets the browser remember the last real height. */
  contain-intrinsic-size: auto 120px;

  /* 3) Isolate each card: layout/paint changes inside don't affect siblings. */
  contain: content;   /* = layout paint style */
}

.comment-card.expanded {
  /* Now toggling height only re-lays-out THIS card's subtree, not the whole feed,
     because contain:content made it a containment boundary. */
}

/* Result: only ~visible cards are laid out/painted (fast initial render + smooth
   scroll), and expanding a card is a local reflow. If the list grows to tens of
   thousands, add windowing on top — they compose. */`}
      />
    </Stack>
  );
}
