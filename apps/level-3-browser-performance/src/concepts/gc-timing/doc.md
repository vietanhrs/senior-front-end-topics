# Garbage collection timing

## The problem: GC is non-deterministic and runs on your thread

JavaScript is garbage-collected: you don't free memory, the engine does. But **you don't control
when** it runs, and major collections can **pause the main thread** ("stop-the-world"). If a GC
pause lands inside your 16.7ms frame budget, you **drop a frame** — visible as a stutter in an
animation or scroll, even though your own code is fast. The cause isn't slow code; it's **allocation
pressure**.

## How modern GCs work (generational)

V8 (and friends) use a **generational** collector based on the *generational hypothesis*: most
objects die young.

- **Young generation (nursery)**: small, collected very frequently with a cheap **scavenge** (copy
  survivors out). Fast, but frequent.
- **Old generation**: long-lived objects, collected by a **mark-sweep-compact** major GC — more
  expensive, can pause longer (V8 mitigates with **incremental marking** and **concurrent/parallel**
  GC on background threads, but some main-thread work remains).

The practical takeaway: **allocating lots of short-lived objects in a hot path** (every frame,
every scroll event) churns the nursery and triggers frequent young-gen GCs; promote enough and you
trigger costly major GCs. Either way → jank.

## Where allocation pressure hides

- **Per-frame allocations** in `requestAnimationFrame`/scroll/`mousemove` handlers: new arrays,
  objects, closures, `{x, y}` points, strings via concatenation/`map`.
- **Functional patterns in hot loops**: `arr.map().filter().reduce()` each create intermediate
  arrays; spreads (`[...a, x]`) and object spreads clone.
- **Closures created per frame** (new function identities), each capturing scope.
- **Boxing / string building**: template strings, `JSON.parse`/`stringify` per frame.

## Reducing GC pressure (object pooling & reuse)

The goal is **fewer, longer-lived allocations** in hot paths:

- **Reuse buffers**: allocate a `Float32Array`/array/object **once** and mutate it each frame instead
  of creating new ones.
- **Object pools**: keep a pool of reusable objects (particles, vectors) and recycle them.
- **Avoid intermediates in hot loops**: prefer a single `for` loop over chained `map/filter/reduce`;
  write into a preallocated output array.
- **Hoist** constants/closures out of the loop so they aren't recreated per frame.
- Mutate **typed arrays** for numeric work (no boxing, contiguous memory).

```js
// ❌ allocates a new array (+ closures) every frame
function tick() {
  positions = particles.map((p) => ({ x: p.x + p.vx, y: p.y + p.vy }));
}

// ✔ mutate a preallocated buffer in place — near-zero allocation
function tick() {
  for (let i = 0; i < particles.length; i++) {
    particles[i].x += particles[i].vx;
    particles[i].y += particles[i].vy;
  }
}
```

> Don't prematurely pool everything — it adds complexity and can *hurt* in cold paths. Optimize the
> **hot** paths (animation/scroll/per-frame), measured.

## Measuring

- **Performance panel**: GC shows up as **"Minor GC"/"Major GC"** events; sawtooth in the **Memory**
  track (heap rising then dropping sharply = allocate-then-collect). Frequent drops + frame drops at
  the same time = GC-induced jank.
- **Memory → Allocation instrumentation on timeline** ("allocation sampling") shows *what* is
  allocating in hot paths.
- `performance.memory` (Chrome) for a rough trend; the **Performance monitor** shows JS heap live.

## Senior checklist

- GC is non-deterministic and can pause the main thread → allocation pressure causes frame drops.
- Generational GC: cheap frequent young-gen scavenges, costlier major GCs; short-lived garbage churns the nursery.
- In hot paths (rAF/scroll), reuse buffers/pools, avoid per-frame arrays/objects/closures and chained array methods.
- Diagnose with the Performance panel GC events + sawtooth memory; optimize hot paths only.

## References

- [V8 blog: Trash talk — the Orinoco garbage collector](https://v8.dev/blog/trash-talk)
- [web.dev: Memory management & GC](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management)
- [Chrome DevTools: Allocation profiling](https://developer.chrome.com/docs/devtools/memory-problems/allocation-profiler)
- [web.dev: Rendering performance / frame budget](https://web.dev/articles/rendering-performance)
