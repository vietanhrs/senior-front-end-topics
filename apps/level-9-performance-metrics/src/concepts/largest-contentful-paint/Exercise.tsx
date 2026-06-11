import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `<!-- The hero image IS the LCP element, but everything about how it's loaded
     makes LCP slow: late discovery, low priority, lazy-loaded, render-blocked. -->
<head>
  <link rel="stylesheet" href="/big.css" />            <!-- render-blocking -->
  <script src="/analytics.js"></script>                 <!-- parser-blocking in head -->
</head>
<body>
  <!-- discovered late (in CSS), lazy, default priority -->
  <div class="hero" style="background-image: url('/hero-4000px.jpg')"></div>
  <img data-src="/hero-4000px.jpg" loading="lazy" />    <!-- lazy LCP image! -->
</body>`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the LCP image fast"
        description="The largest element is the hero, but it's hidden in CSS / lazy-loaded / low-priority and the head is render-blocked. Make the LCP resource discoverable, prioritized, right-sized, and unblock rendering."
      >
        <CodeHighlight code={buggy} language="html" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Put the LCP image in the initial HTML as a real <code>&lt;img&gt;</code> (so the preload
        scanner finds it), give it <code>fetchpriority="high"</code> and <b>never</b>{' '}
        <code>loading="lazy"</code>, <code>preload</code> it, serve a right-sized modern format with{' '}
        <code>srcset</code>, <code>preconnect</code> to its origin, and stop the head from blocking
        render (defer JS, inline critical CSS).
      </Callout>

      <SolutionReveal
        language="html"
        code={`<head>
  <!-- unblock rendering: critical CSS inline, the rest async; JS deferred -->
  <style>/* critical above-the-fold CSS inlined */</style>
  <link rel="preload" href="/big.css" as="style" onload="this.rel='stylesheet'" />
  <script src="/analytics.js" defer></script>

  <!-- discover + prioritize the LCP image as early as possible -->
  <link rel="preconnect" href="https://img.cdn.example" crossorigin />
  <link
    rel="preload"
    as="image"
    href="/hero-1200.avif"
    imagesrcset="/hero-800.avif 800w, /hero-1200.avif 1200w, /hero-1600.avif 1600w"
    imagesizes="100vw"
    fetchpriority="high"
  />
</head>
<body>
  <!-- a REAL <img>, eager, high priority, right-sized, modern format -->
  <img
    src="/hero-1200.avif"
    srcset="/hero-800.avif 800w, /hero-1200.avif 1200w, /hero-1600.avif 1600w"
    sizes="100vw"
    width="1200" height="675"        <!-- reserve space too (helps CLS) -->
    fetchpriority="high"
    decoding="async"
    alt="..."
  />
</body>

<!-- Why LCP improves, by sub-part:
  • Load delay: the <img> + preload make the LCP resource discoverable immediately
    (no waiting for CSS to parse), at high priority, never lazy.
  • Load time: AVIF + responsive srcset ships far fewer bytes.
  • Render delay: critical CSS inlined and JS deferred → nothing blocks the paint.
  • TTFB: preconnect cuts connection setup to the image origin.
-->`}
      />
    </Stack>
  );
}
