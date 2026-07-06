# Angular SSR vs Server Components

React Server Components (RSC) and Angular SSR solve overlapping product goals but are not the same
architecture.

## React RSC in one sentence

RSC adds server-only components to React's component model. A server component can read server data
and produce a serialized component payload. Client components opt in with a boundary like
`'use client'`.

## Angular SSR in one sentence

Angular SSR renders Angular routes/components to HTML on the server, sends that HTML to the
browser, and hydrates it on the client.

```ts
export const config: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideServerRouting(serverRoutes),
  ],
};
```

## Mapping table

| React concept | Angular equivalent |
|---|---|
| SSR HTML | Angular SSR HTML |
| Hydration | Angular hydration |
| RSC server-only component | No direct equivalent |
| `'use client'` boundary | No direct equivalent; use platform guards and architecture boundaries |
| RSC payload | HTML plus transferred state/cache |

## Transfer cache

Angular can transfer HTTP data from server render to client hydration so the browser does not
immediately refetch the same data. This is closer to SSR data transfer than to RSC.

## Browser API trap

Angular component code can run on server and client in SSR mode. Code that touches `window`,
`document`, layout measurement, localStorage, or browser-only SDKs must be guarded or moved to
client-only lifecycle paths.

## Senior interview phrasing

> Angular SSR is traditional server rendering plus hydration, not React Server Components. I can
> compare the user-facing goals, but I do not claim Angular has a server-only component graph or
> a `'use client'` boundary. I use transfer cache, server routes, and platform guards instead.

## References

- [Angular: SSR](https://angular.dev/guide/ssr)
- [Angular: Hydration](https://angular.dev/guide/hydration)
- [React: Server Components](https://react.dev/reference/rsc/server-components)
