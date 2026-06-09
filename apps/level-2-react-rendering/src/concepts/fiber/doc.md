# Fiber architecture

## Why Fiber exists

Before React 16, reconciliation was **recursive and synchronous** ("stack reconciler"): once
React started rendering a tree it ran to completion, blocking the main thread. A big update
could jank the UI for hundreds of ms.

**Fiber** (React 16+) re-implemented reconciliation as a **linked list of units of work** that
can be **paused, resumed, reused, aborted, and reprioritized**. This interruptibility is the
foundation that makes **concurrent rendering**, **time slicing**, and **Suspense** possible.

## A fiber is a unit of work

A **fiber** is a plain JS object representing one node (a component instance, a DOM element,
etc.). Instead of the call stack, fibers form a tree via three pointers:

```
        child
   ┌──────────────▶
Parent ───────────── Child1 ──sibling──▶ Child2 ──sibling──▶ Child3
   ▲     return                            │
   └──────────────────────────────────────┘  (return points back to parent)
```

- `child` → first child fiber
- `sibling` → next sibling fiber
- `return` → parent fiber (where to go back after finishing children)

React traverses this structure iteratively (not via recursion), so it can stop after any fiber,
check "do I still have time / has something more urgent come in?", and yield to the browser.

Each fiber also stores: its `type`, `pendingProps`/`memoizedProps`, `memoizedState` (the hooks
linked list), the effect flags, and `alternate` (its counterpart in the other tree, see below).

## Two phases: render (interruptible) vs commit (atomic)

Fiber splits work into two phases:

| Phase | What happens | Interruptible? | Side effects allowed? |
|---|---|---|---|
| **Render / reconcile** | Call components, build the work-in-progress tree, diff, mark effects | ✅ yes (can be paused/restarted/aborted) | ❌ **No** — must be pure |
| **Commit** | Apply DOM mutations, run layout effects, then passive effects | ❌ no (synchronous, atomic) | ✅ yes (this is where DOM/refs/effects run) |

This is the single most important consequence for engineers: **the render phase can run
multiple times or be thrown away before committing.** So a component's body (and `useMemo`,
`useState` initializers) must be **pure** — no mutating external state, no DOM writes, no
"do it once" side effects. Side effects belong in event handlers or effects (commit phase).

> React 18+ StrictMode intentionally **double-invokes** render and effect setup/cleanup in dev
> to surface impurity and missing cleanup.

## Double buffering: `current` vs `work-in-progress`

React keeps **two fiber trees**: the `current` tree (what's on screen) and a
**work-in-progress** tree it builds during render. Each fiber's `alternate` links the two. When
render finishes, React **swaps** the WIP tree to become `current` in a single commit. If a
render is aborted (e.g. a higher-priority update arrives), the half-built WIP tree is simply
discarded — `current` is untouched, so the screen never shows a partial render.

## Lanes: the priority model

Updates are tagged with **lanes** (a bitmask) representing priority — e.g. discrete user input
(high) vs transitions (low). The scheduler uses lanes to decide what to render next, to batch
compatible updates, and to interrupt low-priority work for high-priority work. (Details in
"Scheduler priorities".)

## Senior checklist

- Fiber = interruptible, linked-list reimplementation of reconciliation (the basis of concurrency).
- Render phase is pure & interruptible; commit phase is atomic & where effects/DOM happen.
- Never put side effects in render — it can run many times or be discarded.
- Double buffering (`current` vs WIP, swapped at commit) is why aborted renders don't tear the screen.

## References

- [React: Render and Commit](https://react.dev/learn/render-and-commit)
- [Lin Clark: A Cartoon Intro to Fiber (talk)](https://www.youtube.com/watch?v=ZCuYPiUIONs)
- [React Fiber Architecture (acdlite notes)](https://github.com/acdlite/react-fiber-architecture)
- [React: Keeping components pure](https://react.dev/learn/keeping-components-pure)
