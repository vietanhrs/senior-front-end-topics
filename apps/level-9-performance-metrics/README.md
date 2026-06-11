# Level 9 — Performance Metrics in Practice

Interactive SPA workbook for 10 real-world performance & UX-measurement concepts: the Core Web
Vitals, the observer APIs that produce them, memory-leak hunting, and the accessibility/input
plumbing users actually feel. Built on the shared `@sfe/workbook` engine. Stack: Bun · React 19 ·
TypeScript · Vite · Tailwind v4 · Mantine v8.

## Running

```bash
bun install                                        # (run at the repo root)
bun run --filter level-9-performance-metrics dev     # dev server
bun run --filter level-9-performance-metrics build   # type-check + production build
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

First Input Delay (FID) · Interaction to Next Paint (INP) · Cumulative Layout Shift (CLS) · Largest
Contentful Paint (LCP) · PerformanceObserver API · Long Tasks API · Browser memory leak detection ·
Accessibility tree · ARIA live regions internals · Pointer events model.

## Notes on the demos

The demos drive the **real** browser APIs wherever the engine supports them, with graceful
feature-detection fallbacks:

- **FID** measures real input delay (block the main thread, then tap) and reads the page's actual
  `first-input` entry.
- **INP** uses the real Event Timing API (`event` entries) to break each interaction into input
  delay / processing / presentation; a slider inflates handler processing.
- **CLS** triggers genuine `layout-shift` entries with a late-loading banner, demonstrating the
  `hadRecentInput` exclusion and reserved-space fix, with a session-window CLS accumulator.
- **LCP** reads the real buffered `largest-contentful-paint` entry and runs a candidate-evolution
  timeline (largest-so-far, frozen on input).
- **PerformanceObserver** attaches observers for ~9 entry types (`buffered`) into one live timeline,
  with `supportedEntryTypes` detection and generators for marks/long tasks/resources.
- **Long Tasks** records real `longtask` entries and computes Total Blocking Time, contrasting one
  300ms task with chunked + yielding work.
- **Memory leak detection** runs a controlled, measurable leak (retained detached nodes + buffers)
  vs a clean cycle, and probes `performance.memory` / `measureUserAgentSpecificMemory`.
- **Accessibility tree** computes role + accessible name (accname priority) + tree pruning live as
  you edit markup/attributes.
- **ARIA live regions** are real `role="status"`/`role="alert"` regions (so a real screen reader
  announces them), with a model of polite vs assertive ordering and the flooding pitfall.
- **Pointer events** is a real drawing surface using `setPointerCapture`, `getCoalescedEvents`,
  pressure, and `touch-action: none` — one handler set for mouse/touch/pen.
