# Browser compositing layers

## What a compositing layer is

To draw the page, the browser can split content into multiple **compositing layers** — each a
separately rasterized bitmap (texture) — and then the **compositor** (on the GPU) assembles them
into the final image. Think of them like layers in Photoshop: moving or fading one layer doesn't
require repainting the others.

This is what makes `transform`/`opacity` animations cheap: the element lives on its own layer, so
animating it is just the GPU re-compositing existing textures — **no layout, no repaint**.

## Why the browser promotes an element to its own layer

The compositor creates a new layer when it would help correctness or performance. Common triggers
(they evolve across engines, so treat as heuristics, not contract):

- `will-change: transform | opacity` (the explicit, intended hint)
- A running `transform`/`opacity` **animation/transition**
- `transform: translateZ(0)` / `translate3d(0,0,0)` (the old "hack" to force a layer)
- `position: fixed` / `sticky` (often)
- `<video>`, `<canvas>` (WebGL/2D), some `<iframe>`, plugins
- Elements with `filter`, certain `mix-blend-mode`, `backdrop-filter`
- An element that **overlaps** an already-composited layer (an "implicit" layer to preserve paint order)

## The cost: layers aren't free

Each layer is a texture that consumes **GPU memory** (roughly `width × height × 4 bytes`, often
tiled) and adds compositing/management overhead. Two failure modes:

- **Layer explosion**: promoting hundreds of elements (e.g. `* { will-change: transform }` or
  `translateZ(0)` everywhere) blows past GPU memory, causing *more* jank, scrolling stutter, and
  on mobile, crashes.
- **Implicit layers**: promoting element A can force element B (which overlaps A and must paint on
  top) onto its own layer too — a layer you didn't ask for. Reorder/stack to avoid surprises.

> Rule: promote **a few** elements that you actually animate. `will-change` is a scalpel, not paint.

## `will-change`: use it deliberately

`will-change` tells the browser "I'm about to animate this property, prepare a layer." Best
practice:

- Apply it **shortly before** the animation and **remove it after** — a permanent `will-change`
  keeps the layer (and its memory) alive forever.
- Don't apply it to large numbers of elements or via broad selectors.

```css
/* Good: scoped, removed when idle (e.g. toggled via a class on hover/interaction) */
.card.will-animate { will-change: transform; }
```

## Inspecting layers

- **DevTools → Layers panel**: see every layer, its size, memory, and the **compositing reason**
  ("compositing reasons" tells you *why* it was promoted).
- **Rendering tab → Layer borders**: orange/blue borders overlay composited layers on the page.
- Use these to confirm only what you intend is promoted, and to catch implicit layers.

## Senior checklist

- A compositing layer = independently rasterized texture; the GPU assembles layers.
- Promotion enables cheap transform/opacity animation but costs GPU memory (~w×h×4).
- Triggers: `will-change`, transform/opacity animations, `translateZ(0)`, fixed/sticky, video/canvas, overlap.
- Avoid layer explosion; scope `will-change` and remove it when idle; check the Layers panel.

## References

- [web.dev: Manage layer count / compositor-only properties](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [Chrome DevTools: Layers panel](https://developer.chrome.com/docs/devtools/layers/)
- [Surma: GPU animation & compositing](https://web.dev/articles/animations-guide)
