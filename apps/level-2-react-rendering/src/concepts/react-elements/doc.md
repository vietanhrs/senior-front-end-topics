# React elements & JSX output

## The core idea

React does not render JSX directly. JSX is syntax that your compiler lowers into calls to the
JSX runtime (`jsx` / `jsxs`) or, in older transforms, `React.createElement`. Those calls return
a **React element object**: an immutable description of what you want on the screen.

```tsx
<button className="primary">Save</button>
```

is roughly equivalent to:

```tsx
jsx('button', {
  className: 'primary',
  children: 'Save',
});
```

and the runtime returns an object shaped like:

```ts
{
  $$typeof: Symbol.for('react.transitional.element'), // React 19 implementation detail
  type: 'button',
  key: null,
  props: {
    className: 'primary',
    children: 'Save',
  },
  ref: null,
}
```

The exact internal fields can differ between development, production, and React versions. The
stable app-level model is: **an element has `type`, `props`, `key`, and `ref`**.

## What each field means

### `type`

`type` tells React what kind of node this element describes:

- a string like `'div'` or `'button'` means a **host component** handled by the renderer
  (`react-dom` on the web),
- a function or class means React must call/instantiate a **user component** to get more elements,
- a special symbol/object can mean Fragment, Suspense, memo, lazy, Context, and other React types.

```tsx
<button />          // type === 'button'
<Profile />         // type === Profile
<>...</>            // type === React.Fragment
<Suspense />        // type === React.Suspense
```

### `props`

`props` contains the attributes you passed, plus `children`. JSX children are just another prop:

```tsx
<Panel title="Details">
  <p>Hello</p>
</Panel>
```

becomes a `Panel` element whose props are roughly:

```ts
{
  title: 'Details',
  children: {
    $$typeof: Symbol.for('react.transitional.element'),
    type: 'p',
    props: { children: 'Hello' },
    key: null,
    ref: null,
  },
}
```

### `key`

`key` is not a normal prop. React stores it on the element so the reconciler can match siblings
across renders. Your component does **not** receive `key` in `props`.

```tsx
items.map((item) => <Row key={item.id} item={item} />)
```

`Row` receives `{ item }`, not `{ key, item }`.

### `ref`

`ref` is also special. For host elements, React attaches it during the commit phase when the DOM
node exists. For function components in React 19, `ref` is passed as a prop when the component is
written to accept it; older code commonly uses `forwardRef`.

## Elements are not DOM nodes

A React element is a plain JS object. Creating it does not touch the DOM:

```tsx
const element = <button>Save</button>;
// No DOM node exists yet.
```

The DOM appears only after a renderer receives the element tree:

```tsx
createRoot(container).render(element);
```

At that point React builds a Fiber tree from the element tree, computes what changed, and asks
the host renderer (`react-dom`) to create/update/remove real DOM nodes during commit.

## Element tree vs Fiber tree

React elements are **immutable descriptions**. They are cheap snapshots created every render.

Fibers are **mutable work nodes**. A Fiber keeps the persistent rendering state React needs:
hooks, update queues, lanes, effect flags, the current DOM node for host components, and an
`alternate` pointer to the other tree.

That distinction is crucial:

- elements describe the next UI,
- fibers store work and state across renders,
- the DOM is the host output produced during commit.

## Senior checklist

- JSX compiles to runtime calls that return React element objects.
- An element is a description with `type`, `props`, `key`, and `ref`; it is not a DOM node.
- `key` and `ref` are special; they are not ordinary component props.
- Function components return elements; host elements become DOM work only through the renderer.
- Elements are immutable render output; Fibers are mutable units of work that preserve state.

## Angular equivalent

The Angular equivalent is not another element object. Angular templates are compiler input that becomes Ivy create/update instructions. Inputs map to `input()` / `@Input`, callback props map to `output()` / `@Output`, and children map to `<ng-content>`. See Level 2* "Angular templates vs JSX" for the full bridge.

## References

- [React: createElement](https://react.dev/reference/react/createElement)
- [React: isValidElement](https://react.dev/reference/react/isValidElement)
- [React: Render and Commit](https://react.dev/learn/render-and-commit)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)
