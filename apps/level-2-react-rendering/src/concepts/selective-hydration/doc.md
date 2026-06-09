# Selective hydration

> Builds on Level 1 "Hydration". There, hydration was one big all-or-nothing step. React 18+
> makes it **selective**: granular, out-of-order, and interruptible by user interaction.

## The problem with traditional hydration

Classic hydration was **blocking and monolithic**:

1. The server sent the full HTML.
2. The client had to download **all** the JS,
3. then hydrate the **entire** tree in one synchronous pass before **anything** became interactive.

So one slow component (or one big chunk) delayed interactivity for the whole page. Time To
Interactive (TTI) was held hostage by the slowest/biggest part.

## What selective hydration changes

By wrapping parts of the app in **`<Suspense>`**, React can:

- **Hydrate independently / out of order.** Each Suspense boundary hydrates as its code+data are
  ready — a boundary whose chunk arrives first becomes interactive first, without waiting for siblings.
- **Stream + hydrate in parallel.** With streaming SSR (`renderToPipeableStream`), HTML for a
  boundary can arrive after the initial shell; React hydrates it when it does.
- **Prioritize by interaction.** This is the headline feature: if the user **clicks** a region
  that hasn't hydrated yet, React **synchronously hydrates that boundary first**, ahead of the
  queue, so their click isn't lost. React even **replays** the captured event after hydrating.

```tsx
// Each boundary is an independent hydration unit. A click on Comments makes
// React hydrate the Comments boundary first, before the (still-pending) Sidebar.
<Suspense fallback={<HeaderSkeleton />}><Header /></Suspense>
<Suspense fallback={<SidebarSkeleton />}><Sidebar /></Suspense>
<Suspense fallback={<CommentsSkeleton />}><Comments /></Suspense>
```

## How it works (mental model)

- Hydration is scheduled as **low-priority, time-sliced** work (concurrent rendering), so it
  doesn't block the main thread — the browser can paint and handle input meanwhile.
- React records which boundaries are hydrated. On a user event in a not-yet-hydrated boundary,
  React **bumps that boundary to high priority**, hydrates it immediately, and dispatches the
  event so the interaction "just works."
- Boundaries hydrate in **document order by default**, but interaction and readiness reorder it.

## Practical guidance

- **Wrap independently-interactive regions in Suspense** so they can hydrate separately. No
  boundaries → you're back to monolithic hydration.
- **Code-split along boundaries** (Level 1) so each region's JS can arrive independently.
- Put boundaries around things users are likely to interact with early (search, nav) so an early
  click prioritizes the right region.
- This is a **framework-level** capability — Next.js, Remix/React Router, etc. wire up streaming
  SSR + Suspense for you. In a pure CSR Vite SPA there's no SSR to hydrate, so the demo here
  *simulates* the scheduling.

## Senior checklist

- Selective hydration = independent, out-of-order, interruptible hydration via Suspense boundaries.
- A click on a pending boundary makes React hydrate it first (and replays the event).
- Needs streaming SSR + Suspense + code-splitting along boundaries.
- More boundaries around interactive regions = better TTI and click responsiveness.

## References

- [React 18 Working Group: New Suspense SSR & selective hydration](https://github.com/reactwg/react-18/discussions/37)
- [React: hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)
- [React: renderToPipeableStream](https://react.dev/reference/react-dom/server/renderToPipeableStream)
- [Patterns.dev: Progressive & Selective Hydration](https://www.patterns.dev/react/progressive-hydration/)
