import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `/* Someone "optimized" scrolling by promoting everything. The result: the page
   uses hundreds of MB of GPU memory, scroll stutters, and mobile Safari crashes.
   Fix the layer strategy. */
* {
  will-change: transform;        /* applied to EVERY element */
  transform: translateZ(0);      /* the old hack, everywhere */
}

.card { /* 600 of these on the page */ }

/* Only .hero actually animates (a parallax transform on scroll). */
.hero { /* transform updated each scroll frame */ }`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the layer explosion"
        description="The universal will-change/translateZ promotes every element to its own layer → GPU memory blowup. Scope promotion to only what animates, and manage will-change's lifecycle."
      >
        <CodeHighlight code={buggy} language="css" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Remove the universal rules. Promote only <code>.hero</code> (the thing that actually
        animates), ideally only <i>while</i> it's animating. A permanent <code>will-change</code>
        keeps the layer — and its memory — alive forever.
      </Callout>

      <SolutionReveal
        language="css"
        code={`/* ❌ Delete these — they promote 600+ elements: */
/* * { will-change: transform; transform: translateZ(0); } */

/* ✔ Promote ONLY the element that animates */
.hero {
  will-change: transform;   /* one layer, on purpose */
}

/* Even better: add will-change only while the parallax is active, then remove it,
   so the layer/memory isn't held when the hero is off-screen or idle. */
.hero.is-parallaxing { will-change: transform; }
/* JS: add .is-parallaxing on scroll-start, remove it (debounced) on scroll-end */

/* Verify in DevTools → Layers: you should now see ~1 promoted layer for .hero,
   not 600. The .card elements paint into a shared layer again. */`}
      />
    </Stack>
  );
}
