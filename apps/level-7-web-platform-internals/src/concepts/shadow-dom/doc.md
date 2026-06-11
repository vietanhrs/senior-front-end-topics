# Shadow DOM

## What it is

**Shadow DOM** gives an element a private, **encapsulated** DOM subtree — a *shadow tree* — that is
separate from the main document ("light DOM"). It's the encapsulation primitive behind **web
components**: styles and DOM inside the shadow tree are isolated from the page, and the page's CSS
can't reach in.

```js
const host = document.querySelector('#widget');
const root = host.attachShadow({ mode: 'open' }); // creates the shadow root
root.innerHTML = `
  <style> p { color: tomato; } </style>   <!-- scoped to THIS shadow tree only -->
  <p>Inside the shadow — page CSS can't restyle me.</p>
  <slot></slot>                            <!-- projects the host's light-DOM children -->
`;
```

## The three guarantees

1. **Style encapsulation (both ways).** Selectors in the page **don't match** shadow content, and
   `<style>` inside the shadow **doesn't leak** out. `p { color: blue }` on the page leaves the
   shadow's `<p>` alone, and vice-versa. This is real isolation, not BEM/CSS-modules convention.
2. **DOM encapsulation.** `document.querySelector('p')` won't find shadow nodes; events retarget at
   the boundary (`event.target` is the host, not the inner node, for outside listeners). With
   `mode: 'open'` you can reach in via `host.shadowRoot`; with **`mode: 'closed'`**,
   `host.shadowRoot` is `null` and only the code that called `attachShadow` holds the reference.
3. **Composition via slots.** The host's light-DOM children are *projected* into `<slot>`s. The
   shadow defines structure; the consumer supplies content — `<slot name="header">` for named
   slots, a default `<slot>` for the rest.

## Styling across the boundary (the escape hatches)

Encapsulation is strong, so there are *explicit* ways to style across it:

- **`:host` / `:host(.modifier)`** — style the host element from inside the shadow.
- **`::slotted(selector)`** — style projected light-DOM nodes (only the top-level slotted elements).
- **`::part(name)`** — the component exposes `part="name"` on internal nodes; the page styles them
  with `host::part(name) { … }`. The sanctioned theming API.
- **CSS custom properties inherit through** the boundary — `--accent` set on the page is readable
  inside the shadow. This is the main "theming" channel for design tokens.
- Inherited properties (`color`, `font`) still inherit from the host's context unless overridden.

## Gotchas

- **`closed` isn't real security.** It only hides `shadowRoot`; determined code can still patch
  `attachShadow`. It's an encapsulation signal, not a trust boundary.
- **Global stylesheets don't apply** inside — you must include styles in the shadow (or adopt them
  via `adoptedStyleSheets` for sharing one `CSSStyleSheet` across roots, efficiently).
- **Focus, selection, accessibility**: `:focus-within` works, but ARIA references (`aria-labelledby`
  by id) **can't cross** the shadow boundary — a real a11y pitfall (being addressed by ARIA
  reflection / cross-root ARIA).
- **SSR**: shadow DOM historically didn't serialize; **Declarative Shadow DOM**
  (`<template shadowrootmode="open">`) lets servers emit shadow trees as HTML.
- **Forms**: form controls inside a shadow tree need `ElementInternals`/`formAssociated` to
  participate in the outer form.

## Senior checklist

- Shadow DOM = encapsulated subtree; page CSS can't reach in, shadow CSS can't leak out; `querySelector` won't find it.
- `open` exposes `host.shadowRoot`; `closed` hides it (not a security boundary).
- Compose with `<slot>`; style across the boundary via `:host`, `::slotted`, `::part`, and inherited custom properties.
- Watch global styles not applying, cross-root ARIA limits, SSR (Declarative Shadow DOM), and form association.

## References

- [MDN: Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM)
- [MDN: ::part / ::slotted / :host](https://developer.mozilla.org/en-US/docs/Web/CSS/::part)
- [web.dev: Declarative Shadow DOM](https://web.dev/articles/declarative-shadow-dom)
- [MDN: adoptedStyleSheets](https://developer.mozilla.org/en-US/docs/Web/API/Document/adoptedStyleSheets)
