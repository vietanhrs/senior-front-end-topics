# React Server Components (RSC)

## The core idea

**Server Components** run **only on the server**. They render to a special serialized format
(the "RSC payload"), never ship their code to the browser, and can directly access
server-only resources (databases, filesystem, secrets, internal services). **Client Components**
are the React you already know: they run in the browser, can hold state and effects, and respond
to events.

An app becomes a **tree that crosses the server/client boundary**: server components render the
static/data parts on the server and embed client components (the interactive islands) into the
output.

```
Server Component (default)            Client Component ('use client')
  ├─ runs on server only               ├─ runs in browser (and SSR)
  ├─ async; await db/fetch directly    ├─ useState/useEffect/refs/events
  ├─ ZERO JS shipped for itself        ├─ its JS is bundled & shipped
  └─ can import & render Client comps   └─ cannot import Server comps directly
```

## The `'use client'` boundary

By default (in an RSC framework) components are **Server Components**. Adding the `'use client'`
directive at the top of a file marks it — and everything it imports into the client graph — as a
**Client Component**:

```tsx
'use client';
import { useState } from 'react';
export function LikeButton() {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked(!liked)}>{liked ? '♥' : '♡'}</button>;
}
```

```tsx
// No directive → Server Component. Can be async and touch the DB.
import db from './db';
import { LikeButton } from './LikeButton'; // a client island embedded here
export default async function Post({ id }) {
  const post = await db.post.find(id);     // runs on the server only
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <LikeButton />                        {/* interactivity lives in the client */}
    </article>
  );
}
```

## What you can and can't do

| | Server Component | Client Component |
|---|---|---|
| `useState`/`useEffect`/refs | ❌ | ✅ |
| Event handlers (`onClick`…) | ❌ | ✅ |
| `async`/`await` in the component | ✅ | ❌ (use Suspense/`use`) |
| Access DB / secrets / fs | ✅ | ❌ (would leak to the bundle) |
| Browser APIs (`window`…) | ❌ | ✅ |
| Ships JS to the browser | ❌ (none) | ✅ |
| Import a Server Component | ✅ | ❌ (pass as `children`/props instead) |

## Why it matters

- **Less client JS**: server components and their (often heavy) dependencies — markdown parsers,
  date libs, syntax highlighters — never enter the bundle. Only interactive islands ship JS.
- **Direct data access**: no API layer needed for server-rendered data; `await` your data source
  right in the component, closer to the data, with secrets staying on the server.
- **Composability**: server components can pass server-rendered UI as `children` into client
  components, so a client component can wrap server content without that content becoming client code.

## Props must be serializable across the boundary

Anything passed from a Server to a Client Component is serialized in the RSC payload, so props
must be **serializable**: no functions (except Server Actions), no class instances, no Dates with
methods you rely on, etc. `children` can be server-rendered React nodes.

## Server Components vs SSR

They're complementary, not the same. **SSR** renders Client Components to HTML for first paint
(then hydrates). **RSC** is about *where a component runs and whether its code ships at all*. A
server component is never hydrated (it has no client code); a client component is SSR'd then
hydrated.

## Senior checklist

- Server Components run only on the server, ship no JS, can be async and touch server resources.
- `'use client'` marks the interactivity boundary; below it lives state/effects/events.
- Props crossing the boundary must be serializable; client can't import server components (pass as children).
- RSC reduces bundle size & removes API plumbing; it's distinct from (and combined with) SSR.

## References

- [React: Server Components](https://react.dev/reference/rsc/server-components)
- [React: 'use client'](https://react.dev/reference/rsc/use-client)
- [React: 'use server' / Server Actions](https://react.dev/reference/rsc/server-actions)
- [Next.js: Server & Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
