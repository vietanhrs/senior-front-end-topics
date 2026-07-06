# Micro-frontend orchestration

## What and why

**Micro-frontends (MFEs)** extend the microservice idea to the UI: split one front-end into several
**independently developed, tested, and deployed** applications, owned by different teams, then
**compose** them into one experience at runtime. The driver is almost always **organizational**
(Conway's law) — letting teams ship autonomously without a shared release train — not technical
elegance. If you have one small team, you probably don't need MFEs.

## Composition models (where the pieces are stitched)

- **Build-time** — MFEs published as npm packages and bundled by a host. Simple, but you lose
  independent deploy (a host rebuild is needed for every change). Barely "micro".
- **Server / edge-side composition** — a server or edge worker assembles fragments into one HTML
  document (Podium, Tailor, ESI/SSI, edge includes). Great for SSR + SEO.
- **Client-side runtime composition** — an **app shell** loads remote MFEs in the browser at runtime
  via **Module Federation**, **import maps**, **web components**, or (last resort) **iframes**. Most
  flexible; the focus of this concept.

## The orchestrator (app shell) owns

- **Routing** — top-level routes map to MFEs; each MFE may own its sub-routes. Avoid two routers
  fighting.
- **Lifecycle** — mount/unmount MFEs as routes change (single-spa formalizes
  `bootstrap`/`mount`/`unmount`).
- **Shared services** — auth/session, a design-system/theme, telemetry, feature flags — provided once
  by the shell, consumed by MFEs.
- **Communication** — keep it **loose**: custom events / a small pub-sub / URL state / props passed
  down. **Avoid a big shared store** that couples everyone (that's how you get a *distributed
  monolith* — all the cost of MFEs, none of the autonomy).

## The hard parts

- **Isolation.**
  - **CSS:** scope it (Shadow DOM, CSS Modules, hashed classes) so one MFE can't restyle another.
  - **JS / failure:** wrap each MFE in an **error boundary** so a crash in one degrades to a fallback
    **without taking down the shell or sibling MFEs**. This *failure isolation* is the headline
    benefit.
- **Shared dependencies** — naively each MFE ships its own React → multiple framework copies, huge
  payloads, and broken hooks if two React instances mix. **Module Federation shared singletons** /
  import maps dedupe them (next concept). In a multi-team setup, this also needs a compatibility
  policy: versioned remote manifests, owned singleton dependencies, contract tests, and runtime
  fallback so one team's dependency update does not break the whole shell.
- **Consistency** — independent teams drift visually and behaviorally; a shared **design system** +
  contracts keep it coherent.
- **Performance** — lazy-load MFEs, avoid duplicate vendors, prefetch likely routes; watch the
  cumulative bundle.

## Senior checklist

- MFEs = independent build/deploy/ownership composed at runtime; adopt them for **team autonomy**,
  not for fun — they add real complexity.
- The **shell** owns routing, lifecycle, shared services, and loose communication; keep coupling low
  or you get a **distributed monolith**.
- **Isolate**: scoped CSS + an **error boundary per MFE** so one failure degrades gracefully; dedupe
  shared deps (singletons) to avoid multiple frameworks.
- Treat shared dependency upgrades as platform changes: version manifests, test contracts, and avoid
  loading implicit `latest` remotes in production.
- Hold the line on a **shared design system** and contracts for visual/behavioral consistency.

## Angular equivalent

Angular MFEs have the same shared-runtime hazard: multiple incompatible copies of @angular/core, @angular/router, Zone.js, RxJS, or a design-system runtime can break DI, routing, event handling, or bundle budgets. Treat Angular framework packages as shared singletons when composing Angular remotes.

## References

- [martinfowler.com: Micro Frontends](https://martinfowler.com/articles/micro-frontends.html)
- [micro-frontends.org](https://micro-frontends.org/)
- [single-spa](https://single-spa.js.org/)
- [Module Federation](https://module-federation.io/)
