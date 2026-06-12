# Controlled vs Uncontrolled Components

## The two models

For any component that holds input/interaction state, **who owns the state?**

- **Controlled** — the **parent** owns the value and passes it in via props (`value`), and the
  component reports changes via `onChange`. The component renders exactly what it's told; it has no
  state of its own. "Single source of truth" lives in the parent.
  ```jsx
  const [name, setName] = useState('');
  <input value={name} onChange={(e) => setName(e.target.value)} />
  ```
- **Uncontrolled** — the **component (or the DOM)** owns the value internally; the parent only sets
  an initial value (`defaultValue`) and reads the result imperatively when needed (a ref, or on
  submit).
  ```jsx
  const ref = useRef();
  <input defaultValue="" ref={ref} />   // read ref.current.value on submit
  ```

## When to use which

- **Controlled** when you need to **react to / validate / transform** input as it changes, drive it
  from elsewhere (reset, prefill, sync two fields), or keep it in sync with other state. Most app
  forms with live validation are controlled.
- **Uncontrolled** when you just need the **final value** (simple forms, file inputs — which are
  *always* uncontrolled), or to avoid re-rendering on every keystroke for very large/perf-sensitive
  forms. Libraries like React Hook Form lean uncontrolled for performance.

## The cardinal rule: don't switch modes

A component is controlled **iff** its `value` prop is not `undefined`. Flipping between
`value={undefined}` and `value={something}` triggers React's warning *"a component is changing an
uncontrolled input to be controlled"* and loses state. Pick one:
- Controlled? Always pass a defined `value` (use `''`, not `undefined`).
- Uncontrolled? Use `defaultValue`, never `value`.

## Building a component that supports BOTH (library technique)

Reusable components often accept either mode — controlled if `value` is provided, otherwise
self-managed from `defaultValue`:

```jsx
function Rating({ value, defaultValue = 0, onChange, max = 5 }) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = isControlled ? value : internal;          // single read point
  const set = (v) => {
    if (!isControlled) setInternal(v);                       // own state only when uncontrolled
    onChange?.(v);                                           // always notify
  };
  return /* stars 1..max, highlighted up to `current`, onClick={() => set(i)} */;
}
```

Keep `isControlled` stable for the component's life — don't let `value` go from defined to undefined.

## Senior checklist

- **Controlled** = parent owns `value` + `onChange` (single source of truth, live validation/derive).
  **Uncontrolled** = component/DOM owns it, parent reads via ref/`defaultValue`.
- Use controlled for reactive/validated/synced inputs; uncontrolled for fire-and-read forms and
  file inputs (always uncontrolled).
- **Never switch modes** — controlled means `value` is always defined; uncontrolled uses
  `defaultValue`. Mixing them triggers the React warning and drops state.
- A reusable input can support both: controlled when `value !== undefined`, else internal state from
  `defaultValue`, always firing `onChange`.

## References

- [React: Controlled vs Uncontrolled / Sharing state](https://react.dev/learn/sharing-state-between-components)
- [React: <input> (controlled vs uncontrolled)](https://react.dev/reference/react-dom/components/input)
- [React Hook Form (uncontrolled-first)](https://react-hook-form.com/)
