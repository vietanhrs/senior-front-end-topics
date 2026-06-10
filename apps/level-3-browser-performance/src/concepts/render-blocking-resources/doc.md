# Render-blocking resources

> Builds on Level 1's "Critical Rendering Path". Here we focus specifically on **identifying** what
> blocks the first paint and the concrete techniques to **unblock** it.

## What "render-blocking" means

A **render-blocking resource** is one the browser insists on **downloading and processing before
it will paint anything**. Until they're done, the user stares at a blank screen. The two classes:

- **CSS in `<head>`** is render-blocking by default — the browser won't paint until the CSSOM is
  built (to avoid a flash of unstyled content).
- **Synchronous `<script>` in `<head>`** is **parser-blocking**: it halts DOM construction while
  it downloads and executes (and, if it reads styles, also waits on CSS). Parser-blocking delays
  the DOM, which delays paint.

There's also **render-blocking** vs **parser-blocking** nuance: modern browsers expose a
`blocking="render"` attribute, and treat fonts/imports specially — but the practical model above
covers most cases.

## How to tell if a resource is render-blocking

| Resource | Render-blocking? |
|---|---|
| `<link rel="stylesheet">` (no media / matching media) | **Yes** |
| `<link rel="stylesheet" media="print">` or non-matching media | No (loaded at low priority) |
| `<script>` (no attribute) in `<head>` | **Yes** (parser-blocking) |
| `<script defer>` | No (runs after DOM, before DOMContentLoaded) |
| `<script async>` | No (runs whenever it arrives) |
| `<script type="module">` | No (deferred by default) |
| Inline `<style>` / inline `<script>` | Processed inline (no network), but still executes/parses in order |
| `@import` inside CSS | **Yes**, and serially (CSS waits for CSS) — avoid |

In DevTools, the **Coverage** panel and **Lighthouse → "Eliminate render-blocking resources"** flag
them; the **Network** panel's priority column and the request initiator chain show the blocking
order.

## Techniques to unblock

### CSS
- **Inline critical CSS** (above-the-fold) in a `<style>` so the first paint needs no network.
- **Load the rest non-blockingly**: `media`-swap trick —
  `<link rel="preload" href="rest.css" as="style" onload="this.rel='stylesheet'">`.
- Split CSS by media: `<link rel="stylesheet" href="print.css" media="print">` isn't blocking.
- Avoid `@import` (serial chains). Minify + compress; remove unused CSS.

### JavaScript
- **`defer`** for scripts that need the DOM and must keep order (most app bundles).
- **`async`** for independent scripts (analytics) with no DOM/order dependency.
- Move non-critical `<script>` out of `<head>` / to the end of `<body>`.
- Use `type="module"` (deferred by default).

### Both
- **Preload** genuinely critical late-discovered resources (LCP image, fonts).
- Reduce bytes (tree-shake, code-split — Level 1) and round-trips (HTTP/2-3, preconnect).

## A subtle one: fonts

Web fonts declared in CSS are discovered late and can cause invisible/late text (FOIT/FOUT).
`font-display: swap` + preloading the font keeps text painting promptly without blocking.

## Senior checklist

- CSS (matching media) and sync `<head>` scripts block the first paint; know the table cold.
- Inline critical CSS; defer/async scripts; split CSS by media; avoid `@import`.
- Use `media`, `defer`, `async`, `preload`, and inlining as the unblocking toolkit.
- Verify with Lighthouse "render-blocking resources" + the Network initiator chain.

## References

- [web.dev: Eliminate render-blocking resources](https://web.dev/articles/render-blocking-resources)
- [web.dev: Defer non-critical CSS](https://web.dev/articles/defer-non-critical-css)
- [MDN: blocking attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/blocking)
- [web.dev: Critical Rendering Path](https://web.dev/articles/critical-rendering-path)
