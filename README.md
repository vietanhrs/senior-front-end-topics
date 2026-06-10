# Senior Front-end Topics

Documentation & exercises for practicing **in-depth front-end knowledge** at a senior level.
Each *level* is its own **interactive SPA workbook** (Bun + React + TypeScript + Vite +
Tailwind + Mantine), where each *concept* has 3 parts:

- **Theory** — in-depth markdown to understand the concept + references to online sources.
- **Demo** — an **interactive example you can observe in the browser** (open DevTools to see).
- **Exercise** — code to complete/fix/improve, with a revealable solution to compare against.

## Repository structure (Bun workspaces monorepo)

```
senior-front-end-topics/
├── package.json                  # workspace root
├── packages/
│   └── workbook/                 # shared engine: WorkbookApp, layout, doc renderer, UI, roadmap
│       └── src/                  # consumed by every level via the @sfe/workbook alias
├── apps/
│   ├── workbook-hub/             # ⭐ ALL levels in one app (navigate between levels)
│   │   └── src/levels.ts         # aggregates every level's LEVEL registry
│   ├── level-1-fundamentals/     # ✅ Level 1 SPA workbook (10 concepts)
│   │   └── src/concepts/<slug>/  # per concept: doc.md + Demo.tsx + Exercise.tsx + index.ts
│   ├── level-2-react-rendering/  # ✅ Level 2 SPA workbook (10 concepts)
│   │   └── src/concepts/<slug>/
│   ├── level-3-browser-performance/ # ✅ Level 3 SPA workbook (10 concepts)
│   │   └── src/concepts/<slug>/
│   ├── level-4-data-state/       # ✅ Level 4 SPA workbook (10 concepts)
│   │   └── src/concepts/<slug>/
│   └── level-5-caching-networking/ # ✅ Level 5 SPA workbook (10 concepts)
│       └── src/concepts/<slug>/
```

The reusable workbook engine lives in `packages/workbook` (`@sfe/workbook`). Each level app
provides its own `concepts/` + `LevelMeta` and renders `<WorkbookApp level={LEVEL} />`; the
**hub** passes all of them at once (`<WorkbookApp levels={LEVELS} />`) and gets cross-level
navigation, a level switcher sidebar, and routes like `/#/3/layout-thrashing`. New levels are new
workspace apps following the same template — plus one import line in the hub's `levels.ts`.

## Running it

Requires **Bun ≥ 1.3**.

```bash
bun install           # install deps for the whole workspace
bun run dev           # ⭐ run the HUB (all levels in one app)
bun run dev:l1        # run Level 1 standalone
bun run dev:l2        # run Level 2
bun run dev:l3        # run Level 3
bun run dev:l4        # run Level 4
bun run dev:l5        # run Level 5
# or directly:
bun run --filter level-5-caching-networking dev
bun run --filter '*' build      # build everything
```

## Roadmap (10 levels — added incrementally)

| Level | Topic | Status |
|---|---|---|
| 1 | Fundamentals (clear, never fuzzy) | ✅ Done |
| 2 | React Core & Rendering Mechanics | ✅ Done |
| 3 | Browser Performance | ✅ Done |
| 4 | Advanced Data & State management | ✅ Done |
| 5 | Caching & Networking strategies | ✅ Done |
| 6 | Security | 🔜 |
| 7–10 | (to be added later) | 🔜 |

### Level 1 — Fundamentals (10 concepts)

1. **Hydration** — attach event handlers/state onto server-rendered HTML.
2. **Virtual DOM diffing complexity** — O(n³) → O(n) via type + key heuristics.
3. **Event loop (macro vs microtasks)** — async execution order.
4. **Critical rendering path** — DOM/CSSOM → render tree → layout → paint.
5. **Code splitting strategies** — split the bundle by route/component/vendor.
6. **Dynamic import chunking** — `import()`, how the bundler cuts & caches chunks.
7. **Preload vs Prefetch vs Preconnect** — the right resource hints in the right place.
8. **CORS preflight** — when the browser auto-sends OPTIONS.
9. **CSRF vs XSS mitigation** — the distinction & how to defend.
10. **Web workers vs Service workers** — off-main-thread vs network proxy/offline.

