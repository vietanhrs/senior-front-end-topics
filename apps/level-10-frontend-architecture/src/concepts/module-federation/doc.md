# Module Federation

## What it is

**Module Federation** (Webpack 5, Rspack, and a Vite plugin) lets **separately built and deployed**
bundles share code and consume each other's modules **at runtime** — the technical backbone of
client-side micro-frontends. An app can **expose** modules for others and **consume** modules from
others; an app is often both a **host** and a **remote**.

Three roles in the config:

```js
new ModuleFederationPlugin({
  name: 'shell',
  remotes: { catalog: 'catalog@https://cdn/.../remoteEntry.js' }, // consume
  exposes: { './Cart': './src/Cart' },                            // provide
  shared: {                                                       // share deps
    react: { singleton: true, requiredVersion: '^18.2.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
  },
});
```

## How it loads (runtime)

1. The host boots and, when it needs a remote, fetches that remote's **`remoteEntry.js`** (its
   manifest of exposed modules + shared deps).
2. Both sides register into a **shared scope**. For each shared dependency, the runtime **negotiates
   a single version** that satisfies everyone's `requiredVersion`, loading it **once**.
3. The exposed module is fetched lazily and executed against that shared scope.

This is why federation isn't just "import from a URL": it's **dependency negotiation** so independent
apps don't each ship their own React.

## The senior trap: shared singletons

Some libraries **must be a single instance** in the page or they break:

- **React / React-DOM** — two copies means two separate internal dispatchers → **"Invalid hook
  call"**, broken `Context` (a provider in one copy isn't seen by consumers in the other), duplicated
  reconcilers. Always `singleton: true`.
- State libraries with module-level stores (some Redux/Zustand setups), styling runtimes, i18n — same
  story.

`shared` options that matter:

- **`singleton: true`** — exactly one instance across host + all remotes (highest compatible version
  wins). Essential for React.
- **`requiredVersion` / `strictVersion`** — the semver each app needs; `strictVersion: true` **errors**
  on a mismatch instead of silently loading a possibly-incompatible single copy.
- **`eager: true`** — bundle the shared dep into the initial chunk (no extra round-trip) vs lazy
  (smaller initial, async). Eager-load the singletons your shell needs immediately.

## Failure modes

- **No singleton (or version skew)** → multiple framework copies: bigger payload **and** broken hooks/
  context.
- **Incompatible majors** (React 17 remote in an 18 host) → either a hard `strictVersion` error or a
  risky single instance with API skew. Align majors across the org; coordinate upgrades.
- **Remote down / version drift** → the host must handle a remote that fails to load (error boundary
  — previous concept) and a `remoteEntry` that changed shape.

## Senior checklist

- Federation shares code **at runtime** via host/remote/`shared` + a negotiated **shared scope**;
  it's dependency negotiation, not just remote imports.
- Mark framework-like deps **`singleton: true`** (React/ReactDOM especially) — two copies →
  duplicated payload + "invalid hook call" + dead context.
- Tune `requiredVersion`/`strictVersion`/`eager`; align **major versions** across teams and
  coordinate upgrades to avoid skew.
- Pair with **error boundaries** for remotes that fail to load and a plan for `remoteEntry` drift.

## References

- [Module Federation docs](https://module-federation.io/)
- [Webpack: Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Shared singletons & "Invalid hook call"](https://module-federation.io/guide/troubleshooting/other.html)
- [Vite plugin: @module-federation/vite](https://module-federation.io/guide/framework/vite.html)
