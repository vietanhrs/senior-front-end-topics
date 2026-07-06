# CSRF vs XSS mitigation

Two classic vulnerabilities that are often confused. The key is understanding "who trusts whom".

## XSS — Cross-Site Scripting

**The attacker manages to run JS inside your page**, under your origin → it can read
cookies/localStorage, the DOM, and call APIs on behalf of the user. Root cause: **untrusted
data is treated as code/markup**.

### Three kinds of XSS
- **Stored**: the payload is saved on the server (a comment, a profile) and replayed to
  everyone who views it.
- **Reflected**: the payload is in the URL/params and reflected back into the page.
- **DOM-based**: the flaw is entirely client-side, where JS takes data (location.hash…) and
  writes it straight into the DOM (`innerHTML`, `document.write`).

### XSS mitigation (in priority order)
1. **Context-aware output encoding**. React **escapes** every `{value}` by default → safe.
   Don't break that.
2. **Avoid `dangerouslySetInnerHTML` / `innerHTML`** with untrusted data. If you must render
   HTML, **sanitize** it with a vetted library (DOMPurify).
3. **CSP (Content-Security-Policy)**: block inline scripts & foreign script sources → limit
   the damage even if a flaw exists (Level 6).
4. **Trusted Types**: force every dangerous sink (`innerHTML`…) to accept only values that
   passed through a policy (Level 6).
5. **`HttpOnly` cookies**: JS can't read the session cookie → reduces the impact of session theft.

```tsx
// ❌ XSS hole: rendering user-supplied HTML
<div dangerouslySetInnerHTML={{ __html: userComment }} />

// ✔ Safe: React escapes, displays as text
<div>{userComment}</div>

// ✔ If HTML is needed: sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userHtml) }} />
```

## CSRF — Cross-Site Request Forgery

**The attacker makes the victim's browser send a request *with credentials* to your site**,
exploiting the fact that cookies are **automatically attached** by destination origin. The
victim only needs to be logged in and visit a malicious page (an auto-submitting form, an
`<img>` to a side-effecting GET endpoint…). Unlike XSS, the attacker **can't** run JS in your
page — they only "borrow" the session cookie.

### CSRF mitigation
1. **SameSite cookies** (the main line of defense today):
   - `Strict`: the cookie is **not** sent on any cross-site request (even clicking a link over).
   - `Lax` (the modern browser default): sent on **top-level GET** navigations (clicking a
     link), **not** on cross-site POSTs / background requests (img, fetch).
   - `None`: sent on all cross-site requests, **requires** `Secure` (HTTPS).
2. **Anti-CSRF token**: the server issues a token embedded in a form/header (`X-CSRF-Token`);
   a forged request doesn't know it → rejected. Common patterns: *double-submit cookie* or
   *synchronizer token*.
3. **Check `Origin`/`Referer`** on the server for state-changing requests.
4. **Don't use GET for side-effecting operations** (GET must be safe/idempotent).
5. **Custom header + CORS**: requiring a custom header (e.g. `X-Requested-With`) forces a
   preflight, which a simple cross-site request can't attach.

```
SameSite=Lax (default):
  ✔ User clicks a link to bank.com (top-level GET)        -> cookie sent
  ✘ evil.com auto-submits <form method=POST> to bank.com  -> cookie NOT sent
  ✘ evil.com <img src="bank.com/transfer?...">            -> cookie NOT sent
```

## XSS vs CSRF — quick distinction

| | XSS | CSRF |
|---|---|---|
| Essence | run foreign code in your origin | borrow cookies to send requests as the user |
| Needs JS running in your page? | yes | no |
| Main defense | output encoding, sanitize, CSP, Trusted Types | SameSite, CSRF token, Origin checks |
| Does `HttpOnly` help? | reduces impact (stolen cookie) | not directly related |
| **Heavy caveat** | **XSS breaks every CSRF defense** (the token is readable by JS) | — |

> Important consequence: if a site **already has XSS**, CSRF tokens are useless (the script can
> read the token). That's why preventing XSS is foundational.

## Senior checklist

- Be able to say "who trusts whom": XSS = foreign code in your origin; CSRF = borrowed credentials.
- Default to React escaping; only use `dangerouslySetInnerHTML` with sanitized data.
- SameSite (Lax by default) + a token for side-effecting operations.
- Understand why XSS nullifies CSRF defenses.

## Angular equivalent

Angular also escapes interpolation by default: {{ user.bio }} is text, not HTML. The dangerous escape hatch is property binding to HTML with trusted values, especially [innerHTML] plus DomSanitizer.bypassSecurityTrustHtml; treat that with the same suspicion as React's dangerouslySetInnerHTML. Angular sanitizes several DOM sinks, but sanitizer bypass APIs must only wrap already-trusted content.

## References

- [OWASP: XSS](https://owasp.org/www-community/attacks/xss/)
- [OWASP: CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [React: dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)
- [web.dev: SameSite cookies explained](https://web.dev/articles/samesite-cookies-explained)
- [DOMPurify](https://github.com/cure53/DOMPurify)
