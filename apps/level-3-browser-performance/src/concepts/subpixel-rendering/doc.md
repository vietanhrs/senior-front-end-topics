# Subpixel rendering

## CSS pixels vs device pixels

A **CSS pixel** is a logical unit; a **device (physical) pixel** is an actual dot on the screen.
The ratio between them is **`window.devicePixelRatio` (DPR)**: 1 on a classic display, 2–3 on
HiDPI/Retina and most phones.

```
1 CSS px  ─ DPR 1 ─▶  1 device px
1 CSS px  ─ DPR 2 ─▶  2 device px   (so 0.5 CSS px = 1 device px)
1 CSS px  ─ DPR 3 ─▶  3 device px
```

**Subpixel rendering** is what happens when content lands at a **fractional** position or size that
doesn't align to whole device pixels. The browser must approximate it across neighboring pixels via
**anti-aliasing**, which can look **blurry** — most visibly on 1px borders, thin lines, and text.

## Where fractions come from

- **Layout math**: `width: 33.333%` of an odd container, `calc()`, fl/grid distribution, centering
  with `margin:auto` of an odd-width child → fractional box edges.
- **Transforms**: `transform: translateX(10.5px)`, sub-pixel scroll offsets, animations that pass
  through fractional positions every frame.
- **High-DPR scaling**: a position that's a whole CSS pixel may still be a *half device pixel* after
  multiplying by a fractional effective DPR (e.g. browser zoom, DPR 1.5).

## Two different "subpixel" things (don't conflate)

1. **Subpixel layout/positioning** (above): boxes/lines at fractional device-pixel offsets → blur
   from anti-aliasing. This is the performance/visual topic here.
2. **Subpixel *text* anti-aliasing** (e.g. ClearType / LCD RGB sub-stripe rendering): using the
   R/G/B sub-stripes of a pixel to triple horizontal text resolution. Largely phased out on the web
   (`-webkit-font-smoothing` is grayscale on most platforms now), and it breaks over translucent/
   animated/composited layers — which is one reason text can look different on a promoted layer.

## Why it matters for performance & polish

- **Crispness**: 1px hairlines and borders blur into 2px grays at fractional offsets — a common
  "why does my divider look fuzzy?" bug.
- **Animation shimmer**: animating a transform that crosses fractional positions can make text/edges
  shimmer; some engines snap at rest.
- **Compositing interaction**: promoted layers may be rasterized once and then transformed, so a
  layer positioned at a fractional offset stays blurry while animating.

## Techniques for crisp rendering

- **Snap to the device-pixel grid** for crisp lines: round positions to a multiple of `1/DPR`.
  `const snapped = Math.round(x * dpr) / dpr;`
- Prefer **integer CSS-pixel** positions/sizes for borders and dividers; use box-shadow/`outline`
  tricks or `transform: translateZ(0)` cautiously.
- For canvas, **scale the backing store by DPR**: set `canvas.width = cssW * dpr` and
  `ctx.scale(dpr, dpr)`, otherwise everything is blurry on Retina.
- For images, serve **DPR-appropriate assets** (`srcset`/`image-set`) so a 1× image isn't upscaled.
- Use **`image-rendering`** deliberately for pixel art; avoid fractional `background-position`.
- Test at **DPR 1, 1.5, 2, 3** and with browser **zoom** (which changes the effective DPR).

## Senior checklist

- DPR maps CSS px → device px; fractional device-pixel offsets cause anti-aliasing blur.
- Snap lines/borders to the device grid (`Math.round(x*dpr)/dpr`); keep hairlines on integer px.
- Scale canvas backing store by DPR; serve `srcset` for HiDPI.
- Subpixel *text* AA (ClearType) is mostly gone on the web and breaks on composited/translucent layers.

## References

- [MDN: devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio)
- [MDN: Canvas + devicePixelRatio (HiDPI)](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#correcting_resolution_in_a_canvas)
- [web.dev: Serve responsive images (srcset/DPR)](https://web.dev/articles/serve-responsive-images)
- [Surma: Pixel-perfect rendering & devicePixelRatio](https://web.dev/articles/device-pixel-content-box)
