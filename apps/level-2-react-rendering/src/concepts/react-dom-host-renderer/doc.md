# ReactDOM host renderer

## React core is renderer-agnostic

React's reconciler decides **what work needs to happen**. It does not itself know how to create a
browser DOM node, a native mobile view, or a terminal UI widget. That host-specific work belongs
to a renderer.

For the web, the renderer is **ReactDOM**. When the reconciler sees a host element like:

```tsx
<button className="primary" disabled={isSaving} onClick={save}>
  Save
</button>
```

ReactDOM knows how to translate that host work into browser operations.

## Host elements become host fibers

For a JSX type string like `'button'`, React creates a HostComponent fiber. During completion and
commit, ReactDOM handles the host instance:

```ts
// Mental model, not public API:
const node = document.createElement('button');
node.className = 'primary';
node.disabled = isSaving;
node.textContent = 'Save';
parent.appendChild(node);
```

ReactDOM also knows the awkward browser details: property vs attribute, style object diffing,
controlled input semantics, text nodes, SVG namespaces, resource tags, and more.

## Props are not copied blindly

ReactDOM maps JSX props to DOM behavior:

| JSX prop | Host behavior |
|---|---|
| `className` | Sets the DOM `class` attribute / `className` property. |
| `htmlFor` | Sets the label's `for` attribute. |
| `style={{ opacity: 0.5 }}` | Diffs a style object and updates individual style properties. |
| `disabled={false}` | Removes/clears the boolean host property/attribute. |
| `children="Save"` | May create/update a text node or text content. |
| `onClick={fn}` | Registers through React's event system, not as a raw `onclick` string. |
| `dangerouslySetInnerHTML` | Writes HTML to a host node; React skips normal children there. |

This is why a mini renderer that just calls `setAttribute` for everything is wrong.

## Event delegation

ReactDOM uses a synthetic event system layered over browser events. In modern React, event
listeners are generally delegated at the root container instead of attaching a separate native
listener to every button.

That gives React a consistent event API, batching behavior, priority classification for events,
and event replay during hydration for supported events.

## Refs are attached in commit

Refs are not available while render is computing elements. A DOM ref is attached only after
ReactDOM has committed the host node:

```tsx
const ref = useRef<HTMLButtonElement>(null);
return <button ref={ref} />;
```

`ref.current` points to the DOM node after commit, so layout reads belong in `useLayoutEffect`
or event handlers. Avoid mutating DOM nodes that React owns unless you are doing a non-destructive
escape hatch like focus, scroll, or measurement.

## Hydration is matching, not fresh creation

With server rendering, the browser already has DOM from HTML. `hydrateRoot` asks ReactDOM to
match React elements against that existing DOM, attach listeners, and reuse nodes where possible.

Hydration is not a guarantee that every mismatch will be patched. Some mismatches are recoverable,
some cause React to discard and client-render a subtree, and some attributes may remain stale
until a later update. Treat hydration warnings as bugs.

## Senior checklist

- React reconciles; ReactDOM performs web host operations.
- Host fibers (`'div'`, `'button'`, text) eventually map to DOM nodes/text nodes.
- Props require DOM-specific mapping; they are not blindly copied as attributes.
- Events are delegated and prioritized through ReactDOM's event system.
- Refs attach in commit; layout reads belong after DOM mutation.
- Hydration reuses existing DOM when it matches, and mismatch recovery is limited.

## References

- [ReactDOM client APIs](https://react.dev/reference/react-dom/client)
- [React DOM common components](https://react.dev/reference/react-dom/components/common)
- [React: Manipulating the DOM with refs](https://react.dev/learn/manipulating-the-dom-with-refs)
- [React: hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)
