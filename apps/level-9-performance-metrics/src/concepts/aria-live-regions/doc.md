# ARIA live regions internals

## The problem they solve

A sighted user *sees* a toast appear, a cart count tick up, a "Saved" message flash. A screen-reader
user, whose focus is elsewhere, would miss all of it — the change happens away from their cursor.
**ARIA live regions** tell assistive technology: *"when the content inside this element changes,
announce it — without moving focus."* They're how you make dynamic, async UI perceivable.

## Politeness levels

```html
<div aria-live="polite">…</div>   <!-- announce at the next idle point -->
<div aria-live="assertive">…</div> <!-- interrupt whatever is being read NOW -->
<div aria-live="off">…</div>       <!-- default: not announced -->
```

- **`polite`** — queued; the screen reader finishes its current utterance, then announces. Use for
  status, results counts, "saved", non-urgent updates. **The default you should reach for.**
- **`assertive`** — interrupts immediately. Reserve for genuinely urgent things (errors that block
  the user, session-expiry warnings). Overusing it is hostile — it talks over everything.

## Role shortcuts (preferred)

These imply a live region with sensible defaults, so you don't hand-wire `aria-live`:

- **`role="status"`** ≡ `aria-live="polite"` + `aria-atomic="true"` — status messages.
- **`role="alert"`** ≡ `aria-live="assertive"` + `aria-atomic="true"` — errors/alerts.
- **`role="log"`**, **`role="timer"`**, **`role="marquee"`** — specialized live roles.

## The tuning attributes

- **`aria-atomic`** — `true` = announce the **whole region** when any part changes; `false` (default)
  = announce **only the changed nodes**. A "3 results" → "5 results" counter wants `atomic=true` so it
  reads "5 results", not just "5".
- **`aria-relevant`** — which mutations matter: `additions`, `removals`, `text`, `all`
  (default `additions text`). A chat log cares about `additions`; rarely about `removals`.
- **`aria-busy="true"`** — suppress announcements while you're making a batch of changes; set back to
  `false` when done so the region announces once, coherently.

## The internals that bite people

1. **The region must exist in the DOM *before* the change.** Screen readers register live regions
   when they're parsed. If you **inject the region and its content at the same time**, many SRs won't
   announce it. **Render an empty live region up front**, then write text into it.
2. **Only changes are announced**, and the announcement is the *computed text* of the relevant nodes.
   Re-inserting identical text may not re-announce.
3. **Don't flood it.** Rapid successive updates get coalesced or dropped, and assertive spam talks
   over everything — **debounce/throttle**, and prefer one meaningful message.
4. **Moving focus vs announcing** are different tools. Live regions announce *without* stealing focus;
   for things the user must act on (a dialog), move focus instead.
5. **Visually-hidden but not `display:none`.** A status region is often `sr-only` (clipped, off-screen)
   — but `display:none`/`visibility:hidden` removes it from the a11y tree, so it won't announce.

## Senior checklist

- Live regions announce dynamic changes **without moving focus**; `polite` (queue) by default,
  `assertive` (interrupt) only for urgent. Prefer `role="status"` / `role="alert"`.
- **Create the region empty first, then update it** — injecting region+content together often won't
  announce.
- `aria-atomic` controls whole-region vs delta; `aria-relevant` controls which mutations; `aria-busy`
  batches.
- Debounce noisy updates; keep status regions in the a11y tree (`sr-only`, not `display:none`); move
  focus for things that need action.

## References

- [MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [WAI-ARIA: aria-live / aria-atomic / aria-relevant](https://www.w3.org/TR/wai-aria-1.2/#aria-live)
- [WAI-ARIA Authoring Practices: alert & status](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)
- [web.dev: prefer role="status"/"alert"](https://web.dev/articles/aria-live)
