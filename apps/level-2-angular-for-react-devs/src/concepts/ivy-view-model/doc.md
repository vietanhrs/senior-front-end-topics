# Ivy view model

React's rendering internals revolve around Fiber. Angular's modern rendering internals revolve
around Ivy's compiled template instructions and view data structures.

The useful comparison:

| React | Angular Ivy |
|---|---|
| React element tree | Compiled template instructions |
| Fiber tree | View tree made from `TView` / `LView` data |
| Render phase | Template refresh / change-detection pass |
| Commit phase | DOM writes from generated instructions / renderer |
| Hook state slots | Binding/component/directive slots in `LView` |

## TView and LView

The exact implementation is private, but the mental model is stable enough:

- `TView` stores static template metadata: instruction layout, binding positions, cleanup metadata,
  directive definitions, and first-pass information.
- `LView` stores live state for one view instance: component instance, DOM references, directive
  instances, flags, and current binding values.

React frequently creates a fresh element tree and reconciles it against existing fibers. Angular
does not normally build a Virtual DOM tree to diff. It already knows the static template shape and
can refresh indexed bindings.

## Embedded views

`@if`, `@for`, `ng-template`, and structural directives create embedded views. If you are mapping
from React, think "a preserved subtree instance with its own state and binding slots", not "a
function call returning JSX".

## Why this matters

This model explains several Angular performance rules:

- Stable template shape is valuable because the compiler can generate direct instructions.
- Stable list identity matters because Angular can reuse embedded views.
- Expensive template getters are costly because binding refresh can call them repeatedly.
- `OnPush` and signals work by limiting or targeting dirty view checks, not by diffing a VDOM.

## Senior interview phrasing

> React Fiber is a work tree for reconciliation and scheduling. Angular Ivy stores static template
> metadata in `TView` and live view/binding state in `LView`; change detection executes compiled
> update instructions against those views. That is why I do not describe Angular as "React with a
> different JSX syntax".

## References

- [Angular: How Angular works](https://angular.dev/overview)
- [Angular: Change detection](https://angular.dev/guide/components/lifecycle)
- [Angular: Templates](https://angular.dev/guide/templates)
