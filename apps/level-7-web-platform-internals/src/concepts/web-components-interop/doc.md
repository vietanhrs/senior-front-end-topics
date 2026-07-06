# Web components interoperability

Custom elements are framework-agnostic, but wiring them into a framework (React especially) has
sharp edges around **attributes vs properties** and **events**. Getting these wrong is the #1
source of "the web component doesn't work in my app" bugs.

## Attributes vs properties

- **Attributes** are strings in HTML (`<x-el value="3">`). Setting an object via an attribute
  stringifies it to `"[object Object]"` — data loss.
- **Properties** are real JS values on the DOM object (`el.value = 3`, `el.config = {…}`). Rich
  data (objects, arrays, functions) must be passed as **properties**.

How frameworks pass props differs:

- **React ≤ 18**: by default sets everything as **attributes** (stringified) except a few known
  ones. So `<x-el config={obj}>` becomes `config="[object Object]"`. You had to use a `ref` and
  imperatively set `el.config = obj`, and listen to events with `addEventListener`. Libraries like
  `@lit/react` wrapped elements to fix this.
- **React 19**: greatly improved — for a custom element, React **checks if a property exists on the
  element instance**; if so it sets the **property**, otherwise falls back to an attribute. This
  makes `<x-el config={obj}>` mostly "just work" for properties the element actually defines. (It
  must be defined/upgraded for React to see the property.)
- **Most other frameworks** (Angular, Vue, Svelte, Solid) have first-class binding syntax that
  distinguishes attribute vs property and event (`[prop]`, `.prop`, `@event`).

## Events: not React synthetic events

Custom elements dispatch native **`CustomEvent`s** (`this.dispatchEvent(new CustomEvent('change',
{ detail, bubbles: true }))`). These are **not** part of React's synthetic event system and don't
follow the `onX` camelCase convention:

- React ≤ 18: `onChange={…}` on a custom element does **nothing** for a custom `change` event — you
  must `ref` + `el.addEventListener('change', handler)` and clean up.
- React 19: improved custom-element support, but custom (non-standard) events still generally need
  `addEventListener` (React maps known DOM events, not arbitrary custom ones). The reliable,
  portable pattern remains an effect with `addEventListener`/`removeEventListener`.
- Mind **event naming & casing**: HTML lowercases; choose lowercase, non-colliding event names.
  `bubbles`/`composed` control whether the event escapes shadow boundaries (`composed: true` to
  cross shadow DOM).

## A portable React wrapper

```tsx
function Stars({ value, max, onRate }) {
  const ref = useRef(null);
  // property (not attribute) for anything non-string / objects:
  useEffect(() => { if (ref.current) ref.current.value = value; }, [value]);
  // custom event via addEventListener (+ cleanup):
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const h = (e) => onRate(e.detail.value);
    el.addEventListener('rate-change', h);
    return () => el.removeEventListener('rate-change', h);
  }, [onRate]);
  return <sfe-stars ref={ref} max={max} />;  // max is a string-safe attribute
}
```

## Other interop concerns

- **TypeScript/JSX**: augment `JSX.IntrinsicElements` (and React's element types) so `<sfe-stars>`
  type-checks; declare which props are attributes vs properties.
- **SSR**: custom elements don't run on the server unless you use **Declarative Shadow DOM**; React
  renders the tag and hydrates, but the element only *upgrades* client-side after its `define` runs
  — beware flashes / first-render gaps.
- **Defined-timing**: React may render `<sfe-stars>` before its `define` executes; `:defined` /
  `customElements.whenDefined` avoid styling/measuring the un-upgraded element.
- **Two-way data**: reflect property↔attribute thoughtfully; don't create update loops between the
  element's `attributeChangedCallback` and the framework setting the attribute back.

## Senior checklist

- Strings → attributes; objects/arrays/functions → **properties** (via ref, or React 19's property detection).
- Custom events aren't React synthetic events: use `addEventListener` (+ cleanup), not `onX`; mind `bubbles`/`composed`.
- React 19 sets properties when the element defines them; pre-19 needs refs/wrappers (`@lit/react`).
- Handle SSR/upgrade timing (`whenDefined`, `:defined`) and add JSX typings; avoid attribute↔property loops.

## Angular equivalent

Angular generally binds custom element properties and listens to DOM/custom events more naturally from templates: `<x-widget [config]="config" (valueChange)="onValue($event)" />`. For Angular consumers, remember that CustomEvent payloads arrive on `$event.detail`, and schema/type support may need `CUSTOM_ELEMENTS_SCHEMA` or wrapper directives/components.

## References

- [Custom Elements Everywhere (framework interop scores)](https://custom-elements-everywhere.com/)
- [React: Web Components](https://react.dev/reference/react-dom/components#custom-html-elements)
- [Lit: React integration (@lit/react)](https://lit.dev/docs/frameworks/react/)
- [MDN: CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent)
