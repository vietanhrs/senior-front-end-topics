import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const before = `<head>
  <!-- 180KB of CSS, all render-blocking, incl. print + below-the-fold styles -->
  <link rel="stylesheet" href="/all.css" />
  <link rel="stylesheet" href="/print.css" />

  <!-- a second stylesheet pulled via @import inside all.css (serial!) -->

  <!-- analytics: doesn't touch the DOM, but blocks the parser here -->
  <script src="/analytics.js"></script>

  <!-- app bundle: needs the DOM, must run in order, currently parser-blocking -->
  <script src="/app.js"></script>

  <!-- web font discovered late, causing invisible text -->
</head>`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: eliminate the render-blocking resources"
        description="Rewrite this <head> so the first paint isn't blocked by non-critical CSS/JS, fonts paint promptly, and nothing changes behavior. Call out each fix."
      >
        <CodeHighlight code={before} language="html" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Inline critical CSS; defer non-critical CSS (preload+onload); set print CSS to{' '}
        <code>media="print"</code>; <code>async</code> analytics; <code>defer</code> the app bundle;
        preload the font + <code>font-display: swap</code>.
      </Callout>

      <SolutionReveal
        language="html"
        code={`<head>
  <!-- 1) Critical, above-the-fold CSS inlined -> first paint needs no network -->
  <style>/* critical css */</style>

  <!-- 2) Rest of the CSS loaded non-blockingly (swap rel on load) -->
  <link rel="preload" href="/rest.css" as="style"
        onload="this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/rest.css"></noscript>

  <!-- 3) Print styles aren't render-blocking when scoped to print media -->
  <link rel="stylesheet" href="/print.css" media="print">

  <!-- (and: replace CSS @import with <link>s so they don't load serially) -->

  <!-- 4) Preload + swap the LCP web font so text paints promptly -->
  <link rel="preload" href="/inter.woff2" as="font" type="font/woff2" crossorigin>
  <!-- in CSS: @font-face { font-display: swap; ... } -->

  <!-- 5) Analytics is independent -> async (no parser block, any order) -->
  <script src="/analytics.js" async></script>

  <!-- 6) App bundle needs the DOM & order -> defer (no parser block) -->
  <script src="/app.js" defer></script>
</head>`}
      />
    </Stack>
  );
}
