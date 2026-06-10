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
│   ├── level-1-fundamentals/     # ✅ Level 1 SPA workbook (10 concepts)
│   │   └── src/concepts/<slug>/  # per concept: doc.md + Demo.tsx + Exercise.tsx + index.ts
│   ├── level-2-react-rendering/  # ✅ Level 2 SPA workbook (10 concepts)
│   │   └── src/concepts/<slug>/
│   └── level-3-browser-performance/ # ✅ Level 3 SPA workbook (10 concepts)
│       └── src/concepts/<slug>/
```

The reusable workbook engine lives in `packages/workbook` (`@sfe/workbook`). Each level app only
provides its own `concepts/` + `LevelMeta` and renders `<WorkbookApp level={LEVEL} />`. New levels
are new workspace apps following the same template.

## Running it

Requires **Bun ≥ 1.3**.

```bash
bun install           # install deps for the whole workspace
bun run dev           # run Level 1 (Vite dev server)
bun run dev:l2        # run Level 2
bun run dev:l3        # run Level 3
# or directly:
bun run --filter level-3-browser-performance dev
bun run --filter '*' build      # build everything
```

## Roadmap (10 levels — added incrementally)

| Level | Topic | Status |
|---|---|---|
| 1 | Fundamentals (clear, never fuzzy) | ✅ Done |
| 2 | React Core & Rendering Mechanics | ✅ Done |
| 3 | Browser Performance | ✅ Done |
| 4 | Advanced Data & State management | 🔜 |
| 5 | Caching & Networking strategies | 🔜 |
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

## Tech stack

Bun · React 19 · TypeScript · Vite · Tailwind CSS v4 · Mantine v8 · React Router.
