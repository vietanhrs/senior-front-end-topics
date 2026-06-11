# Accessibility tree

## A second tree, for assistive tech

Alongside the DOM (and the render tree), the browser builds an **accessibility tree** — a parallel
structure it exposes to assistive technologies (screen readers, voice control, switch devices) via
the OS accessibility APIs (UIA, AX, AT-SPI). A screen reader doesn't read your DOM; it reads **this
tree**. If a control isn't represented correctly here, it's effectively invisible or broken for those
users — no matter how it looks.

Each accessibility node has, roughly:

- **Role** — *what it is* (button, link, textbox, checkbox, heading, dialog…).
- **Name** — *what it's called* (the accessible name announced to the user).
- **State / properties** — checked, disabled, expanded, required, `aria-*` states.
- **Value** — for inputs/sliders/etc.

## How role is decided

- **Implicit role** from semantic HTML: `<button>` → button, `<a href>` → link, `<input type=checkbox>`
  → checkbox, `<nav>` → navigation, `<h2>` → heading. **Free** and correct.
- **Explicit role** via `role="…"` overrides it. A `<div role="button">` *claims* the button role —
  but now **you** owe all the keyboard/focus/state behavior a real `<button>` gives for free. This is
  why "just use the semantic element" is the first rule of ARIA.
- `role="presentation"`/`"none"` strips semantics (e.g. a layout table).

## Accessible name computation (the accname algorithm)

The name is resolved in a strict **priority order** (first non-empty wins):

1. **`aria-labelledby`** — text content of the referenced element(s). Highest priority.
2. **`aria-label`** — a literal string.
3. **Native markup**: `<label>` for a form control, `alt` for an `<img>`, `<caption>`, a
   `<figcaption>`, or the element's **own text content** for name-from-content roles (button, link,
   heading…).
4. **`title`** attribute — last-resort fallback.

So `<button aria-label="Close">✕</button>` is announced "Close" (aria-label beats the ✕ text), and an
icon-only `<button>✕</button>` with no label is announced as just "button" — unusable.

## Pruning: what's *not* in the tree

- `display:none` / `visibility:hidden` → removed from the tree entirely.
- `aria-hidden="true"` → the node (and its subtree) is removed from the a11y tree but stays visible
  (use for decorative duplicates). **Never** put it on a focusable element — you get a focusable but
  nameless "ghost".
- `<img alt="">` → intentionally **decorative**, pruned from the tree (correct for spacers/icons with
  adjacent text).
- A `<div onclick>` with no role → exposed as **generic/group**, *not* a button: not focusable, no
  role, no keyboard — invisible as a control.

## Inspecting it

DevTools → **Accessibility** pane shows the computed role, name (and the source that won the accname
computation), states, and the tree. Chrome's full a11y-tree view and tools like axe/Lighthouse audit
it.

## Senior checklist

- The accessibility tree (role + name + state + value) is what assistive tech consumes — prefer
  **semantic HTML** so roles/behavior come for free; `role` overrides obligate you to reimplement
  behavior.
- Accessible **name** priority: `aria-labelledby` → `aria-label` → native (`label`/`alt`/text) →
  `title`. Icon-only controls need an explicit label.
- Pruning: `display:none` and `aria-hidden` remove nodes; `alt=""` marks decorative; a bare
  `<div onclick>` is **not** a button in the tree.
- Verify with the DevTools Accessibility pane / axe — don't assume the DOM equals the a11y tree.

## References

- [MDN: The accessibility tree](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Accessibility_tree)
- [W3C: Accessible Name and Description Computation](https://www.w3.org/TR/accname-1.2/)
- [MDN: ARIA — first rule (use semantic HTML)](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [web.dev: The accessibility tree](https://web.dev/articles/the-accessibility-tree)
