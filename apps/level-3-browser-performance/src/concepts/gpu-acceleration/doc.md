# GPU acceleration in CSS

## What "GPU accelerated" actually means

The browser has two relevant threads (plus the GPU process):

- The **main thread**: JS, style, layout, paint (rasterization is often offloaded, but it's
  orchestrated here).
- The **compositor thread**: assembles already-painted **layers** and draws them via the **GPU**.

"GPU-accelerated animation" means the animation runs entirely on the **compositor thread / GPU**,
transforming pre-rasterized layer textures — so it **doesn't touch layout or paint** and barely
touches the main thread. The two properties the compositor can animate by itself are
**`transform`** and **`opacity`**.

## The killer property: it survives a busy main thread

Because composited `transform`/`opacity` animations run off the main thread, they keep going at
60fps **even when the main thread is blocked** by heavy JS. A `setInterval`/rAF/JS-driven
animation, or anything touching layout/paint, will freeze during that block. This is the most
visceral way to see GPU acceleration (see the demo).

> Caveat: this is reliably true for **CSS/Web Animations** transform/opacity animations that the
> browser promoted to the compositor. A JS animation that sets `style.transform` each frame still
> runs on the main thread and will stutter.

## Getting (and keeping) work on the GPU

- **Animate `transform` / `opacity`** — not `left/top/width/height`, not `box-shadow`, etc.
- **Promote the layer** for an upcoming animation with `will-change: transform` (or the legacy
  `translateZ(0)`/`translate3d`). Promotion means the texture is ready so the first frame isn't
  janky.
- Prefer **CSS animations / Web Animations API** over JS-per-frame `style` writes for transform/
  opacity, so the compositor can run them independently.

## The costs and limits (it's not free)

- **GPU memory**: each promoted layer is a texture (~`w×h×4` bytes). Over-promotion = layer
  explosion → stutter/crashes (see "Compositing layers").
- **Texture upload**: promoting a large/complex element means rasterizing and uploading a big
  texture once; very large layers can be slow to create.
- **Text/anti-aliasing**: an element animating on the GPU may render text slightly differently
  (and historically blurrier) while promoted; some engines re-snap on animation end.
- **`will-change` overuse**: leaving it on permanently holds memory; apply it just-in-time and
  remove it when idle.

## Mental model for choosing

```
Need to move/scale/rotate/fade something every frame?
  → use transform / opacity   → GPU compositor → smooth, survives main-thread load
Need to change size/position/color/shadow?
  → that's layout/paint        → main thread    → animate sparingly, watch the budget
```

## Senior checklist

- GPU-accelerated = transform/opacity animated on the compositor thread, off the main thread.
- Such animations keep running even when the main thread is blocked (the demo proves it).
- Promote intentionally with `will-change`; prefer CSS/WAAPI over per-frame JS for these props.
- Mind GPU memory, upload cost, and text rendering; don't promote everything.

## References

- [web.dev: Animations guide (GPU/compositor)](https://web.dev/articles/animations-guide)
- [web.dev: Compositor-only properties & layer count](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- [MDN: will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [Smashing: GPU animation — doing it right](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
