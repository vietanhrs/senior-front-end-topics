# Compound Components

## The pattern

**Compound components** are a set of components that work together to form a whole, sharing **implicit
state** through context, while the consumer composes them **declaratively** as JSX children. Think
`<select>`/`<option>` — they only make sense together and coordinate behind the scenes.

```jsx
<Tabs defaultValue="a">
  <Tabs.List>
    <Tabs.Tab value="a">First</Tabs.Tab>
    <Tabs.Tab value="b">Second</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="a">First panel</Tabs.Panel>
  <Tabs.Panel value="b">Second panel</Tabs.Panel>
</Tabs>
```

The consumer never wires `activeTab`/`onChange` between the pieces — the parent holds that state and
shares it via context; the children read it.

## How it's built

```jsx
const TabsCtx = createContext(null);

function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  return <TabsCtx.Provider value={{ value, setValue }}>{children}</TabsCtx.Provider>;
}
Tabs.List = ({ children }) => <div role="tablist">{children}</div>;
Tabs.Tab = ({ value, children }) => {
  const { value: active, setValue } = useContext(TabsCtx);
  return <button role="tab" aria-selected={active === value} onClick={() => setValue(value)}>{children}</button>;
};
Tabs.Panel = ({ value, children }) => {
  const { value: active } = useContext(TabsCtx);
  return active === value ? <div role="tabpanel">{children}</div> : null;
};
```

(Older variants used `React.Children.map` + `cloneElement` to inject props; **context is the modern
way** — it works at any nesting depth, where cloneElement only reaches direct children.)

## Why use it

- **Flexible markup** — the consumer controls layout/order/wrapping; the component doesn't dictate a
  rigid `items={[...]}` config shape.
- **No prop drilling** — shared state flows through context, not through every intermediate element.
- **Expressive & self-documenting** — the JSX reads like the UI it produces.
- **Extensible** — add `<Tabs.Badge>` or custom children without changing the public API.

## Trade-offs & tips

- **Guard the context**: a `Tabs.Tab` used outside `Tabs` should throw a clear error (a custom
  `useTabsContext()` that asserts non-null).
- Slightly more setup than a config-prop component; worth it for reusable, composable UI (design
  systems lean on this heavily — Mantine, Radix, Reach).
- For accessibility, wire `role`/`aria-selected`/keyboard handling inside the pieces so consumers get
  it for free.

## Senior checklist

- Compound components = several pieces sharing **implicit state via context**, composed as
  **declarative children** (`<X.Sub />`).
- Prefer **context** over `cloneElement`/`Children.map` — depth-independent, no fragile child
  inspection.
- Gains: flexible markup, no prop drilling, extensible API; cost: a bit more wiring + a context
  guard.
- Bake a11y/keyboard into the pieces; throw if a sub-component is used outside its parent.

## References

- [Kent C. Dodds: Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [patterns.dev: Compound Pattern](https://www.patterns.dev/react/compound-pattern/)
- [Radix UI primitives (compound APIs)](https://www.radix-ui.com/primitives)
