# Angular templates vs JSX

React developers usually start with this sentence:

> JSX is just JavaScript that creates React element objects.

That sentence is useful precisely because it is **not** how Angular works.
Angular templates are HTML-like template source that the Angular compiler analyzes and turns into
instructions. Those instructions create DOM, instantiate directives/components, wire listeners,
and refresh bindings.

## The closest mapping

| React | Angular |
|---|---|
| JSX expression | Component template |
| Component function arguments / props | `input()` / `@Input()` |
| Callback prop | `output()` / `@Output()` or DOM event binding |
| `props.children` | Content projection with `<ng-content>` |
| `{value}` text interpolation | `{{ value }}` interpolation |
| Conditional JSX | `@if` block |
| `array.map(...)` in JSX | `@for (...; track ...)` block |

## Key difference

React JSX runs as JavaScript during render. You can create arrays, call functions, branch with any
JavaScript expression, and return different element objects each time.

Angular templates are compiled. Template expressions are intentionally restricted: no arbitrary
statements, no global mutation, no ad-hoc control flow beyond template syntax. This gives Angular
more static knowledge about the template shape.

## Component API shape

Modern Angular often expresses component inputs and outputs like this:

```ts
@Component({
  selector: 'user-card',
  template: `
    <article>
      <h3>{{ user().name }}</h3>
      <button (click)="save.emit()">Save</button>
      <ng-content />
    </article>
  `,
})
export class UserCard {
  user = input.required<User>();
  save = output<void>();
}
```

The React mental model "data down, events up" still transfers well. The syntax and compilation
model do not.

## Senior interview phrasing

> In React, JSX creates runtime element descriptions. In Angular, templates are compiler input.
> I map React props to Angular inputs, callback props to outputs, and children to content
> projection, but I do not expect Angular to recreate a new element tree on every change.

## Practical traps for React developers

- Do not put expensive functions in template bindings; Angular may call them during checks.
- Do not expect `children` as a normal prop; use `<ng-content>` and projection slots.
- Do not treat template reference variables as refs; they are template-scope references.
- Do not assume arbitrary JavaScript in templates; move logic to the component class, a pipe, or a
  computed signal.

## References

- [Angular: Template syntax](https://angular.dev/guide/templates)
- [Angular: Components](https://angular.dev/guide/components)
- [Angular: Inputs](https://angular.dev/guide/components/inputs)
- [Angular: Outputs](https://angular.dev/guide/components/outputs)
