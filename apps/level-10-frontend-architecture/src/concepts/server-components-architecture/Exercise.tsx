import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// 'use client' is at the top of the whole page, so EVERYTHING ships to the client
// (huge bundle), the data fetch runs in a client effect (waterfall), and an API
// key leaks into the browser.
'use client';
import { useState, useEffect } from 'react';

export default function ProductPage({ id }) {
  const [product, setProduct] = useState(null);
  useEffect(() => {
    fetch('https://api/products/' + id, { headers: { 'x-api-key': API_KEY } }) // key in client!
      .then((r) => r.json()).then(setProduct);
  }, [id]);

  if (!product) return <Spinner />;
  return (
    <article>
      <ProductDetails product={product} />   {/* static, but bundled + hydrated */}
      <Reviews productId={id} />              {/* static list, also bundled */}
      <AddToCart product={product} />         {/* the only interactive part */}
    </article>
  );
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: restructure around the server/client boundary"
        description="The whole page is a client component, so static content is bundled + hydrated, data is fetched in a client effect (waterfall), and the API key ships to the browser. Make the page a server component and push 'use client' down to the interactive leaf."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Make the page a <b>server component</b> (no <code>'use client'</code>): <code>await</code> the
        data directly on the server (no effect, no waterfall, key stays server-side). Keep static
        parts as server components (0 KB). Put <code>'use client'</code> only on the genuinely
        interactive leaf (<code>AddToCart</code>), passing it serializable props.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`// ProductPage.jsx — NO 'use client' → server component, ships zero JS
import { ProductDetails } from './ProductDetails';   // server (static)
import { Reviews } from './Reviews';                  // server (static, can be async)
import { AddToCart } from './AddToCart';              // client leaf (see below)

export default async function ProductPage({ id }) {
  // fetch on the server: no client waterfall, and the API key never leaves the server
  const product = await fetch('https://api/products/' + id, {
    headers: { 'x-api-key': process.env.API_KEY },
  }).then((r) => r.json());

  return (
    <article>
      <ProductDetails product={product} />            {/* 0 KB to the client */}
      {/* Reviews can fetch its own data on the server and stream via Suspense */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={id} />
      </Suspense>
      {/* only the interactive bit is a client component; pass serializable props */}
      <AddToCart productId={product.id} price={product.price} />
    </article>
  );
}

// AddToCart.jsx — the ONLY 'use client' file
'use client';
import { useState } from 'react';
export function AddToCart({ productId, price }) {
  const [qty, setQty] = useState(1);
  return <button onClick={() => addToCart(productId, qty)}>Add ({price})</button>;
}

// Why it's better: ProductPage/ProductDetails/Reviews ship NO JavaScript (server
// components) — only AddToCart is bundled + hydrated. Data is fetched on the server
// (no effect waterfall, secret stays server-side) and Reviews streams via Suspense.
// The bundle drops from "whole page" to "one button". Note: props crossing into
// AddToCart are serializable (ids/numbers) — you can't pass a function across.`}
      />
    </Stack>
  );
}
