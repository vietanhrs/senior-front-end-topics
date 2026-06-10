# DOM clobbering

## The trick

**DOM clobbering** is a *script-less* injection technique: an attacker who can inject **HTML but
not JavaScript** (e.g. a sanitizer that strips `<script>`/`on*` but allows `id`/`name`) abuses a
legacy web feature — **named element access** — to overwrite ("clobber") JavaScript variables and
object properties with references to DOM nodes.

Two legacy behaviors make it possible:

1. **Named access on `window`/`document`**: an element with `id="foo"` (or `name="foo"` for some
   elements) becomes accessible as `window.foo` / `document.foo`.
2. **Named access on collections**: `form.elements`, an `<form>`'s named inputs, `document.images`,
   etc. expose children by `name`/`id`. This allows building *nested* clobbered paths.

```html
<!-- attacker-injected (no script needed) -->
<a id="config"></a>
<form id="settings"><input name="isAdmin"></form>
```

```js
window.config          // → the <a> element (not undefined!)
document.settings      // → the <form>
document.settings.isAdmin  // → the <input> (named access on the form)
```

## Why it's dangerous

It turns benign-looking code into a vulnerability:

```js
// Expected: undefined → load safe defaults
if (!window.appConfig) loadDefaults();      // appConfig is now an <element> → truthy → defaults skipped

const cfg = window.CONFIG ?? { api: '/safe' };  // ?? keeps the clobbered element → cfg.api === undefined

// Nested: libraries that read window.x.y
const url = window.settings.endpoint;       // <form id=settings><a id=endpoint href=//evil> → attacker-controlled
```

Clobbering can also produce **strings**: an `<a id="x" href="https://evil">` has a `toString()`
that returns the URL, so `String(window.x)` or string-coercion sinks (`location = window.x`,
`innerHTML += window.x`) can be steered. Chains of `<form>`/`<input>`/`<a>` build multi-level
objects, defeating naive `window.a.b.c` lookups. It's a real-world bypass against allow-list
sanitizers (notable Gmail/AMP/Bootstrap-era cases).

## Defenses

- **Don't trust `window`/`document` named lookups for config.** Read configuration from a real
  module/`const`, a `data-*` attribute parsed explicitly, or `JSON.parse` of a known element's
  text — not from globals that HTML can create.
- **Type-check before use.** `typeof x === 'object' && !(x instanceof Node)` / `!(x instanceof Element)`
  before treating a global as your object. A clobbered value is always a DOM node.
- **Sanitize `id`/`name` too.** Configure your sanitizer to drop or namespace `id`/`name`
  attributes. **DOMPurify** has `SANITIZE_NAMED_PROPS: true` (and `SANITIZE_DOM`) specifically for
  this. Allow-listing tags is not enough.
- **Avoid global names that matter.** Use closures/modules; declare real variables (`let
  config = …`) which **shadow** named-access properties (a real `var/let/const` at the top level
  wins over the clobbered global). Freeze critical config objects.
- **CSP/Trusted Types don't stop it** — no script executes. This is purely a data/lookup-integrity
  problem.

## Senior checklist

- DOM clobbering needs only injected HTML; `id`/`name` create `window`/`document`/collection properties.
- It hijacks falsy checks, `??`/`||` fallbacks, and nested `a.b.c` lookups; can also yield strings via `<a href>`.
- Defend by not reading config from globals, type-checking against `Node`/`Element`, and sanitizing `id`/`name` (DOMPurify `SANITIZE_NAMED_PROPS`).
- CSP/Trusted Types don't help — it's script-less; treat it as data-integrity hardening.

## References

- [HTML spec: named access on the Window object](https://html.spec.whatwg.org/multipage/nav-history-apis.html#named-access-on-the-window-object)
- [PortSwigger: DOM clobbering](https://portswigger.net/web-security/dom-based/dom-clobbering)
- [DOMPurify: SANITIZE_NAMED_PROPS](https://github.com/cure53/DOMPurify#sanitize_named_props)
- [research.securitum: DOM clobbering attacks](https://research.securitum.com/xss-in-amp4email-dom-clobbering/)
