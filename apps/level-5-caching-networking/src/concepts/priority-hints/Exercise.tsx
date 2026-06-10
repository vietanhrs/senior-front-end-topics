import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `<!-- A product page with poor loading priorities. Lighthouse says LCP is the
     hero image at 4.1s. Fix the priorities (and only the priorities/discovery —
     no redesign). Note the anti-pattern on line 3 too. -->
<head>
  <link rel="preload" as="image" href="/logo.svg" fetchpriority="high" />  <!-- tiny logo?! -->
  <script src="/analytics.js"></script>
</head>
<body>
  <img src="/logo.svg" width="120" />
  <img src="/hero-product.jpg" />                  <!-- the LCP element -->
  <img src="/trust-badges.png" />                  <!-- above fold, decorative -->
  <img src="/related-1.jpg" /> <img src="/related-2.jpg" />  <!-- below the fold -->
  <script>
    fetch('/api/recommendations').then(render);    // needed only below the fold
    fetch('/api/product').then(renderPrice);       // needed for first paint!
  </script>
</body>`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: fix the page's loading priorities"
        description="Promote exactly what gates LCP, demote everything competing with it, and fix the misused preload. List each change and why."
      >
        <CodeHighlight code={buggy} language="html" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Ask of every resource: does it gate first paint/LCP? The hero and the product API do; the
        logo, badges, related items, recommendations, and analytics don't. Remember{' '}
        <code>loading="lazy"</code> for below-fold images and <code>priority</code> on{' '}
        <code>fetch()</code>.
      </Callout>

      <SolutionReveal
        language="html"
        code={`<head>
  <!-- preload + high priority for the ACTUAL LCP element (was wasted on the logo) -->
  <link rel="preload" as="image" href="/hero-product.jpg" fetchpriority="high" />
  <!-- analytics must not block or compete: async + it's low priority by nature -->
  <script src="/analytics.js" async></script>
</head>
<body>
  <img src="/logo.svg" width="120" />                       <!-- auto is fine: tiny -->
  <img src="/hero-product.jpg" fetchpriority="high" />      <!-- LCP: skip Low-until-layout -->
  <img src="/trust-badges.png" fetchpriority="low" />       <!-- above fold but minor -->
  <img src="/related-1.jpg" loading="lazy" />               <!-- below fold: don't fetch yet -->
  <img src="/related-2.jpg" loading="lazy" />
  <script>
    fetch('/api/product', { priority: 'high' }).then(renderPrice);          // gates first paint
    fetch('/api/recommendations', { priority: 'low' }).then(render);        // below the fold
  </script>
</body>

<!-- Why each change works:
  · preload was spending the early-discovery slot on a 2KB logo while the 200KB
    hero waited — the worst possible trade. Point it at the LCP resource.
  · fetchpriority="high" on the hero removes the images-start-Low phase.
  · "low" + lazy on decorative/below-fold images stops them competing for
    bandwidth during the critical window.
  · the product API gates rendering → high; recommendations don't → low.
  Verify in DevTools → Network → Priority column, and re-run Lighthouse. -->`}
      />
    </Stack>
  );
}
