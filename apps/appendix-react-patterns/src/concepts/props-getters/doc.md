# Props Getters

## The pattern

A **props getter** is a function a hook/component returns that produces **all the props you should
spread onto an element** — event handlers, ARIA attributes, ids, roles — so the consumer gets correct
behavior and accessibility **by default**, while still being able to add their own props and
handlers. Popularized by **Downshift** (`getInputProps`, `getItemProps`, `getMenuProps`).

```jsx
const { isOpen, getTriggerProps, getPanelProps } = useDisclosure();

<button {...getTriggerProps({ onClick: () => track('opened') })}>Menu</button>
<div {...getPanelProps()} hidden={!isOpen}>…</div>
```

The getter wires `aria-expanded`, `aria-controls`, the matching `id`, and the toggle handler — and
**composes** the consumer's `onClick` with its own so both run.

## The core trick: composing handlers

The getter must call the consumer's handler **and** its internal one (and respect
`event.defaultPrevented` so a consumer can bail out):

```jsx
const callAll = (...fns) => (...args) => fns.forEach((fn) => fn?.(...args));

function getTriggerProps({ onClick, ...props } = {}) {
  return {
    'aria-expanded': isOpen,
    'aria-controls': panelId,
    ...props,                                   // consumer's className/style/etc.
    onClick: callAll(onClick, () => setOpen((o) => !o)), // their handler + ours
  };
}
```

If you just let the consumer pass `onClick`, they'd **overwrite** your toggle (or you'd overwrite
theirs). The getter merges them so neither side has to know about the other.

## Why use it (vs exposing raw state/handlers)

- **Correct-by-default accessibility & behavior** — consumers can't forget `aria-*`, `id` wiring,
  `role`, keyboard handlers; the getter supplies them.
- **Flexible** — consumers still add classes, data attrs, and their own handlers; the getter merges.
- **Encapsulated** — internal implementation (which ids, which events) can change without breaking
  call sites.

It pairs with the **state reducer** pattern: state reducer = control over *state transitions*; props
getters = control over *prop wiring*. Together (à la Downshift) they give consumers huge flexibility
while keeping the component correct.

## Pitfalls

- **Always spread the getter** (`{...getTriggerProps()}`) — forgetting it silently drops a11y/
  handlers.
- **Compose, don't clobber** handlers (use `callAll`); honor `defaultPrevented`.
- Let consumer props win where appropriate (styling), but keep critical wiring (handlers, aria)
  composed/controlled.

## Senior checklist

- A props getter returns the **full prop bundle** (handlers + ARIA + ids) to spread onto an element →
  correct behavior/a11y by default, still customizable.
- **Compose handlers** with a `callAll` helper so the consumer's and the component's both run; respect
  `event.defaultPrevented`.
- Spread consumer props for styling, but keep behavior/aria controlled by the getter.
- Pairs with the **state reducer** pattern (transitions) — the Downshift-style "maximum flexibility,
  correct by default" combo.

## References

- [Kent C. Dodds: How to give rendering control with prop getters](https://kentcdodds.com/blog/how-to-give-rendering-control-to-users-with-prop-getters)
- [Downshift: prop getters](https://www.downshift-js.com/downshift#prop-getters)
