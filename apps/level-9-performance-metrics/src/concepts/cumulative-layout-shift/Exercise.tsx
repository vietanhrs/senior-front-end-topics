import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// A product card. It racks up CLS every time it renders because nothing reserves
// space for async content.
function ProductCard({ product }) {
  return (
    <div className="card">
      {/* image has no dimensions → collapses to 0, then jumps when it loads */}
      <img src={product.image} alt={product.title} />

      <h3>{product.title}</h3>

      {/* promo banner injected above the price when an async call resolves */}
      {promo && <Banner>{promo.text}</Banner>}

      <div className="price">{product.price}</div>

      {/* web font swaps in late, reflowing the whole card */}
      <p style={{ fontFamily: 'FancyFont' }}>{product.description}</p>
    </div>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: drive CLS to ~0"
        description="The image has no dimensions, the promo injects above existing content, and the web font swaps in late — three classic layout-shift sources. Reserve space for everything that arrives asynchronously."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Reserve space <i>before</i> async content lands: give the image <code>width</code>/
        <code>height</code> (or <code>aspect-ratio</code>), give the promo a fixed-height slot that
        exists whether or not the promo is present, and make the font swap metric-compatible
        (<code>font-display</code> + <code>size-adjust</code>/preload) so text doesn't reflow.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`function ProductCard({ product }) {
  return (
    <div className="card">
      {/* (1) reserve the image box via intrinsic size or aspect-ratio */}
      <img
        src={product.image}
        alt={product.title}
        width={320}
        height={200}
        style={{ aspectRatio: '16 / 10', width: '100%', height: 'auto' }}
        loading="lazy"
      />

      <h3>{product.title}</h3>

      {/* (2) ALWAYS-present fixed-height slot; the promo fills it, never inserts */}
      <div className="promo-slot" style={{ minHeight: 40 }}>
        {promo && <Banner>{promo.text}</Banner>}
      </div>

      <div className="price">{product.price}</div>

      {/* (3) metric-matched font swap so late font load doesn't reflow text */}
      <p className="description">{product.description}</p>
    </div>
  );
}

/* CSS:
@font-face {
  font-family: 'FancyFont';
  src: url('/fancy.woff2') format('woff2');
  font-display: optional;        /* don't swap after first paint -> no reflow */
  size-adjust: 97%;              /* match fallback metrics to minimize shift */
  ascent-override: 90%;
}
.description { font-family: 'FancyFont', system-ui, sans-serif; }
*/

// And preload the LCP image + critical font so they arrive before first paint:
//   <link rel="preload" as="image" href={product.image} />
//   <link rel="preload" as="font" type="font/woff2" href="/fancy.woff2" crossorigin>

// Why CLS drops to ~0: every async arrival (image, promo, font) lands into space
// that was already reserved, so nothing visible moves. The only shifts left are
// ones triggered directly by user input — which are excluded from CLS anyway.`}
      />
    </Stack>
  );
}
