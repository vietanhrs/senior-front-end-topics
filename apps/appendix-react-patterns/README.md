# Appendix · React Design Patterns

A bonus workbook covering the canonical **React design patterns** — what each is for, when to reach
for it (and when a newer pattern supersedes it), and a **runnable example** plus a fix-it exercise for
every one. Built on the shared `@sfe/workbook` engine. Stack: Bun · React 19 · TypeScript · Vite ·
Tailwind v4 · Mantine v8.

## Running

```bash
bun install                                   # (run at the repo root)
bun run --filter appendix-react-patterns dev    # dev server
bun run --filter appendix-react-patterns build  # type-check + production build
```

## Architecture

Thin app on top of the shared engine (`packages/workbook`, imported as `@sfe/workbook`, aliased to
its TS source in `vite.config.ts` + `tsconfig.json`). It registers as a "level" (number 11) so it
appears at the end of the hub's sidebar.

```
src/
├── main.tsx               # MantineProvider + <WorkbookApp level={LEVEL} />
├── index.css              # Mantine/Tailwind layers + @source for the shared engine
└── concepts/
    ├── index.ts           # LEVEL registry (assembles the 14 patterns)
    └── <slug>/            # doc.md + Demo.tsx + Exercise.tsx + index.ts (+ helpers)
```

## Patterns

1. **Container / Presentational** — separate pure prop-driven views from data/logic.
2. **Custom Hooks** — extract reusable stateful logic (the modern HOC/render-props replacement).
3. **Compound Components** — `Tabs.List`/`Tabs.Tab`/`Tabs.Panel` sharing context state.
4. **Render Props** — function-as-prop delegating rendering; and when hooks win.
5. **Higher-Order Components (HOC)** — `Component → Component` wrappers + hygiene.
6. **Provider Pattern** — Context + typed hook, memoized value, split contexts.
7. **Controlled vs Uncontrolled** — who owns the value; supporting both modes.
8. **State Reducer Pattern** — consumer-supplied reducer controls every transition.
9. **Props Getters** — handler + ARIA bundles with composed handlers.
10. **Composition over Configuration** — children, slots, specialization-by-wrapping.
11. **Ref Forwarding & Imperative Handle** — pass refs through; minimal imperative API.
12. **Error Boundaries** — scoped fallbacks + reset + reporting.
13. **Lazy Loading & Suspense** — on-demand chunks, error boundaries, preloading.
14. **Portals** — escape overflow/z-index via `createPortal`; React-tree event bubbling.

## Notes on the demos

Demos use the **real** React APIs and run live: a working compound `Tabs`, a state-reducer `useToggle`
with consumer rules, props-getter `useDisclosure`, `forwardRef` + `useImperativeHandle`, a class
`ErrorBoundary` catching a render throw, a real `React.lazy` + `Suspense` that code-splits into its
own chunk, and a `createPortal` modal/popover that escapes an `overflow: hidden` ancestor. Each
pattern's exercise is a realistic anti-pattern to refactor, with a revealable solution.
