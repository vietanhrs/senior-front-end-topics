import { makeAngularConcept } from '../common';
import doc from './doc.md?raw';

export const angularRenderer = makeAngularConcept({
  slug: 'angular-renderer',
  title: 'DOM renderer and platform abstraction',
  summary: 'Angular writes to the host through renderer abstractions and platform packages.',
  tags: ['Angular', 'Renderer', 'Platform'],
  doc,
  reactMentalModel:
    'ReactDOM is the host renderer that turns React work into DOM mutations during commit.',
  angularEquivalent:
    'Angular has platform-browser, Renderer2, hydration support, and lower-level Ivy DOM instructions.',
  code: `@Directive({ selector: '[highlightOnHover]' })
export class HighlightOnHover {
  private renderer = inject(Renderer2);
  private el = inject(ElementRef<HTMLElement>);

  @HostListener('mouseenter')
  enter() {
    this.renderer.setStyle(this.el.nativeElement, 'background', 'gold');
  }
}`,
  bridge: [
    {
      react: 'react-dom host config',
      angular: 'platform-browser renderer',
      seniorNote: 'Most apps use templates; Renderer2 appears when directives need imperative DOM work.',
    },
    {
      react: 'commit phase DOM writes',
      angular: 'create/update instructions plus renderer calls',
      seniorNote: 'Angular updates DOM as part of change detection, not through a separate Fiber commit API.',
    },
    {
      react: 'custom renderer',
      angular: 'custom platform/renderer',
      seniorNote: 'Both exist, but Angular apps rarely replace the browser renderer in product code.',
    },
  ],
  exercise: {
    prompt: 'Port a React ref-based imperative DOM effect into Angular safely.',
    reactFirstThinking: [
      'useRef stores a DOM node.',
      'useLayoutEffect mutates style after commit.',
      'Cleanup restores or removes listeners.',
    ],
    angularAnswer: `Prefer a directive.

- Inject \`ElementRef\` only when you truly need the host element.
- Use \`Renderer2\` for DOM writes that should stay platform-aware.
- Use \`@HostListener\` for host DOM events.
- Put cleanup in \`DestroyRef.onDestroy\` if you manually subscribe or attach listeners.`,
    checklist: [
      'Uses directive instead of component-specific imperative code.',
      'Mentions Renderer2.',
      'Mentions HostListener or DestroyRef cleanup.',
      'Separates template binding from imperative DOM escape hatches.',
    ],
  },
});
