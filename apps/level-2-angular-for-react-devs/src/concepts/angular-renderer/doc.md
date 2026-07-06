# DOM renderer and platform abstraction

React has `react-dom`: the host renderer that commits host mutations to the browser DOM.

Angular has a browser platform package, compiled DOM instructions, and the `Renderer2` abstraction
for imperative DOM escape hatches.

## The everyday path

Most Angular DOM work happens through templates:

```html
<button [disabled]="saving()" (click)="save()">Save</button>
```

Angular compiles this into create/update/listener instructions. You rarely create DOM manually in
component code.

## The imperative path

When you need imperative host DOM work, Angular usually wants a directive:

```ts
@Directive({ selector: '[highlightOnHover]' })
export class HighlightOnHover {
  private renderer = inject(Renderer2);
  private el = inject(ElementRef<HTMLElement>);

  @HostListener('mouseenter')
  enter() {
    this.renderer.setStyle(this.el.nativeElement, 'background', 'gold');
  }
}
```

This maps roughly to a React component that uses a ref and an effect, but Angular encourages the
behavior to live beside the element as a directive.

## Renderer2 vs nativeElement

`ElementRef.nativeElement` is the raw node. It is sometimes necessary, but it is also the sharpest
escape hatch. `Renderer2` keeps DOM writes behind Angular's renderer abstraction and is safer for
platform-aware code.

## Where the analogy breaks

React has a formal host renderer architecture that can target DOM, Native, custom renderers, etc.
Angular's product apps usually target the browser platform. You can customize renderer/platform
behavior, but most senior Angular work is about using templates/directives cleanly and avoiding
uncontrolled DOM mutation before hydration.

## Senior interview phrasing

> The ReactDOM analogy helps: there is a framework-owned host write path. But in Angular I prefer
> template bindings and directives; I only reach for `ElementRef`/`Renderer2` when a directive must
> integrate with a host node or third-party imperative API.

## References

- [Angular: Attribute directives](https://angular.dev/guide/directives/attribute-directives)
- [Angular: Renderer2 API](https://angular.dev/api/core/Renderer2)
- [Angular: ElementRef API](https://angular.dev/api/core/ElementRef)
