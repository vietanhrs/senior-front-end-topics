# Level 1 — Fundamentals

Interactive SPA workbook for 10 fundamental concepts. Stack: Bun · React 19 · TypeScript ·
Vite · Tailwind v4 · Mantine v8 · React Router (hash router for easy static deployment).

## Running

```bash
bun install                  # (run at the repo root)
bun run --filter level-1-fundamentals dev      # dev server
bun run --filter level-1-fundamentals build    # type-check + production build
```

## Architecture

```
src/
├── main.tsx               # MantineProvider + mount; gathers all CSS imports
├── index.css              # CSS layer order: @layer mantine, tw-utils (Tailwind doesn't reset Mantine)
├── App.tsx                # createHashRouter
├── workbook/              # reusable "engine" for later levels
│   ├── types.ts           # ConceptModule, LevelMeta
│   ├── curriculum.ts      # full roadmap (shown in the sidebar)
│   ├── Layout.tsx         # AppShell + nav
│   ├── Overview.tsx       # overview page
│   ├── ConceptPage.tsx    # Theory / Demo / Exercise tabs + prev/next navigation
│   ├── DocView.tsx        # markdown renderer (react-markdown + Mantine CodeHighlight)
│   └── ui.tsx             # DemoCard, Callout, LogConsole+useLogger, SolutionReveal
└── concepts/
    ├── index.ts           # LEVEL registry (assembles the 10 concepts)
    └── <slug>/
        ├── doc.md         # theory (imported via ?raw)
        ├── Demo.tsx       # interactive demo
        ├── Exercise.tsx   # exercise + solution
        └── index.ts       # exports a ConceptModule
```

## Adding a new concept

1. Create `src/concepts/<slug>/` with `doc.md`, `Demo.tsx`, `Exercise.tsx`, `index.ts`.
2. In `index.ts`, export a `ConceptModule` (see `types.ts`).
3. Add it to the `concepts` array in `src/concepts/index.ts`.

Layout, routing, tabs, and the doc renderer apply automatically — nothing else to touch.

## Notable technical details

- **Tailwind + Mantine coexistence**: declare `@layer mantine, tw-utils` and **drop Tailwind's
  Preflight** so it doesn't reset Mantine's styles (see `index.css`).
- **Observable code splitting**: `HeavyWidget`, `mathPack`, and `heavy.worker` are emitted as
  separate chunks by Vite — visible in the Network tab and in the build output.
- **Web Worker**: uses the `new Worker(new URL('./x.worker.ts', import.meta.url), { type:
  'module' })` syntax that Vite supports natively.
