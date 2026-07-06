# Level 6 — Security

Interactive SPA workbook for 10 security concepts: trust boundaries, injection sinks, isolation,
and conflict. Built on the shared `@sfe/workbook` engine. Stack: Bun · React 19 · TypeScript · Vite ·
Tailwind v4 · Mantine v8.

## Running

```bash
bun install                          # (run at the repo root)
bun run --filter level-6-security dev      # dev server
bun run --filter level-6-security build    # type-check + production build
```

## Architecture

Thin app on top of the shared engine (`packages/workbook`, imported as `@sfe/workbook`, aliased to
its TS source in `vite.config.ts` + `tsconfig.json`).

```
src/
├── main.tsx               # MantineProvider + <WorkbookApp level={LEVEL} />
├── index.css              # Mantine/Tailwind layers + @source for the shared engine
└── concepts/
    ├── index.ts           # LEVEL registry (assembles the 10 concepts)
    └── <slug>/            # doc.md + Demo.tsx + Exercise.tsx + index.ts
```

## Concepts

CSP · Trusted Types · DOM clobbering · Prototype pollution · Same-origin policy · Service Worker
lifecycle traps · SharedArrayBuffer · Transferable objects · CORS preflight internals · Offline
conflict resolution.

## Notes on the demos

Security demos run **safely** — real exploits are contained, simulated, or self-cleaning:

- **CSP** evaluates a policy against sample requests (the "injected inline script" row is the tell).
- **Trusted Types** uses the real `window.trustedTypes` policy where supported (Chromium) and
  simulates the enforcing sink otherwise; payloads render as text, never executed.
- **DOM clobbering** injects attacker HTML into a `sandbox="allow-same-origin"` iframe (scripts
  disabled) and reads the clobbered named-access properties.
- **Prototype pollution** performs a *real* `Object.prototype` write with a namespaced key and
  deletes it synchronously, proving global pollution without affecting the app.
- **Same-origin policy** / **CORS preflight internals** are live decision/exchange simulators.
- **Service Worker lifecycle** is a deterministic simulation of install→waiting→activate (the
  "stuck in waiting" trap).
- **SharedArrayBuffer** reports `crossOriginIsolated`/SAB availability and demonstrates real
  `Atomics` correctness vs a simulated lost-update race.
- **Transferable objects** uses a real worker to contrast structured-clone copy vs zero-copy
  transfer, showing the sender buffer detaching (`byteLength → 0`).
- **Offline conflict resolution** diverges two replicas and merges them via LWW vs CRDT semantics.

## Angular equivalent

React security examples map to Angular's template escaping, sanitization, Trusted Types support, HttpClient/XSRF helpers, and the same browser security headers. The dangerous Angular escape hatches are sanitizer bypass APIs and raw DOM writes.
