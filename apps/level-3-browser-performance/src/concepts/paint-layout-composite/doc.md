# Paint vs Layout vs Composite

## The pixel pipeline

Every visual update flows through some subset of this pipeline. The further left you start, the
more work the browser does:

```
JS / CSS ─▶ Style ─▶ Layout ─▶ Paint ─▶ Composite ─▶ screen
              │         │         │          │
        recalc style  geometry  rasterize  assemble layers (GPU)
```

- **Style**: compute which CSS rules apply and the final computed values.
- **Layout (reflow)**: compute geometry — size and position of every box. Changing one box can
  reflow its ancestors/siblings/descendants.
- **Paint**: fill in pixels — text, colors, borders, shadows, images — into paint records, then
  rasterize (often into tiles).
- **Composite**: the compositor assembles the painted layers in the right order and draws them,
  largely on the **GPU**.

## The key insight: which properties trigger which stage

What you animate/change determines where you re-enter the pipeline:

| You change… | Triggers | Cost | Examples |
|---|---|---|---|
| Geometry | **Layout → Paint → Composite** | highest | `width`, `height`, `top/left`, `margin`, `padding`, `font-size`, `display` |
| Visual (non-geometry) | **Paint → Composite** | medium | `color`, `background`, `box-shadow`, `border-radius`, `visibility`, `outline` |
| Transform / opacity | **Composite only** | lowest | `transform`, `opacity` (on a promoted layer) |

So animating `left` reflows and repaints every frame; animating `transform: translateX()` only
re-composites — the layer was already painted, the GPU just moves it. That's why
**transform/opacity animations hit 60fps** while `top/left`/`width` animations jank.

## Why "composite only" is so cheap

A composited layer is a pre-rasterized texture living on the GPU. Moving, scaling, rotating, or
fading it is a GPU matrix/alpha operation — no re-layout, no re-paint of the layer's contents. The
main thread is barely involved, so even during heavy JS the compositor thread can keep animating.

## Paint can still be expensive

"Paint only" isn't free. Large paint areas, expensive effects (big `box-shadow`, blurs,
`filter`, gradients), and frequent repaints of big regions cost real time. Use DevTools **Paint
flashing** (rendering tab) to see what repaints, and **"Paint profiler"** to see how long.

## The budget

For 60fps you have **~16.7ms per frame** (minus browser overhead → aim for <~10ms of JS+style+
layout+paint). Miss it and the frame drops. For animations, staying on the **composite-only** path
is the most reliable way to hit that budget.

## Practical rules

- **Animate `transform` and `opacity`**, not `top/left/width/height`.
- To move something, prefer `transform: translate()` over changing offsets.
- Avoid animating properties that force layout (`width`, `height`, `top`, `margin`, …).
- Watch paint cost of shadows/filters/gradients on large or frequently-updated areas.
- Use `will-change` sparingly to pre-promote a layer for an upcoming transform/opacity animation
  (see "GPU acceleration" / "Compositing layers").

## Senior checklist

- Know the pipeline order and which CSS properties re-enter it where.
- transform/opacity = composite-only (cheap, GPU); geometry = layout+paint+composite (expensive).
- "Paint only" still costs for large/complex paints — measure with paint flashing.
- 16.7ms frame budget; composite-only is the safe path for smooth animation.

## References

- [web.dev: Stick to compositor-only properties](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- [CSS Triggers (which property triggers what)](https://csstriggers.com/)
- [web.dev: Rendering performance](https://web.dev/articles/rendering-performance)
- [MDN: How browsers work / the pixel pipeline](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work)
