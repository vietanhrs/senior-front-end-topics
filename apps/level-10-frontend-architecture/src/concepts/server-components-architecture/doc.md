# Server Components architecture

## What RSC actually changes

**React Server Components (RSC)** add a third kind of component to the model. Before RSC you had
**client components** that run in the browser (and optionally pre-render to HTML via SSR). RSC adds
components that run **only on the server, render once, and never ship their JavaScript to the
client**. This is not the same as SSR:

| | SSR (classic) | Server Components |
|---|---|---|
| Where it runs | server (then hydrates on client) | server only |
| Ships its JS to the client? | **yes** (for hydration) | **no — zero bundle cost** |
| Can hold state / effects? | yes | **no** |
| Output | HTML | a serialized **RSC payload** |

So SSR makes client components *appear* fast; RSC removes non-interactive components from the
**bundle entirely**.

## The two component types

**Server Components** (default in RSC frameworks):
- Run on the server; can be **`async`** and `await` data directly (DB, filesystem, internal services).
- Can safely use **secrets** (API keys) — they never reach the client.
- **Cannot** use `useState`/`useEffect`/event handlers/browser APIs.
- Render to an **RSC payload** (a streamed description of the tree), not HTML and not bundled JS.

**Client Components** (opt in with the `'use client'` directive at the top of the file):
- The interactive leaves: state, effects, event handlers, browser APIs.
- Their JS **is** shipped and hydrated.

## The boundary rules (the part people get wrong)

- A **server component can render a client component** and pass it **serializable props**
  (strings, numbers, plain objects, arrays, and even server-rendered **`children`**) — **not
  functions** or class instances.
- A **client component cannot import a server component** (it has no server to run it). But it **can
  receive one as `children`/props** — the "donut" pattern: a client shell with server-rendered
  filling passed in.
- `'use client'` marks the **entry** to the client subtree; everything imported below it is client
  too. Push it **down to the leaves** to keep the bundle small.

## Why it's an architecture, not a feature

- **Bundle**: only interactive leaves ship JS. A content-heavy page can ship near-zero component JS.
- **Data**: fetching colocates with the component on the server (no client waterfalls, no exposing
  endpoints/secrets).
- **Streaming**: the RSC payload **streams** and integrates with Suspense (level 7/8) — server work
  flushes progressively, client islands hydrate as they arrive (selective hydration).

## Senior checklist

- RSC = components that render **only on the server** and **ship no JS** — distinct from SSR (which
  hydrates and ships JS). Server components can be async, fetch data, and use secrets; no
  state/effects.
- `'use client'` marks the boundary into the interactive subtree — **push it to the leaves** to
  minimize bundle.
- Server→client props must be **serializable** (no functions); a client component can't import a
  server one but can take it as **children** (donut pattern).
- The win is **bundle + colocated data + streaming**; reach for it on content-heavy, data-driven UIs.

## References

- [React: Server Components](https://react.dev/reference/rsc/server-components)
- [React: 'use client' directive](https://react.dev/reference/rsc/use-client)
- [Next.js: Server & Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [Making Sense of React Server Components (Josh Comeau)](https://www.joshwcomeau.com/react/server-components/)