### Level 2 — React Core & Rendering Mechanics (10 concepts)

1. **Reconciliation algorithm** — state lives at (position + type + key); preserve vs remount.
2. **Fiber architecture** — interruptible units of work; pure render vs atomic commit.
3. **Concurrent rendering** — interruptible, cooperative rendering (transitions/deferred values).
4. **Time slicing** — render large updates in ~5ms chunks, yielding to the browser.
5. **Scheduler priorities** — lanes & tiers; urgent updates preempt transitions.
6. **Suspense boundaries** — declarative waiting; `use()`; avoiding fallback flashes.
7. **Selective hydration** — independent, interaction-prioritized hydration via Suspense.
8. **Server components** — server-only, zero-JS components; the `'use client'` boundary.
9. **Tearing in concurrent UI** — inconsistent external-store reads; `useSyncExternalStore`.
10. **Stale closure problems** — callbacks capturing old renders; updaters/deps/refs.

### Level 3 — Browser Performance (10 concepts)

1. **Layout thrashing** — interleaved read/write forces repeated reflows; batch reads then writes.
2. **Paint vs Layout vs Composite** — the pixel pipeline & which CSS props re-enter it where.
3. **Browser compositing layers** — GPU layer textures; promotion triggers & memory cost.
4. **GPU acceleration in CSS** — transform/opacity on the compositor; survives main-thread jank.
5. **CSS containment** — `contain` + `content-visibility` to scope/skip layout & paint.
6. **Render blocking resources** — identify & unblock paint-blocking CSS/JS.
7. **Render waterfall** — critical-path latency = the request chain; attack depth & late discovery.
8. **Subpixel rendering** — CSS px vs device px (DPR); snap to the device grid for crispness.
9. **Detached DOM nodes** — removed-but-referenced nodes leak; heap snapshots & cleanup.
10. **Garbage collection timing** — non-deterministic GC pauses; cut allocation pressure in hot paths.

### Level 4 — Advanced Data & State (10 concepts)

1. **Structural sharing** — immutable updates that re-create only the change path; share the rest.
2. **Immutable data patterns** — replace, never mutate; in-place mutation = stale UI.
3. **Referential equality** — objects/functions compare by reference; fresh identities defeat memo.
4. **Memoization pitfalls** — unstable deps, trivial memos, children-defeated memo, effects in useMemo.
5. **Race conditions in UI state** — out-of-order responses; cleanup flags / AbortController / tokens.
6. **Finite state modeling** — replace boolean soup with a discriminated-union FSM.
7. **Event sourcing in frontend** — state = fold over an event log; undo/redo & time-travel for free.
8. **Optimistic UI rollback** — apply instantly, reconcile with the server, roll back on failure.
9. **Deterministic rendering** — same inputs → same output; no random/now/unstable sorts in render.
10. **Idempotent UI actions** — safe to repeat; client guards + idempotency keys.

### Level 5 — Caching & Networking (10 concepts)

1. **Cache invalidation strategies** — TTL, key-based/immutable, validation, event-driven.
2. **Stale-while-revalidate** — serve cached instantly, refresh in the background (header + UI pattern).
3. **ETag vs Cache-Control** — freshness (skip the network) vs validation (cheap 304s).
4. **HTTP/3 and QUIC** — independent streams over UDP kill TCP head-of-line blocking; 0/1-RTT.
5. **Backpressure in Streams API** — consumer-paced production via desiredSize/high-water mark.
6. **AbortController** — the cancellation primitive: on-the-wire aborts, timeouts, combined signals.
7. **Streaming fetch response handling** — chunked bodies, stateful decoding, frame buffering.
8. **Priority hints** — `fetchpriority`: promote the LCP image, demote the noise.
9. **SameSite cookie modes** — Strict/Lax/None on *sites* (eTLD+1); the Lax GET exception.
10. **Speculative prerendering** — Speculation Rules; prefetch/prerender on hover; gate analytics.

## Tech stack

Bun · React 19 · TypeScript · Vite · Tailwind CSS v4 · Mantine v8 · React Router.
