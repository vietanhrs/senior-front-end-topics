# Workbook Hub — all levels in one app

A single SPA that aggregates every level's workbook with cross-level navigation:

- `/#/` — landing page listing all levels (+ locked upcoming ones)
- `/#/3` — Level 3 overview
- `/#/3/layout-thrashing` — a concept page (Theory / Demo / Exercise)

The sidebar shows every level as a collapsible group; the active level's concepts expand
automatically.

## Running

```bash
bun install                       # (run at the repo root)
bun run dev                       # root shortcut for this app
bun run --filter workbook-hub dev
bun run --filter workbook-hub build
```

## How it works

- The shared engine (`@sfe/workbook`) supports two modes:
  - `<WorkbookApp level={LEVEL} />` — single level (used by the per-level apps, unchanged);
  - `<WorkbookApp levels={LEVELS} />` — hub mode: routes `/`, `/:levelId`, `/:levelId/:slug`,
    with `HubShell` (level-switcher sidebar), `HubOverview`, and `LevelScope` providing the
    active level to the same `Overview`/`ConceptPage` used in single mode.
- `src/levels.ts` imports each level's `LEVEL` registry straight from the sibling apps'
  `src/concepts` — safe inside the monorepo since all apps share the same engine, tooling, and
  dependency versions.
- Build: `manualChunks` emits one chunk per level (plus mantine/markdown vendors), while keeping
  Level 1's dynamically-imported demo modules (`HeavyWidget`, `mathPack`, workers) as separate
  chunks so its code-splitting demos remain observable.

## Adding a new level to the hub

1. Build the level app as usual (`apps/level-6-*` with its `src/concepts/index.ts` exporting `LEVEL`).
2. Add one import + array entry in `src/levels.ts`. Done — routes, sidebar, and the landing card
   appear automatically (and it disappears from the "coming soon" list, which is derived from the
   shared ROADMAP).
