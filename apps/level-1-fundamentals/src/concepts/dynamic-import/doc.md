# Dynamic import & chunking

## `import()` — an expression, not a declaration

`import ... from '...'` (static) is resolved at **build time**: the bundler follows the
dependency graph and packs it into a chunk. `import('...')` (dynamic) is an **expression that
returns a Promise**, resolved at **runtime**:

```ts
const mod = await import('./pack.js'); // Promise<Module namespace>
mod.doSomething();
```

Because it's an expression, you can call it conditionally, inside an event handler, or with a
variable — things static imports can't do.

## How the bundler creates chunks

When the bundler (Vite/Rollup/webpack) sees `import('X')`, it splits X (and the dependencies
*only* X needs) into a separate **chunk**, with a runtime loading mechanism. Key points:

- **Modules are cached by specifier**: calling `import('./pack')` multiple times hits the
  network **only once**; subsequent calls return the already-loaded module (the Promise
  resolves instantly).
- **Shared dependencies are split out (shared chunk)**: if two dynamic chunks both use
  `lodash`, the bundler typically extracts `lodash` into a shared chunk to avoid duplication.
- **Chunk names/paths get a content hash** for cache-busting (`pack.a1b2c3.js`).

## Hints for the bundler (magic comments)

Bundlers support "magic comments" to control chunking:

```ts
// webpack
import(/* webpackChunkName: "editor" */ /* webpackPrefetch: true */ './Editor');
```

Vite has its own approach and uses `rollupOptions.output.manualChunks` / `build.rollupOptions`
to group chunks; it also has `import.meta.glob` for bulk dynamic imports:

```ts
// Vite: build a map of dynamic loaders from many files
const pages = import.meta.glob('./pages/*.tsx'); // { './pages/a.tsx': () => import(...) }
```

## How it differs from "Code splitting"

- **Code splitting** is the *strategy* (split at route/component/vendor) — the previous concept.
- **Dynamic import chunking** is the *mechanism* behind it: the `import()` syntax, how the
  bundler cuts & caches chunks, and how to control naming/preloading.

## Practical pitfalls

- **You can't fully tree-shake a variable-based dynamic import**:
  `import(\`./locale/\${name}.js\`)` forces the bundler to package *every* file matching the
  pattern as separate chunks. Be careful with overly broad dynamic globs.
- **Waterfall**: `await import(A)` then inside it `await import(B)` → sequential. If you know
  ahead of time, `Promise.all([import(A), import(B)])` or prefetch in parallel.
- **Handle load failures**: a chunk can 404 after a deploy (the file's hash changed). Wrap
  `await import()` in `try/catch` (or use an Error Boundary with `React.lazy`) and allow reload.
- **Race on concurrent calls**: calling `import()` concurrently many times is safe (same
  Promise), but if you cache the loader yourself, cache the **Promise**, not two parallel fetches.

## Proactive prefetching

Preload a chunk when idle or when the user shows intent (hover), so a click is instant:

```ts
// just trigger the load, no need to use the result
const prefetch = () => { void import('./Editor'); };
button.addEventListener('mouseenter', prefetch);
// or when idle:
requestIdleCallback(() => void import('./Editor'));
```

## Senior checklist

- Understand `import()` is an expression returning a Promise, resolved at runtime.
- Know modules are cached by specifier (call many times, load once).
- Know how to avoid waterfalls (`Promise.all`) and how to prefetch.
- Be cautious with dynamic globs that explode the chunk count.

## Angular equivalent

Angular uses the same JavaScript import() primitive under the hood for lazy routes and deferrable views. The Angular-specific API is usually loadComponent, loadChildren, or @defer; error UX belongs in route error handling or @error blocks rather than a React Error Boundary.

## References

- [MDN: Dynamic import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [Vite: Glob Import](https://vitejs.dev/guide/features.html#glob-import)
- [webpack: import() & magic comments](https://webpack.js.org/api/module-methods/#magic-comments)
- [web.dev: route prefetching](https://web.dev/articles/route-prefetching-in-nextjs)
