# SameSite cookie modes

> Level 1 touched SameSite as a CSRF defense. Here we go deep: exact semantics, the "site vs
> origin" distinction, Lax's GET exception, None's requirements, and where legit flows break.

## Site ≠ origin

SameSite operates on **sites**, not origins. A *site* is the **registrable domain** (eTLD+1, per
the Public Suffix List) — scheme is included in modern browsers ("schemeful same-site"):

```
https://app.example.com  and  https://api.example.com   → SAME site (example.com)
https://example.com      and  http://example.com        → different (schemeful)
https://foo.github.io    and  https://bar.github.io     → DIFFERENT site!
                                  (github.io is on the Public Suffix List)
```

So `api.example.com` calls from `app.example.com` are **same-site** (SameSite doesn't restrict
them) even though they're **cross-origin** (CORS does apply). Don't conflate the two layers.

## The three modes

A request is "cross-site" when the **request's target site** differs from the **site of the
top-level browsing context** that initiated it.

### `SameSite=Strict`
Cookie is sent **only** for same-site requests. Even clicking a link *from another site to yours*
arrives **without** the cookie — the first navigation looks logged-out (the classic "clicked a
link from Slack/email and got the login page" bug). Use for high-security session/CSRF tokens
where that UX is acceptable, often paired with a second `Lax` cookie for presentation.

### `SameSite=Lax` (modern default when unspecified)
Cookie is withheld on cross-site **subresource and background requests** (images, iframes, fetch,
form POSTs), but **sent on top-level navigations with safe methods** (GET link clicks,
`window.open`). That exception keeps "follow a link, stay logged in" working while still blocking
classic CSRF (which relies on POSTs/subrequests carrying cookies).

> Chrome's interim "Lax + POST" allowance: unspecified-SameSite cookies younger than 2 minutes may
> be sent on top-level cross-site POSTs (a compatibility patch for payment redirects). Don't build
> on it.

### `SameSite=None`
Cookie is sent on **all** cross-site requests — required for genuinely cross-site auth: embedded
widgets/iframes (payment, support chat), third-party SSO redirect flows, cross-site API calls with
`credentials: 'include'`. Two hard requirements:

1. **Must** be paired with **`Secure`** (HTTPS), or browsers reject it.
2. Increasingly subject to **third-party-cookie phase-outs** (Safari ITP, Firefox TCP, Chrome's
   evolving policies) — `None` is necessary but may not be *sufficient* in embedded contexts;
   CHIPS (`Partitioned`) and the Storage Access API are follow-ups.

## Decision table

| Scenario | Cookie sent? Strict / Lax / None |
|---|---|
| Same-site fetch/XHR/form | ✅ / ✅ / ✅ |
| Cross-site link click (top-level GET) | ❌ / ✅ / ✅ |
| Cross-site `<form method=POST>` | ❌ / ❌ / ✅ |
| Cross-site `<img>`, `<iframe>`, fetch | ❌ / ❌ / ✅ |

## Practical guidance

- Session cookie: **`Lax`** is the right default (CSRF protection + sane link UX). Add CSRF tokens
  for state-changing endpoints anyway (defense in depth — Level 1).
- SSO/OAuth callback breaking? That's usually a `Strict` cookie not arriving on the redirect —
  the callback flow needs `Lax`/`None` for the cookies it depends on.
- Embedded iframe widgets need `None; Secure` (+ plan for partitioned/storage-access).
- Subdomain note: SameSite does **not** isolate subdomains (same site!) — a compromised
  `blog.example.com` can still ride `Domain=.example.com` cookies. Use `__Host-` prefixed,
  host-locked cookies for the crown jewels.

## Senior checklist

- SameSite compares **sites** (schemeful eTLD+1), not origins; subdomains are same-site.
- Strict = never cross-site (breaks inbound-link sessions); Lax = +top-level GET; None = always, requires `Secure`.
- Lax blocks classic CSRF (cross-site POST/subresources carry no cookie) — but keep CSRF tokens.
- `None` is entangled with third-party cookie deprecation; know CHIPS/Storage Access exist.

## References

- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [web.dev: SameSite cookies explained](https://web.dev/articles/samesite-cookies-explained)
- [web.dev: Schemeful Same-Site](https://web.dev/articles/schemeful-samesite)
- [MDN: CHIPS (partitioned cookies)](https://developer.mozilla.org/en-US/docs/Web/Privacy/Privacy_sandbox/Partitioned_cookies)
