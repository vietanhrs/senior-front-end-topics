# Level 3 — Browser Performance

Interactive SPA workbook for 10 concepts about the browser rendering pipeline, GPU compositing, and
memory. Built on the shared `@sfe/workbook` engine. Stack: Bun · React 19 · TypeScript · Vite ·
Tailwind v4 · Mantine v8.

## Running

```bash
bun install                                      # (run at the repo root)
bun run --filter level-3-browser-performance dev    # dev server
bun run --filter level-3-browser-performance build  # type-check + production build
```

## Architecture

Thin app on top of the shared engine (`packages/workbook`, imported as `@sfe/workbook`, aliased to
its TS source in `vite.config.ts` + `tsconfig.json`).

```
src/
├── main.tsx               # MantineProvider + <WorkbookApp level={LEVEL} />
├── index.css              # Mantine/Tailwind layers + @source for the shared engine
├── lib/useFps.ts          # rAF-based FPS meter shared by the animation/GC demos
└── concepts/
    ├── index.ts           # LEVEL registry (assembles the 10 concepts)
    └── <slug>/            # doc.md + Demo.tsx + Exercise.tsx + index.ts
```

## Concepts

Layout thrashing · Paint vs Layout vs Composite · Compositing layers · GPU acceleration ·
CSS containment · Render-blocking resources · Render waterfall · Subpixel rendering ·
Detached DOM nodes · GC timing.

## Notes on the demos

Several demos are **measurable in the browser** and are most dramatic with DevTools open:

- **Layout thrashing** / **CSS containment** time forced reflows with `performance.now()` — compare
  the numbers across runs.
- **Paint/Layout/Composite**, **GPU acceleration**, **GC timing** use an FPS meter and a
  main-thread blocker; throttle CPU (Performance → 4–6×) to exaggerate differences.
- **Compositing layers** estimates GPU memory and points you to the **Layers** panel for ground truth.
- **Detached DOM nodes** is best confirmed with **Memory → heap snapshot → filter "Detached"** and
  the Retainers path. (`performance.memory` is shown when available, i.e. Chrome.)
- **Render-blocking resources** introspects this page's own `<link>`/`<script>` tags live.

## Angular equivalent

React-specific examples in this level generally map to Angular through AfterViewInit/render callbacks, directives, OnPush/signals, and CDK virtualization. The browser performance primitive is the same; the framework lifecycle hook differs.
