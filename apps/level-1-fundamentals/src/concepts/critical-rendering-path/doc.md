# Critical Rendering Path (CRP)

## What the CRP is

The Critical Rendering Path is the **sequence of steps the browser must perform** to turn
the HTML/CSS/JS it receives into pixels on screen. Optimizing the CRP = shortening the time
to **First Paint / First Contentful Paint**.

```
Bytes ──▶ DOM ──┐
                 ├──▶ Render Tree ──▶ Layout (reflow) ──▶ Paint ──▶ Composite ──▶ Pixels
Bytes ──▶ CSSOM ─┘
                 ▲
            JavaScript can block/modify both DOM and CSSOM
```

## The steps in detail

1. **HTML → DOM**: the parser reads HTML and builds the DOM tree. It **pauses** when it hits
   a synchronous `<script>` (no `defer`/`async`).
2. **CSS → CSSOM**: CSS is **render-blocking**. The browser won't paint content until the
   CSSOM is ready (to avoid a flash of unstyled content — FOUC).
3. **DOM + CSSOM → Render Tree**: only the nodes that will be displayed (drops
   `display:none`, `<head>`…), with computed styles attached.
4. **Layout (reflow)**: compute the size & position (geometry) of every node.
5. **Paint**: rasterize pixels for each layer (text, color, images, borders…).
6. **Composite**: assemble the layers in the correct order (GPU). (Deeper dive in Level 3.)

## The two main blockers

### CSS is render-blocking
The browser **won't paint** until the required CSS is downloaded & parsed. Heavier/more CSS
files → later first paint. Fixes: inline critical CSS, split non-critical CSS, use `media`
to deprioritize (`<link media="print">` → not render-blocking).

### JavaScript is parser-blocking
A synchronous `<script>` in `<head>` **blocks the parser**: the browser stops building the
DOM to download + run the script. Worse: a script that wants to read the CSSOM must wait for
CSS to finish → JS is blocked by CSS, while JS itself blocks the DOM. This dependency chain
is the classic source of slowness.

| Script attribute | Blocks parser? | When it runs | Order preserved? |
|---|---|---|---|
| (none) | ✔ blocks | as soon as fetched, pausing parse | yes |
| `async` | ✘ | as soon as fetched (any time) | **no** |
| `defer` | ✘ | after the DOM is built, before `DOMContentLoaded` | yes |
| `type="module"` | ✘ (deferred by default) | after parse | yes |

## Metrics to know

- **FP / FCP**: first pixels / first content. Depends on the CRP.
- **DOMContentLoaded (DCL)**: DOM fully built (waits for sync/defer scripts).
- **Load**: every resource (images, css, js) finished.
- **LCP**: the largest content element painted (a Core Web Vital). Optimize the CRP + preload
  the LCP image.

## CRP optimization strategy (practical)

1. **Reduce render-blocking bytes**: minify, compress (gzip/brotli), tree-shake CSS.
2. **Inline critical CSS** for above-the-fold; lazy-load the rest.
3. **Move scripts to the end of `<body>` or use `defer`** so they don't block the parser.
4. **`async`** for independent scripts (analytics) that don't depend on the DOM/order.
5. **Preload** important resources (fonts, LCP image) — see the "Resource Hints" concept.
6. **Reduce round-trips** (HTTP/2-3, preconnect to third-party origins).

## Senior checklist

- Draw the pipeline DOM/CSSOM → Render Tree → Layout → Paint → Composite.
- Explain why CSS is render-blocking and JS is parser-blocking.
- Distinguish async vs defer vs module precisely.
- Know which metric measures what (FCP/DCL/Load/LCP).

## References

- [web.dev: Critical Rendering Path](https://web.dev/articles/critical-rendering-path)
- [MDN: Critical rendering path](https://developer.mozilla.org/en-US/docs/Web/Performance/Critical_rendering_path)
- [web.dev: efficiently load third-party JavaScript (async/defer)](https://web.dev/articles/efficiently-load-third-party-javascript)
- [web.dev: Largest Contentful Paint (LCP)](https://web.dev/articles/lcp)
