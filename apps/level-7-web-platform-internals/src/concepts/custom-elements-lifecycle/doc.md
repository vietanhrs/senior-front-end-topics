# Custom elements lifecycle

## Defining an element

Custom elements let you register your own HTML tags backed by a class extending `HTMLElement`:

```js
class MyWidget extends HTMLElement {
  static observedAttributes = ['label'];           // gate attributeChangedCallback
  constructor() { super(); /* set up shadow root, internal state — NO attributes/children yet */ }
  connectedCallback() { /* inserted into the DOM — do rendering, add listeners, fetch */ }
  disconnectedCallback() { /* removed from the DOM — REMOVE listeners, cancel timers/fetches */ }
  adoptedCallback() { /* moved to a new document (e.g. adoptNode into an iframe) */ }
  attributeChangedCallback(name, oldVal, newVal) { /* only for observed attrs */ }
}
customElements.define('my-widget', MyWidget);       // name MUST contain a hyphen
```

## The lifecycle callbacks (and what belongs in each)

| Callback | Fires when | Put here |
|---|---|---|
| `constructor` | element is created (`document.createElement`, parser, `new`) | **lightweight** init only; **don't** touch attributes/children/parent yet |
| `connectedCallback` | inserted into a document (can fire **multiple times**) | render, attach listeners, start work, read attributes |
| `disconnectedCallback` | removed from the document | **cleanup**: remove listeners, `disconnect()` observers, clear timers, abort fetches |
| `attributeChangedCallback` | an **observed** attribute is set/changed/removed | react to config changes; also fires for initial attributes present at upgrade |
| `adoptedCallback` | element moved to another document | re-bind document-specific things |

Key rules seniors trip on:

- **`observedAttributes` is mandatory** to receive `attributeChangedCallback` — unlisted attributes
  change silently. It's a static getter/field; reflect it as `static get observedAttributes()`.
- **The constructor can't see attributes/children.** During parser upgrade, the element exists
  before its attributes/children are set. Read them in `connectedCallback`, not the constructor.
  (Touching children in the constructor throws for parser-created elements.)
- **`connected` can fire more than once.** Moving an element (re-`appendChild` elsewhere) fires
  `disconnectedCallback` then `connectedCallback` again — so connect/disconnect must be
  **idempotent** and symmetric (every listener added in connect is removed in disconnect), or you
  leak.

## Upgrading: definition order doesn't matter

If the HTML parser meets `<my-widget>` **before** `customElements.define` runs, it creates an inert
**`HTMLUnknownElement`-like** placeholder. When you later define the class, all existing matching
elements are **upgraded** (constructor + connectedCallback run then). So:

- You can ship HTML first and the defining script later (great for progressive enhancement).
- `customElements.whenDefined('my-widget')` / `:defined` CSS pseudo-class let you style/await the
  pre-upgrade ("undefined") state to avoid FOUC.
- A name can be defined **once**; re-`define` throws. Guard with `customElements.get(name)`.

## Attributes vs properties

Attributes are strings in HTML; properties are JS values. Convention: **reflect** important
attributes to properties and vice-versa, but only attributes trigger `attributeChangedCallback`.
Rich data (objects, arrays) should be passed as **properties**, not stringified attributes — which
matters a lot when frameworks drive the element (next concept).

## Other lifecycle-adjacent APIs

- **`ElementInternals`** (`this.attachInternals()`) + `static formAssociated = true` → participate
  in forms, expose ARIA/role, and custom states (`:state()`).
- **Custom state**: `internals.states.add('loading')` → style with `:state(loading)`.

## Senior checklist

- 4 callbacks: constructor (light init), connected (render/listen), disconnected (cleanup), attributeChanged (observed only); plus adopted.
- Constructor can't read attributes/children; do that in `connectedCallback`. Connect can fire repeatedly — keep it idempotent + symmetric with disconnect.
- `observedAttributes` gates attribute callbacks; define-after-parse **upgrades** existing elements; `:defined`/`whenDefined` handle the pre-upgrade state.
- Pass rich data as properties (not attributes); use `ElementInternals` for forms/ARIA/custom states.

## References

- [MDN: Using custom elements (lifecycle callbacks)](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [MDN: CustomElementRegistry.define / whenDefined](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry)
- [web.dev: Custom elements v1](https://web.dev/articles/custom-elements-v1)
- [MDN: ElementInternals (form-associated)](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals)
