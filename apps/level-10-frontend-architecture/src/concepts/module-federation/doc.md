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

## Dependency compatibility across teams

The hardest production problem is not getting one remote to load. It is letting many teams deploy
independently without one team's dependency update breaking the rest of the page.

Typical breakages:

- Team A updates `react`, `react-dom`, router, state library, or design-system runtime and the shared
  scope now resolves a version another remote did not test against.
- A remote bundles a second React copy, causing `Invalid hook call`, dead Context, duplicated
  reconcilers, or hydration bugs.
- A remote changes its exposed component contract (`props`, events, route shape, exposed path), but
  the host or another remote still consumes the old contract.
- The shell loads a new `remoteEntry.js`, while cached chunks, manifests, or host assumptions still
  expect the previous remote shape.
- Global CSS, global side effects, telemetry initialization, or singleton stores leak from one remote
  into siblings.

### 1. Share less than you think

Do **not** put every dependency into `shared`. Classify dependencies by runtime coupling:

| Dependency type | Recommended handling | Why |
|---|---|---|
| React / ReactDOM | Shared singleton | Multiple copies break hooks, Context, and reconciliation. |
| Router, i18n, global state runtime | Usually shared singleton if the shell coordinates them | They often carry global runtime state. |
| Design-system runtime | Shared and platform-owned when it controls theme/tokens/portals | Visual and behavioral consistency need one contract. |
| Utility libs (`date-fns`, `lodash`, small helpers) | Usually local to each remote | A local update should not affect other teams. |
| Heavy but isolated libs (charts, editors, SDKs) | Case-by-case; local by default | Sharing may reduce bytes, but increases version coupling. |

Sharing too much turns micro-frontends into a distributed monolith: all teams keep the deployment
cost of MFEs, but lose independent compatibility.

### 2. Let the shell own critical shared dependencies

For critical singletons, the shell or platform team should define the supported version range. Remote
teams align to it instead of independently upgrading major versions.

```js
shared: {
  react: {
    singleton: true,
    requiredVersion: '^18.2.0',
    strictVersion: true,
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '^18.2.0',
    strictVersion: true,
  },
  'react-dom/': {
    singleton: true,
    requiredVersion: '^18.2.0',
    strictVersion: true,
  },
}
```

Key points:

- `singleton: true` means one runtime instance in the share scope.
- `requiredVersion` declares what the app can safely consume.
- `strictVersion: true` is often worth it for critical dependencies: fail fast on incompatible
  versions instead of silently running an untested runtime.
- Include subpath imports when needed. If code imports `react-dom/client`, sharing only
  `react-dom` may not intercept that subpath in some setups.

### 3. Keep a compatibility matrix

Publish a small compatibility matrix for the shell and remotes:

```text
Shell v3
- React: 18.2.x
- Design System: 4.x
- Router: 6.x
- Remote catalog: >= 2.4.0 < 3.0.0
- Remote checkout: >= 1.8.0 < 2.0.0
```

Each remote should publish machine-readable metadata:

```json
{
  "name": "wallet-widget",
  "version": "2.5.1",
  "requires": {
    "react": "^18.2.0",
    "@company/design-system": "^4.3.0",
    "shell-contract": "^3.0.0"
  }
}
```

The shell can check this metadata before loading or promoting a remote. This makes compatibility an
explicit contract instead of tribal knowledge.

### 4. Do not load `latest` in production

This is unsafe:

```text
https://cdn.example.com/team-a/remoteEntry.js
```

If Team A deploys, production immediately consumes it. Prefer immutable, versioned remote entries:

```text
https://cdn.example.com/team-a/2.5.1/remoteEntry.js
```

Then let the shell read a manifest:

```json
{
  "teamA": {
    "version": "2.5.1",
    "remoteEntry": "https://cdn.example.com/team-a/2.5.1/remoteEntry.js"
  }
}
```

Promotion becomes a manifest change, not a surprise runtime mutation. Rollback is also a manifest
rollback.

### 5. Expose stable facades, not internals

Avoid exposing deep implementation modules:

```js
exposes: {
  './InternalButton': './src/components/Button/index.tsx',
}
```

Expose a stable public facade:

```js
exposes: {
  './WalletWidget': './src/public/WalletWidget',
}
```

And treat its props/events as an API:

```ts
type WalletWidgetProps = {
  userId: string;
  network: 'mainnet' | 'testnet';
  onConnect?: (wallet: WalletInfo) => void;
};
```

For breaking changes, version the exposed contract:

```js
exposes: {
  './v1/WalletWidget': './src/public/v1/WalletWidget',
  './v2/WalletWidget': './src/public/v2/WalletWidget',
}
```

Keep `v1` during a deprecation window so the shell and other remotes can migrate safely.

### 6. Add consumer-driven compatibility tests

Every remote release should be tested in the composition environment, not only inside its own repo.

