# Level 4 — Advanced Data & State

Interactive SPA workbook for 10 concepts on modeling state correctly: identity, immutability, time,
and failure. Built on the shared `@sfe/workbook` engine. Stack: Bun · React 19 · TypeScript · Vite ·
Tailwind v4 · Mantine v8.

## Running

```bash
bun install                            # (run at the repo root)
bun run --filter level-4-data-state dev      # dev server
bun run --filter level-4-data-state build    # type-check + production build
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

Structural sharing · Immutable data patterns · Referential equality · Memoization pitfalls ·
Race conditions · Finite state modeling · Event sourcing · Optimistic UI rollback ·
Deterministic rendering · Idempotent actions.

## Notes on the demos

Most demos are **interactive and observable**:

- **Structural sharing / referential equality / memoization pitfalls** track reference identity and
  render/recompute counts so you can *see* when sharing or memoization works vs breaks.
- **Immutable data** shows mutation producing a stale UI (data changes, screen doesn't).
- **Race conditions** triggers a deterministic out-of-order response race and a sequence-token fix.
- **Finite state** contrasts an FSM with reachable "impossible" boolean-soup states.
- **Event sourcing** derives state by folding an event log, with a time-travel slider + undo/redo.
- **Optimistic UI** applies updates instantly with a forced-failure switch to watch rollbacks.
- **Deterministic rendering** shuffles tied rows under a random tiebreaker vs a stable `id` one.
- **Idempotent actions** double-charges in naive mode and dedupes via an idempotency key.
