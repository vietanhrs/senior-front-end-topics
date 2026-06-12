# Portals

## The pattern

A **Portal** renders children into a **different DOM node** — outside the parent's DOM hierarchy —
while keeping them in the **same React tree**. `createPortal(children, domNode)` is how you put modals,
dialogs, tooltips, popovers, toasts, and dropdowns at the **top of the DOM** (usually `document.body`)
so they're not trapped by an ancestor's styles.

```jsx
import { createPortal } from 'react-dom';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <div className="backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>,
    document.body,                 // render OUTSIDE the parent, into body
  );
}
```

## Why you need them: escaping the parent

CSS makes overlays painful when they're nested inside other content:

- **`overflow: hidden` / `auto`** on an ancestor **clips** your dropdown/tooltip.
- **`z-index` + stacking contexts** — an ancestor with `transform`, `opacity`, `filter`, or its own
  `z-index` creates a stacking context your overlay can't escape, so it renders *behind* other UI no
  matter how high its `z-index`.
- **`position` containment** — `position: fixed` is relative to a transformed ancestor, not the
  viewport.

Rendering into `document.body` via a portal sidesteps all of these: the overlay sits at the document
root, free of ancestor clipping and stacking.

## The crucial gotcha: events bubble through the React tree

A portal moves the **DOM** position, **not** the React position. So **events bubble to React
ancestors**, not DOM ancestors. A `click`/`onChange` inside a portaled modal will fire `onClick`
handlers on the component that **rendered** the portal — even though the DOM node is elsewhere. This
is usually what you want (context, handlers keep working), but it surprises people debugging "why did
clicking my modal trigger the parent's handler?"

(Native, non-React event listeners attached to a DOM ancestor of the portal target behave by DOM
position — another subtlety with outside-click handling.)

## Doing modals/overlays right (beyond the portal)

A portal is necessary but not sufficient for an accessible overlay:

- **Focus management** — move focus into the dialog on open, **trap** it inside, restore it to the
  trigger on close.
- **Escape + scrim click** to close; `aria-modal="true"` + `role="dialog"` + a label.
- **Scroll locking** of the background.
- **`inert`** on the rest of the page so AT/tab don't reach behind the modal.

This is why most teams use the platform **`<dialog>`** element or a library (Radix, Mantine, React
Aria) that bundles portal + focus trap + a11y, rather than hand-rolling.

## Senior checklist

- `createPortal(children, node)` renders into a **different DOM node** (usually `document.body`) but
  keeps children in the **same React tree** — for modals/tooltips/toasts/dropdowns.
- Use it to escape ancestor **`overflow` clipping** and **z-index/stacking contexts**.
- **Events bubble through the React tree, not the DOM** — portaled content's events reach the
  rendering component's ancestors (handy, but a common surprise).
- A portal alone isn't accessible — add **focus trap/restore, Escape, scroll lock, `aria-modal`,
  `inert`** (or use `<dialog>`/a library).

## References

- [React: createPortal](https://react.dev/reference/react-dom/createPortal)
- [React: portals & event bubbling](https://react.dev/reference/react-dom/createPortal#caveats)
- [MDN: <dialog> element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog)
- [WAI-ARIA APG: Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
