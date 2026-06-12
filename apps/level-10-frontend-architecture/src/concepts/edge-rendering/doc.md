# Edge rendering

## The idea

**Edge rendering** runs your server-side logic (SSR, middleware, APIs) on a CDN's **edge network** —
hundreds of points of presence (POPs) physically close to users — instead of in one centralized
origin region. The goal is **latency**: the first byte travels metres-to-hundreds-of-km, not
across an ocean. Platforms: Cloudflare Workers, Vercel/Netlify Edge Functions, AWS Lambda@Edge,
Deno Deploy, Fastly Compute.

## Why it's fast (and what it runs on)

Edge runtimes are **V8 isolates**, not containers/VMs — thousands share a process, so **cold starts
are ~milliseconds** and they scale globally for free. The cost: a **constrained runtime**:

- **Web APIs, not Node** — `fetch`, `Request`/`Response`, Web Streams, `crypto.subtle`; usually **no**
  `fs`, raw TCP, or most native npm modules.
- **Tight CPU/time/memory budgets** per request (e.g. tens of ms of CPU, a few MB) — edge is for
  glue and rendering, not heavy compute.

## The patterns

- **Edge SSR + streaming** — render the document at the POP and stream it (the level-7/8 streaming
  pipeline, but originating near the user) → low TTFB *and* progressive paint.
- **Edge middleware** — run *before* the request resolves: auth checks, A/B bucketing, geolocation,
  i18n redirects, bot detection, personalization headers. Cheap, ubiquitous.
- **Cache / ISR at the edge** — serve cached HTML from the POP, revalidate in the background.
- **Partial Prerendering (PPR)** — a static shell served instantly from edge cache, with dynamic
  holes streamed in — static speed + dynamic freshness.

## The catch: data gravity

Moving **compute** to the edge is easy; moving **data** is not. If your edge function still has to
call a database in one region on every request, you've added a hop: **user → edge (near) → origin DB
(far) → back**. That can be **as slow as, or slower than**, just rendering at the origin — the famous
*"data gravity"* problem. Edge wins only when the data is also near the edge:

- **Edge KV / edge cache** (Workers KV, Vercel Edge Config) for read-mostly config/content.
- **Regional/global replicas** (Turso/libSQL, D1, Planetscale, DynamoDB global tables) so reads are
  local.
- **Cache the data** at the edge with smart invalidation; keep writes going to the origin of record.

So the senior framing is a **placement** problem: *put compute near the user, but only if the data it
needs is also near the user.* Otherwise keep rendering where the data lives.

## Senior checklist

- Edge rendering runs SSR/middleware on V8 isolates at POPs near users → low TTFB, instant cold
  start, global scale — but a **constrained, Web-API-only runtime** with tight CPU/time budgets.
- Best for streaming SSR, middleware (auth/geo/A-B/redirects), edge cache/ISR, and PPR shells.
- **Data gravity** is the trap: an edge function that round-trips to a distant origin DB per request
  can be slower than origin rendering — co-locate data via edge KV / regional replicas / caching.
- Decide by **placement**: compute near the user *and* data near the compute.

## References

- [Cloudflare: How Workers works (isolates)](https://developers.cloudflare.com/workers/reference/how-workers-works/)
- [Vercel: Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Next.js: Partial Prerendering](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)
- [The Edge Computing case & data gravity](https://www.cloudflare.com/learning/serverless/glossary/what-is-edge-computing/)