Useful checks:

- Can the shell fetch and execute the remote entry?
- Do all exposed module paths still exist?
- Does shared dependency negotiation resolve to the expected singleton/version?
- Do TypeScript public types or API extractor output show breaking changes?
- Do Playwright smoke tests pass in the composed shell?
- Does the remote still work with the current production shell manifest?

In a mature setup, remote CI publishes a candidate build, shell CI consumes that candidate with the
current manifest, and only compatible candidates can be promoted.

### 7. Guard the runtime anyway

Tests reduce risk, but runtime must still degrade gracefully:

- Wrap every remote in an error boundary.
- Treat remote loading as async and fallible.
- Show a feature-level fallback instead of crashing the shell.
- Log remote name, remote version, shell version, and resolved shared dependency versions.
- Check metadata compatibility before mounting when possible.

Conceptually:

```ts
if (!isCompatible(remote.manifest.requires, shell.runtimeVersions)) {
  reportIncompatibleRemote(remote);
  return <RemoteUnavailable />;
}
```

The user should lose one feature, not the whole application.

### 8. Use separate share scopes only for migrations

For a major upgrade, such as React 18 to React 19, a second share scope can let teams migrate in
stages:

```js
shared: {
  react: {
    singleton: true,
    requiredVersion: '^18.2.0',
    shareScope: 'react18',
  },
}
```

A new set of remotes can use a `react19` scope. This is a migration tool, not the default operating
model. Multiple framework majors in one page increase bundle cost and integration complexity, and
React Context/hooks cannot cross the runtime boundary safely.

### 9. Use hard isolation for legacy or high-risk remotes

If a remote cannot align with the platform dependency contract, isolate it more strongly:

- `iframe` with `postMessage`
- Web Component + Shadow DOM
- A separately mounted app with a narrow event/URL contract

This sacrifices deep integration, but it protects the rest of the page from dependency and global
side-effect breakage. Use it for legacy apps, third-party apps, or major-version experiments that
cannot safely share the shell runtime.

### 10. Define an upgrade workflow

Dependency updates need different levels of ceremony:

| Change type | Suggested workflow |
|---|---|
| Patch/minor local dependency inside one remote | Team-owned, normal remote CI. |
| Patch/minor shared singleton | Compatibility matrix + composed shell smoke tests. |
| Major shared singleton | RFC, migration plan, canary, deprecation window, rollback plan. |
| Design-system breaking change | Migration guide, codemod or adapter if possible, contract tests. |
| Exposed component breaking change | New exposed version (`v2`), keep `v1` temporarily. |

Recommended operating model:

- Shell/platform owns critical shared runtimes.
- Remote teams own local implementation dependencies.
- Production uses versioned remote manifests, never implicit `latest`.
- Public remote APIs are versioned and contract-tested.
- Runtime has error boundaries and compatibility guards.
- Legacy/high-risk remotes use stronger isolation.

### Interview phrasing

> I would not share every dependency. I would classify dependencies into critical singletons and
> local implementation dependencies. React, ReactDOM, router, and design-system runtime should be
> owned by the shell with `singleton`, `requiredVersion`, and usually `strictVersion`. Other
> libraries should stay bundled inside each remote to preserve team autonomy. On top of that, I would
> use versioned remote manifests instead of loading latest remote entries, enforce public contracts
> with CI compatibility tests, and protect runtime with error boundaries and fallback. For major
> upgrades, I would use a migration window or separate share scopes; for high-risk legacy remotes, I
> would isolate them with iframe or Web Components.

## Senior checklist

- Federation shares code **at runtime** via host/remote/`shared` + a negotiated **shared scope**;
  it's dependency negotiation, not just remote imports.
- Mark framework-like deps **`singleton: true`** (React/ReactDOM especially) — two copies →
  duplicated payload + "invalid hook call" + dead context.
- Tune `requiredVersion`/`strictVersion`/`eager`; align **major versions** across teams and
  coordinate upgrades to avoid skew.
- Share only dependencies that benefit from runtime sharing; keep implementation-only deps local to
  preserve team autonomy.
- Load production remotes through immutable versioned manifests, not `latest` remote entries.
- Pair **contract tests**, **error boundaries**, and **runtime compatibility guards** with a plan for
  `remoteEntry` drift.

## Angular equivalent

For Angular Module Federation, the singleton list usually includes @angular/core, @angular/common, @angular/router, @angular/forms when shared, RxJS, Zone.js if present, and the design-system runtime. The reason mirrors React: two framework runtimes mean broken DI/router assumptions and duplicated global behavior.

## References

- [Module Federation docs](https://module-federation.io/)
- [Webpack: Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Shared singletons & "Invalid hook call"](https://module-federation.io/guide/troubleshooting/other.html)
- [Vite plugin: @module-federation/vite](https://module-federation.io/guide/framework/vite.html)
