# Level 2* - Angular for React Developers

Interactive SPA workbook for 13 Angular runtime concepts, written for readers who already know
React's rendering model. The app itself still uses the shared `@sfe/workbook` React engine, but
the theory, demos, and exercises explain Angular equivalents: templates, Ivy, views, change
detection, signals, Zone.js, SSR, hydration, RxJS, and lifecycle cleanup.

## Running

```bash
bun install                                      # run at the repo root
bun run --filter level-2-angular-for-react-devs dev
bun run --filter level-2-angular-for-react-devs build
```

## Concepts

Angular templates vs JSX · Ivy view model · DOM renderer and platform abstractions · View
identity with `@for track` · Change detection · Signals · Zone.js and zoneless mode · Scheduling
work without Fiber lanes · Deferrable views · Hydration and event replay · Angular SSR vs Server
Components · RxJS and external state consistency · Stale captures and lifecycle cleanup.

## Design goal

Every concept starts from a React mental model, names the Angular equivalent, and calls out the
places where the mapping is deliberately not 1:1. The goal is not to teach Angular syntax from
zero; it is to help a strong React engineer transfer their intuition safely.
