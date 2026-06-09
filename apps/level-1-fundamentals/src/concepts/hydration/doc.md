# Hydration

## In one sentence

**Hydration** is the process where client-side JavaScript *attaches* event handlers and
restores state onto **static HTML that was already rendered by the server** (SSR/SSG),
turning "dead" markup into an interactive UI **without re-creating the DOM from scratch**.

```
SSR/SSG:   Server  ──render──▶  HTML string  ──ship──▶  Browser paints it (fast FCP)
                                                            │ (not clickable yet)
Hydration: Client loads JS ──▶ React rebuilds the VDOM ──▶ matches it to existing DOM
                                                            │
                                                            ▼
                                                    Attaches listeners → interactive
```

## Why hydration exists

SSR gives us a fast **First Contentful Paint (FCP)** and good **SEO** because users see
content immediately, before any JS runs. But server HTML has no event listeners and no
state — it's inert. Hydration is the bridge between static markup and an interactive app.

The key thing many people are fuzzy about: **between the moment HTML paints and the moment
hydration finishes, the UI looks ready but clicks/typing do nothing**. That gap is the
**"uncanny valley"** of SSR. If the JS bundle is large, this delay is long → users click
and get no response.

## React: `hydrateRoot` vs `createRoot`

| | `createRoot` (CSR) | `hydrateRoot` (SSR) |
|---|---|---|
| Initial DOM | empty (`<div id="root"></div>`) | already contains server HTML |
| Behavior | builds the whole DOM | reuses the DOM, only attaches listeners |
| Requirement | none | the client's first render **must match** the server HTML |

```tsx
// Client entry for an SSR app
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root')!, <App />);
```

## Hydration mismatch — the classic bug

React assumes the client's first render is **identical** to the server HTML. If they differ
you get the warning *"Hydration failed... server rendered HTML didn't match the client"*,
and React must patch the DOM (expensive) — sometimes discarding and re-rendering the whole
subtree.

Common causes:

- **Non-deterministic values**: `Date.now()`, `Math.random()`, `new Date().toLocaleString()`
  (differs by timezone/locale between server and client).
- **Touching browser-only APIs during render**: `window`, `localStorage`, `navigator`.
- **Invalid HTML**: `<p><div/></p>` gets auto-corrected by the browser parser.
- **Content branching on `typeof window`** that diverges on the two sides.

The correct fix:

```tsx
// Pattern: render the same as the server first, update after mount
function ClientOnlyTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    setTime(new Date().toLocaleTimeString()); // client only, AFTER hydration
  }, []);
  return <span>{time ?? 'Loading…'}</span>; // first render matches the server
}
```

You can also use `suppressHydrationWarning` for nodes that genuinely can't avoid differing
(e.g. timestamps), but that's an escape hatch, not a default.

## Modern variants (groundwork for Level 2)

- **Partial / Selective hydration**: hydrate only the parts that need interactivity, by
  priority (React 18 + Suspense). Covered in depth in Level 2.
- **Progressive hydration**: hydrate gradually by viewport/interaction.
- **Islands architecture** (Astro, Fresh): most of the page is static HTML; only a few
  "islands" hydrate.
- **Resumability** (Qwik): avoids hydration entirely by serializing state and *resuming*
  instead of *replaying*.

## Senior checklist

- Understand hydration is **attaching listeners onto existing DOM**, not repainting it.
- Know FCP comes from SSR while **TTI (Time To Interactive)** only arrives after hydration.
- Avoid every non-deterministic value in the first render.
- Know when to defer browser-only logic to `useEffect`.

## References

- [React: `hydrateRoot`](https://react.dev/reference/react-dom/client/hydrateRoot)
- [React: Common hydration mismatch causes](https://react.dev/link/hydration-mismatch)
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)
- [Patterns.dev: Progressive & Selective Hydration](https://www.patterns.dev/react/progressive-hydration/)
- [Qwik: Resumability vs Hydration](https://qwik.dev/docs/concepts/resumable/)
