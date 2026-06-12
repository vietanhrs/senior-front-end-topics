# Composition (over Configuration / Inheritance)

## The principle

React has **no component inheritance** — you don't `extends Button`. The way to reuse and specialize
UI is **composition**: build components out of other components, passing UI **in** rather than
configuring it with ever-more props. "Composition over inheritance" and "composition over
configuration" are the same instinct: prefer slots/children to boolean-and-string prop soup.

## The tools

### 1. `children` (containment)
The most basic and powerful: a component renders a "hole" its parent fills.

```jsx
function Card({ children }) { return <div className="card">{children}</div>; }
<Card><h3>Title</h3><p>Body</p></Card>
```

### 2. Named slots (props that take JSX)
When you need *several* holes, accept `ReactNode` props — "slots":

```jsx
function Panel({ title, actions, children, footer }) {
  return (
    <section className="panel">
      <header><h3>{title}</h3><div>{actions}</div></header>
      <div className="body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </section>
  );
}
<Panel title="Settings" actions={<IconButton icon="x" />} footer={<SaveBar />}>…</Panel>
```

### 3. Specialization by composition
Make a specific component by **wrapping** a generic one with fixed children/props — the React
replacement for subclassing:

```jsx
// instead of `class ConfirmDialog extends Dialog`
function ConfirmDialog({ onConfirm, children }) {
  return <Dialog footer={<><Button onClick={onConfirm}>Confirm</Button></>}>{children}</Dialog>;
}
```

## Why composition beats a config-prop explosion

A component that grows `showHeader`, `headerText`, `headerIcon`, `showFooter`, `footerButtons`,
`variant`, `dense`… is a smell:

- **Combinatorial props** can't express arbitrary content (what if the header needs a custom badge?).
- **Every new need = a new prop** and an edit to the component.
- Hard to read at the call site, hard to type, easy to pass conflicting flags.

With slots/children the consumer supplies **exactly** the markup they want; the component just
provides **structure and behavior**. The prop surface stays tiny and stable.

## When configuration is still right

Props are correct for **data and behavior** (`value`, `onChange`, `disabled`, `variant` from a small
fixed set). Use **composition for content/structure**. Rule of thumb: if a prop's value would
naturally be JSX, make it a slot/child; if it's a scalar/flag/callback, keep it a prop.

## Senior checklist

- React favors **composition over inheritance**; specialize by **wrapping** generic components, not
  subclassing.
- Use **`children`** for the main hole and **`ReactNode` slot props** for multiple holes; let
  consumers pass real markup.
- Replace boolean/string **config-prop explosions** with slots — smaller, stable, more expressive
  API.
- Keep **props for data/behavior**, **composition for content/structure**.

## References

- [React: Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children)
- [React (legacy): Composition vs Inheritance](https://legacy.reactjs.org/docs/composition-vs-inheritance.html)
- [patterns.dev: Composition](https://www.patterns.dev/react/)
