# Trusted Types

## The problem they close

XSS ultimately happens at a small set of **DOM injection sinks** that turn strings into code:
`element.innerHTML`, `outerHTML`, `document.write`, `el.insertAdjacentHTML`, `script.src`,
`el.setAttribute('onclick', …)`, `eval`, `new Function`, `<iframe srcdoc>`, etc. Auditing every
call site that *might* reach one of these (often through layers of helpers) is hopeless at scale —
**DOM-based XSS** is exactly the class that slips through code review.

**Trusted Types** flips the model: instead of trying to find every dangerous string, the browser
**refuses to accept plain strings at those sinks at all**. A sink will only accept a special typed
object (`TrustedHTML`, `TrustedScript`, `TrustedScriptURL`) that can *only* be produced by a
**policy** you explicitly define. Now there's exactly **one place** (your policies) where unsafe
string→DOM conversion can happen — a tiny, auditable surface.

## How it works

Enable enforcement via CSP:

```
Content-Security-Policy: require-trusted-types-for 'script'; trusted-types default dompurify
```

Then a raw assignment **throws**:

```js
el.innerHTML = userInput;   // ❌ TypeError: requires a TrustedHTML, not a string
```

You must route it through a policy:

```js
const policy = trustedTypes.createPolicy('dompurify', {
  createHTML: (input) => DOMPurify.sanitize(input),   // YOUR sanitization lives here
});
el.innerHTML = policy.createHTML(userInput);   // ✅ accepts the TrustedHTML object
```

- `createPolicy(name, rules)` registers a named policy with `createHTML` / `createScript` /
  `createScriptURL` transforms. The transform is where you sanitize/validate.
- `trusted-types <names>` in CSP **allow-lists which policy names may exist** (stops an attacker
  from creating their own permissive policy). `'none'` forbids all; `allow-duplicates` permits
  re-creating a name.
- The **`default` policy** is a special fallback applied to any sink value that wasn't already a
  Trusted Type — useful for migrating legacy code, but keep it strict (it runs on *everything*).

## Why this is stronger than "just sanitize"

- **Completeness**: enforcement is at the sink, so you can't *forget* a call site — the browser
  blocks it. Violations are reported (`report-to`) so you find every offender.
- **Auditability**: security review shrinks from "every `innerHTML` in the codebase" to "the 1–2
  policies." 
- **Defense-in-depth with CSP**: even with a script-src bypass, DOM XSS sinks stay closed.

## Practical adoption

1. Turn on **`Content-Security-Policy-Report-Only: require-trusted-types-for 'script'`** to
   discover every sink your app (and its deps) hits — no breakage yet.
2. Create a small number of policies (commonly one wrapping **DOMPurify** for HTML, one for
   trusted script URLs).
3. Replace raw sink assignments with policy calls; in React, `dangerouslySetInnerHTML` must
   receive sanitized/Trusted HTML.
4. Switch to enforcing. Keep `default` strict or avoid it once migrated.

## Caveats

- **Chromium-only** today (Chrome/Edge); Firefox/Safari don't enforce yet → it's *added* protection
  where supported, not a cross-browser guarantee. Feature-detect `window.trustedTypes`.
- It guards **DOM sinks**, not network/CORS/cookies. Still need CSP, sanitization correctness, etc.
- A sloppy policy (`createHTML: (s) => s`) re-opens the hole — the policy *is* the trust boundary;
  put real sanitization there.

## Senior checklist

- Trusted Types make DOM XSS sinks reject raw strings; only policy-produced Trusted* objects pass.
- Enable via `require-trusted-types-for 'script'` + a `trusted-types` allow-list of policy names.
- Concentrate sanitization in 1–2 policies (e.g. DOMPurify); roll out Report-Only → enforce.
- Chromium-only for now; feature-detect, keep the `default` policy strict, don't write pass-through policies.

## Angular equivalent

Angular integrates with DOM sanitization and can work with Trusted Types policies, but DomSanitizer.bypassSecurityTrustHtml is an escape hatch, not a sanitizer. Treat it like dangerouslySetInnerHTML: only feed it content that has already been proven safe by a trusted sanitizer/policy.

## References

- [web.dev: Trusted Types — prevent DOM XSS](https://web.dev/articles/trusted-types)
- [MDN: Trusted Types API](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API)
- [W3C: Trusted Types](https://w3c.github.io/trusted-types/dist/spec/)
- [DOMPurify (+ Trusted Types support)](https://github.com/cure53/DOMPurify)
