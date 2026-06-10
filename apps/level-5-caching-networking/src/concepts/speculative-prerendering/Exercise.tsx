import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `<!-- An e-commerce site enabled aggressive prerendering. Three problems shipped:
  (1) it prerenders EVERY link on the page immediately (hundreds of pages of
      bandwidth/memory; data-saver users hurt),
  (2) analytics now reports 5× pageviews (beacons fire during speculation),
  (3) the server marks coupons as "viewed" when its page is merely prerendered. -->
<script type="speculationrules">
{
  "prerender": [{ "where": { "selector_matches": "a" }, "eagerness": "immediate" }]
}
</script>

<script>
  // runs on every page, including hidden prerenders:
  sendPageview();
</script>

// server (pseudo):
app.get('/coupon/:id', (req, res) => {
  markCouponViewed(req.params.id);   // side effect for speculative requests too
  res.render('coupon');
});`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make the speculation responsible"
        description="Fix all three: target only high-intent links with sane eagerness, gate analytics on actual viewing, and protect the server side effect from speculative requests."
      >
        <CodeHighlight code={buggy} language="html" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        <code>eagerness: "moderate"</code> fires on hover; scope <code>where</code> to product
        links. Check <code>document.prerendering</code> + <code>prerenderingchange</code> for
        analytics. The server can detect speculation via the <code>Sec-Purpose</code> header.
      </Callout>

      <SolutionReveal
        language="html"
        code={`<!-- (1) scope + hover-intent eagerness: speculate only what users signal -->
<script type="speculationrules">
{
  "prerender": [{
    "where": { "selector_matches": ".product-card a" },
    "eagerness": "moderate"            // fires on ~200ms hover, not on page load
  }],
  "prefetch": [{
    "where": { "href_matches": "/category/*" },   // cheaper bet for nav links
    "eagerness": "moderate"
  }]
}
</script>

<script>
  // (2) count a pageview only when the page is actually SEEN
  if (document.prerendering) {
    document.addEventListener('prerenderingchange', () => sendPageview(), { once: true });
  } else {
    sendPageview();
  }
</script>

// (3) server: don't run side effects for speculative requests
app.get('/coupon/:id', (req, res) => {
  const speculative = (req.headers['sec-purpose'] || '').includes('prefetch');
  if (!speculative) markCouponViewed(req.params.id);
  // alternative: move the side effect client-side, gated like analytics above
  res.render('coupon');
});

<!-- Bonus hygiene: browsers skip speculation for Save-Data users automatically;
     cap your rules to a handful of high-probability targets, and revalidate
     personalized content on prerenderingchange (it may be stale by activation). -->`}
      />
    </Stack>
  );
}
