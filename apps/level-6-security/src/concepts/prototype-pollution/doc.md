# Prototype pollution

## The vulnerability

JavaScript objects inherit from a shared prototype (`Object.prototype`). **Prototype pollution**
is when attacker-controlled keys reach a "write into an object by path/merge" operation and set
**`__proto__`**, **`constructor`**, or **`prototype`** — mutating the *shared* prototype. Because
*every* object inherits from it, you've now injected a property into **all objects in the realm**.

```js
// a typical vulnerable deep-set / merge
setByPath(target, '__proto__.isAdmin', true);   // or merge(target, JSON.parse(userInput))

({}).isAdmin;   // → true   ← a brand-new, empty object now "has" isAdmin
```

The injection vector is usually **untrusted structured data**: `JSON.parse`d request bodies,
query strings parsed into nested objects, YAML/config, `Object.assign`/lodash-style deep merges,
`setByPath`/`_.set`, form-to-object parsers — anything that walks a key path and creates
intermediate objects without filtering the key names.

## Why it's severe

It rarely does damage by itself — it plants a **gadget** that other code trips over:

- **Auth/logic bypass**: `if (options.isAdmin)` where `options` is `{}` but now inherits `isAdmin`.
- **Default-config override**: `const cfg = { ...defaults, ...userConfig }` then `cfg.allowEval`
  is suddenly truthy via the prototype.
- **DoS / crashes**: polluting `toString`, `then` (turns objects into "thenables"), or properties
  libraries read internally.
- **RCE on the server** (Node): polluting things like child-process options, template engine
  internals, etc. On the client it's typically XSS/logic-bypass gadget chaining.

## Defenses (layered)

### 1. Reject dangerous keys
Block `__proto__`, `constructor`, `prototype` in any path/merge walk:

```js
const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype']);
function safeSet(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (FORBIDDEN.has(k)) throw new Error('blocked key: ' + k);
    cur = cur[k] ??= {};
  }
  const last = keys.at(-1);
  if (FORBIDDEN.has(last)) throw new Error('blocked key');
  cur[last] = value;
}
```

> Note: `obj['__proto__'] = …` is the obvious case, but also guard `constructor.prototype`.
> Some parsers also need to reject the literal string key `"__proto__"` from JSON (it has special
> setter semantics on plain objects).

### 2. Use prototype-less / non-object containers
- **`Object.create(null)`** for dictionaries/maps of untrusted keys — no prototype to pollute, and
  `__proto__` becomes an ordinary own key.
- **`Map`** for untrusted key→value data (keys are strings, no prototype chain involved). The best
  structural fix for "user-controlled keys."

### 3. Freeze the prototype
`Object.freeze(Object.prototype)` (and `Object.prototype` of key built-ins) makes pollution throw
in strict mode / silently fail. A strong global mitigation, but test for compatibility (some libs
extend prototypes).

### 4. Validate shape, don't blind-merge
Parse untrusted input into a **known schema** (zod/valibot, or manual allow-listed field copy)
instead of deep-merging arbitrary objects into your state. `JSON.parse(input, reviver)` can also
drop `__proto__` keys.

### 5. Use safe libraries / methods
Modern lodash `_.set`/`_.merge` guard these keys; `structuredClone` doesn't carry `__proto__` as a
real proto. Prefer maintained utilities over hand-rolled deep merges.

## Senior checklist

- Attacker keys `__proto__`/`constructor`/`prototype` reaching a path-set/merge pollute *all* objects.
- The payload is a **gadget**: auth bypass, config override, DoS, or (server) RCE.
- Defend: reject those keys, use `Map`/`Object.create(null)` for untrusted dictionaries, validate to a schema, consider freezing `Object.prototype`.
- Don't blind deep-merge untrusted JSON into app state; prefer maintained `_.set`/`_.merge` or schema parsing.

## References

- [PortSwigger: Prototype pollution](https://portswigger.net/web-security/prototype-pollution)
- [OWASP / Snyk: Prototype pollution](https://learn.snyk.io/lesson/prototype-pollution/)
- [MDN: Object.create(null)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [Node.js: --disable-proto flag](https://nodejs.org/api/cli.html#--disable-protomode)
