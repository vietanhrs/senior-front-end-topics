# Level 2 — React Core & Rendering Mechanics

Interactive SPA workbook for 13 concepts about how React actually renders. Built on the shared
`@sfe/workbook` engine. Stack: Bun · React 19 · TypeScript · Vite · Tailwind v4 · Mantine v8.

## Running

```bash
bun install                              # (run at the repo root)
bun run --filter level-2-react-rendering dev      # dev server
bun run --filter level-2-react-rendering build    # type-check + production build
```

## Architecture

This app is thin — the layout, routing, theory renderer, nav, and UI helpers all come from the
shared engine in `packages/workbook` (imported as `@sfe/workbook`, aliased to its TS source in
`vite.config.ts` + `tsconfig.json`).

```
src/
├── main.tsx               # MantineProvider + <WorkbookApp level={LEVEL} />
├── index.css              # Mantine/Tailwind layers + @source for the shared engine
└── concepts/
    ├── index.ts           # LEVEL registry (assembles the 13 concepts)
    └── <slug>/
        ├── doc.md         # theory (imported via ?raw)
        ├── Demo.tsx       # interactive demo
        ├── Exercise.tsx   # exercise + solution
        └── index.ts       # exports a ConceptModule
```

## Concepts

React elements & JSX output · Render pipeline & Fiber work loop · ReactDOM host renderer ·
Reconciliation · Fiber architecture · Concurrent rendering · Time slicing · Scheduler priorities ·
Suspense boundaries · Selective hydration · Server components · Tearing · Stale closures.

## Notes on the demos

- **Time slicing / concurrent rendering / scheduler priorities** use real React 18+ concurrency
  (`useTransition`, `useDeferredValue`) with CPU-heavy renders + an rAF heartbeat so you can *feel*
  responsiveness differences. Best observed in a production build (`build` + `preview`); dev
  StrictMode double-invokes render/effects.
- **Selective hydration** and **server components** can't run their real machinery in a pure CSR
  SPA, so those demos *simulate* the scheduler / show an interactive classifier, with the real
  patterns in the theory + solution.
- **Tearing** uses a deterministic simulation of a mid-render store mutation, plus a live
  `useSyncExternalStore` example.
