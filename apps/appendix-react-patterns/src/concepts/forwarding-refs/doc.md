# Ref Forwarding & Imperative Handle

## The problem

`ref` is not a normal prop — by default you **can't** put a `ref` on your own component and have it
reach a DOM node inside it. A parent that wants to call `inputRef.current.focus()` on your
`<TextField>` needs the ref to travel **through** your component to the underlying `<input>`. That's
**ref forwarding**.

## `forwardRef`

```jsx
const TextField = forwardRef(function TextField(props, ref) {
  return <input ref={ref} {...props} />;   // forward the ref to the real DOM node
});

// now the parent can grab the input:
const ref = useRef(null);
<TextField ref={ref} />;
ref.current.focus();
```

> **React 19 note:** `ref` is now a **regular prop** for function components, so you can write
> `function TextField({ ref, ...props })` without `forwardRef` (which is deprecated). The *concept* —
> passing the ref down to a real node — is unchanged; `forwardRef` is still everywhere in existing
> code and libraries.

## `useImperativeHandle` — expose an API, not the DOM

Often you **don't** want to hand the parent the raw DOM node (it could do anything). Instead expose a
**small, intentional imperative API**:

```jsx
const TextField = forwardRef(function TextField(props, ref) {
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; },
    // expose ONLY what callers should be able to do
  }), []);
  return <input ref={inputRef} {...props} />;
});

const api = useRef(null);
<TextField ref={api} />;
api.current.focus();  // controlled surface, not the whole DOM node
```

## When (and when not) to reach for this

- **Use** for genuinely imperative things React state can't express cleanly: **focus management**,
  text selection, scrolling into view, media play/pause, measuring, triggering an animation,
  integrating a non-React widget.
- **Don't** use it to push data or "tell a child to re-render with new values" — that's what **props
  and state** are for. Imperative handles are an escape hatch; prefer declarative data flow.
- A common smell is reaching for refs to avoid lifting state up. If you find yourself calling a
  child's method to set its data, lift the state instead.

## Senior checklist

- `ref` isn't a normal prop pre-React-19; use **`forwardRef`** to pass it to a DOM node inside your
  component (in React 19, `ref` is just a prop — `forwardRef` deprecated, concept unchanged).
- Use **`useImperativeHandle`** to expose a **minimal, intentional API** (`focus`, `clear`, `scrollTo`)
  instead of the raw DOM node.
- Reserve imperative handles for truly imperative needs (focus/scroll/media/measure/3rd-party
  widgets); keep data flow **declarative** (props/state).
- If you're using a ref to push data into a child, **lift state up** instead.

## References

- [React: forwardRef](https://react.dev/reference/react/forwardRef)
- [React: useImperativeHandle](https://react.dev/reference/react/useImperativeHandle)
- [React 19: ref as a prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop)
- [React: Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs)
