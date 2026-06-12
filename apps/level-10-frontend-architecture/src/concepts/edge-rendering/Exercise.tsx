import { Stack } from '@mantine/core';
import { CodeHighlight } from '@mantine/code-highlight';
import { Callout, DemoCard, SolutionReveal } from '@sfe/workbook';

const buggy = `// An "edge" SSR handler for a product page. It's deployed to the edge for speed,
// but it's actually slow and fragile: it round-trips to a single-region DB on
// every request, uses Node APIs, and buffers the whole page.
export const config = { runtime: 'edge' };

import fs from 'node:fs';                       // (1) Node API — not in edge runtime

export default async function handler(req) {
  const region = fs.readFileSync('./region');   // (2) blocking + unavailable at edge
  // (3) every request hops to the origin DB in us-east-1 (data gravity)
  const product = await db.query('SELECT * FROM products WHERE id = ?', [id]);
  const html = renderToString(<Product data={product} />); // (4) buffered, no stream
  return new Response(html);                     // (5) no cache, recomputed every hit
}`;

export function Exercise() {
  return (
    <Stack gap="md">
      <DemoCard
        title="Exercise: make this genuinely benefit from the edge"
        description="It's deployed to the edge but uses Node APIs, hits a far origin DB on every request (data gravity), and buffers the response. Fix the runtime constraints and co-locate the data so the edge actually helps — or render where the data is."
      >
        <CodeHighlight code={buggy} language="jsx" radius="md" />
      </DemoCard>

      <Callout kind="tip" title="Hint">
        Use Web APIs only (no <code>node:fs</code>; read geo from request headers). Kill data gravity:
        read read-mostly data from <b>edge KV / a regional replica</b>, or <b>cache</b> the
        product at the edge with revalidation. <b>Stream</b> the response. And accept that if data
        truly can't move, rendering near the origin may be the right call.
      </Callout>

      <SolutionReveal
        language="jsx"
        code={`export const config = { runtime: 'edge' };

export default async function handler(req) {
  // (1)(2) Web APIs only — geo comes from the edge platform's request headers.
  const country = req.headers.get('x-vercel-ip-country') ?? 'US';

  // (3) Kill data gravity: read from data that's NEAR the edge.
  //   a) edge cache first (stale-while-revalidate), or
  //   b) a globally-replicated DB so the read is local to the POP.
  const cacheKey = \`product:\${id}\`;
  let product = await edgeKV.get(cacheKey, 'json');     // Workers KV / Edge Config
  if (!product) {
    product = await replicatedDb.query(id);             // global replica → local read
    await edgeKV.put(cacheKey, JSON.stringify(product), { expirationTtl: 60 });
  }

  // (4) Stream the SSR output instead of buffering the whole document.
  const stream = await renderToReadableStream(<Product data={product} country={country} />);

  // (5) Cache at the edge with revalidation so repeat hits don't recompute.
  return new Response(stream, {
    headers: {
      'content-type': 'text/html',
      'cache-control': 's-maxage=60, stale-while-revalidate=300',
    },
  });
}

// If the data genuinely can't be replicated/cached (strongly-consistent,
// write-heavy, per-request), the honest answer is: render near the origin DB and
// use the edge only for middleware (auth/geo/redirects). Compute near the user is
// only a win when the data is near the compute.

// Why it's better: no Node APIs (runs on the isolate), reads are local to the POP
// (edge KV / replica) so there's no far DB hop per request, the response streams
// (low TTFB + progressive paint), and edge caching makes repeat hits ~instant.`}
      />
    </Stack>
  );
}
