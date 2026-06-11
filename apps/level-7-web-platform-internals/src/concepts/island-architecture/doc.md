# Island architecture

## The core idea

Most pages are **mostly static** — a header, article body, footer — with a few **interactive
regions**: a search box, a cart widget, a carousel. **Island architecture** ships the page as
static HTML and hydrates **only those interactive regions** ("islands"), each independently. The
"sea" of static content around them ships **zero JavaScript**.

```
┌───────────────────────────────────────────┐
│  static HTML (no JS)                        │
│   ┌─────────────┐        ┌───────────────┐  │
│   │ 🏝 Search    │ static │ 🏝 Cart badge  │  │   ← islands: each its own tiny JS bundle,
│   │  (island)    │  HTML  │  (island)      │  │     hydrated independently
│   └─────────────┘        └───────────────┘  │
│  more static HTML …                         │
└───────────────────────────────────────────┘
```

Contrast with a **SPA**, where the whole page is one JS app and *everything* hydrates, and with
classic SSR, where the entire tree is server-rendered then hydrated as one unit (Level 1).

## Why it matters

- **Less JS** = faster TTI. You only pay for the interactive parts; the static 80–90% of the page
  costs nothing on the client.
- **Independent hydration** = no single big hydration pass blocking the main thread; each island
  hydrates on its own schedule (eager, on-visible, on-idle, on-interaction — next concept).
- **Resilience**: one island's JS failing doesn't take down the others or the static content.

This is the model behind **Astro** (`client:*` directives), **Marko**, **Fresh** (Deno),
**Eleventy + islands**, and increasingly partial-hydration modes in meta-frameworks.

## How an island works (mechanically)

1. The server renders the whole page to HTML, including each island's initial markup (so it's
   visible and SEO-friendly immediately).
2. For each island it emits a small **bootstrap**: the component's code + a marker (e.g.
   `<astro-island>`) describing which component, its props (serialized), and the hydration trigger.
3. On the client, a tiny runtime finds the markers and **mounts/hydrates each island into its own
   root** — `createRoot`/`hydrateRoot` per island, not one app root.

The key difference from a SPA: **N small roots** scattered in static HTML, instead of **one root**
owning the page.

## Trade-offs & gotchas

- **Cross-island communication is harder**: islands are isolated roots; they don't share a React
  tree/context. Use the platform — custom events, a shared store via `useSyncExternalStore`,
  `BroadcastChannel`, or URL/state — not React context across islands.
- **Duplicated runtime**: naively, each island bundles its own framework runtime. Frameworks
  dedupe the shared runtime chunk; verify you're not shipping React N times.
- **Props are serialized** across the static→island boundary (like RSC): must be JSON-serializable;
  no functions/class instances.
- **Not free for highly-interactive apps**: a dashboard that's interactive *everywhere* has few
  static regions to save — islands shine for content-heavy, mostly-static pages.

## Senior checklist

- Islands = static HTML + independently-hydrated interactive regions (many small roots, not one).
- Ship JS only for interactive parts → big TTI win on content-heavy pages.
- Islands are isolated: coordinate via events/stores/URL, not a shared component tree.
- Watch runtime duplication & serializable props; not the right model for fully-interactive apps.

## References

- [Patterns.dev: Islands architecture](https://www.patterns.dev/vanilla/islands-architecture/)
- [Astro: Islands](https://docs.astro.build/en/concepts/islands/)
- [Jason Miller: Islands architecture (original)](https://jasonformat.com/islands-architecture/)
- [Deno Fresh: Islands](https://fresh.deno.dev/docs/concepts/islands)
