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
├── package.json                 # workspace root
├── apps/
│   └── level-1-fundamentals/    # ✅ Level 1 SPA workbook (all 10 concepts)
│       └── src/
│           ├── workbook/        # shared "engine": layout, registry, doc renderer, UI
│           └── concepts/<slug>/ # per concept: doc.md + Demo.tsx + Exercise.tsx + index.ts
└── packages/                    # (reserved for shared code later)
```

Each subsequent level will be a new workspace app (`apps/level-2-...`, …) following the same
template as Level 1.

## Running it

Requires **Bun ≥ 1.3**.

```bash
bun install           # install deps for the whole workspace
bun run dev           # run Level 1 (Vite dev server)
# or directly:
bun run --filter level-1-fundamentals dev
bun run --filter level-1-fundamentals build
```

## Roadmap (10 levels — added incrementally)

| Level | Topic | Status |
|---|---|---|
| 1 | Fundamentals (clear, never fuzzy) | ✅ Done |
| 2 | React Core & Rendering Mechanics | 🔜 |
| 3 | Browser Performance | 🔜 |
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

## Tech stack

Bun · React 19 · TypeScript · Vite · Tailwind CSS v4 · Mantine v8 · React Router.
