# Level 7 — Web Platform Internals

Interactive SPA workbook for 10 web-platform concepts below the framework line: rendering
strategies, web components, and the observer plumbing that drives modern UIs. Built on the shared
`@sfe/workbook` engine. Stack: Bun · React 19 · TypeScript · Vite · Tailwind v4 · Mantine v8.

## Running

```bash
bun install                                            # (run at the repo root)
bun run --filter level-7-web-platform-internals dev    # dev server
bun run --filter level-7-web-platform-internals build  # type-check + production build
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
    └── <slug>/            # doc.md + Demo.tsx + Exercise.tsx + index.ts (+ worker/element.ts)
```

## Concepts

Island architecture · Partial hydration · Streaming SSR · Shadow DOM · Custom elements lifecycle ·
Web components interoperability · IntersectionObserver internals · ResizeObserver loop limits ·
MutationObserver cost · OffscreenCanvas.

## Notes on the demos

The demos use the **real** platform APIs wherever possible, not mockups:

- **Island architecture** mounts independent React roots (`createRoot` per island) into separate
  containers and contrasts the shipped-JS budget of a full SPA vs hydrating only the islands.
- **Partial hydration** hydrates a widget on a chosen trigger — eager, `requestIdleCallback`,
  `IntersectionObserver` (visible), or first interaction (`pointerover`) — logging when each fires.
- **Streaming SSR** simulates the flush order of a blocking render vs a streamed shell with
  out-of-order Suspense chunks (shell → main → late sidebar).
- **Shadow DOM** uses real `attachShadow` (open/closed), proves style encapsulation against an
  injected page `<style>`, and demonstrates `<slot>` projection and `::part`.
- **Custom elements lifecycle** defines a real element and surfaces
  `connected`/`attributeChanged`/`adopted`/`disconnected` callbacks live via a pub/sub bus.
- **Web components interoperability** drives a real custom element imperatively (properties vs
  attributes, the attribute-stringification pitfall) and listens to its `CustomEvent`.
- **IntersectionObserver** runs a real observer over a scroll container with adjustable `threshold`
  and `rootMargin`, showing batched callbacks, the initial callback, and live `intersectionRatio`.
- **ResizeObserver loop limits** triggers the real *"loop completed with undelivered notifications"*
  window error by resizing the observed element in-callback, then fixes it with a `rAF`-deferred
  write.
- **MutationObserver cost** fires a burst of thousands of DOM mutations and shows them coalesced
  into a single batched callback; `subtree` and `attributeFilter` toggles change the record volume.
- **OffscreenCanvas** transfers a canvas to a worker (`transferControlToOffscreen`) and runs the
  whole `requestAnimationFrame` loop off-thread — block the main thread and only the main-thread
  canvas freezes.

## Angular equivalent

React examples in this level map to Angular through independent bootstrap roots, custom elements support, @defer/hydration, and directives. The platform primitive is shared; framework interop syntax differs.
