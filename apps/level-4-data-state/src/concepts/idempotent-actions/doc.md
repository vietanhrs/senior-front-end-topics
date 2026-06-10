# Idempotent UI actions

## Definition

An operation is **idempotent** if performing it **multiple times has the same effect as performing
it once**. `DELETE /item/42` is idempotent (deleting twice = deleted). `POST /charge` usually is
**not** — call it twice and you've charged the customer twice. Idempotency is the property that
makes an action **safe to repeat**, which is exactly what the messy real world (double-clicks,
retries, flaky networks, the back button) forces on you.

## Why the frontend must care

The same logical action can fire **more than once** for reasons outside your control:

- **Double-clicks / rage clicks** on a submit button.
- **Automatic retries** (yours, the browser's, a proxy's) after a timeout — where the original
  request actually **did** succeed but the response was lost.
- **Reconnects / offline queues** replaying queued mutations.
- **React StrictMode / re-renders / effect re-runs** firing an action twice in dev.
- **Navigation**: back→forward re-submitting a form (`POST`-then-back).

If the action isn't idempotent, these become **duplicate orders, double charges, doubled
comments**.

## Two layers of defense

### 1. Client-side guards (necessary, not sufficient)
- **Disable the button / enter a `submitting` state** on first click (finite state — Level 4) so a
  second click is ignored.
- **Dedupe in flight**: if a mutation with the same intent is pending, return the same promise
  instead of firing again.
- **Debounce** rapid triggers.

These stop *most* double-submits, but **can't** stop a retry after a lost response, or a replay
from another tab. You still need the server to be safe.

### 2. Idempotency keys (the robust fix)
Generate a **unique key per logical operation** on the client and send it with the request (e.g.
`Idempotency-Key: <uuid>`). The server records the key with the result: the **first** request does
the work; **any repeat with the same key returns the original result without repeating the
effect**. This is how Stripe, payment APIs, and well-built mutation endpoints work.

```ts
// One key per *intended* payment (created when the user initiates it).
const key = crypto.randomUUID();
async function pay() {
  return fetch('/api/charge', {
    method: 'POST',
    headers: { 'Idempotency-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
}
// Retrying pay() (timeout, reconnect) reuses the SAME key → at most one charge.
```

Key rules:
- **Same logical op → same key** (reuse across retries of *that* attempt).
- **New, distinct op → new key** (a second deliberate payment gets its own key).
- Keys should be **stable across retries** (generate at intent time, not per-attempt) and have a
  server TTL.

## Designing idempotent operations

Prefer operations whose repetition is naturally safe:

- **Set, don't increment**: `setQuantity(3)` is idempotent; `incrementQuantity()` is not. Send the
  desired absolute state when you can.
- **Upsert by client id**: create with a client-generated id so a retry upserts the same row
  instead of inserting a duplicate.
- **Use the right HTTP method**: `PUT`/`DELETE` are defined as idempotent; `POST` is not — add an
  idempotency key when you must `POST`.
- **Toggle to an explicit value**: send `done: true`, not "flip it".

## Senior checklist

- Idempotent = repeating the action ≡ doing it once; double-clicks/retries/replays make this mandatory.
- Client guards (disable/`submitting`/dedupe) catch double-clicks but not lost-response retries.
- Use an **idempotency key per logical operation** (stable across retries) so the server dedupes.
- Design for it: set absolute values / upsert by client id / use PUT/DELETE where possible.

## References

- [Stripe: Idempotent requests](https://stripe.com/docs/api/idempotent_requests)
- [MDN: Idempotent HTTP methods](https://developer.mozilla.org/en-US/docs/Glossary/Idempotent)
- [IETF: The Idempotency-Key HTTP Header Field (draft)](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
- [web.dev: Offline & background sync (replay safety)](https://web.dev/articles/offline-cookbook)
