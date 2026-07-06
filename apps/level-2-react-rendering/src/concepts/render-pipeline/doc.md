# Render pipeline & Fiber work loop

## The path from element to screen

Once you have a React element tree, rendering starts when a root receives it:

```tsx
createRoot(container).render(<App />);
```

Conceptually, React does four big things:

1. **Trigger**: enqueue an update on the root with a lane/priority.
2. **Render phase**: build a work-in-progress Fiber tree by walking elements and components.
3. **Complete phase**: bubble information up the tree and mark host mutations/effects.
4. **Commit phase**: apply the finished work to the host environment, then run effects.

Only the commit phase changes the real DOM.

## Fiber nodes are the work units

A Fiber is React's mutable record for one unit of work. Important fields to recognize when
debugging or reading React internals:

| Field | Meaning |
|---|---|
| `tag` | What kind of work this is: FunctionComponent, HostComponent, Suspense, Offscreen, etc. |
| `type` / `elementType` | The element type being rendered, such as `'button'` or `Profile`. |
| `pendingProps` | Props for the next render. |
| `memoizedProps` | Props from the last completed render. |
| `memoizedState` | Hook state list, class state, Suspense state, etc. |
| `updateQueue` | Pending updates/effects for this fiber. |
| `child`, `sibling`, `return` | Pointers used to traverse the Fiber tree without the JS call stack. |
| `alternate` | The matching fiber in the other tree (`current` vs work-in-progress). |
| `flags`, `subtreeFlags`, `deletions` | Work discovered during render that commit must apply. |
| `lanes`, `childLanes` | Priority bookkeeping for this fiber and its subtree. |
| `stateNode` | Host instance for DOM fibers, root object for HostRoot, or class instance for classes. |

You do not use these fields in app code, but knowing them makes React's behavior easier to
reason about.

## `beginWork`: go down

During render, React starts at the root and repeatedly performs work on a fiber. The "begin" step
looks at the fiber's type and props, then decides what children should exist.

- Function component: call the component, run hooks in order, receive returned elements.
- Host component: read `props.children`.
- Suspense: decide whether to render primary content or fallback.
- Memo/context/offscreen: decide whether to bail out or continue.

This step is pure. It can be restarted, abandoned, or run more than once.

## `completeWork`: come back up

After a fiber's children are processed, React completes the fiber:

- for new host components, prepare or create the host instance (`document.createElement` in
  ReactDOM's host renderer),
- diff old vs new props and mark update flags,
- bubble `subtreeFlags` and lanes to the parent,
- build enough information for commit to apply changes quickly.

The render phase produces a finished Fiber tree plus a set of flags. It still has not changed
the visible DOM.

## Commit has sub-phases

Commit is synchronous and not time-sliced because the screen must not show half an update.

React's commit work is commonly discussed in these sub-phases:

1. **Before mutation**: read the host tree before it changes. This is where legacy snapshot
   lifecycles fit.
2. **Mutation**: insert, remove, and update host nodes; detach deleted refs.
3. **Layout**: attach refs and run layout effects (`useLayoutEffect`) while the DOM is updated
   but before the browser has a chance to paint.
4. **Passive**: schedule and later flush passive effects (`useEffect`) after paint.

That is why render must be pure, layout effects can read layout synchronously, and passive
effects are the right place to synchronize with external systems.

## Why interruption is safe

React keeps a `current` tree for what is on screen and builds a separate work-in-progress tree.
If higher-priority work arrives, React can abandon the unfinished work-in-progress tree. Because
commit has not run, users never see a partial render.

When render finishes, commit swaps the finished tree into place atomically.

## Senior checklist

- Rendering is trigger -> render/beginWork -> completeWork -> commit.
- Function components return elements; host components are delegated to the renderer.
- Fiber fields hold state, lanes, alternates, and commit flags across renders.
- Render can be interrupted and must be pure; commit is synchronous and mutates the host tree.
- Layout effects run after DOM mutation; passive effects run later after paint.

## Angular equivalent

Angular's equivalent pipeline is template compilation plus change detection. Ivy stores static metadata in TView, live binding/component state in LView, then refreshes bindings and writes DOM through generated instructions. There is no normal React-style render/complete/commit Fiber pipeline.

## References

- [React: Render and Commit](https://react.dev/learn/render-and-commit)
- [React: Keeping components pure](https://react.dev/learn/keeping-components-pure)
- [React Fiber Architecture notes](https://github.com/acdlite/react-fiber-architecture)
- [React source: ReactFiberWorkLoop](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberWorkLoop.js)
