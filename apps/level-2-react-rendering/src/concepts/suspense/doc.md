# Suspense boundaries

## What Suspense is

`<Suspense>` lets a part of the tree **declaratively wait** for something (code, data) and show
a **fallback** until it's ready. A component signals "I'm not ready" by **suspending** — and the
nearest `<Suspense>` ancestor catches that and renders its `fallback` instead, while keeping the
rest of the page intact.

```tsx
<Suspense fallback={<Skeleton />}>
  <Profile />   {/* if Profile suspends, <Skeleton /> shows here */}
</Suspense>
```

## How a component "suspends"

A component suspends by **throwing a promise** during render (React catches it). You rarely do
this by hand — it happens via:

- **`React.lazy`** (the code chunk isn't loaded yet) — Level 1.
- **The `use(promise)` hook** (React 19) — reads a promise; suspends until it resolves.
- **Data libraries** that integrate with Suspense (React Query, Relay, RSC, framework loaders).

Because render must be pure/idempotent, the suspending render can run again — so the promise
must be **stable/cached** across renders (created outside render or memoized). Creating a *new*
promise every render causes an infinite fallback loop.

## The boundary determines what's hidden

A `<Suspense>` boundary defines the unit that shows a fallback **together**. Anything outside it
renders immediately; anything inside that suspends triggers the *one* fallback for the whole
boundary.

```tsx
<Layout>
  <Sidebar />                         {/* shows instantly */}
  <Suspense fallback={<FeedSkeleton />}>
    <Feed />                          {/* this region waits as a unit */}
  </Suspense>
</Layout>
```

**Nested boundaries** let you reveal content progressively — an inner boundary can keep showing
its own fallback while the outer content is already visible:

```tsx
<Suspense fallback={<PageSkeleton />}>
  <Header />
  <Suspense fallback={<CommentsSkeleton />}>
    <Comments />     {/* reveals later, independently of Header */}
  </Suspense>
</Suspense>
```

## Transitions avoid unwanted fallbacks

When content is **already on screen** and you trigger an update that suspends (e.g. navigating,
refetching), you usually *don't* want it to flash back to a skeleton. Wrap the update in a
**transition**: React keeps the current UI visible (with `isPending`) and swaps only when the
new content is ready.

```tsx
const [isPending, startTransition] = useTransition();
startTransition(() => setQuery(next)); // suspends without showing the fallback again
```

## SSR streaming + Suspense

On the server, `renderToPipeableStream` can **stream HTML in chunks**: it sends the fallback's
HTML for a not-yet-ready boundary, keeps rendering, and streams the real HTML when ready — the
browser swaps it in. This also enables **selective hydration** (next concept).

## Pitfalls

- **Unstable promises** → infinite fallback. Cache the promise.
- **Boundary too high** → one slow piece hides the whole page; **too low** → skeleton confetti.
  Place boundaries around meaningful, independently-loadable regions.
- **Waterfalls**: nested components each starting their own fetch on mount load sequentially.
  Kick off fetches in parallel (hoist them, or use a loader) so boundaries resolve together.
- Suspense for data needs a Suspense-enabled source; a bare `useEffect(fetch)` doesn't suspend.

## Senior checklist

- A boundary is the unit that shows a fallback; nest boundaries for progressive reveal.
- Components suspend by throwing a (cached/stable) promise; `use()` is the React 19 primitive.
- Use transitions to avoid flashing fallbacks when content is already visible.
- Avoid request waterfalls; start independent fetches in parallel.

## References

- [React: Suspense](https://react.dev/reference/react/Suspense)
- [React: use](https://react.dev/reference/react/use)
- [React: startTransition + Suspense](https://react.dev/reference/react/useTransition#preventing-unwanted-loading-indicators)
- [React: renderToPipeableStream (streaming SSR)](https://react.dev/reference/react-dom/server/renderToPipeableStream)
