# Partial hydration

## What it adds on top of islands

Island architecture says *which* parts hydrate (only the interactive ones). **Partial hydration**
is the broader idea — hydrate **a subset** of the tree — plus the crucial second dimension:
**when** each piece hydrates. Instead of one hydration pass at load, each component is hydrated
**lazily**, on a trigger, so the main thread isn't flooded and below-the-fold interactivity costs
nothing until it's needed.

This is exactly Astro's `client:*` directives, and the same lever behind React's Suspense-driven
**selective hydration** (Level 2) — here viewed as a general platform pattern you can implement by
hand with `createRoot`/`hydrateRoot` per region.

## The hydration triggers

| Trigger | When it hydrates | Use for |
|---|---|---|
| **eager / load** | immediately on page load | above-the-fold, must-be-instant controls |
| **idle** | `requestIdleCallback` (next idle moment) | non-urgent widgets that should be ready soon |
| **visible** | `IntersectionObserver` when it scrolls into view | below-the-fold components (most of the page) |
| **interaction (lazy)** | on first `pointerover`/`focus`/`click` of the placeholder | rarely-used controls (menus, modals, video) |
| **media** | when a media query matches | mobile-only / desktop-only widgets |
| **never** | static, no hydration | pure display content |

`visible` and `interaction` are the big wins: they defer (or entirely avoid) work for content the
user never reaches.

## The mechanics: "render placeholder, attach later"

```tsx
// pseudo-Astro
<Counter client:visible />     // SSR'd HTML now; JS loads + hydrates when scrolled into view
<Newsletter client:idle />
<HeavyEditor client:only="react" />  // skip SSR, client-render only

// by hand: defer hydrate until the trigger fires
function hydrateWhenVisible(el, importComponent) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    importComponent().then(({ default: C }) => hydrateRoot(el, <C />)); // chunk loads now, not at page load
  });
  io.observe(el);
}
```

The component's chunk is **code-split** and only fetched when its trigger fires — so partial
hydration also shrinks the **initial** JS, not just defers execution.

## Pitfalls

- **Interactive-before-hydrated gap**: HTML looks ready but a not-yet-hydrated control is inert. For
  `interaction` triggers, capture the event and **replay** it after hydration (React's selective
  hydration does this; hand-rolled solutions must, or the first click is lost).
- **Layout shift on hydrate**: if hydration changes the DOM size, you get CLS. Server-render the
  real markup so hydration is a no-op visually.
- **Over-deferring urgent UI**: don't put `visible`/`idle` on the primary above-the-fold action.
- **Dependencies between deferred parts**: a not-yet-hydrated island can't respond to another's
  events; design for arrival-order independence.
- **SSR mismatch** still applies per region (Level 1): the deferred component's first client render
  must match its server HTML.

## Senior checklist

- Partial hydration = hydrate a subset, each on a trigger (eager / idle / visible / interaction / media).
- `visible` + `interaction` defer or avoid work for unreached content; chunks load on trigger → smaller initial JS.
- Mind the inert-until-hydrated gap (replay the first interaction), avoid hydration layout shift.
- Keep deferred regions independent; SSR markup must match to avoid mismatch/CLS.

## References

- [Astro: client directives (`client:visible`, `client:idle`, …)](https://docs.astro.build/en/reference/directives-reference/#client-directives)
- [Patterns.dev: Progressive hydration](https://www.patterns.dev/react/progressive-hydration/)
- [web.dev: requestIdleCallback](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)
- [React 18 WG: Selective hydration](https://github.com/reactwg/react-18/discussions/130)
