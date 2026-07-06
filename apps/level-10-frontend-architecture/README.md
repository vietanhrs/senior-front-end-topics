# Level 10 — Modern Frontend System Architecture

Interactive SPA workbook for 10 system-architecture concepts: rendering placement, composition,
client storage at scale, offline/distributed data, and the trade-offs that tie them together — the
capstone of the curriculum. Built on the shared `@sfe/workbook` engine. Stack: Bun · React 19 ·
TypeScript · Vite · Tailwind v4 · Mantine v8.

## Running

```bash
bun install                                          # (run at the repo root)
bun run --filter level-10-frontend-architecture dev    # dev server
bun run --filter level-10-frontend-architecture build  # type-check + production build
```

## Architecture

Thin app on top of the shared engine (`packages/workbook`, imported as `@sfe/workbook`, aliased to
its TS source in `vite.config.ts` + `tsconfig.json`).

```
src/
├── main.tsx               # MantineProvider + <WorkbookApp level={LEVEL} />
├── index.css              # Mantine/Tailwind layers + @source for the shared engine
└── concepts/
    ├── index.ts           # LEVEL registry (assembles the 10 concepts)
    └── <slug>/            # doc.md + Demo.tsx + Exercise.tsx + index.ts
```

## Concepts

Edge rendering · Micro-frontend orchestration · Module Federation · WebAssembly integration ·
IndexedDB scaling strategy · Server Components architecture · Offline-first design · Conflict
resolution models · Distributed UI consistency · Frontend system design trade-offs.

## Notes on the demos

The demos use **real** platform APIs where the concept allows, and clearly-labelled
models/simulations where the real thing needs a server or build pipeline:

- **Edge rendering** simulates TTFB across regions for origin vs edge vs edge-with-data, surfacing the
  data-gravity trade-off.
- **Micro-frontend orchestration** composes an app shell of staggered-loading remotes; toggle one to
  fail and see error-boundary isolation keep the shell + siblings alive.
- **Module Federation** is a live shared-scope negotiator — set each app's React version + singleton
  options and watch it resolve to one instance, multiple copies (broken hooks), or a version error;
  the notes also cover versioned manifests, contract tests, owned shared dependencies, and fallback
  strategies for multi-team compatibility.
- **WebAssembly integration** instantiates a **real**, hand-assembled `.wasm` module and calls its
  export, then benchmarks 5M calls to demonstrate the JS↔WASM boundary cost.
- **IndexedDB scaling** runs against a **real** IndexedDB: bulk-in-one-transaction vs one-per-record,
  and index query vs full-scan-and-filter, with live timings.
- **Server Components architecture** is an interactive server/client component tree showing bundle
  contribution (server = 0 KB) and boundary-rule violations.
- **Offline-first design** uses **real** `online`/`offline` events + an optimistic outbox that queues
  writes offline and replays them (idempotent) on reconnect.
- **Conflict resolution models** compares LWW / field-LWW / three-way merge / CRDT / manual on one
  concurrent edit, showing what each loses or flags.
- **Distributed UI consistency** uses **real** `BroadcastChannel` instances (two in-page "tabs")
  with versioned, monotonic updates and a simulated partition to show convergence.
- **Frontend system design trade-offs** is a decision tool: pick constraints, get a right-sized
  rendering strategy + topology and the trade-offs/tensions it implies.

## Angular equivalent

When architecture docs mention React singleton/runtime concerns, Angular has the same class of issue for @angular/core, @angular/common, @angular/router, Zone.js, RxJS, and design-system runtimes. Singletons and version alignment are still platform contracts.
