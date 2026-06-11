# Frontend system design trade-offs

> The capstone. Every concept in this level is a **trade-off**, not a default. Senior system design
> isn't knowing the fanciest option — it's choosing the *boring-enough* one that fits the constraints,
> and being able to **name what you're giving up**.

## There is no "best", only fit

The same questions decide most front-end architectures:

- **Discoverability / first load** — does this need SEO and a fast first paint? (marketing site vs
  internal dashboard)
- **Data freshness** — static, periodically rebuilt, per-request, or realtime?
- **Personalization** — is content per-user (can't be cached globally)?
- **Interactivity** — a content page, or a rich app?
- **Org scale** — one team or many independent teams?
- **Connectivity** — always online, or offline-capable?
- **Consistency needs** — strong, or eventual-with-reconcile?

## Rendering strategy decision

| Need | Strategy |
|---|---|
| Static content, SEO, rare changes | **SSG** (prerender once) |
| Mostly static, periodic updates | **ISR / SSG + revalidate** |
| Per-request/personalized, SEO | **SSR** (→ **edge SSR** for a global audience, if data is near) |
| Content-heavy + some interactivity, small bundle | **RSC + streaming**, client leaves |
| Rich app, SEO not critical | **CSR SPA** (optionally prerender the shell) |
| Realtime data | client data layer (WS/SSE) on top of a streamed shell |

These compose: an RSC app can stream from the edge, hydrate islands, and run a realtime client layer.

## Architecture decision

- **Monolith vs micro-frontends** — MFEs buy **team autonomy** at the cost of orchestration,
  duplicate-dep risk, and consistency work. **One team → monolith.** Reach for MFEs when independent
  deploy across teams is the actual bottleneck (not for technical novelty).
- **Build vs buy** — auth, search, analytics, design systems: buying is usually cheaper than the
  total cost of owning. Build what's your differentiator.
- **State complexity** — local state → context → a store → a server-cache library. Don't add a
  distributed store until you have distributed problems.
- **Offline & consistency** — offline-first + CRDTs are powerful and **expensive**; adopt them when
  offline/collaboration is a real requirement, not speculatively.

## The meta-skill

- **Make trade-offs explicit.** "We chose eventual consistency + optimistic UI; the cost is brief
  stale reads, mitigated by versioned reconcile." That sentence is senior signal.
- **Avoid resume-driven / speculative complexity.** Every abstraction (edge, WASM, MFEs, CRDTs) has
  a carrying cost in latency, bundle, ops, and onboarding. Pay it only against a real constraint.
- **Optimize the constraint that's binding** — TTFB, bundle, team velocity, correctness — not all of
  them at once. You can't max consistency, availability, and latency simultaneously (CAP/PACELC).
- **Reversibility** — prefer decisions you can undo cheaply; spend your "one-way door" budget where it
  matters.

## Senior checklist

- Drive architecture from **requirements** (SEO/freshness/personalization/interactivity/team
  scale/offline/consistency), not from trends.
- Pick a **rendering strategy** to match (SSG/ISR/SSR/edge/RSC/CSR — they compose); pick **MFEs only
  for team autonomy**, monolith otherwise.
- Every advanced technique (edge, WASM, offline-first, CRDTs, federation) carries a real cost —
  adopt against a binding constraint, not speculatively.
- **State the trade-off you're accepting** out loud; prefer reversible decisions; optimize the
  constraint that's actually binding.

## References

- [patterns.dev — rendering patterns](https://www.patterns.dev/)
- [web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)
- [martinfowler.com: Micro Frontends (when not to)](https://martinfowler.com/articles/micro-frontends.html)
- [PACELC theorem](https://en.wikipedia.org/wiki/PACELC_theorem)
