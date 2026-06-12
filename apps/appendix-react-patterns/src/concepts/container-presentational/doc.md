# Container / Presentational

## The pattern

Split a feature into two kinds of components:

- **Presentational** ("dumb") — concerned with **how things look**. Receives everything via **props**,
  has no app/data dependencies, holds at most local UI state, and is trivially reusable and testable.
- **Container** ("smart") — concerned with **how things work**. Fetches data, holds the logic/state,
  and **passes props down** to presentational components.

```jsx
// presentational: pure, prop-driven, no idea where data comes from
function UserCard({ name, email, loading, onRefresh }) {
  if (loading) return <Skeleton />;
  return (
    <div>
      <h3>{name}</h3><p>{email}</p>
      <button onClick={onRefresh}>Refresh</button>
    </div>
  );
}

// container: wires data + behavior, renders the presentational component
function UserCardContainer({ id }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { setLoading(true); fetchUser(id).then((u) => { setUser(u); setLoading(false); }); }, [id]);
  useEffect(() => { load(); }, [load]);
  return <UserCard {...user} loading={loading} onRefresh={load} />;
}
```

## Why it still matters (even though hooks changed it)

Historically this was *the* way to separate concerns. **Custom hooks** (next pattern) now absorb most
"container" logic without a wrapper component, so you rarely write an explicit container anymore. But
the underlying principle is timeless and still the goal:

- **Presentational components stay pure** — props in, UI out. They're reusable across data sources,
  easy to test (no mocking fetch), and easy to render in Storybook/design systems.
- **Logic lives in one place** — a hook or a container — not smeared through the view.

So the modern phrasing is: *keep your view components dumb; push data/logic into hooks (or a thin
container).* The split is conceptual, not necessarily two files.

## When to use / avoid

- **Use** when a view is reused with different data sources, or you want pure, testable UI.
- **Don't** over-apply it to tiny components — a wrapper that only forwards props with no logic is
  noise. Prefer a custom hook for the logic and one component for the view.

## Senior checklist

- Separate **how it looks** (presentational, prop-driven, pure) from **how it works** (data/logic).
- Modern React puts the "container" logic in a **custom hook**; keep the view component dumb either
  way.
- Presentational components are reusable + testable precisely because they don't know where data
  comes from.
- Don't create empty pass-through containers; apply the split where it buys reuse/testability.

## References

- [Presentational and Container Components (Dan Abramov)](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)
- [patterns.dev: Container/Presentational](https://www.patterns.dev/react/presentational-container-pattern/)
